"use client";

import { useCallback, useEffect, useState } from "react";
import { getService } from "@/config/services";
import { buttonClass } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Form";
import { blankValues, SpecialistForm, valuesFromApplication, valuesFromSpecialist } from "@/components/admin/SpecialistForm";
import type { Specialist, SupplierApplication } from "@/lib/types";

type Editing =
  | { kind: "application"; application: SupplierApplication }
  | { kind: "new" }
  | { kind: "edit"; specialist: Specialist }
  | null;

const STATUS_LABELS: Record<SupplierApplication["status"], string> = {
  received: "To review",
  under_review: "To review",
  accepted: "✓ Approved",
  declined: "✕ Declined",
};

function date(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function servicesOf(slugs: string[]): string {
  return slugs.map((s) => getService(s)?.name ?? s).join(", ");
}

/** Onboarding status in words and a symbol, never colour alone. */
function onboardingText(s: Specialist): string {
  const o = s.onboarding!;
  if (o.status === "active") return `✓ Terms accepted ${date(o.terms!.acceptedAt)} by ${o.terms!.acceptedByName}`;
  if (!o.termsInvite) return "⚠ Awaiting terms: no link sent yet";
  const expired = new Date(o.termsInvite.expiresAt) < new Date();
  return `${expired ? "⚠ Terms link expired" : "… Awaiting terms"} (link sent ${date(o.termsInvite.sentAt)})`;
}

/**
 * Applications to review, and real specialists' onboarding: approve after
 * checks, send the terms, edit details. Accounts and top-ups are handled in
 * the Accounts tab.
 */
export function AdminOnboarding({ token, owner, onChanged }: { token: string; owner: boolean; onChanged: () => void }) {
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [stored, setStored] = useState<Specialist[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [declining, setDeclining] = useState<SupplierApplication | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);

  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([
      fetch("/api/admin/applications", { headers: { authorization: `Bearer ${token}` } }),
      fetch("/api/admin/specialists", { headers: { authorization: `Bearer ${token}` } }),
    ]);
    if (a.ok) setApplications(((await a.json()) as { applications: SupplierApplication[] }).applications);
    if (s.ok) setStored(((await s.json()) as { specialists: Specialist[] }).specialists);
  }, [token]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  async function resendTerms(s: Specialist) {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/specialists/${s.slug}/terms`, { method: "POST", headers });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return setError(body.error ?? "That didn't work.");
    setMessage(`A new terms link has been emailed to ${s.name}. Any earlier link no longer works.`);
    await load();
  }

  function finished(text: string) {
    setEditing(null);
    setMessage(text);
    void load();
    onChanged();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (editing) {
    const title =
      editing.kind === "application"
        ? `Review and approve: ${editing.application.companyName}`
        : editing.kind === "edit"
          ? `Edit: ${editing.specialist.name}`
          : "Add a specialist";
    return (
      <section className="grid min-w-0 gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        {editing.kind === "application" && <ApplicationDetails a={editing.application} />}
        <SpecialistForm
          token={token}
          mode={editing.kind === "edit" ? "edit" : "approve"}
          initial={
            editing.kind === "application"
              ? valuesFromApplication(editing.application)
              : editing.kind === "edit"
                ? valuesFromSpecialist(editing.specialist)
                : blankValues()
          }
          applicationId={editing.kind === "application" ? editing.application.id : undefined}
          slug={editing.kind === "edit" ? editing.specialist.slug : undefined}
          onDone={finished}
          onCancel={() => setEditing(null)}
        />
      </section>
    );
  }

  const current = stored.filter((s) => s.onboarding?.status !== "removed");
  const removed = stored.filter((s) => s.onboarding?.status === "removed");
  const toReview = applications.filter((a) => a.status === "received" || a.status === "under_review");
  const done = applications.filter((a) => a.status === "accepted" || a.status === "declined");

  return (
    <div className="grid min-w-0 gap-10">
      {message && (
        <p role="status" className="rounded-[var(--radius-card)] border border-line bg-surface p-4 font-semibold">
          {message}
        </p>
      )}
      {error && <FormError>{error}</FormError>}

      <section aria-labelledby="applications" className="grid min-w-0 gap-3">
        <h2 id="applications" className="text-2xl font-bold">
          Applications to review ({toReview.length})
        </h2>
        <p className="text-[15px] text-muted">
          Check each application, then approve it. Approving emails them a link to accept the Specialist terms. They&apos;re only
          considered for leads once they&apos;ve accepted and you&apos;ve recorded their first top-up.
        </p>
        {toReview.length === 0 && <p className="text-muted">Nothing to review.</p>}
        <ul className="grid gap-3">
          {toReview.map((a) => (
            <li key={a.id} className="grid min-w-0 gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
              <p className="font-semibold">{a.companyName}</p>
              <p className="text-muted">
                {servicesOf(a.servicesOffered ?? [a.mainService])} · {a.basePostcode ? `${a.radiusMiles} miles from ${a.basePostcode}` : a.areasCovered.join(", ")} · applied {date(a.createdAt)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass("primary", "sm")} onClick={() => setEditing({ kind: "application", application: a })}>
                  Review and approve
                </button>
                <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setOpen(open === a.id ? null : a.id)}>
                  {open === a.id ? "Hide details" : "Show details"}
                </button>
                <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setDeclining(a)}>
                  Decline
                </button>
              </div>
              {open === a.id && <ApplicationDetails a={a} />}
              {declining?.id === a.id && (
                <DeclineForm
                  token={token}
                  application={a}
                  onCancel={() => setDeclining(null)}
                  onDone={(text) => {
                    setDeclining(null);
                    setMessage(text);
                    void load();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        {done.length > 0 && (
          <div className="grid gap-2">
            <button type="button" className={`${buttonClass("secondary", "sm")} justify-self-start`} onClick={() => setShowDone(!showDone)}>
              {showDone ? "Hide" : "Show"} reviewed applications ({done.length})
            </button>
            {showDone && (
              <ul className="grid gap-2 text-[15px]">
                {done.map((a) => (
                  <li key={a.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
                    <span className="font-semibold">{a.companyName}</span> · {STATUS_LABELS[a.status]}
                    {a.review ? ` ${date(a.review.at)} by ${a.review.by}` : ""}
                    {a.review?.declineReason ? ` · ${a.review.declineReason}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="onboarded" className="grid min-w-0 gap-3">
        <h2 id="onboarded" className="text-2xl font-bold">
          Real specialists
        </h2>
        <button type="button" className={`${buttonClass("secondary")} justify-self-start`} onClick={() => setEditing({ kind: "new" })}>
          Add a specialist without an application
        </button>
        {current.length === 0 && <p className="text-muted">None yet. Approve an application, or add one yourself.</p>}
        <ul className="grid gap-3">
          {current.map((s) => (
            <li key={s.slug} className="grid min-w-0 gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
              <p className="font-semibold">{s.name}</p>
              <p>{onboardingText(s)}</p>
              <p className="text-muted">
                {servicesOf(s.services)} · {s.coverage ? `${s.coverage.radiusMiles} miles from ${s.coverage.basePostcode}` : ""} · checks
                done {date(s.checksLastConfirmed)} by {s.onboarding?.checkedBy}
              </p>
              <p className="text-muted">
                {s.onboarding?.contactName}, {s.onboarding?.phone}, {s.enquiryEmail}
              </p>
              {s.onboarding?.paymentReference && (
                <p className="text-muted">
                  Payment reference: <span className="font-mono text-ink">{s.onboarding.paymentReference}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setEditing({ kind: "edit", specialist: s })}>
                  Edit details and checks
                </button>
                {s.onboarding?.status !== "active" && (
                  <button type="button" className={buttonClass("secondary", "sm")} onClick={() => void resendTerms(s)}>
                    Send the terms link again
                  </button>
                )}
                {owner && (
                  <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setRemoving(removing === s.slug ? null : s.slug)}>
                    Remove
                  </button>
                )}
              </div>
              {removing === s.slug && (
                <RemoveForm
                  token={token}
                  specialist={s}
                  onCancel={() => setRemoving(null)}
                  onDone={(text) => {
                    setRemoving(null);
                    setMessage(text);
                    void load();
                    onChanged();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
        {removed.length > 0 && (
          <div className="grid gap-2">
            <button type="button" className={`${buttonClass("secondary", "sm")} justify-self-start`} onClick={() => setShowRemoved(!showRemoved)}>
              {showRemoved ? "Hide" : "Show"} removed specialists ({removed.length})
            </button>
            {showRemoved && (
              <ul className="grid gap-2 text-[15px]">
                {removed.map((s) => (
                  <li key={s.slug} className="grid gap-2 rounded-[var(--radius-card)] border border-dashed border-line bg-surface p-3">
                    <p>
                      <span className="font-semibold">{s.name}</span> · ✕ Removed {s.onboarding?.removal ? `${date(s.onboarding.removal.at)}: ${s.onboarding.removal.reason}` : ""}
                    </p>
                    {owner && (
                      <button
                        type="button"
                        className={`${buttonClass("secondary", "sm")} justify-self-start`}
                        onClick={async () => {
                          const res = await fetch(`/api/admin/specialists/${s.slug}/restore`, { method: "POST", headers });
                          const body = (await res.json().catch(() => ({}))) as { error?: string };
                          if (!res.ok) return setError(body.error ?? "That didn't work.");
                          setMessage(`${s.name} has been restored.`);
                          void load();
                          onChanged();
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ApplicationDetails({ a }: { a: SupplierApplication }) {
  const rows: [string, string][] = [
    ["Contact", `${a.contactName}, ${a.phone}, ${a.email}`],
    ["Website", a.website ?? "Not given"],
    ["Services", servicesOf(a.servicesOffered ?? [a.mainService])],
    ["Work taken on", a.leadTypes ? Object.entries(a.leadTypes).map(([s, k]) => `${getService(s)?.name ?? s}: ${k.join(", ")}`).join("; ") || "Everything" : "Everything"],
    ["Also does", a.otherServices ?? "Nothing else"],
    ["Where they work", a.basePostcode ? `Within ${a.radiusMiles} miles of ${a.basePostcode}${a.excludedPostcodes ? `, not ${a.excludedPostcodes}` : ""}` : a.areasCovered.join(", ")],
    ["Companies House", a.companiesHouseNumber],
    ["Trade scheme", a.competentPersonScheme],
    ["Guarantee provider", a.insuranceBackedGuaranteeProvider],
    ["Google profile", a.googleProfileUrl],
    ["About", a.description],
    ["Anything else", a.anythingElse ?? "Nothing"],
    ["Came from", a.source?.utm?.source ? `${a.source.utm.source}${a.source.utm.medium ? ` (${a.source.utm.medium})` : ""}` : (a.source?.referrer ?? "Not known")],
    ["Reference", a.id],
  ];
  return (
    <dl className="grid min-w-0 gap-2 rounded-[var(--radius-card)] border border-line bg-ground p-4 text-[15px]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid min-w-0 gap-0.5 sm:grid-cols-[180px_1fr]">
          <dt className="font-semibold">{k}</dt>
          <dd className="min-w-0 break-words text-muted">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function DeclineForm({
  token,
  application,
  onCancel,
  onDone,
}: {
  token: string;
  application: SupplierApplication;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = "min-h-[90px] w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 py-3 text-[16px]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/admin/applications/${application.id}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ action: "decline", reason, sendEmail, message }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
    if (!res.ok) return setError(body.error ?? "That didn't work.");
    onDone(`${application.companyName} has been declined${sendEmail ? (body.emailed ? " and emailed" : ", but the email couldn't be sent") : ""}.`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-[var(--radius-card)] border border-dashed border-ink p-4">
      <label className="grid gap-1.5 text-[15px] font-semibold">
        Reason, for our records
        <textarea className={field} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </label>
      <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3 text-[15px]">
        <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="mt-0.5 size-[20px] accent-blue" />
        <span>Email them to say we can&apos;t accept their application</span>
      </label>
      {sendEmail && (
        <label className="grid gap-1.5 text-[15px] font-semibold">
          Anything to add to the email (optional)
          <textarea className={field} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
        </label>
      )}
      {error && <FormError>{error}</FormError>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClass("primary", "sm")}>
          Decline
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary", "sm")}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RemoveForm({
  token,
  specialist,
  onCancel,
  onDone,
}: {
  token: string;
  specialist: Specialist;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/admin/specialists/${specialist.slug}/remove`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ reason, notify }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
    if (!res.ok) return setError(body.error ?? "That didn't work.");
    onDone(`${specialist.name} has been removed${notify ? (body.emailed ? " and emailed" : ", but the email couldn't be sent") : ""}. Their records are kept, and you can restore them under "Show removed specialists".`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-[var(--radius-card)] border border-dashed border-ink p-4">
      <p className="text-[15px]">
        Removing {specialist.name} stops all introductions and hides them from these lists. Their account history is kept.
        Their balance must be zero first: pay out or forfeit any credits in Accounts and top-ups.
      </p>
      <label className="grid gap-1.5 text-[15px] font-semibold">
        Reason, for our records
        <textarea
          className="min-h-[80px] w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 py-3 text-[16px] font-normal"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
        />
      </label>
      <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3 text-[15px]">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="mt-0.5 size-[20px] accent-blue" />
        <span>Email them to say we&apos;ve stopped sending introductions</span>
      </label>
      {error && <FormError>{error}</FormError>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClass("primary", "sm")}>
          Remove {specialist.name}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary", "sm")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
