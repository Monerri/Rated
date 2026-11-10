"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextField } from "@/components/ui/Form";

export function AcceptTermsForm({ token, consent }: { token: string; consent: { wordingId: string; wording: string } }) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please enter your full name.");
    if (!agreed) return setError("Please tick the box to accept the terms.");
    setState("saving");
    const res = await fetch("/api/specialist-terms/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, name: name.trim(), consent: { ...consent, given: true } }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { error?: string } | null;
    if (!res?.ok) {
      setState("idle");
      return setError(body?.error ?? "Something went wrong. Please try again.");
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div role="status" className="grid gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p className="text-xl font-bold">✓ Thank you, you&apos;ve accepted the terms</p>
        <p>
          We&apos;ve emailed you a copy. To start receiving introductions, top up your credits: reply to our email and
          we&apos;ll send you the payment details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <TextField label="Your full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
      <ConsentCheckbox name="accept" wording={consent.wording} checked={agreed} onChange={setAgreed} />
      {error && <FormError>{error}</FormError>}
      <button type="submit" disabled={state === "saving"} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        {state === "saving" ? "Saving…" : "Accept the terms"}
      </button>
    </form>
  );
}
