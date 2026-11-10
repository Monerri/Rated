import {
  defaultLeadPrice,
  LATER_TIMESCALE,
  laterLeadDiscountPercent,
  leadPrices,
  pencePerCredit,
  pricesConfirmed,
  regionalLeadPrices,
  vatRegistered,
} from "@/config/pricing";
import { getService } from "@/config/services";
import { bonusCreditsFor, formatCredits, formatPounds } from "@/lib/credits";
import { getFunnel } from "@/funnels";
import { recordStore } from "@/lib/records";
import type { Answers } from "@/funnels/types";
import type { LedgerEntry, Specialist } from "@/lib/types";

export { bonusCreditsFor, formatCredits, formatPounds };

/**
 * Prepaid credits. A specialist buys credits (one credit is worth £1, with
 * bonus credits for larger top-ups) and only receives a lead's details once
 * its price in credits has been taken from their balance, so every lead sent
 * is already paid for. Demo specialists are never charged.
 */

export function isLaterLead(answers: Answers): boolean {
  return answers.timescale === LATER_TIMESCALE;
}

/** The prices for a service, or for one kind of job within it if it has its own (for example "extensions/new-build"). */
export function pricesFor(serviceSlug: string, leadType: string | null, regionSlug: string | null = null) {
  const table = (regionSlug && regionalLeadPrices[regionSlug]) || leadPrices;
  return (leadType ? table[`${serviceSlug}/${leadType}`] : undefined) ?? table[serviceSlug] ?? defaultLeadPrice;
}

/** Price per specialist, in whole credits. Exclusive when the homeowner asked for one specialist only. */
export function leadPrice(
  serviceSlug: string,
  leadType: string | null,
  requested: number,
  later: boolean,
  regionSlug: string | null = null,
): number {
  const prices = pricesFor(serviceSlug, leadType, regionSlug);
  const base = requested === 1 ? prices.exclusive : prices.shared;
  return later ? laterPrice(base) : base;
}

/** The discounted price for work 3 to 6 months away, rounded down to whole credits (in the specialist's favour). */
export function laterPrice(credits: number): number {
  return Math.floor((credits * (100 - laterLeadDiscountPercent)) / 100);
}

/** The cheapest lead for a service, used to check coverage before the price is known. */
export function cheapestLeadPrice(serviceSlug: string, leadType: string | null): number {
  return leadPrice(serviceSlug, leadType, 2, true);
}

/** The line about VAT shown with prices. */
export function vatNote(): string {
  return vatRegistered ? "Prices exclude VAT, which is added to each top-up." : "We're not VAT registered, so no VAT is charged.";
}

export function describeLead(requested: number, later: boolean): string {
  const kind = requested === 1 ? "exclusive (the homeowner asked for one specialist)" : `shared (the homeowner asked for ${requested} specialists)`;
  return later ? `${kind}, with the ${laterLeadDiscountPercent}% discount for work planned in 3 to 6 months` : kind;
}

function entry(
  supplierSlug: string,
  kind: LedgerEntry["kind"],
  amountCredits: number,
  enquiryId: string | null,
  note: string,
  paidPence: number | null = null,
): LedgerEntry {
  return { id: crypto.randomUUID(), supplierSlug, createdAt: new Date().toISOString(), kind, amountCredits, paidPence, enquiryId, note };
}

/** Takes the lead price if the balance covers it. Demo specialists always succeed, at no charge. */
export async function chargeForLead(s: Specialist, enquiryId: string, priceCredits: number, note: string): Promise<boolean> {
  if (s.isDemo) return true;
  return recordStore.chargeIfFunded(entry(s.slug, "lead", -priceCredits, enquiryId, note));
}

/** Gives a lead's price back, for example when its email couldn't be sent. */
export async function refundLead(s: Specialist, enquiryId: string, priceCredits: number, note: string): Promise<void> {
  if (s.isDemo) return;
  await recordStore.addLedgerEntry(entry(s.slug, "refund", priceCredits, enquiryId, note));
}

/**
 * Records money received: one credit per whole pound, plus any bonus as a
 * separate line so it can never be mistaken for credits that were paid for.
 */
