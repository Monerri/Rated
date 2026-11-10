import { creditBonusTiers, pencePerCredit } from "@/config/pricing";

/**
 * Formatting and bonus maths for credits. No server code here, so the admin
 * page can use it too. One credit is worth £1.
 */

/** Pounds, for example "£40.00". */
export function formatPounds(pence: number): string {
  const sign = pence < 0 ? "-" : "";
  return `${sign}£${(Math.abs(pence) / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Credits with their pound value, for example "40 credits (£40.00)". Specialists always see both. */
export function formatCredits(credits: number): string {
  const n = Math.abs(credits);
  return `${credits < 0 ? "-" : ""}${n.toLocaleString("en-GB")} credit${n === 1 ? "" : "s"} (${formatPounds(n * pencePerCredit)})`;
}

/** Bonus credits for a top-up of this many pounds, from the tiers in config/pricing.ts. */
export function bonusCreditsFor(pounds: number): number {
  const tier = creditBonusTiers.find((t) => pounds >= t.fromPounds);
  return tier ? Math.floor((pounds * tier.percent) / 100) : 0;
}
