import { specialists } from "@/data/specialists";
import { outwardCode, postcodeArea } from "@/lib/postcode";
import { isCurrentlyVetted } from "@/lib/vetting";
import type { Specialist } from "@/lib/types";
import { canAfford, chargeForLead, cheapestLeadPrice } from "@/lib/billing";
import { recordStore } from "@/lib/records";
import { switchedOffByHand } from "@/lib/listing";
import { lookupPostcode, milesBetween } from "@/lib/geo";
import { maxRadiusMiles } from "@/config/coverage";

/** Where a homeowner is: their postcode area and district, and the postcode's location when it could be looked up. */
interface Place {
  area: string;
  outward: string | null;
  point: { lat: number; lng: number } | null;
}

async function placeFor(areaOrPostcode: string): Promise<Place> {
  if (!areaOrPostcode.includes(" ")) return { area: areaOrPostcode, outward: null, point: null };
  const info = await lookupPostcode(areaOrPostcode);
  return {
    area: postcodeArea(areaOrPostcode),
    outward: outwardCode(areaOrPostcode),
    point: info ? { lat: info.lat, lng: info.lng } : null,
  };
}

/**
 * Whether a specialist covers a place. With a base and radius: within the
 * radius (never more than the cap) and not in a postcode they've left out.
 * If the postcode couldn't be located, the base's own postcode area counts.
 * Without a base: the postcode areas or districts they listed.
 */
export function covers(s: Specialist, place: Place): boolean {
  const c = s.coverage;
  if (c) {
    const excluded = (c.excluded ?? []).map((x) => x.toUpperCase());
    if (excluded.includes(place.area) || (place.outward !== null && excluded.includes(place.outward))) return false;
    if (place.point) return milesBetween(place.point, c) <= Math.min(c.radiusMiles, maxRadiusMiles);
    return outwardCode(c.basePostcode.toUpperCase()).replace(/\d.*$/, "") === place.area;
  }
  return s.areasCovered.includes(place.area) || (place.outward !== null && s.areasCovered.includes(place.outward));
}

/** Whether a specialist takes this kind of job. No preference set means they take every kind. */
function takesLeadType(s: Specialist, serviceSlug: string, leadType: string | null): boolean {
  const accepted = s.leadTypes?.[serviceSlug];
  return !leadType || !accepted || accepted.includes(leadType);
}

/** Specialists who could take this lead, leaving out anyone switched off by hand. */
async function candidates(serviceSlug: string, areaOrPostcode: string, leadType: string | null): Promise<Specialist[]> {
  const [place, off] = await Promise.all([placeFor(areaOrPostcode), switchedOffByHand()]);
  return specialists.filter(
    (s) =>
      !off.has(s.slug) &&
      s.services.includes(serviceSlug) &&
      covers(s, place) &&
      takesLeadType(s, serviceSlug, leadType) &&
      isCurrentlyVetted(s),
  );
}

function shuffle<T>(items: T[]): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

export interface Allocation {
  /** Specialists who were charged and will receive the lead. */
  chosen: Specialist[];
  /** Specialists who would have been considered but whose balance was too low. */
  underfunded: Specialist[];
}

/**
 * Picks and charges up to `requested` specialists for an enquiry.
 *
 * Everyone eligible has passed the same checks, so they're tried in random
 * order, which spreads leads fairly. Each is charged before being chosen; a
 * specialist whose balance doesn't cover the price is skipped and the next
 * one tried (this is the automatic "off" for a low balance; they're told
 * they missed the lead so they can top up). Anyone switched off by hand
 * isn't considered or told. The homeowner's choice of how many is never exceeded.
 */
export async function allocateLead(opts: {
  serviceSlug: string;
  postcode: string;
  /** The kind of job, for services that have kinds (for example new builds). */
  leadType: string | null;
  requested: number;
  later: boolean;
  enquiryId: string;
  priceCredits: number;
  note: string;
}): Promise<Allocation> {
  const pool = shuffle(
    (await candidates(opts.serviceSlug, opts.postcode, opts.leadType)).filter(
      (s) => !(opts.later && s.skipLaterLeadsFor?.includes(opts.serviceSlug)),
    ),
  );
  const chosen: Specialist[] = [];
  const underfunded: Specialist[] = [];
  for (const s of pool) {
    if (chosen.length >= opts.requested) break;
    if (await chargeForLead(s, opts.enquiryId, opts.priceCredits, opts.note)) chosen.push(s);
    else underfunded.push(s);
  }
  // Also tell anyone not reached whose balance couldn't have covered it, so they can top up.
  const balances = await recordStore.getBalances();
  for (const s of pool) {
    if (!chosen.includes(s) && !underfunded.includes(s) && !canAfford(s, balances, opts.priceCredits)) underfunded.push(s);
  }
  return { chosen, underfunded };
}

/**
 * How many vetted specialists cover an area or postcode and could currently
 * take a lead, without revealing who.
 */
export async function coverageCount(serviceSlug: string, areaOrPostcode: string, leadType: string | null): Promise<number> {
  const balances = await recordStore.getBalances();
  const price = cheapestLeadPrice(serviceSlug, leadType);
  return (await candidates(serviceSlug, areaOrPostcode, leadType)).filter((s) => canAfford(s, balances, price)).length;
}
