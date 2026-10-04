"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { primaryRegion } from "@/config/regions";
import { notifyServiceAvailableWording } from "@/lib/consent";
import { getSourceInfo } from "@/lib/source";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

type Status = "idle" | "submitting" | "done" | "error";

export function RegisterInterest({ services }: { services: Service[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    // Record the landing source on first render, before any navigation.
    getSourceInfo();
  }, []);

  function open(s: Service) {
    setService(s);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {services.map((s) => (
          <li key={s.slug}>
            <button
              type="button"
              onClick={() => open(s)}
              className="grid h-full w-full justify-items-start gap-2 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line p-4 text-left text-ink transition-colors hover:border-solid hover:border-blue motion-reduce:transition-none"
              aria-haspopup="dialog"
            >
              <Icon name={s.icon} className="size-7 text-muted" />
              <span className="font-display text-[15px] font-semibold leading-tight">{s.name}</span>
              <span className="rounded-full bg-ground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Coming soon
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Coming soon? Tap a service to hear when it becomes available in your area.</p>

      <dialog
        ref={dialogRef}
        aria-labelledby="interest-title"
        className="m-auto w-[calc(100%-32px)] max-w-md rounded-[var(--radius-panel)] border border-line bg-surface p-0 text-ink"
        onClose={() => setService(null)}
      >
        {/* Keyed so the form resets each time a different service is opened. */}
        {service && <InterestForm key={service.slug} service={service} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}

function InterestForm({ service, onClose }: { service: Service; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const ids = useId();
  const consent = notifyServiceAvailableWording(service.name);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("consent") !== "on") {
      setError("Please tick the box so we can email you when this service is available.");
      return;
    }
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          firstName: form.get("firstName"),
          email: form.get("email"),
          postcodeArea: form.get("postcodeArea") || null,
          consent: { wordingId: consent.wordingId, wording: consent.wording, given: true },
          source: getSourceInfo(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? `${err.message} Please try again.` : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="grid gap-4 p-6" role="status">
        <span className="justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          Registered
        </span>
        <h2 id="interest-title" className="text-2xl font-bold">
          Thanks, we&apos;ll let you know
        </h2>
        <p className="text-muted">
          We&apos;ll email you when {service.name} is available in your area. That&apos;s the only thing we&apos;ll use
          these details for.
        </p>
        <button type="button" className={buttonClass("secondary")} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form className="grid gap-4 p-6" onSubmit={onSubmit} noValidate={false}>
      <span className="justify-self-start rounded-full bg-ground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Register interest
      </span>
      <h2 id="interest-title" className="text-2xl font-bold">
        {service.name} is coming soon
      </h2>
      <p className="text-muted">
        We&apos;re currently building our network of vetted specialists in your area. Leave your details and we&apos;ll
        let you know when this service becomes available.
      </p>
      <p className="rounded-[var(--radius-card)] bg-blue-tint px-4 py-3 text-[15px]">
        This isn&apos;t an enquiry. No company will contact you.
      </p>

      <div className="grid gap-1.5">
        <label htmlFor={`${ids}-name`} className="text-[15px] font-semibold">
          First name
        </label>
        <input
          id={`${ids}-name`}
          name="firstName"
          required
          maxLength={80}
          autoComplete="given-name"
          className="min-h-[50px] rounded-lg border-[1.5px] border-line bg-surface px-3.5 text-[17px] focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue-tint"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${ids}-email`} className="text-[15px] font-semibold">
          Email
        </label>
        <input
          id={`${ids}-email`}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="min-h-[50px] rounded-lg border-[1.5px] border-line bg-surface px-3.5 text-[17px] focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue-tint"
        />
      </div>
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

      <label className="grid grid-cols-[24px_1fr] items-start gap-2.5 text-[15px]">
        <input type="checkbox" name="consent" className="mt-0.5 size-[22px] accent-blue" />
        <span>{consent.wording}</span>
      </label>

      {error && (
        <p role="alert" className="text-[15px] font-semibold text-ink">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={buttonClass("primary")} disabled={status === "submitting"}>
          {status === "submitting" ? "Registering…" : "Register my interest"}
        </button>
        <button type="button" className={buttonClass("secondary")} onClick={onClose}>
          Not now
        </button>
      </div>
    </form>
  );
}
