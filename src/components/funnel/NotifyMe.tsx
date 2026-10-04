"use client";

import Link from "next/link";
import { useState } from "react";
import type { Service } from "@/lib/types";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextField } from "@/components/ui/Form";

/**
 * For people we can't help yet (outside our area, or no specialist vetted
 * for their area). Registers interest only. It is never an enquiry.
 */
export function NotifyMe({
  headingRef,
  service,
  postcode,
  postcodeArea = null,
  title,
  body,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  service: Service;
  postcode: string | null;
  postcodeArea?: string | null;
  title: string;
  body: string;
}) {
  const consent = notifyServiceAvailableWording(service.name);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const firstName = String(f.get("firstName") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    if (!firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter your first name and a valid email address.");
    if (!agreed) return setError("Please tick the box so we can email you.");
    setError(null);
    setStatus("saving");
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceSlug: service.slug,
        firstName,
        email,
        postcode: postcode || undefined,
        postcodeArea,
        consent: { ...consent, given: true },
        source: getSourceInfo(),
      }),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    const msg = ((await res?.json().catch(() => null)) as { error?: string } | null)?.error;
    setError(`${msg ?? "Something went wrong."} Please try again.`);
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <div className="grid gap-4" role="status">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight outline-none">
          Thanks, we&apos;ll let you know
        </h1>
        <p className="text-muted">
          We&apos;ll email you when {service.name} is available in your area. That&apos;s the only thing we&apos;ll use
          these details for.
        </p>
        <Link href="/guides" className={buttonClass("secondary", "md", "justify-self-start")}>
          Read our guides
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <header className="grid gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-[30px]">
          {title}
        </h1>
        <p className="text-muted">{body}</p>
        <p className="rounded-[var(--radius-card)] bg-blue-tint px-4 py-3 text-[15px]">
          This isn&apos;t an enquiry. No company will contact you.
        </p>
      </header>
      <div className="grid gap-4">
        <TextField label="First name" name="firstName" autoComplete="given-name" maxLength={80} />
        <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} />
      </div>
      <ConsentCheckbox name="consent" wording={consent.wording} checked={agreed} onChange={setAgreed} />
      {error && <FormError>{error}</FormError>}
      <button type="submit" disabled={status === "saving"} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        {status === "saving" ? "Registering…" : "Register my interest"}
      </button>
    </form>
  );
}
