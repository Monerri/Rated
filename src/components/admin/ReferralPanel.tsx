"use client";

import { useCallback, useEffect, useState } from "react";
import { referrals } from "@/config/referrals";
import { buttonClass } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Form";
import type { ReferralFlag } from "@/lib/types";

interface Flag {
  flag: ReferralFlag;
  detail: string;
  label: string;
  blocking: boolean;
}

interface ReferralState {
  recommendedBy: { name: string; submittedAt: string } | null;
  suggestions: { slug: string; name: string }[];
  approved: { slug: string; name: string }[];
  chosen: { slug: string; name: string } | null;
  flags: Flag[];
  confirmation: { recommenderName: string; confirmedAt: string; overrides: { flag: ReferralFlag; reason: string }[] } | null;
  award: { recommenderName: string; recommendedName: string; awardedAt: string; recommenderEntryId: string | null } | null;
  canConfirm: boolean;
}

const OUTCOME_TEXT: Record<string, string> = {
  awarded: `Confirmed. ${referrals.credits} credits each have been added and both businesses emailed.`,
  already_awarded: "Referral credits were already added for this application.",
  waiting: `Confirmed. The ${referrals.credits} credits each will be added automatically once the business is approved and has accepted the Specialist terms.`,
};

/**
 * "Recommended by" on an application: suggested matches, the flags for the
 * chosen recommender, and (owner only) the manual confirmation. Never awards
 * anything by itself. Status is shown with symbols and words, never colour alone.
 */
export function ReferralPanel({ token, applicationId }: { token: string; applicationId: string }) {
  const [state, setState] = useState<ReferralState | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [reasons, setReasons] = useState<Partial<Record<ReferralFlag, string>>>({});
  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(
    async (recommender?: string) => {
      const q = recommender ? `?recommender=${encodeURIComponent(recommender)}` : "";
      const res = await fetch(`/api/admin/applications/${applicationId}/referral${q}`, { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) return setError("Couldn't load the referral.");
      const body = (await res.json()) as ReferralState;
      setState(body);
      setSlug(body.chosen?.slug ?? "");
    },
    [applicationId, token],
  );

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  if (!state) return <p className="text-[15px] text-muted">Loading the referral…</p>;
  if (!state.recommendedBy) return null;

  const blocking = state.flags.filter((f) => f.blocking);
  const overridable = [...new Map(state.flags.filter((f) => !f.blocking).map((f) => [f.flag, f])).values()];
  const suggested = new Set(state.suggestions.map((s) => s.slug));
  const others = state.approved.filter((s) => !suggested.has(s.slug));

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${applicationId}/referral`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ recommenderSlug: slug, overrides: reasons, ownershipChecked }),
    }).catch(() => null);
    setBusy(false);
    const body = (await res?.json().catch(() => null)) as { error?: string; outcome?: { status: string } } | null;
    if (!res?.ok) return setError(body?.error ?? "That didn't work.");
    setMessage(OUTCOME_TEXT[body?.outcome?.status ?? "waiting"] ?? OUTCOME_TEXT.waiting);
    setConfirmed(false);
    await load(slug);
  }

  return (
    <section aria-label="Referral" className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
      <h3 className="font-bold">Referral</h3>
      <p>
        <span className="font-semibold">Recommended by (as typed):</span> &ldquo;{state.recommendedBy.name}&rdquo;
        <span className="text-muted"> · submitted {state.recommendedBy.submittedAt.slice(0, 16).replace("T", " ")} UTC</span>
      </p>

      {state.award ? (
        <p role="status" className="font-semibold">
          ✓ {referrals.credits} referral credits added {state.award.awardedAt.slice(0, 10)}: {state.award.recommendedName}
          {state.award.recommenderEntryId ? ` and ${state.award.recommenderName}` : ` (not ${state.award.recommenderName}, who had left)`}.
        </p>
      ) : (
        <>
          {state.confirmation && (
            <p className="font-semibold">
              … Confirmed as {state.confirmation.recommenderName} on {state.confirmation.confirmedAt.slice(0, 10)}. Credits are added once
              the business is approved and has accepted the Specialist terms.
            </p>
          )}

          <label className="grid gap-1.5">
            <span className="font-semibold">Recommender</span>
            <select
              className="min-h-11 rounded-lg border-[1.5px] border-line bg-surface px-3 text-[16px]"
              value={slug}
              disabled={!!state.confirmation}
              onChange={(e) => {
                setSlug(e.target.value);
                setReasons({});
                void load(e.target.value || undefined);
              }}
            >
              <option value="">Choose a specialist</option>
              {state.suggestions.length > 0 && (
                <optgroup label="Suggested matches">
                  {state.suggestions.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="All approved specialists">
                {others.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
            {state.suggestions.length === 0 && <span className="text-sm text-muted">No likely match among approved specialists.</span>}
          </label>

          {state.flags.length === 0 ? (
            <p>✓ No flags for this recommender.</p>
          ) : (
            <ul className="grid gap-2">
              {state.flags.map((f, i) => (
                <li key={i} className="rounded-lg border border-line p-3">
                  <p className="font-semibold">
                    {f.blocking ? "✕" : "⚠"} {f.label}
                    {f.blocking ? " (can't be overridden)" : ""}
                  </p>
                  <p className="text-muted">{f.detail}</p>
                </li>
              ))}
            </ul>
          )}

          {state.canConfirm && !state.confirmation && blocking.length === 0 && slug && (
            <div className="grid gap-3">
              {overridable.map((f) => (
                <label key={f.flag} className="grid gap-1.5">
                  <span className="font-semibold">Reason to override: {f.label.toLowerCase()}</span>
                  <textarea
                    className="min-h-[70px] w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 py-3 text-[16px]"
                    maxLength={500}
                    value={reasons[f.flag] ?? ""}
                    onChange={(e) => setReasons({ ...reasons, [f.flag]: e.target.value })}
                  />
                </label>
              ))}
              <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3">
                <input type="checkbox" checked={ownershipChecked} onChange={(e) => setOwnershipChecked(e.target.checked)} className="mt-0.5 size-[20px] accent-blue" />
                <span>
                  I&apos;ve checked Companies House (or, for sole traders, the owners&apos; details) and the two businesses don&apos;t share an
                  owner or director.
                </span>
              </label>
              <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 size-[20px] accent-blue" />
                <span>I confirm this is the specialist who recommended them.</span>
              </label>
              <button
                type="button"
                disabled={busy || !confirmed}
                onClick={() => void confirm()}
                className={buttonClass("primary", "sm", "justify-self-start")}
              >
                {busy ? "Confirming…" : "Confirm the referral"}
              </button>
            </div>
          )}
          {!state.canConfirm && !state.confirmation && <p className="text-muted">Only the owner can confirm referrals.</p>}
          {state.canConfirm && blocking.length > 0 && <p className="font-semibold">This referral can&apos;t qualify, so it can&apos;t be confirmed.</p>}
        </>
      )}
      {message && (
        <p role="status" className="font-semibold">
          {message}
        </p>
      )}
      {error && <FormError>{error}</FormError>}
    </section>
  );
}
