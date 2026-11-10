/**
 * The launch plan. While `onboardingPhase` is true the site is live but we
 * haven't started advertising to homeowners:
 * - introductions are still sent, but they're free: each is recorded on the
 *   specialist's account at 0 credits, with what it would normally cost
 * - specialists aren't switched off for a low balance
 * - homeowners and specialists see notices saying we're still onboarding
 * - specialists who accept the terms get `foundingCredits` free credits
 *
 * The day advertising starts, set `onboardingPhase` to false. Specialist
 * terms section 5 promises at least 14 days' email notice before charging
 * starts, so email them before you do, and remove the "Free introductions"
 * paragraph from the terms at the same time.
 */
export const launch = {
  onboardingPhase: true,
  /** When advertising to homeowners starts, in words. Shown to specialists. */
  advertisingFrom: "early January 2027",
  /** Free credits for specialists who accept the terms during the onboarding phase. Set to 0 to stop. */
  foundingCredits: 50,
};
