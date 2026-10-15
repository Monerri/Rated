"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextAreaField } from "@/components/ui/Form";
import type { SpecialistFeedback } from "@/lib/types";

interface Data {
  firstName: string;
  serviceName: string;
  specialists: { slug: string; name: string }[];
  responses: Record<string, SpecialistFeedback>;
  publishWording: string;
}

interface Answer {
  contacted: "" | "yes" | "no" | "not-yet";
  rating: number | null;
  comment: string;
  publish: boolean;
}

const CONTACTED = [
  { value: "yes", label: "Yes" },
  { value: "not-yet", label: "Not yet" },
  { value: "no", label: "No" },
] as const;

const RATINGS = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Fair" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very good" },
  { value: 5, label: "Excellent" },
];

/** Choice buttons that show their state with a tick and a border, not colour alone. */
function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border-[1.5px] px-4 font-display text-[15px] font-semibold ${
        selected ? "border-blue bg-blue-tint" : "border-line bg-surface"
      }`}
    >
      {selected && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}

export function FeedbackForm({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [status, setStatus] = useState<"loading" | "missing" | "ready" | "sending" | "done">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/feedback/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) return setStatus("missing");
        const d = (await res.json()) as Data;
        setData(d);
        setAnswers(
          Object.fromEntries(
            d.specialists.map((s) => {
              const r = d.responses[s.slug];
              return [s.slug, { contacted: r?.contacted ?? "", rating: r?.rating ?? null, comment: r?.comment ?? "", publish: !!r?.publishConsent }];
            }),
          ),
        );
        setStatus("ready");
      })
      .catch(() => setStatus("missing"));
  }, [token]);

  const set = (slug: string, patch: Partial<Answer>) => setAnswers((a) => ({ ...a, [slug]: { ...a[slug], ...patch } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const answered = Object.entries(answers).filter(([, a]) => a.contacted);
    if (answered.length === 0) return setError("Please tell us whether each specialist got in touch.");
    setStatus("sending");
    const res = await fetch(`/api/feedback/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        responses: Object.fromEntries(
          answered.map(([slug, a]) => [slug, { contacted: a.contacted, rating: a.rating, comment: a.comment, publish: a.publish }]),
        ),
      }),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    const body = (await res?.json().catch(() => null)) as { error?: string } | null;
    setError(body?.error ?? "Something went wrong. Please try again.");
    setStatus("ready");
  }

  if (status === "loading") return <p className="text-muted">Loading…</p>;
  if (status === "missing" || !data) {
    return (
      <div className="grid gap-3">
        <h1 className="text-[28px] font-bold leading-tight">We couldn&apos;t find that link</h1>
        <p className="text-muted">It may have been mistyped, or the feedback has been removed under our privacy notice.</p>
      </div>
    );
  }
  if (status === "done") {
    return (
      <div className="grid gap-3" role="status">
        <h1 className="text-[28px] font-bold leading-tight">Thank you, {data.firstName}</h1>
        <p className="text-muted">
          Your answers help us decide which specialists we keep introducing. You can use the same link to change them.
        </p>
        <Link href="/guides" className="font-semibold text-blue">
          Read our guides
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-[28px] font-bold leading-tight">How did it go, {data.firstName}?</h1>
        <p className="text-muted">
          About your {data.serviceName.toLowerCase()} enquiry. It takes about a minute. We won&apos;t share your answers
          unless you say we can quote you.
        </p>
      </header>

      {data.specialists.map((s) => {
        const a = answers[s.slug];
        return (
          <fieldset key={s.slug} className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5">
            <legend className="px-1 font-display text-lg font-bold">{s.name}</legend>

            <div className="grid gap-2">
              <p id={`c-${s.slug}`} className="text-[15px] font-semibold">
                Did they get in touch?
              </p>
              <div role="radiogroup" aria-labelledby={`c-${s.slug}`} className="flex flex-wrap gap-2">
                {CONTACTED.map((o) => (
                  <Choice key={o.value} selected={a.contacted === o.value} onClick={() => set(s.slug, { contacted: o.value })}>
                    {o.label}
                  </Choice>
                ))}
              </div>
            </div>

            {a.contacted === "yes" && (
              <div className="grid gap-2">
                <p id={`r-${s.slug}`} className="text-[15px] font-semibold">
                  How would you rate them? <span className="font-normal text-muted">(optional)</span>
                </p>
                <div role="radiogroup" aria-labelledby={`r-${s.slug}`} className="flex flex-wrap gap-2">
                  {RATINGS.map((o) => (
                    <Choice key={o.value} selected={a.rating === o.value} onClick={() => set(s.slug, { rating: o.value })}>
                      {o.value} {o.label}
                    </Choice>
                  ))}
                </div>
              </div>
            )}

            {a.contacted && (
              <TextAreaField
                label="Anything you'd like to tell us?"
                optional
                maxLength={1000}
                value={a.comment}
                onChange={(e) => set(s.slug, { comment: e.target.value })}
              />
            )}
            {a.contacted && a.comment.trim() && (
              <ConsentCheckbox
                name={`publish-${s.slug}`}
                wording={data.publishWording}
                checked={a.publish}
                onChange={(checked) => set(s.slug, { publish: checked })}
              />
            )}
          </fieldset>
        );
      })}

      {error && <FormError>{error}</FormError>}
      <button type="submit" className={buttonClass("primary")} disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send my answers"}
      </button>
    </form>
  );
}
