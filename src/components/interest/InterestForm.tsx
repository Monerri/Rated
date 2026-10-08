"use client";

import Link from "next/link";
import { useState } from "react";
import type { Service } from "@/lib/types";
import { primaryRegion } from "@/config/regions";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextField } from "@/components/ui/Form";

/**
 * Register interest in a service someone can't use yet. Used by the
 * homepage dialog, the register-interest page and the questionnaire's
 * out-of-area screen. It is never an enquiry and no company is contacted.
 */
export function InterestForm({
  service,
  title,
  intro,
  postcode = null,
  postcodeArea = null,
  headingRef,
  headingLevel = "h2",
  onClose,
}: {
  service: Service;
  title?: string;
  intro?: string;
  /** Known full postcode (for example from the questionnaire). Hides the area choice. */
  postcode?: string | null;
  /** Known postcode area. Hides the area choice. */
  postcodeArea?: string | null;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  headingLevel?: "h1" | "h2";
  /** Shown as a "Not now" button when the form is in a dialog. */
  onClose?: () => void;
}) {
  const consent = notifyServiceAvailableWording(service.name);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const Heading = headingLevel;
  const askArea = !postcode && !postcodeArea;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const firstName = String(f.get("firstName") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const next = {
      firstName: firstName ? undefined : "Please enter your first name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Please enter a valid email address.",
    };
    setErrors(next);
    if (next.firstName || next.email) return;
    if (!agreed) return setFormError("Please tick the box so we can email you when this service is available.");

    setFormError(null);
    setStatus("saving");
    const res = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceSlug: service.slug,
        firstName,
        email,
        postcode: postcode || undefined,
        postcodeArea: postcodeArea ?? (askArea ? f.get("postcodeArea") : null),
        consent: { ...consent, given: true },
        source: getSourceInfo(),
      }),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    const msg = ((await res?.json().catch(() => null)) as { error?: string } | null)?.error;
    setFormError(`${msg ?? "Something went wrong."} Please try again.`);
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <div className="grid gap-4" role="status">
        <span className="justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          Registered
        </span>
        <Heading ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none">
          Thanks, we&apos;ll let you know
        </Heading>
        <p className="text-muted">
          We&apos;ll send you one email when {service.name} is available in your area. We&apos;ve also sent you a
          confirmation with a link to unsubscribe at any time.
        </p>
        {onClose ? (
          <button type="button" className={buttonClass("secondary")} onClick={onClose}>
            Close
          </button>
        ) : (
          <Link href="/guides" className={buttonClass("secondary", "md", "justify-self-start")}>
            Read our guides
          </Link>
        )}
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <header className="grid gap-3">
        <span className="justify-self-start rounded-full bg-ground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Register interest
        </span>
        <Heading ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none">
          {title ?? `${service.name} is coming soon`}
        </Heading>
        <p className="text-muted">
          {intro ??
            "We're currently building our network of vetted specialists in your area. Leave your details and we'll let you know when this service becomes available."}
        </p>
        <p className="rounded-[var(--radius-card)] bg-blue-tint px-4 py-3 text-[15px]">
          This isn&apos;t an enquiry. No company will contact you.
        </p>
      </header>

      <TextField label="First name" name="firstName" autoComplete="given-name" maxLength={80} error={errors.firstName} />
      <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />

      {askArea && (
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[15px] font-semibold">
            Start of your postcode <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {[...primaryRegion.postcodeAreas.map((a) => a.code), "Elsewhere"].map((code) => (
              <label key={code} className="cursor-pointer">
                <input type="radio" name="postcodeArea" value={code} className="peer sr-only" />
                <span className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line px-4 font-display text-[15px] font-semibold peer-checked:border-blue peer-checked:bg-blue-tint peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-blue">
                  {code}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <ConsentCheckbox name="consent" wording={consent.wording} checked={agreed} onChange={setAgreed} />
      {formError && <FormError>{formError}</FormError>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={buttonClass("primary")} disabled={status === "saving"}>
          {status === "saving" ? "Registering…" : "Register my interest"}
        </button>
        {onClose && (
          <button type="button" className={buttonClass("secondary")} onClick={onClose}>
            Not now
          </button>
        )}
      </div>
    </form>
  );
}
