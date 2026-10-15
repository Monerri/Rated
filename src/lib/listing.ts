import { specialists } from "@/data/specialists";
import { leadPrice } from "@/lib/billing";
import { getFunnel } from "@/funnels";
import { recordStore } from "@/lib/records";
import type { ListingSwitch, Specialist } from "@/lib/types";

/**
 * Whether each specialist is switched on: shown in the directory and
 * considered for leads. A specialist is off when either
 * - they've been switched off by hand (on /admin), or
 * - their balance is below their minimum lead fee. This switches itself
 *   back on as soon as they top up. Demo specialists are never charged, so
 *   only the manual switch applies to them.
 * Server only.
 */

export interface ListingStatus {
  on: boolean;
  /** Why they're off, or null when on. */
  reason: "switched-off" | "low-balance" | null;
  balancePence: number;
  /** The cheapest lead they could receive. Null for demo specialists, who aren't charged. */
  minimumFeePence: number | null;
  /** The latest manual switch, if there's ever been one. */
  lastSwitch: ListingSwitch | null;
}

/** The cheapest lead a specialist could receive, across the services and kinds of job they take. */
export function minimumLeadFee(s: Specialist): number {
  const fees: number[] = [];
  for (const service of s.services) {
    const later = !s.skipLaterLeadsFor?.includes(service);
    const kinds = getFunnel(service)?.leadTypes?.options.map((o) => o.value) ?? [null];
    const accepted = kinds.filter((k) => k === null || !s.leadTypes?.[service] || s.leadTypes[service].includes(k));
    for (const k of accepted.length ? accepted : [null]) fees.push(leadPrice(service, k, 2, later));
  }
  return fees.length ? Math.min(...fees) : 0;
}

export function listingStatus(
  s: Specialist,
  balances: Record<string, number>,
  switches: Record<string, ListingSwitch>,
): ListingStatus {
  const balancePence = balances[s.slug] ?? 0;
  const lastSwitch = switches[s.slug] ?? null;
  const minimumFeePence = s.isDemo ? null : minimumLeadFee(s);
  const reason =
    lastSwitch && !lastSwitch.on
      ? "switched-off"
      : minimumFeePence !== null && balancePence < minimumFeePence
        ? "low-balance"
        : null;
  return { on: reason === null, reason, balancePence, minimumFeePence, lastSwitch };
}

/** Every specialist's status, by slug. */
export async function listingStatuses(): Promise<Record<string, ListingStatus>> {
  const [balances, switches] = await Promise.all([recordStore.getBalances(), recordStore.getListingSwitches()]);
  return Object.fromEntries(specialists.map((s) => [s.slug, listingStatus(s, balances, switches)]));
}

/** Slugs of specialists switched off by hand. They're left out of matching entirely. */
export async function switchedOffByHand(): Promise<Set<string>> {
  const switches = await recordStore.getListingSwitches();
  return new Set(Object.values(switches).filter((r) => !r.on).map((r) => r.supplierSlug));
}

/** Switches specialists on or off by hand. Only records a line where the setting actually changes. */
export async function setListing(slugs: string[], on: boolean, note: string): Promise<number> {
  const switches = await recordStore.getListingSwitches();
  let changed = 0;
  for (const slug of slugs) {
    const current = switches[slug]?.on ?? true;
    if (current === on) continue;
    await recordStore.addListingSwitch({ id: crypto.randomUUID(), supplierSlug: slug, createdAt: new Date().toISOString(), on, note });
    changed++;
  }
  return changed;
}

/** Demo specialists that are still switched on. Used for the "before you go live" reminders. */
export function demoStillOn(statuses: Record<string, ListingStatus>): Specialist[] {
  return specialists.filter((s) => s.isDemo && statuses[s.slug]?.on);
}
