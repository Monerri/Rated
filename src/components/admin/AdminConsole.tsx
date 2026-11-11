"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormError, TextField } from "@/components/ui/Form";
import type { LedgerEntry } from "@/lib/types";
import { bonusCreditsFor, formatCredits, formatPounds } from "@/lib/credits";
import { AdminOnboarding } from "@/components/admin/AdminOnboarding";
import { launch } from "@/config/launch";
import { AdminCoverage } from "@/components/admin/AdminCoverage";

/** "£500 = 500 credits + 50 bonus credits", for the top-up form. */
function topUpHint(pounds: number): string {
  if (!Number.isFinite(pounds) || pounds < 1) return "One credit per whole pound, plus bonus credits on larger top-ups.";
  const credits = Math.floor(pounds);
  const bonus = bonusCreditsFor(pounds);
  return `${formatPounds(Math.round(pounds * 100))} = ${credits.toLocaleString("en-GB")} credits${bonus ? ` + ${bonus.toLocaleString("en-GB")} bonus credits` : ""}.`;
}

interface FeedbackRow {
  respondedAt: string;
  specialist: string;
  service: string;
  area: string;
  firstName: string;
  contacted: "yes" | "no" | "not-yet";
  rating: number | null;
  comment: string | null;
  mayQuote: boolean;
}

const CONTACTED_LABELS = { yes: "Got in touch", "not-yet": "Not yet", no: "Never got in touch" };

interface Supplier {
  slug: string;
  name: string;
  isDemo: boolean;
  paymentReference: string | null;
  balanceCredits: number;
  on: boolean;
  reason: "awaiting-terms" | "switched-off" | "low-balance" | null;
  minimumFeeCredits: number | null;
  switchedAt: string | null;
  switchNote: string | null;
}

/** Status in words and a symbol, never colour alone. */
function statusText(s: Supplier): string {
  if (s.on) return "✓ On";
  if (s.reason === "awaiting-terms") return "… Off until they accept the Specialist terms";
  if (s.reason === "switched-off") return `✕ Off (switched off${s.switchedAt ? ` ${s.switchedAt.slice(0, 10)}` : ""})`;
  return `✕ Off (balance below ${money(s.minimumFeeCredits ?? 0)}; back on after a top-up)`;
}

const TOKEN_KEY = "vn_admin_token";
const KIND_LABELS: Record<LedgerEntry["kind"], string> = {
  topup: "Top-up",
  bonus: "Bonus",
  promo: "Free credits",
  lead: "Lead",
  refund: "Refund",
  adjustment: "Adjustment",
  forfeit: "Forfeit",
  payout: "Paid out",
};

const money = formatCredits;

function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Balances and manual account changes. The admin token is kept in this tab
 * only and sent with each request; the server checks it.
 */
