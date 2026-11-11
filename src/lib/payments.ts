import { site } from "@/config/site";
import { bindings } from "@/lib/cloudflare";
import type { Specialist } from "@/lib/types";

/**
 * Paying for credits by bank transfer. The account number and sort code are
 * Cloudflare variables (BANK_ACCOUNT_NUMBER and BANK_SORT_CODE), because this
 * repository is public. Until they're set, emails ask specialists to reply for
 * payment details instead. Server only.
 */

/** UK bank transfer references allow 18 characters. */
const MAX_REFERENCE = 18;

function referenceFromSlug(slug: string): string {
  return `VN-${slug.replace(/[^a-z0-9]/gi, "").toUpperCase()}`.slice(0, MAX_REFERENCE);
}

/** A new specialist's reference, different from everyone else's. */
export function newPaymentReference(slug: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = referenceFromSlug(slug);
  let ref = base;
  for (let n = 2; used.has(ref); n++) ref = `${base.slice(0, MAX_REFERENCE - String(n).length)}${n}`;
  return ref;
}

/** The reference a specialist uses when they pay us. */
export function paymentReference(s: Specialist): string {
  return s.onboarding?.paymentReference ?? referenceFromSlug(s.slug);
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  sortCode: string;
}

/** Our bank details, or null if they haven't been set in Cloudflare. */
export function bankDetails(): BankDetails | null {
  const { BANK_ACCOUNT_NUMBER, BANK_SORT_CODE } = bindings();
  const accountNumber = BANK_ACCOUNT_NUMBER?.replace(/\D/g, "");
  const digits = BANK_SORT_CODE?.replace(/\D/g, "");
  if (!accountNumber || accountNumber.length !== 8 || !digits || digits.length !== 6) return null;
  return { accountName: site.legal.companyName, accountNumber, sortCode: digits.replace(/(\d\d)(\d\d)(\d\d)/, "$1-$2-$3") };
}

/**
 * How to top up, for the end of an email: our bank details and the
 * specialist's own reference, the payee name explained, and a warning about
 * fake "our bank details have changed" emails.
 */
export function topUpInstructions(s: Specialist): string {
  const bank = bankDetails();
  if (!bank) return `To top up, reply to this email and we'll send you our payment details.`;
  return `${site.name} top-up payments
  Account name:    ${bank.accountName}
  Account number:  ${bank.accountNumber}
  Sort code:       ${bank.sortCode}
  Your reference:  ${paymentReference(s)}

Please always use your reference, so we can add the credits to the right account. ${bank.accountName} is the company behind ${site.name}, so that's the name your bank will check. We add your credits as soon as the money arrives, usually the same working day.

Our bank details won't change without warning. If they ever do, we'll phone you first. Never pay a different account because of an email alone, even one that looks like it's from us.`;
}
