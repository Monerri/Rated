"use client";

import { useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { maxRadiusMiles, radiusOptions } from "@/config/coverage";
import { competentPersonSchemes, supplierDeclarationWording } from "@/config/suppliers";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { getFunnel } from "@/funnels";
import { ConsentCheckbox, FormError, SelectField, TextAreaField, TextField } from "@/components/ui/Form";

type FieldErrors = Record<string, string>;

export function SupplierForm({ services }: { services: Pick<Service, "slug" | "name">[] }) {
  const declaration = supplierDeclarationWording();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [scheme, setScheme] = useState("");
  const [offered, setOffered] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const doneRef = useRef<HTMLHeadingElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) ?? "");

    setFormError(null);
    setStatus("sending");
    const res = await fetch("/api/supplier-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: get("companyName"),
        contactName: get("contactName"),
        email: get("email"),
        phone: get("phone"),
        website: get("website"),
        website_confirm: get("website_confirm"),
        servicesOffered: offered,
        leadTypes: Object.fromEntries(offered.map((slug) => [slug, f.getAll(`leadTypes:${slug}`).map(String)])),
        otherServices: get("otherServices"),
        basePostcode: get("basePostcode"),
        radiusMiles: get("radiusMiles"),
        excludedPostcodes: get("excludedPostcodes"),
        companiesHouseNumber: get("companiesHouseNumber"),
        competentPersonScheme: get("competentPersonScheme"),
        competentPersonSchemeOther: get("competentPersonSchemeOther"),
        otherSchemes: get("otherSchemes"),
        insuranceBackedGuaranteeProvider: get("insuranceBackedGuaranteeProvider"),
        googleProfileUrl: get("googleProfileUrl"),
        description: get("description"),
        anythingElse: get("anythingElse"),
        declaration: { ...declaration, given: agreed },
        source: getSourceInfo(),
      }),
    }).catch(() => null);

    if (res?.ok) {
      setStatus("done");
      requestAnimationFrame(() => {
        doneRef.current?.focus();
        doneRef.current?.scrollIntoView({ block: "center" });
      });
      return;
    }
    const body = (await res?.json().catch(() => null)) as { error?: string; fields?: FieldErrors } | null;
    setErrors(body?.fields ?? {});
    setFormError(body?.error ?? "Something went wrong. Please try again.");
    setStatus("idle");
    // Take keyboard and screen-reader users to the first problem.
    requestAnimationFrame(() => (form.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
  }

  if (status === "done") {
    return (
      <div className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-6" role="status">
        <span className="justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          Received
        </span>
        <h3 ref={doneRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Thanks. We&apos;ve received your details
        </h3>
        <p className="text-muted">
          We&apos;ll review your business against our current requirements. We&apos;ve emailed you a copy for your
          records. If your business looks like a good fit, we&apos;ll be in touch about next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-8">
      {/* Honeypot for bots. Hidden from people and assistive technology. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input name="website_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-display text-lg font-bold">Your business</legend>
        <TextField label="Company name" name="companyName" autoComplete="organization" maxLength={160} error={errors.companyName} />
        <TextField
          label="Companies House number"
          name="companiesHouseNumber"
          hint="8 characters, for example 01234567 or SC123456."
          autoCapitalize="characters"
          maxLength={10}
          error={errors.companiesHouseNumber}
        />
        <TextField label="Website (optional)" name="website" type="url" inputMode="url" autoComplete="url" error={errors.website} />
      </fieldset>

      <fieldset className="grid gap-3" aria-describedby={errors.servicesOffered ? "services-error" : undefined}>
        <legend className="mb-1 font-display text-lg font-bold">Services you offer</legend>
        <p className="-mt-1 text-sm text-muted">Choose all that apply. We&apos;ll only send you enquiries for these.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.slug} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={offered.includes(s.slug)}
                onChange={(e) =>
                  setOffered((o) => (e.target.checked ? [...o, s.slug] : o.filter((x) => x !== s.slug)))
                }
                className="size-5 accent-[var(--color-blue)]"
              />
              {s.name}
            </label>
          ))}
        </div>
        {offered.map((slug) => {
          const kinds = getFunnel(slug)?.leadTypes;
          if (!kinds) return null;
          const name = services.find((s) => s.slug === slug)?.name;
          return (
            <fieldset key={slug} className="grid gap-2 rounded-[var(--radius-card)] border border-line p-4">
              <legend className="px-1 text-[15px] font-semibold">Which {name?.toLowerCase()} work do you take on?</legend>
              {kinds.options.map((o) => (
                <label key={o.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
                  <input type="checkbox" name={`leadTypes:${slug}`} value={o.value} defaultChecked className="size-5 accent-[var(--color-blue)]" />
                  {o.label}
                </label>
              ))}
            </fieldset>
          );
        })}
        {errors.servicesOffered && (
          <p id="services-error" className="text-sm font-semibold">
            {errors.servicesOffered}
          </p>
        )}
        <TextField label="Anything else you do (optional)" name="otherServices" maxLength={300} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 font-display text-lg font-bold">Where you work</legend>
        <p className="-mt-2 text-sm text-muted">
          We introduce you to homeowners within a set distance of your base, up to {maxRadiusMiles} miles.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Your base postcode"
            name="basePostcode"
            autoComplete="postal-code"
            autoCapitalize="characters"
            hint="Where you usually travel from."
            error={errors.basePostcode}
          />
          <SelectField
            label="How far you'll travel"
            name="radiusMiles"
            options={radiusOptions.map((m) => ({ value: String(m), label: `Up to ${m} miles` }))}
            error={errors.radiusMiles}
          />
        </div>
        <TextField
          label="Postcodes you don't cover within that distance (optional)"
          name="excludedPostcodes"
          maxLength={300}
          hint="Postcode areas or districts, for example TD, DG or NE71. Useful across a border, where different rules apply, or for places you can't easily reach."
          error={errors.excludedPostcodes}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-display text-lg font-bold">Accreditation and reputation</legend>
        <SelectField
          label="Main trade scheme you're registered with"
          name="competentPersonScheme"
          options={competentPersonSchemes}
          value={scheme}
          onChange={(e) => setScheme(e.target.value)}
          error={errors.competentPersonScheme}
        />
        {scheme === "other" && (
          <TextField label="Which scheme?" name="competentPersonSchemeOther" maxLength={120} error={errors.competentPersonSchemeOther} />
        )}
        {scheme !== "none" && scheme !== "not-applicable" && (
          <TextField
            label="Any other schemes you're registered with (optional)"
            name="otherSchemes"
            maxLength={200}
            hint="For example, Gas Safe and OFTEC for a heating engineer."
          />
        )}
        <TextField
          label="Insurance-backed guarantee provider"
          name="insuranceBackedGuaranteeProvider"
          maxLength={160}
          error={errors.insuranceBackedGuaranteeProvider}
        />
        <TextField
          label="Google Business profile or reviews link"
          name="googleProfileUrl"
          type="url"
          inputMode="url"
          hint="Paste the link to your Google Business profile or your reviews."
          error={errors.googleProfileUrl}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-display text-lg font-bold">About you</legend>
        <TextField label="Contact name" name="contactName" autoComplete="name" maxLength={120} error={errors.contactName} />
        <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />
        <TextField label="Telephone" name="phone" type="tel" autoComplete="tel" error={errors.phone} />
        <TextAreaField
          label="Brief description of the business"
          name="description"
          hint="What you do, how long you've been trading and the size of your team."
          maxLength={2000}
          error={errors.description}
        />
        <TextAreaField label="Anything else you'd like us to know" name="anythingElse" optional maxLength={2000} />
      </fieldset>

      <div className="grid gap-4">
        <ConsentCheckbox name="declaration" wording={declaration.wording} checked={agreed} onChange={setAgreed} />
        {errors.declaration && <p className="text-sm font-semibold">{errors.declaration}</p>}
        <p className="text-sm text-muted">
          Submitting doesn&apos;t guarantee you&apos;ll receive introductions. We review every business against our current
          requirements.
        </p>
        {formError && <FormError>{formError}</FormError>}
        <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
          {status === "sending" ? "Submitting…" : "Submit for consideration"}
        </button>
      </div>
    </form>
  );
}
