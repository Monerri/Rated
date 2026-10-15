import { getService } from "@/config/services";
import { getSpecialist } from "@/data/specialists";
import { feedbackRequestEmail, noContactAlertEmail, trySend } from "@/lib/notifications";
import { postcodeArea } from "@/lib/postcode";
import { recordStore } from "@/lib/records";
import type { FeedbackRequest, SpecialistFeedback } from "@/lib/types";

/**
 * About two weeks after an introduction, we email the homeowner once to ask
 * how it went: whether each specialist got in touch, a rating and an optional
 * comment. It tells us who isn't contacting homeowners, gives specialists a
 * record of their service and, with permission, gives us real testimonials.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Ask this many days after the introduction. */
export const FEEDBACK_AFTER_DAYS = 14;
/** If the daily job misses a day, still ask up to this many days after. */
const FEEDBACK_WINDOW_DAYS = 7;

export function publishConsentWording(firstName: string, area: string) {
  return {
    wordingId: "publish_feedback.v1",
    wording: `You can quote my comment on the Vetted North website, with my first name and area ("${firstName}, ${area}").`,
  };
}

/** Sends the feedback emails that are due. Runs once a day. */
export async function sendDueFeedbackRequests(origin: string, now = new Date()): Promise<{ sent: number }> {
  const from = new Date(now.getTime() - (FEEDBACK_AFTER_DAYS + FEEDBACK_WINDOW_DAYS) * DAY).toISOString();
  const to = new Date(now.getTime() - FEEDBACK_AFTER_DAYS * DAY).toISOString();
  let sent = 0;
  for (const e of await recordStore.listEnquiries(from, to)) {
    if (e.feedbackRequestedAt || !e.customerNotifiedAt || e.specialistNotifications.length === 0) continue;
    const record: FeedbackRequest = {
      kind: "feedback",
      token: crypto.randomUUID(),
      enquiryId: e.id,
      serviceSlug: e.serviceSlug,
      firstName: e.contact.firstName,
      area: postcodeArea(e.postcode),
      specialistSlugs: e.specialistNotifications.map((n) => n.slug),
      createdAt: now.toISOString(),
      respondedAt: null,
      responses: {},
    };
    const names = record.specialistSlugs.map((slug) => getSpecialist(slug)?.name ?? slug);
    const serviceName = getService(e.serviceSlug)?.name ?? e.serviceSlug;
    // Record the request first, so a failed save can never lead to a second email.
    await recordStore.saveFeedback(record);
    await recordStore.updateEnquiry(e.id, { feedbackRequestedAt: now.toISOString() });
    if (await trySend(feedbackRequestEmail(e.contact.email, e.contact.firstName, serviceName, names, `${origin}/feedback/${record.token}`))) {
      sent++;
    }
  }
  return { sent };
}

export type FeedbackInput = Record<string, { contacted?: unknown; rating?: unknown; comment?: unknown; publish?: unknown }>;

/** Saves a homeowner's answers. They can change them by submitting again. */
export async function submitFeedback(
  token: string,
  input: FeedbackInput,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const record = await recordStore.getFeedback(token);
  if (!record) return { ok: false, status: 404, error: "We couldn't find that feedback link." };

  const consent = publishConsentWording(record.firstName, record.area);
  const now = new Date().toISOString();
  const responses: Record<string, SpecialistFeedback> = {};
  for (const slug of record.specialistSlugs) {
    const a = input[slug];
    if (!a) continue;
    const contacted = a.contacted === "yes" || a.contacted === "no" || a.contacted === "not-yet" ? a.contacted : null;
    if (!contacted) return { ok: false, status: 400, error: "Please tell us whether each specialist got in touch." };
    const rating = Number(a.rating);
    const comment = typeof a.comment === "string" && a.comment.trim() ? a.comment.trim().slice(0, 1000) : null;
    responses[slug] = {
      contacted,
      rating: contacted === "yes" && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      comment,
      publishConsent: comment && a.publish === true ? { ...consent, givenAt: now } : null,
    };
  }
  if (Object.keys(responses).length === 0) return { ok: false, status: 400, error: "Please answer for at least one specialist." };

  const firstTime = !record.respondedAt;
  await recordStore.saveFeedback({ ...record, responses: { ...record.responses, ...responses }, respondedAt: now });

  // A specialist who never got in touch is something we need to know about straight away.
  const noContact = Object.entries(responses).filter(([, r]) => r.contacted === "no").map(([slug]) => getSpecialist(slug)?.name ?? slug);
  if (noContact.length && firstTime) {
    await trySend(noContactAlertEmail(getService(record.serviceSlug)?.name ?? record.serviceSlug, record.area, record.enquiryId, noContact));
  }
  return { ok: true };
}

/** Average rating and contact rate per specialist, for reports. */
export function summariseFeedback(records: FeedbackRequest[]) {
  const out: Record<string, { responses: number; ratings: number[]; notContacted: number }> = {};
  for (const r of records) {
    for (const [slug, f] of Object.entries(r.responses)) {
      const s = (out[slug] ??= { responses: 0, ratings: [], notContacted: 0 });
      s.responses++;
      if (f.rating) s.ratings.push(f.rating);
      if (f.contacted === "no") s.notContacted++;
    }
  }
  return out;
}
