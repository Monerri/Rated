import { getCatalogueService } from "@/lib/catalogue";
import { getFunnel } from "@/funnels";
import type { FunnelConfig } from "@/funnels/types";
import { isResearching, summarise, validateAnswers } from "@/funnels/engine";
import { MAX_SPECIALISTS, shareWithSpecialistWording } from "@/lib/consent";
import { allocateLead } from "@/lib/matching";
import { describeLead, isLaterLead, leadPrice, refundLead } from "@/lib/billing";
import { minimumLeadFee } from "@/lib/listing";
import {
  customerMatchEmail,
  listingPausedAlertEmail,
  listingPausedEmail,
  lostLeadAlertEmail,
  missedLeadEmail,
  specialistEnquiryEmail,
  trySend,
} from "@/lib/notifications";
import { normalisePostcode, outwardCode, postcodeArea, regionForPostcode } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import type { Enquiry, SourceInfo, Specialist } from "@/lib/types";

export type SubmitResult =
  | { ok: true; enquiry: Enquiry; specialists: Specialist[] }
  | { ok: false; status: number; error: string };

export interface SubmitInput {
  serviceSlug: string;
  answers: unknown;
  postcode: string;
  contact: { firstName: string; lastName: string; email: string; phone: string };
  consent: { wordingId: string; wording: string; given: boolean };
  source: SourceInfo;
  /** Set when the person said "just researching" and then chose to be put in touch. */
  researchingConfirmed: boolean;
  origin: string;
}

/**
 * The enquiry pipeline:
 * 1. validate answers and consent
 * 2. match up to the number of specialists the homeowner chose (1 to 3)
 * 3. store the enquiry
 * 4. email the homeowner the specialists' details
 * 5. only then send the enquiry to each specialist
 */
export async function submitEnquiry(input: SubmitInput): Promise<SubmitResult> {
  const service = await getCatalogueService(input.serviceSlug);
  const funnel = getFunnel(input.serviceSlug);
  if (!service || service.status !== "live" || !funnel) {
    return { ok: false, status: 400, error: "That service isn't available." };
  }

  const validated = validateAnswers(funnel, input.answers);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };
  const answers = validated.answers;

  if (isResearching(funnel, answers) && !input.researchingConfirmed) {
    return { ok: false, status: 400, error: "Please confirm you'd like to be put in touch." };
  }

  const postcode = normalisePostcode(input.postcode);
  if (!postcode) return { ok: false, status: 400, error: "Please enter a valid UK postcode." };
  const regionSlug = regionForPostcode(postcode);
  if (!regionSlug || !service.regions.includes(regionSlug)) {
    return { ok: false, status: 422, error: "We don't cover that postcode yet." };
  }

  // How many specialists the homeowner chose. Questionnaires without the question mean one.
  const requested = Math.min(Math.max(1, Number(answers.specialistCount ?? 1) || 1), MAX_SPECIALISTS);

  const expected = shareWithSpecialistWording(service.name, requested);
  if (
    input.consent.given !== true ||
    input.consent.wordingId !== expected.wordingId ||
    input.consent.wording !== expected.wording
  ) {
    return { ok: false, status: 400, error: "Please tick the box so we can share your details with the specialists." };
  }

  // Each specialist is charged before being chosen, so every lead sent is already paid for.
  const enquiryId = crypto.randomUUID();
  const later = isLaterLead(answers);
  const leadType = funnel.leadTypes?.of(answers) ?? null;
  const pricePence = leadPrice(service.slug, leadType, requested, later, regionSlug);
  const area = postcodeArea(postcode);
  const { chosen: specialists, underfunded } = await allocateLead({
    serviceSlug: service.slug,
    postcode,
    leadType,
    requested,
    later,
    enquiryId,
    pricePence,
    note: `${service.name}${leadTypeLabel(funnel, leadType)} lead, ${outwardCode(postcode)}, ${describeLead(requested, later)}`,
  });
  await recordMissedLeads(underfunded, { enquiryId, serviceSlug: service.slug, serviceName: service.name, area, pricePence });

  if (specialists.length === 0) {
    if (underfunded.length > 0) await trySend(lostLeadAlertEmail(service.name, outwardCode(postcode), requested, 0, underfunded));
    return { ok: false, status: 409, error: "We don't have a vetted specialist available for that postcode right now." };
  }
  if (specialists.length < requested && underfunded.length > 0) {
    await trySend(lostLeadAlertEmail(service.name, outwardCode(postcode), requested, specialists.length, underfunded));
  }

  const now = new Date().toISOString();
  const enquiry: Enquiry = {
    kind: "enquiry",
    id: enquiryId,
    serviceSlug: service.slug,
    answers,
    summary: [...summarise(funnel, answers), { questionId: "postcode", label: "Postcode", value: postcode }],
    postcode,
    regionSlug,
    contact: input.contact,
    consent: {
      purpose: "share_with_specialist",
      serviceSlug: service.slug,
      wordingId: expected.wordingId,
      wording: expected.wording,
      given: true,
      givenAt: now,
    },
    source: input.source,
    createdAt: now,
    specialistsRequested: requested,
    matchedSpecialistSlugs: specialists.map((s) => s.slug),
    customerNotifiedAt: null,
    specialistNotifications: [],
    pricePence,
  };
  await recordStore.saveEnquiry(enquiry);

  // The homeowner must be told who will contact them before anyone else gets their details.
  if (!(await trySend(customerMatchEmail(enquiry, specialists, service.name)))) {
    // Nobody receives the lead, so nobody pays for it.
    for (const s of specialists) {
      await refundLead(s, enquiry.id, pricePence, "Refund: the homeowner's confirmation email couldn't be sent, so the lead wasn't passed on");
    }
    return {
      ok: false,
      status: 502,
      error:
        "We couldn't send your confirmation email, so we haven't passed your details to anyone. Please check your email address and try again in a few minutes.",
    };
  }
  enquiry.customerNotifiedAt = new Date().toISOString();
  await recordStore.updateEnquiry(enquiry.id, { customerNotifiedAt: enquiry.customerNotifiedAt });

  const balances = await recordStore.getBalances();
  for (const specialist of specialists) {
    const billing = specialist.isDemo
      ? null
      : { pricePence, balancePence: balances[specialist.slug] ?? 0, description: describeLead(requested, later) };
    if (!(await trySend(specialistEnquiryEmail(enquiry, specialist, specialists.length, service.name, billing)))) {
      // They never received the details, so they get their money back. Logged so it can be followed up.
      await refundLead(specialist, enquiry.id, pricePence, "Refund: the lead email couldn't be delivered");
      continue;
    }
    enquiry.specialistNotifications.push({ slug: specialist.slug, notifiedAt: new Date().toISOString() });
  }
  await recordStore.updateEnquiry(enquiry.id, { specialistNotifications: enquiry.specialistNotifications });
  await notifyLowBalances(enquiry, specialists, pricePence);

  return { ok: true, enquiry, specialists };
}

