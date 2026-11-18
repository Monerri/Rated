import { requiredChecks, verifiedChecks, vettingStandard } from "@/config/vetting";
import type { PublicSpecialist, VettingCheckId } from "@/lib/types";

/** The date by which a specialist's checks must be reconfirmed. */
export function checksExpire(s: Pick<PublicSpecialist, "checksLastConfirmed">): Date {
  const expires = new Date(s.checksLastConfirmed);
  expires.setUTCMonth(expires.getUTCMonth() + vettingStandard.checkValidityMonths);
  return expires;
}

export type CheckStatus = "passed" | "not_required" | "not_passed" | "not_recorded";

/** Where a specialist stands on one check. */
export function checkStatus(s: Pick<PublicSpecialist, "checks">, id: VettingCheckId): CheckStatus {
  const r = s.checks.find((c) => c.id === id);
  if (!r) return "not_recorded";
  if (r.passed) return "passed";
  return r.notApplicableReason ? "not_required" : "not_passed";
}

const ok = (st: CheckStatus) => st === "passed" || st === "not_required";

/**
 * Whether we can recommend this specialist: every required check passed (or
 * doesn't apply), a Google rating above the minimum from enough reviews, and
 * checks confirmed recently enough. Specialists approved before the legal
 * registration check existed passed the stricter old standard, so a missing
 * record for it doesn't count against them.
 */
export function isCurrentlyVetted(
  s: Pick<PublicSpecialist, "checks" | "checksLastConfirmed" | "googleRating" | "googleReviewCount">,
  now = new Date(),
): boolean {
  if (checksExpire(s) < now) return false;
  if (!(s.googleRating > vettingStandard.minimumGoogleRating)) return false;
  if (!(s.googleReviewCount >= vettingStandard.minimumGoogleReviews)) return false;
  return requiredChecks.every((def) => {
    const st = checkStatus(s, def.id);
    return ok(st) || (def.id === "legal_registration" && st === "not_recorded");
  });
}

/** Whether a specialist shows the Verified badge: recommendable, and every other check passed or not required. */
export function isVerified(
  s: Pick<PublicSpecialist, "checks" | "checksLastConfirmed" | "googleRating" | "googleReviewCount">,
  now = new Date(),
): boolean {
  return isCurrentlyVetted(s, now) && verifiedChecks.every((def) => ok(checkStatus(s, def.id)));
}

/** The checks a specialist still needs for the badge, by title. Empty when they have it. */
export function missingForBadge(s: Pick<PublicSpecialist, "checks">): string[] {
  return verifiedChecks.filter((def) => !ok(checkStatus(s, def.id))).map((def) => def.title);
}
