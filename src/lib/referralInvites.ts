import { foundingOfferOpen, launch } from "@/config/launch";
import { referrals, referralInvitesFrom, referralsOpen } from "@/config/referrals";
import { site } from "@/config/site";
import { verifiedBadge, vettingStandard } from "@/config/vetting";
import { ordinalDate } from "@/lib/format";
import { trySend, type Email } from "@/lib/notifications";
import { recordStore } from "@/lib/records";
import type { Specialist } from "@/lib/types";

/**
 * The referral invite: one email per specialist, the morning after they go
 * live, inviting them to recommend other businesses (Specialist terms,
 * "Referral credits"). It's promotional, so it carries a "stop offers like
 * this" link and is never sent to anyone who has used it.
 */

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;
const pounds = (credits: number) => `£${credits}`;

/** The message for them to copy and send, which changes when the Founding Supplier offer closes. */
function forwardedMessage(business: string, now: Date): string {
  const founding = foundingOfferOpen(now);
  const free = launch.welcomeCredits + (founding ? launch.foundingCredits : 0);
  const total = free + referrals.credits;
  const offer = free > 0
    ? `${founding ? `Apply before ${ordinalDate(launch.foundingDeadline)} and, if you're approved, you'll get` : "If you're approved, you'll get"} ${free} free credits, plus ${referrals.credits} extra if you put ${business} in the "Who recommended us?" box. That's ${total} credits (${pounds(total)} of introductions).`
    : `If you're approved, you'll get ${referrals.credits} free credits if you put ${business} in the "Who recommended us?" box.`;
  return `Hi [name], I've joined ${site.name}, a new service introducing North East homeowners to checked local trades. Each job goes to three firms at most, there's no subscription and you only pay when an introduction is sent.
${offer} It takes about 5 minutes: ${site.domain}/for-suppliers`;
}

export function referralInviteEmail(s: Specialist, stopLink: string, now = new Date()): Email {
  const business = s.name;
  const five = referrals.credits * 5;
  return {
    to: s.enquiryEmail,
    replyTo: site.supplierApplicationsEmail,
    subject: `Recommend a business and you both get ${referrals.credits} extra credits`,
    text: `Hi ${firstName(s.onboarding?.contactName ?? business)},

Thanks again for joining ${site.name}. ${business} is now approved and ready to receive introductions.

You'll know other good local businesses: the electrician you trust, the roofer you'd send your own family to. We'd like to meet them too.

Recommend a business and you both get ${referrals.credits} extra credits, on top of any other offer.

How it works
1. Tell them about us. Use the message below, or just give them a call.
2. They apply at ${site.domain}/for-suppliers and enter "${business}" in the "Who recommended us?" box. This step is essential: if your business name isn't in that box, we can't award the credits.
3. Once they're approved, you both get ${referrals.credits} credits, worth ${pounds(referrals.credits)} of introductions each.
4. There's no limit. Recommend five businesses that get approved and that's ${five} extra credits for you.

Who's likely to be approved?
- A limited company, or a sole trader happy for us to check the owner's identity and address
- Gas Safe or F gas certified, where their work legally needs it
- Rated above ${vettingStandard.minimumGoogleRating} stars on Google, from at least ${vettingStandard.minimumGoogleReviews} reviews
Businesses that also offer an insurance-backed guarantee and belong to the right trade scheme can earn our gold ${verifiedBadge.name} badge.

Copy and send this by WhatsApp, text or email:

${forwardedMessage(business, now)}

The small print
- The recommended business must enter your business name in "Who recommended us?" on their application. We can't add it afterwards.
- They must be new to us: not already registered, applied or recommended.
- They must apply by ${ordinalDate(referrals.deadline, true)} and be approved.
- We won't accept lists of businesses.
- Referral credits are on top of any other offer. Free credits have no cash value and can't be transferred.

Thanks for helping us build something better for local trades.
The ${site.name} team
${site.domain}

You're receiving this because ${business} is an approved ${site.name} specialist. If you'd rather not hear about offers like this, use this link and we won't send them: ${stopLink}
`,
  };
}

/** Why a specialist can't be sent the invite right now, or null if they can. */
export function inviteBlocker(s: Specialist, now = new Date()): string | null {
  if (s.isDemo || s.onboarding?.status !== "active") return "They aren't live yet.";
  if (s.onboarding.offersOptOut) return "They've asked us not to send offers.";
  if (s.onboarding.referralInviteSentAt) return "They've already been sent it.";
  if (!referralsOpen(now)) return "The referral scheme has closed.";
  return null;
}

async function send(s: Specialist, origin: string, now: Date): Promise<boolean> {
  const token = s.onboarding!.offersToken ?? crypto.randomUUID().replace(/-/g, "");
  const ok = await trySend(referralInviteEmail(s, `${origin}/offers/stop/${token}`, now));
  if (!ok) return false;
  await recordStore.saveSpecialist({ ...s, onboarding: { ...s.onboarding!, offersToken: token, referralInviteSentAt: now.toISOString() } });
  return true;
}

/**
 * Daily job: sends the invite to specialists who went live before today
 * (so it arrives the morning after their welcome email), from
 * referralInvitesFrom onwards. Earlier specialists can be sent it from /admin.
 */
export async function sendDueReferralInvites(origin: string, now = new Date()): Promise<{ sent: number }> {
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  let sent = 0;
  for (const s of await recordStore.listSpecialists()) {
    if (inviteBlocker(s, now)) continue;
    const liveAt = s.onboarding!.terms?.acceptedAt ?? s.onboarding!.approvedAt;
    if (liveAt < referralInvitesFrom || liveAt >= startOfToday) continue;
    if (await send(s, origin, now)) sent++;
  }
  return { sent };
}

/** Sends it now, from /admin, for example to someone who went live before the automatic email existed. */
export async function sendReferralInviteNow(slug: string, origin: string, now = new Date()): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = (await recordStore.listSpecialists()).find((x) => x.slug === slug);
  if (!s) return { ok: false, error: "Specialist not found." };
  const blocker = inviteBlocker(s, now);
  if (blocker) return { ok: false, error: blocker };
  return (await send(s, origin, now)) ? { ok: true } : { ok: false, error: "The email couldn't be sent. Please try again." };
}

/** The "stop offers like this" link. True if the token belonged to a specialist. */
export async function stopOffers(token: string, now = new Date()): Promise<boolean> {
  if (!token) return false;
  const s = (await recordStore.listSpecialists()).find((x) => x.onboarding?.offersToken === token);
  if (!s) return false;
  if (!s.onboarding!.offersOptOut) await recordStore.saveSpecialist({ ...s, onboarding: { ...s.onboarding!, offersOptOut: { at: now.toISOString() } } });
  return true;
}
