"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormError, TextField } from "@/components/ui/Form";
import type { LedgerEntry } from "@/lib/types";

interface Supplier {
  slug: string;
  name: string;
  isDemo: boolean;
  balancePence: number;
}

const TOKEN_KEY = "vn_admin_token";
const KIND_LABELS: Record<LedgerEntry["kind"], string> = {
  topup: "Top-up",
  lead: "Lead",
  refund: "Refund",
  adjustment: "Adjustment",
  forfeit: "Forfeit",
};

function money(pence: number) {
  return `${pence < 0 ? "-" : ""}£${(Math.abs(pence) / 100).toFixed(2)}`;
}

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
  const [data, setData] = useState<{ suppliers: Supplier[]; entries: LedgerEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [supplier, setSupplier] = useState("");
  const [kind, setKind] = useState<"topup" | "refund" | "adjustment" | "forfeit">("topup");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async (t: string) => {
    setError(null);
    const res = await fetch("/api/admin/ledger", { headers: { authorization: `Bearer ${t}` } });
    if (!res.ok) {
      setData(null);
      setError(res.status === 404 ? "That token isn't right, or ADMIN_API_TOKEN isn't set on the Worker." : "Couldn't load accounts.");
      return false;
    }
    setData(await res.json());
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
    const pounds = Number(amount);
    if (kind !== "forfeit" && (!Number.isFinite(pounds) || pounds === 0)) return setError("Enter an amount in pounds.");
    setBusy(true);
    const res = await fetch("/api/admin/ledger", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ supplierSlug: supplier, kind, amountPence: Math.round(pounds * 100), note }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setError(body.error ?? "That didn't work.");
    const name = data?.suppliers.find((s) => s.slug === supplier)?.name ?? supplier;
    setMessage(`Done. ${name}'s balance is now ${money(body.balancePence)}.`);
    setAmount("");
    setNote("");
    await load(token);
  }

  if (!token || !data) {
    return (
      <form onSubmit={signIn} className="grid max-w-md gap-4">
        <TextField
          label="Admin token"
          type="password"
          autoComplete="current-password"
          value={draftToken}
          onChange={(e) => setDraftToken(e.target.value)}
          hint="The ADMIN_API_TOKEN secret set on the Worker in Cloudflare."
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

  return (
    <div className="grid min-w-0 gap-10">
      <section aria-labelledby="balances" className="grid min-w-0 gap-3">
        <h2 id="balances" className="text-2xl font-bold">
          Balances
        </h2>
        {real.length === 0 && (
          <p className="text-muted">No real specialists yet. Demo specialists aren&apos;t charged and are listed below.</p>
        )}
        <table className="w-full text-left text-[15px]">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 font-semibold">Specialist</th>
              <th className="py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {[...real, ...demo].map((s) => (
              <tr key={s.slug} className="border-b border-line">
                <td className="py-2">
                  {s.name}
                  {s.isDemo && <span className="ml-2 font-mono text-xs text-muted">DEMO, NOT CHARGED</span>}
                </td>
                <td className="py-2 text-right font-mono">{money(s.balancePence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              onChange={(e) => setSupplier(e.target.value)}
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
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="min-h-[52px] w-full min-w-0 rounded-lg border-[1.5px] border-line bg-surface px-3 text-[17px] font-normal"
            >
              <option value="topup">Top-up (they paid you)</option>
              <option value="refund">Refund to balance (for example, a disputed lead)</option>
              <option value="adjustment">Adjustment (correct a mistake; can be negative)</option>
              <option value="forfeit">Forfeit whole balance (left over 6 months ago)</option>
            </select>
          </label>
          {kind !== "forfeit" && (
            <TextField
              label="Amount (£)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint={kind === "adjustment" ? "Use a minus sign to take money off, for example -15" : undefined}
            />
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
                  <th className="py-2 text-right font-semibold">Amount</th>
                  <th className="py-2 pl-4 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-b border-line align-top">
                    <td className="py-2 font-mono whitespace-nowrap">{e.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="py-2">{names[e.supplierSlug] ?? e.supplierSlug}</td>
                    <td className="py-2">{KIND_LABELS[e.kind]}</td>
                    <td className="py-2 text-right font-mono">{money(e.amountPence)}</td>
                    <td className="py-2 pl-4 text-muted">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
