"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormError, SelectField, TextAreaField, TextField } from "@/components/ui/Form";

export function ContactForm({ topics }: { topics: { value: string; label: string }[] }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form));
    setStatus("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    const body = (await res?.json().catch(() => null)) as { error?: string; fields?: Record<string, string> } | null;
    setErrors(body?.fields ?? {});
    setFormError(body?.error ?? "Something went wrong. Please try again.");
    setStatus("idle");
    requestAnimationFrame(() => (form.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
  }

  if (status === "done") {
    return (
      <div className="grid gap-2 rounded-[var(--radius-panel)] border border-line bg-surface p-6" role="status">
        <h2 className="text-2xl font-bold">Thanks, we&apos;ve got your message</h2>
        <p className="text-muted">We&apos;ll reply to the email address you gave us as soon as we can.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-7">
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input name="website_confirm" tabIndex={-1} autoComplete="off" />
      </div>
      <TextField label="Name" name="name" autoComplete="name" maxLength={120} error={errors.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />
      <SelectField label="What's it about?" name="topic" options={topics} error={errors.topic} />
      <TextAreaField label="Message" name="message" rows={6} maxLength={5000} error={errors.message} />
      {formError && <FormError>{formError}</FormError>}
      <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
