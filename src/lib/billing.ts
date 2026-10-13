import { defaultLeadPrice, LATER_TIMESCALE, laterLeadDiscountPercent, leadPrices } from "@/config/pricing";
import { recordStore } from "@/lib/records";
import type { Answers } from "@/funnels/types";
import type { LedgerEntry, Specialist } from "@/lib/types";

/**
 * Prepaid credit. A specialist only receives a lead's details once its price
 * has been taken from their balance, so every lead sent is already paid for.
 * Demo specialists are never charged.
 */

export function isLaterLead(answers: Answers): boolean {
  return answers.timescale === LATER_TIMESCALE;
}

/** Price per specialist, in pence. Exclusive when the homeowner asked for one specialist only. */
export function leadPrice(serviceSlug: string, requested: number, later: boolean): number {
  const prices = leadPrices[serviceSlug] ?? defaultLeadPrice;
  const base = requested === 1 ? prices.exclusive : prices.shared;
  return later ? Math.round((base * (100 - laterLeadDiscountPercent)) / 100) : base;
}

/** The cheapest lead for a service, used to check coverage before the price is known. */
export function cheapestLeadPrice(serviceSlug: string): number {
  return leadPrice(serviceSlug, 2, true);
}

export function formatPence(pence: number): string {
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${(Math.abs(pence) / 100).toFixed(2)}`;
}

export function describeLead(requested: number, later: boolean): string {
  const kind = requested === 1 ? "exclusive (the homeowner asked for one specialist)" : `shared (the homeowner asked for ${requested} specialists)`;
  return later ? `${kind}, with the ${laterLeadDiscountPercent}% discount for work planned in 3 to 6 months` : kind;
}

function entry(supplierSlug: string, kind: LedgerEntry["kind"], amountPence: number, enquiryId: string | null, note: string): LedgerEntry {
  return { id: crypto.randomUUID(), supplierSlug, createdAt: new Date().toISOString(), kind, amountPence, enquiryId, note };
}

/** Takes the lead price if the balance covers it. Demo specialists always succeed, at no charge. */
export async function chargeForLead(s: Specialist, enquiryId: string, pricePence: number, note: string): Promise<boolean> {
  if (s.isDemo) return true;
  return recordStore.chargeIfFunded(entry(s.slug, "lead", -pricePence, enquiryId, note));
}

/** Gives a lead's price back, for example when its email couldn't be sent. */
export async function refundLead(s: Specialist, enquiryId: string, pricePence: number, note: string): Promise<void> {
  if (s.isDemo) return;
  await recordStore.addLedgerEntry(entry(s.slug, "refund", pricePence, enquiryId, note));
}

export async function addCredit(
  supplierSlug: string,
  kind: Exclude<LedgerEntry["kind"], "lead">,
  amountPence: number,
  note: string,
): Promise<LedgerEntry> {
  const e = entry(supplierSlug, kind, amountPence, null, note);
  await recordStore.addLedgerEntry(e);
  return e;
}

/** Whether a specialist can currently afford a lead at this price. */
export function canAfford(s: Specialist, balances: Record<string, number>, pricePence: number): boolean {
  return s.isDemo || (balances[s.slug] ?? 0) >= pricePence;
}