export function AdminConsole() {
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [data, setData] = useState<{ role: "owner" | "assistant"; suppliers: Supplier[]; entries: LedgerEntry[] } | null>(null);
  const [tab, setTab] = useState<"onboarding" | "accounts" | "coverage" | "feedback">("onboarding");
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [kind, setKind] = useState<"topup" | "promo" | "refund" | "adjustment" | "forfeit" | "payout">("topup");
  const [payoutPreview, setPayoutPreview] = useState<{ credits: number; pence: number } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async (t: string) => {
    setError(null);
    const res = await fetch("/api/admin/ledger", { headers: { authorization: `Bearer ${t}` } });
    if (!res.ok) {
      setData(null);
      setError(res.status === 404 ? "That password isn't right." : "Couldn't load accounts.");
      return false;
    }
    setData(await res.json());
    const fb = await fetch("/api/admin/feedback", { headers: { authorization: `Bearer ${t}` } }).catch(() => null);
    if (fb?.ok) setFeedback(((await fb.json()) as { feedback: FeedbackRow[] }).feedback);
    return true;
  }, []);

  // Restore the token saved in this tab, after hydration (sessionStorage only exists in the browser).
  useEffect(() => {
    const t = readToken();
    if (!t) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setToken(t);
    void load(t);
  }, [load]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (await load(draftToken)) {
      setToken(draftToken);
      try {
        sessionStorage.setItem(TOKEN_KEY, draftToken);
      } catch {}
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const value = Number(amount);
    if ((kind === "topup" || kind === "promo" || kind === "refund" || kind === "adjustment") && (!Number.isFinite(value) || value === 0)) {
      return setError(kind === "topup" ? "Enter the amount received in pounds." : "Enter a number of credits.");
    }
    setBusy(true);
    const res = await fetch("/api/admin/ledger", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ supplierSlug: supplier, kind, amountPounds: value, amountCredits: value, note }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setError(body.error ?? "That didn't work.");
    const name = data?.suppliers.find((s) => s.slug === supplier)?.name ?? supplier;
    setMessage(`Done. ${name}'s balance is now ${money(body.balanceCredits)}.`);
    setAmount("");
    setNote("");
    setPayoutPreview(null);
    await load(token);
  }

  /** Shows what a payout would be worth before it's saved. */
  async function previewPayout(slug: string) {
    setPayoutPreview(null);
    if (!slug) return;
    const res = await fetch("/api/admin/ledger", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ supplierSlug: slug, kind: "payout", preview: true }),
    });
    if (res.ok) setPayoutPreview(await res.json());
  }

  async function switchListing(target: { supplierSlug: string } | { allDemo: true }, on: boolean, label: string) {
    setError(null);
    setSwitchMessage(null);
    setBusy(true);
    const res = await fetch("/api/admin/listing", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ ...target, on }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setSwitchMessage(body.error ?? "That didn't work.");
    setSwitchMessage(`${label} switched ${on ? "on" : "off"}.`);
    await load(token);
  }

  if (!token || !data) {
    return (
      <form onSubmit={signIn} className="grid max-w-md gap-4">
        <TextField
          label="Admin password"
          type="password"
          autoComplete="current-password"
          value={draftToken}
          onChange={(e) => setDraftToken(e.target.value)}
          hint="The owner's or the assistant's password. You stay signed in until you close this tab."
        />
        {error && <FormError>{error}</FormError>}
        <button type="submit" className={buttonClass("primary")}>
          Sign in
        </button>
      </form>
    );
  }

  const names = Object.fromEntries(data.suppliers.map((s) => [s.slug, s.name]));
  const real = data.suppliers.filter((s) => !s.isDemo);
  const demo = data.suppliers.filter((s) => s.isDemo);
  const demoOn = demo.filter((s) => s.on);

  const owner = data.role === "owner";
  const tabs = [
    { id: "onboarding", label: "Applications and specialists" },
    { id: "accounts", label: "Accounts and top-ups" },
    { id: "coverage", label: "Coverage" },
    { id: "feedback", label: "Feedback" },
  ] as const;

  return (
    <div className="grid min-w-0 gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-muted">Signed in as {owner ? "the owner" : "an assistant"}.</p>
        <button
          type="button"
          className={buttonClass("secondary", "sm")}
          onClick={() => {
            try {
              sessionStorage.removeItem(TOKEN_KEY);
            } catch {}
            setToken("");
            setData(null);
          }}
        >
          Sign out
        </button>
      </div>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-full border-[1.5px] px-4 text-[15px] font-semibold ${
              tab === t.id ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink"
            }`}
          >
            {tab === t.id ? "● " : ""}
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "onboarding" && <AdminOnboarding token={token} onChanged={() => void load(token)} />}

      {tab === "coverage" && <AdminCoverage token={token} />}

      {tab === "accounts" && (
      <div className="grid min-w-0 gap-10">
      {demoOn.length > 0 && (
        <section
          aria-labelledby="demo-reminder"
          className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-ink bg-surface p-4"
        >
          <h2 id="demo-reminder" className="text-lg font-bold">
            ⚠ Before you go live: switch off the demo companies
          </h2>
          <p className="text-[15px]">
            {demoOn.length} fictional demo {demoOn.length === 1 ? "company is" : "companies are"} still switched on, so real
            homeowners could be introduced to {demoOn.length === 1 ? "it" : "them"}. Switch them off once your real
            specialists are on and topped up.
          </p>
          <button
            type="button"
            className={buttonClass("secondary")}
            disabled={busy}
            onClick={() => {
              if (window.confirm("Switch off every demo company? You can switch them back on here.")) {
                void switchListing({ allDemo: true }, false, "All demo companies");
              }
            }}
          >
            Switch off all demo companies
          </button>
        </section>
      )}

      <section aria-labelledby="balances" className="grid min-w-0 gap-3">
        <h2 id="balances" className="text-2xl font-bold">
          Specialists
        </h2>
        <p className="text-[15px] text-muted">
          A specialist is only sent leads while they&apos;re on. They switch off by themselves when their
          balance is below their cheapest lead, and back on after a top-up. You can also switch anyone off by hand.
        </p>
        {real.length === 0 && (
          <p className="text-muted">No real specialists yet. Demo specialists aren&apos;t charged and are listed below.</p>
        )}
        {switchMessage && (
          <p role="status" className="font-semibold">
            {switchMessage}
          </p>
        )}
        <ul className="grid gap-3">
          {[...real, ...demo].map((s) => (
            <li
              key={s.slug}
              className={`grid min-w-0 gap-2 rounded-[var(--radius-card)] border bg-surface p-4 text-[15px] ${
                s.on ? "border-line" : "border-dashed border-ink"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-semibold">
                  {s.name}
                  {s.isDemo && <span className="ml-2 font-mono text-xs text-muted">DEMO, NOT CHARGED</span>}
                </p>
                <p className="font-mono">{s.isDemo ? "No charge" : money(s.balanceCredits)}</p>
              </div>
              <p className="font-semibold">{statusText(s)}</p>
              {s.paymentReference && <p className="text-muted">Payment reference: <span className="font-mono text-ink">{s.paymentReference}</span></p>}
              {!s.isDemo && s.minimumFeeCredits !== null && (
                <p className="text-muted">Cheapest lead: {money(s.minimumFeeCredits)}</p>
              )}
              <button
                type="button"
                className={`${buttonClass("secondary")} justify-self-start`}
                disabled={busy}
                onClick={() => void switchListing({ supplierSlug: s.slug }, s.reason === "switched-off", s.name)}
              >
                {s.reason === "switched-off" ? "Switch on" : "Switch off"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="change" className="grid min-w-0 max-w-md gap-4">
        <h2 id="change" className="text-2xl font-bold">
          Add to an account
        </h2>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid min-w-0 gap-1.5 text-[15px] font-semibold">
            Specialist
            <select
              required
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value);
                if (kind === "payout") void previewPayout(e.target.value);
              }}
              className="min-h-[52px] w-full min-w-0 rounded-lg border-[1.5px] border-line bg-surface px-3 text-[17px] font-normal"
            >
              <option value="">Choose…</option>
              {[...real, ...demo].map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                  {s.isDemo ? " (demo)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1.5 text-[15px] font-semibold">
            Type
            <select
              value={kind}
              onChange={(e) => {
                const k = e.target.value as typeof kind;
                setKind(k);
                setAmount("");
                if (k === "payout") void previewPayout(supplier);
              }}
              className="min-h-[52px] w-full min-w-0 rounded-lg border-[1.5px] border-line bg-surface px-3 text-[17px] font-normal"
            >
              <option value="topup">Top-up (they paid you)</option>
              {owner && <option value="promo">Free credits (no money received, never paid out)</option>}
              <option value="refund">Refund credits to balance (for example, a disputed lead)</option>
              <option value="adjustment">Adjustment (correct a mistake; can be negative)</option>
              {owner && <option value="forfeit">Forfeit all credits (left over 6 months ago)</option>}
              {owner && <option value="payout">Pay out unused credits as cash (we stopped introducing them)</option>}
            </select>
          </label>
          {supplier && data.suppliers.find((s) => s.slug === supplier)?.paymentReference && (
            <p className="rounded-[var(--radius-card)] border border-line bg-surface p-3 text-[15px]">
              Their payment reference:{" "}
              <span className="font-mono font-semibold">{data.suppliers.find((s) => s.slug === supplier)?.paymentReference}</span>
              <span className="block text-sm text-muted">Match this with the reference on the bank transfer.</span>
            </p>
          )}
          {kind === "topup" && (
            <TextField
              label="Amount received (£)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={topUpHint(Number(amount))}
            />
          )}
          {kind === "promo" && (
            <TextField
              label="Free credits"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={`Recorded as free credits, not money received. They're used before bought credits and are never paid out. Founding specialists get ${launch.foundingCredits} automatically when they accept the terms.`}
            />
          )}
          {(kind === "refund" || kind === "adjustment") && (
            <TextField
              label="Credits"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={kind === "adjustment" ? "Use a minus sign to take credits off, for example -15. Credits added here have no cash value." : undefined}
            />
          )}
          {kind === "payout" && (
            <p className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]" role="status">
              {!supplier
                ? "Choose a specialist to see what their unused credits are worth."
                : payoutPreview === null
                  ? "Working it out…"
                  : payoutPreview.credits <= 0
                    ? "They have no unused credits."
                    : `${payoutPreview.credits.toLocaleString("en-GB")} unused credits, worth ${formatPounds(payoutPreview.pence)} at the average rate they paid (bonus credits aren't paid out). Send this by bank transfer, then save to clear the balance.`}
            </p>
          )}
          <TextField
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="For example, the bank transfer reference or the enquiry reference."
            required
          />
          {error && <FormError>{error}</FormError>}
          {message && (
            <p role="status" className="font-semibold text-green">
              {message}
            </p>
          )}
          <button type="submit" className={buttonClass("primary")} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      </div>
      )}

      {tab === "feedback" && (
      <section aria-labelledby="feedback" className="grid min-w-0 gap-3">
        <h2 id="feedback" className="text-2xl font-bold">
          Homeowner feedback
        </h2>
        {feedback.length === 0 ? (
          <p className="text-muted">No feedback yet. Homeowners are asked about two weeks after an introduction.</p>
        ) : (
          <ul className="grid gap-3">
            {feedback.map((f, i) => (
              <li key={i} className="grid gap-1 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
                <p className="font-semibold">
                  {f.specialist} · {f.service} · {f.area}
                </p>
                <p>
                  {f.contacted === "no" ? "⚠ " : ""}
                  {CONTACTED_LABELS[f.contacted]}
                  {f.rating ? ` · Rated ${f.rating} out of 5` : ""}
                </p>
                {f.comment && (
                  <p className="text-muted">
                    &ldquo;{f.comment}&rdquo; ({f.firstName}, {f.area}) {f.mayQuote ? "· May be quoted" : "· Not for publication"}
                  </p>
                )}
                <p className="font-mono text-xs text-muted">{f.respondedAt.slice(0, 10)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      )}

      {tab === "accounts" && (
      <section aria-labelledby="history" className="grid min-w-0 gap-3">
        <h2 id="history" className="text-2xl font-bold">
          Last 90 days
        </h2>
        {data.entries.length === 0 ? (
          <p className="text-muted">Nothing yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2 font-semibold">When</th>
                  <th className="py-2 font-semibold">Specialist</th>
                  <th className="py-2 font-semibold">Type</th>
                  <th className="py-2 text-right font-semibold">Credits</th>
                  <th className="py-2 pl-4 text-right font-semibold">Money</th>
                  <th className="py-2 pl-4 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-b border-line align-top">
                    <td className="py-2 pr-4 font-mono whitespace-nowrap">{e.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="py-2">{names[e.supplierSlug] ?? e.supplierSlug}</td>
                    <td className="py-2">{KIND_LABELS[e.kind]}</td>
                    <td className="py-2 text-right font-mono">{e.amountCredits > 0 ? "+" : ""}{e.amountCredits.toLocaleString("en-GB")}</td>
                    <td className="py-2 pl-4 text-right font-mono">
                      {e.paidPence ? `${e.kind === "payout" ? "Paid out " : "Received "}${formatPounds(e.paidPence)}` : ""}
                    </td>
                    <td className="py-2 pl-4 text-muted">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
