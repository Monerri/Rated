import { specialists } from "@/data/specialists";
import { authorised } from "@/lib/admin";
import { addCredit } from "@/lib/billing";
import { listingStatuses } from "@/lib/listing";
import { recordStore } from "@/lib/records";
import { jsonError, readJson, str } from "@/lib/request";
import type { LedgerEntry } from "@/lib/types";

/** Balances and on/off status for every specialist, and the last 90 days of account lines. */
export async function GET(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  const statuses = await listingStatuses();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return Response.json({
    suppliers: specialists.map((s) => {
      const st = statuses[s.slug];
      return {
        slug: s.slug,
        name: s.name,
        isDemo: s.isDemo,
        balancePence: st.balancePence,
        on: st.on,
        reason: st.reason,
        minimumFeePence: st.minimumFeePence,
        switchedAt: st.lastSwitch?.createdAt ?? null,
        switchNote: st.lastSwitch?.note ?? null,
      };
    }),
    entries: await recordStore.listLedger(since, 200),
  });
}

const KINDS = ["topup", "refund", "adjustment", "forfeit"] as const;

/**
 * Adds a line to a specialist's account.
 * - topup, refund: a positive amount in pence
 * - adjustment: positive or negative, to correct a mistake
 * - forfeit: removes the whole remaining balance (the amount is worked out here)
 */
export async function POST(request: Request) {
  if (!authorised(request)) return jsonError("Not found.", 404);
  const body = await readJson(request);
  const slug = String(body?.supplierSlug ?? "");
  const supplier = specialists.find((s) => s.slug === slug);
  if (!supplier) return jsonError("Unknown specialist.");
  const kind = body?.kind as (typeof KINDS)[number];
  if (!KINDS.includes(kind)) return jsonError("Choose top-up, refund, adjustment or forfeit.");
  const note = str(body?.note, 300);
  if (!note) return jsonError("Please add a note, for example the bank transfer reference.");

  let amount = Math.round(Number(body?.amountPence));
  if (kind === "forfeit") {
    amount = -((await recordStore.getBalances())[slug] ?? 0);
    if (amount >= 0) return jsonError("There's no balance to forfeit.");
  } else if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10_000_00) {
    return jsonError("Enter an amount between £0.01 and £10,000.");
  } else if (kind !== "adjustment" && amount < 0) {
    return jsonError("Top-ups and refunds must be positive.");
  }

  const entry: LedgerEntry = await addCredit(slug, kind, amount, note);
  const balance = (await recordStore.getBalances())[slug] ?? 0;
  return Response.json({ entry, balancePence: balance }, { status: 201 });
}
