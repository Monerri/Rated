import { adminRole } from "@/lib/admin";
import { allSpecialists } from "@/lib/specialistDirectory";
import { addCredit, cashValueOfBalance, recordPayout, recordTopUp } from "@/lib/billing";
import { listingStatuses } from "@/lib/listing";
import { recordStore } from "@/lib/records";
import { jsonError, readJson, str } from "@/lib/request";
import type { LedgerEntry } from "@/lib/types";

/** Balances and on/off status for every specialist, and the last 90 days of account lines. */
export async function GET(request: Request) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const [statuses, specialists] = await Promise.all([listingStatuses(), allSpecialists()]);
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return Response.json({
    role,
    suppliers: specialists.map((s) => {
      const st = statuses[s.slug];
      return {
        slug: s.slug,
        name: s.name,
        isDemo: s.isDemo,
        balanceCredits: st.balanceCredits,
        on: st.on,
        reason: st.reason,
        minimumFeeCredits: st.minimumFeeCredits,
        switchedAt: st.lastSwitch?.createdAt ?? null,
        switchNote: st.lastSwitch?.note ?? null,
      };
    }),
    entries: await recordStore.listLedger(since, 200),
  });
}

const KINDS = ["topup", "refund", "adjustment", "forfeit", "payout"] as const;

/**
 * Adds to a specialist's account.
 * - topup: `amountPounds` received; credits and any bonus are worked out here
 * - refund: positive `amountCredits` given back, for example for a disputed lead
 * - adjustment: `amountCredits` either way, to correct a mistake
 * - forfeit: removes the whole remaining balance (a leaver after the hold period)
 * - payout: clears the balance and records its cash value, for when we stop
 *   introducing them. Send `preview: true` first to see the value.
 */
export async function POST(request: Request) {
  const role = adminRole(request);
  if (!role) return jsonError("Not found.", 404);
  const body = await readJson(request);
  const slug = String(body?.supplierSlug ?? "");
  const supplier = (await allSpecialists()).find((s) => s.slug === slug);
  if (!supplier) return jsonError("Unknown specialist.");
  const kind = body?.kind as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) return jsonError("Choose a type.");
  // Money leaving the business, or credits removed for good, is for the owner only.
  if ((kind === "payout" || kind === "forfeit") && role !== "owner" && body?.preview !== true) {
    return jsonError("Only the owner can pay out or forfeit credits.", 403);
  }

  if (kind === "payout" && body?.preview === true) {
    return Response.json(cashValueOfBalance(await recordStore.listLedgerFor(slug)));
  }

  const typed = str(body?.note, 300);
  if (!typed) return jsonError("Please add a note, for example the bank transfer reference.");
  // The permanent record shows who made each change.
  const note = role === "assistant" ? `${typed} (recorded by assistant)` : typed;

  let entries: LedgerEntry[];
  if (kind === "topup") {
    const pence = Math.round(Number(body?.amountPounds) * 100);
    if (!Number.isFinite(pence) || pence < 100 || pence > 10_000_00) return jsonError("Enter the amount received, between £1 and £10,000.");
    entries = await recordTopUp(slug, pence, note);
  } else if (kind === "payout") {
    const e = await recordPayout(slug, await recordStore.listLedgerFor(slug), note);
    if (!e) return jsonError("There are no unused credits to pay out.");
    entries = [e];
  } else if (kind === "forfeit") {
    const balance = (await recordStore.getBalances())[slug] ?? 0;
    if (balance <= 0) return jsonError("There are no credits to forfeit.");
    entries = [await addCredit(slug, "forfeit", -balance, note)];
  } else {
    const credits = Math.round(Number(body?.amountCredits));
    if (!Number.isFinite(credits) || credits === 0 || Math.abs(credits) > 10_000) return jsonError("Enter a number of credits between 1 and 10,000.");
    if (kind === "refund" && credits < 0) return jsonError("Refunds must be positive.");
    entries = [await addCredit(slug, kind, credits, note)];
  }

  const balance = (await recordStore.getBalances())[slug] ?? 0;
  return Response.json({ entries, balanceCredits: balance }, { status: 201 });
}
