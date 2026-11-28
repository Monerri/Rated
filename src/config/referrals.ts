/**
 * The referral scheme for specialists (see "Referral credits" in the
 * Specialist terms). When a business names the approved specialist who
 * recommended us on its application, and we approve it, both get free
 * credits. To run the scheme for longer, change the deadline here and in the
 * Specialist terms (and update the terms version).
 */
export const referrals = {
  /** Free credits each business receives. */
  credits: 30,
  /** Applications must reach us before this moment: 31 January 2027, 23:59:59 UK time (GMT in winter). */
  deadline: "2027-01-31T23:59:59.999Z",
  /** The deadline in words, for pages and emails. */
  lastDay: "31 January 2027",
  /** Longest name accepted in "Who recommended us?". */
  maxNameLength: 120,
};

/**
 * The automatic referral invite email (lib/referralInvites.ts) goes to
 * specialists who go live from this moment, the morning after they do.
 * Anyone live before it can be sent one from /admin.
 */
export const referralInvitesFrom = "2026-11-29T00:00:00.000Z";

/** Whether an application made at this moment can claim referral credits. */
export function referralsOpen(at: Date | string = new Date()): boolean {
  return new Date(at).getTime() <= new Date(referrals.deadline).getTime();
}
