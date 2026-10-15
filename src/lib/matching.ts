import { specialists } from "@/data/specialists";
import { outwardCode, postcodeArea } from "@/lib/postcode";
import { isCurrentlyVetted } from "@/lib/vetting";
import type { Specialist } from "@/lib/types";
import { canAfford, chargeForLead, cheapestLeadPrice } from "@/lib/billing";
import { recordStore } from "@/lib/records";
import { switchedOffByHand } from "@/lib/listing";

function covers(s: Specialist, area: string, outward: string | null): boolean {
  return s.areasCovered.includes(area) || (outward !== null && s.areasCovered.includes(outward));
}

/** Whether a specialist takes this kind of job. No preference set means they take every kind. */
function takesLeadType(s: Specialist, serviceSlug: string, leadType: string | null): boolean {
  const accepted = s.leadTypes?.[serviceSlug];
  return !leadType || !accepted || accepted.includes(leadType);
}

/** Specialists who could take this lead, leaving out anyone switched off by hand. */
async function candidates(serviceSlug: string, areaOrPostcode: string, leadType: string | null): Promise<Specialist[]> {
  const isFull = areaOrPostcode.includes(" ");
  const area = isFull ? postcodeArea(areaOrPostcode) : areaOrPostcode;
  const outward = isFull ? outwardCode(areaOrPostcode) : null;
  const off = await switchedOffByHand();
  return specialists.filter(
    (s) =>
      !off.has(s.slug) &&
      s.services.includes(serviceSlug) &&
      covers(s, area, outward) &&
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
  pricePence: number;
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
    if (await chargeForLead(s, opts.enquiryId, opts.pricePence, opts.note)) chosen.push(s);
    else underfunded.push(s);
  }
  // Also tell anyone not reached whose balance couldn't have covered it, so they can top up.
  const balances = await recordStore.getBalances();
  for (const s of pool) {
    if (!chosen.includes(s) && !underfunded.includes(s) && !canAfford(s, balances, opts.pricePence)) underfunded.push(s);
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