export async function recordTopUp(supplierSlug: string, paidPence: number, note: string): Promise<LedgerEntry[]> {
  const credits = Math.floor(paidPence / pencePerCredit);
  const lines = [entry(supplierSlug, "topup", credits, null, note, paidPence)];
  const bonus = bonusCreditsFor(paidPence / 100);
  if (bonus > 0) lines.push(entry(supplierSlug, "bonus", bonus, null, `Bonus for a ${formatPounds(paidPence)} top-up`));
  for (const l of lines) await recordStore.addLedgerEntry(l);
  return lines;
}

/** Adds a refund, adjustment or forfeit line. */
export async function addCredit(
  supplierSlug: string,
  kind: "refund" | "adjustment" | "forfeit",
  amountCredits: number,
  note: string,
): Promise<LedgerEntry> {
  const e = entry(supplierSlug, kind, amountCredits, null, note);
  await recordStore.addLedgerEntry(e);
  return e;
}

/**
 * What a specialist's unused credits are worth in cash, for when we stop
 * introducing them (Specialist terms): the balance at the average rate they
 * paid per credit, bonus credits included, so bonus credits are never paid
 * out. Never more than they paid in, less anything already paid back.
 */
export function cashValueOfBalance(lines: LedgerEntry[]): { credits: number; pence: number } {
  const credits = lines.reduce((t, l) => t + l.amountCredits, 0);
  const bought = lines.filter((l) => l.kind === "topup" || l.kind === "bonus").reduce((t, l) => t + l.amountCredits, 0);
  const paidIn = lines.filter((l) => l.kind === "topup").reduce((t, l) => t + (l.paidPence ?? 0), 0);
  const paidOut = lines.filter((l) => l.kind === "payout").reduce((t, l) => t + (l.paidPence ?? 0), 0);
  if (credits <= 0 || bought === 0) return { credits: Math.max(credits, 0), pence: 0 };
  const value = Math.floor((Math.min(credits, bought) * paidIn) / bought);
  return { credits, pence: Math.max(0, Math.min(value, paidIn - paidOut)) };
}

/** Clears the balance and records the cash paid back. The money itself is sent by bank transfer. */
export async function recordPayout(supplierSlug: string, lines: LedgerEntry[], note: string): Promise<LedgerEntry | null> {
  const { credits, pence } = cashValueOfBalance(lines);
  if (credits <= 0) return null;
  const e = entry(supplierSlug, "payout", -credits, null, note, pence);
  await recordStore.addLedgerEntry(e);
  return e;
}

/** Whether a specialist can currently afford a lead at this price. */
export function canAfford(s: Specialist, balances: Record<string, number>, priceCredits: number): boolean {
  return s.isDemo || (balances[s.slug] ?? 0) >= priceCredits;
}

/**
 * The price list for the work a business does, and nothing else, so an
 * applicant only sees the fees for their own field. Null until prices are
 * confirmed in config/pricing.ts.
 */
export function priceListFor(servicesOffered: string[], leadTypes: Record<string, string[]> = {}): string | null {
  if (!pricesConfirmed || servicesOffered.length === 0) return null;
  const later = (credits: number) => formatCredits(laterPrice(credits));
  const line = (label: string, p: { shared: number; exclusive: number }) =>
    `  ${label}
    Exclusive (the homeowner chose only you): ${formatCredits(p.exclusive)}, or ${later(p.exclusive)} if the work is 3 to 6 months away
    Shared with up to two other specialists: ${formatCredits(p.shared)}, or ${later(p.shared)} if the work is 3 to 6 months away`;
  const lines: string[] = [];
  for (const slug of servicesOffered) {
    const name = getService(slug)?.name ?? slug;
    const kinds = getFunnel(slug)?.leadTypes?.options.filter((o) => leadTypes[slug]?.includes(o.value));
    if (!kinds?.length) {
      lines.push(line(name, pricesFor(slug, null)));
      continue;
    }
    // Kinds of job that share a price are listed together.
    const groups = new Map<ReturnType<typeof pricesFor>, string[]>();
    for (const k of kinds) groups.set(pricesFor(slug, k.value), [...(groups.get(pricesFor(slug, k.value)) ?? []), k.label]);
    for (const [prices, labels] of groups) {
      const list = labels.join(", ").replace(/, ([^,]*)$/, " and $1");
      lines.push(line(`${name}: ${list.charAt(0).toUpperCase()}${list.slice(1).toLowerCase()}`, prices));
    }
  }
  return `${lines.join("\n\n")}

Prices are for North East England. One credit is worth £1, and larger top-ups come with bonus credits. ${vatNote()} You can choose not to receive introductions for work that's 3 to 6 months away.`;
}