/**
 * Tells a specialist (and us) when this lead took their balance below their
 * cheapest lead, which switches them off until they top up. Sent once, at the
 * moment they cross the line, not with every lead they then miss.
 */
async function notifyLowBalances(enquiry: Enquiry, specialists: Specialist[], pricePence: number) {
  const paid = specialists.filter((s) => !s.isDemo && enquiry.specialistNotifications.some((n) => n.slug === s.slug));
  if (paid.length === 0) return;
  const balances = await recordStore.getBalances();
  for (const s of paid) {
    const minimum = minimumLeadFee(s);
    const after = balances[s.slug] ?? 0;
    if (after >= minimum || after + pricePence < minimum) continue;
    await trySend(listingPausedEmail(s, after, minimum));
    await trySend(listingPausedAlertEmail(s, after, minimum));
  }
}

/** Records and tells each specialist who missed a lead because of a low balance. No homeowner details are shared. */
async function recordMissedLeads(
  specialists: Specialist[],
  lead: { enquiryId: string; serviceSlug: string; serviceName: string; area: string; pricePence: number },
) {
  if (specialists.length === 0) return;
  const balances = await recordStore.getBalances();
  for (const s of specialists) {
    await recordStore.saveMissedLead({
      id: crypto.randomUUID(),
      supplierSlug: s.slug,
      enquiryId: lead.enquiryId,
      serviceSlug: lead.serviceSlug,
      area: lead.area,
      pricePence: lead.pricePence,
      createdAt: new Date().toISOString(),
    });
    await trySend(missedLeadEmail(s, lead.serviceName, lead.area, lead.pricePence, balances[s.slug] ?? 0));
  }
}

function leadTypeLabel(funnel: FunnelConfig, leadType: string | null): string {
  const label = funnel.leadTypes?.options.find((o) => o.value === leadType)?.label;
  return label ? ` (${label.toLowerCase()})` : "";
}
