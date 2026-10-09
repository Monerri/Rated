import { specialists } from "@/data/specialists";
import { outwardCode, postcodeArea } from "@/lib/postcode";
import { isCurrentlyVetted } from "@/lib/vetting";
import type { Specialist } from "@/lib/types";

function covers(s: Specialist, area: string, outward: string | null): boolean {
  return s.areasCovered.includes(area) || (outward !== null && s.areasCovered.includes(outward));
}

function candidates(serviceSlug: string, areaOrPostcode: string): Specialist[] {
  const isFull = areaOrPostcode.includes(" ");
  const area = isFull ? postcodeArea(areaOrPostcode) : areaOrPostcode;
  const outward = isFull ? outwardCode(areaOrPostcode) : null;
  return specialists.filter(
    (s) => s.services.includes(serviceSlug) && covers(s, area, outward) && isCurrentlyVetted(s),
  );
}

/**
 * Picks up to `count` specialists for an enquiry. Everyone eligible has
 * passed the same checks, so when more cover an area than were asked for,
 * we choose at random. That spreads introductions fairly between
 * specialists. Once enquiries are stored in a database, this can switch to
 * "fewest recent introductions first".
 */
export function matchSpecialists(serviceSlug: string, postcode: string, count: number): Specialist[] {
  const pool = candidates(serviceSlug, postcode);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, count));
}

/** How many vetted specialists cover an area or postcode, without revealing who. */
export function coverageCount(serviceSlug: string, areaOrPostcode: string): number {
  return candidates(serviceSlug, areaOrPostcode).length;
}
