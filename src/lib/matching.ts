import { specialists } from "@/data/specialists";
import { vettingChecks } from "@/config/vetting";
import { outwardCode, postcodeArea } from "@/lib/postcode";
import type { Specialist } from "@/lib/types";

/** Checks older than this are treated as lapsed and the specialist is not recommended. */
const CHECKS_VALID_MONTHS = 12;

/** Every current check passed, and confirmed recently enough. */
export function isCurrentlyVetted(s: Specialist, now = new Date()): boolean {
  const confirmed = new Date(s.checksLastConfirmed);
  const expires = new Date(confirmed);
  expires.setUTCMonth(expires.getUTCMonth() + CHECKS_VALID_MONTHS);
  if (expires < now) return false;
  return vettingChecks.every((def) => {
    const r = s.checks.find((c) => c.id === def.id);
    return r && (r.passed || r.notApplicableReason);
  });
}

function covers(s: Specialist, area: string, outward: string | null): boolean {
  return s.areasCovered.includes(area) || (outward !== null && s.areasCovered.includes(outward));
}

function candidates(serviceSlug: string, area: string, outward: string | null): Specialist[] {
  return specialists.filter(
    (s) => s.services.includes(serviceSlug) && covers(s, area, outward) && isCurrentlyVetted(s),
  );
}

/**
 * Picks the one specialist we recommend. During beta there will usually be
 * only one specialist per area, so the rule is simple: highest Google
 * rating, then most reviews. Add capacity limits or rotation here once
 * areas have several specialists.
 */
export function matchSpecialist(serviceSlug: string, postcode: string): Specialist | null {
  const list = candidates(serviceSlug, postcodeArea(postcode), outwardCode(postcode));
  list.sort((a, b) => b.googleRating - a.googleRating || b.googleReviewCount - a.googleReviewCount);
  return list[0] ?? null;
}

/** Whether anyone covers an area, without revealing who. Used for the "just researching" screen. */
export function hasCoverage(serviceSlug: string, areaOrPostcode: string): boolean {
  const isFull = areaOrPostcode.includes(" ");
  const area = isFull ? postcodeArea(areaOrPostcode) : areaOrPostcode;
  const outward = isFull ? outwardCode(areaOrPostcode) : null;
  return candidates(serviceSlug, area, outward).length > 0;
}
