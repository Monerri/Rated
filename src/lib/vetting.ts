import { vettingChecks, vettingStandard } from "@/config/vetting";
import type { PublicSpecialist } from "@/lib/types";

/** The date by which a specialist's checks must be reconfirmed. */
export function checksExpire(s: Pick<PublicSpecialist, "checksLastConfirmed">): Date {
  const expires = new Date(s.checksLastConfirmed);
  expires.setUTCMonth(expires.getUTCMonth() + vettingStandard.checkValidityMonths);
  return expires;
}

/** Every current check passed (or doesn't apply), and confirmed recently enough. */
export function isCurrentlyVetted(
  s: Pick<PublicSpecialist, "checks" | "checksLastConfirmed" | "googleRating">,
  now = new Date(),
): boolean {
  if (checksExpire(s) < now) return false;
  if (!(s.googleRating > vettingStandard.minimumGoogleRating)) return false;
  return vettingChecks.every((def) => {
    const r = s.checks.find((c) => c.id === def.id);
    return !!r && (r.passed || !!r.notApplicableReason);
  });
}
