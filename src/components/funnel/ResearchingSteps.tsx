"use client";

import Link from "next/link";
import { useState } from "react";
import type { Service } from "@/lib/types";
import type { Answers } from "@/funnels/types";
import { retainProgressWording } from "@/lib/consent";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextField } from "@/components/ui/Form";

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

const choiceClass =
  "grid w-full gap-1 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface px-4 py-4 text-left text-ink transition-colors hover:border-blue motion-reduce:transition-none";

/** Shown to people who are "just researching". No company is named here. */
export function ResearchingStep({
  headingRef,
  onReady,
  onSave,
  onDelete,
}: {
  headingRef: HeadingRef;
  onReady: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-[30px]">
          There&apos;s a vetted specialist covering your area
        </h1>
        <p className="text-muted">
          You told us you&apos;re just researching, so we haven&apos;t shared anything. Choose what happens next.
        </p>
      </header>
      <ul className="grid gap-3">
        <li>
          <button type="button" className={choiceClass} onClick={onReady}>
            <span className="font-display text-lg font-bold">Ready?</span>
            <span className="text-[15px] text-muted">
              We&apos;ll ask you for a few details and have a recommended specialist contact you.
            </span>
          </button>
        </li>
        <li>
          <button type="button" className={choiceClass} onClick={onSave}>
            <span className="font-display text-lg font-bold">Not quite ready?</span>
            <span className="text-[15px] text-muted">
              We&apos;ll save your progress until you&apos;re ready. You can delete your progress at any time.
            </span>
          </button>
        </li>
        <li>
          <button type="button" className={choiceClass} onClick={onDelete}>
            <span className="font-display text-lg font-bold">Don&apos;t want to be contacted?</span>
            <span className="text-[15px] text-muted">
              We&apos;ll delete everything you&apos;ve told us. You can read our guides instead.
            </span>
          </button>
        </li>
      </ul>
    </div>
  );
}

export function SaveProgressStep({
  headingRef,
  service,
  answers,
  onSaved,
}: {
  headingRef: HeadingRef;
  service: Service;
  answers: Answers;
  onSaved: () => void;
}) {
  const consent = retainProgressWording();
  const [agreed, setAgreed] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setEmailError("Please enter a valid email address.");
    setEmailError(null);
    if (!agreed) return setError("Please tick the box so we can save your answers.");
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/saved-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSlug: service.slug, answers, email, consent: { ...consent, given: true }, source: getSourceInfo() }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Something went wrong.");
      onSaved();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Something went wrong."} Please try again.`);
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <header className="grid gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-[30px]">
          Save your progress
        </h1>
        <p className="text-muted">
          We&apos;ll email you a link to carry on when you&apos;re ready, or to delete your answers. We won&apos;t share
          them with any company.
        </p>
      </header>
      <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={emailError} />
      <ConsentCheckbox name="consent" wording={consent.wording} checked={agreed} onChange={setAgreed} />
      {error && <FormError>{error}</FormError>}
      <button type="submit" disabled={saving} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        {saving ? "Saving…" : "Save my progress"}
      </button>
    </form>
  );
}

export function SavedStep({ headingRef }: { headingRef: HeadingRef }) {
  return (
    <div className="grid gap-4">
      <span className="justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
        Saved
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight outline-none">
        Your progress is saved
      </h1>
      <p className="text-muted">
        We&apos;ve emailed you a link. Use it to carry on when you&apos;re ready, or to delete your answers at any time.
        We haven&apos;t shared anything with a specialist.
      </p>
      <Link href="/guides" className={buttonClass("secondary", "md", "justify-self-start")}>
        Read our guides
      </Link>
    </div>
  );
}

export function DeletedStep({ headingRef, onStartAgain }: { headingRef: HeadingRef; onStartAgain: () => void }) {
  return (
    <div className="grid gap-4">
      <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight outline-none">
        We&apos;ve deleted your answers
      </h1>
      <p className="text-muted">
        Nothing was saved or shared with anyone. If you&apos;d like to read up first, our guides explain the options in
        plain English.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/guides" className={buttonClass("primary")}>
          Read our guides
        </Link>
        <button type="button" className={buttonClass("secondary")} onClick={onStartAgain}>
          Start again
        </button>
      </div>
    </div>
  );
}
