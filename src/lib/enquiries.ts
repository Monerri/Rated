import { getCatalogueService } from "@/lib/catalogue";
import { getFunnel } from "@/funnels";
import { isResearching, summarise, validateAnswers } from "@/funnels/engine";
import { shareWithSpecialistWording } from "@/lib/consent";
import { matchSpecialist } from "@/lib/matching";
import { customerMatchEmail, emailSender, specialistEnquiryEmail } from "@/lib/notifications";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import type { Enquiry, SourceInfo, Specialist } from "@/lib/types";

export type SubmitResult =
  | { ok: true; enquiry: Enquiry; specialist: Specialist }
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
 * 2. match one specialist
 * 3. store the enquiry
 * 4. email the homeowner the specialist's details
 * 5. only then send the enquiry to the specialist
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

  const expected = shareWithSpecialistWording(service.name);
  if (
    input.consent.given !== true ||
    input.consent.wordingId !== expected.wordingId ||
    input.consent.wording !== expected.wording
  ) {
    return { ok: false, status: 400, error: "Please tick the box so we can share your details with the specialist." };
  }

  const specialist = matchSpecialist(service.slug, postcode);
  if (!specialist) {
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
    matchedSpecialistSlug: specialist.slug,
    customerNotifiedAt: null,
    specialistNotifiedAt: null,
  };
  await recordStore.saveEnquiry(enquiry);

  await emailSender.send(customerMatchEmail(enquiry, specialist, service.name, input.origin));
  enquiry.customerNotifiedAt = new Date().toISOString();
  await recordStore.updateEnquiry(enquiry.id, { customerNotifiedAt: enquiry.customerNotifiedAt });

  await emailSender.send(specialistEnquiryEmail(enquiry, specialist, service.name));
  enquiry.specialistNotifiedAt = new Date().toISOString();
  await recordStore.updateEnquiry(enquiry.id, { specialistNotifiedAt: enquiry.specialistNotifiedAt });

  return { ok: true, enquiry, specialist };
}
