import { getCatalogueService } from "@/lib/catalogue";
import { getFunnel } from "@/funnels";
import { isResearching, summarise, validateAnswers } from "@/funnels/engine";
import { MAX_SPECIALISTS, shareWithSpecialistWording } from "@/lib/consent";
import { matchSpecialists } from "@/lib/matching";
import { customerMatchEmail, specialistEnquiryEmail, trySend } from "@/lib/notifications";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
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

  const specialists = matchSpecialists(service.slug, postcode, requested);
  if (specialists.length === 0) {
    return { ok: false, status: 409, error: "We don't have a vetted specialist available for that postcode right now." };
  }

  const now = new Date().toISOString();
  const enquiry: Enquiry = {
    kind: "enquiry",
    id: crypto.randomUUID(),
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
  };
  await recordStore.saveEnquiry(enquiry);

  // The homeowner must be told who will contact them before anyone else gets their details.
  if (!(await trySend(customerMatchEmail(enquiry, specialists, service.name, input.origin)))) {
    return {
      ok: false,
      status: 502,
      error:
        "We couldn't send your confirmation email, so we haven't passed your details to anyone. Please check your email address and try again.",
    };
  }
  enquiry.customerNotifiedAt = new Date().toISOString();
  await recordStore.updateEnquiry(enquiry.id, { customerNotifiedAt: enquiry.customerNotifiedAt });

  for (const specialist of specialists) {
    // A failed send is logged and left off the record, so it can be followed up.
    if (!(await trySend(specialistEnquiryEmail(enquiry, specialist, specialists.length, service.name)))) continue;
    enquiry.specialistNotifications.push({ slug: specialist.slug, notifiedAt: new Date().toISOString() });
  }
  await recordStore.updateEnquiry(enquiry.id, { specialistNotifications: enquiry.specialistNotifications });

  return { ok: true, enquiry, specialists };
}
