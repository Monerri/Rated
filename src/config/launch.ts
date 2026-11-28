/**
 * The launch plan and the offers for new specialists.
 *
 * While `onboardingPhase` is true the site is live but we haven't started
 * advertising to homeowners:
 * - introductions are still sent, but they're free: each is recorded on the
 *   specialist's account at 0 credits, with what it would normally cost
 * - specialists aren't switched off for a low balance
 * - homeowners and specialists see notices saying we're still onboarding
 *
 * The day advertising starts, set `onboardingPhase` to false. Specialist
 * terms section 5 promises at least 14 days' email notice before charging
 * starts, so email them before you do, and remove the "Free introductions"
 * paragraph from the terms at the same time.
 *
 * Free credits, added when a specialist goes live (see activateSpecialist):
 * - `welcomeCredits` for every new specialist. It may be withdrawn: set it to
 *   0 and update Specialist terms section 3.
 * - `foundingCredits` extra for the Founding Supplier offer: specialists whose
 *   application arrived before `foundingDeadline`. The offer ends by itself.
 */
export const launch = {
  onboardingPhase: true,
  /** When advertising to homeowners starts, in words. Shown to specialists. */
  advertisingFrom: "early January 2027",
  welcomeCredits: 50,
  foundingCredits: 100,
  /** Applications received before this moment (UK midnight) qualify for the Founding Supplier offer. */
  foundingDeadline: "2027-01-01T00:00:00Z",
  /** The last day to apply, in words. */
  foundingLastDay: "31st. December 2026",
};

/** Whether the Founding Supplier offer is still open for new applications. */
export function foundingOfferOpen(now = new Date()): boolean {
  return launch.foundingCredits > 0 && now < new Date(launch.foundingDeadline);
}

/** The free credits a specialist gets when they go live, given when they applied. */
export function freeCreditsFor(appliedAt: string): { welcome: number; founding: number } {
  return {
    welcome: launch.welcomeCredits,
    founding: new Date(appliedAt) < new Date(launch.foundingDeadline) ? launch.foundingCredits : 0,
  };
}
