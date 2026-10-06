"use client";

import { useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { primaryRegion } from "@/config/regions";
import { competentPersonSchemes, supplierDeclarationWording } from "@/config/suppliers";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, SelectField, TextAreaField, TextField } from "@/components/ui/Form";

type FieldErrors = Record<string, string>;

export function SupplierForm({ services }: { services: Pick<Service, "slug" | "name">[] }) {
  const declaration = supplierDeclarationWording();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [scheme, setScheme] = useState("");
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
        mainService: get("mainService"),
        areasCovered: f.getAll("areasCovered").map(String),
        otherAreas: get("otherAreas"),
        companiesHouseNumber: get("companiesHouseNumber"),
        competentPersonScheme: get("competentPersonScheme"),
        competentPersonSchemeOther: get("competentPersonSchemeOther"),
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
        <SelectField
          label="Main service"
          name="mainService"
          options={[...services.map((s) => ({ value: s.slug, label: s.name })), { value: "other", label: "Something else" }]}
          error={errors.mainService}
        />
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-display text-lg font-bold">Areas you cover</legend>
        <p className="-mt-1 text-sm text-muted">Choose the postcode areas you work in.</p>
        <div className="flex flex-wrap gap-2">
          {primaryRegion.postcodeAreas.map((a) => (
            <label key={a.code} className="cursor-pointer">
              <input type="checkbox" name="areasCovered" value={a.code} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line px-4 font-display text-[15px] font-semibold peer-checked:border-blue peer-checked:bg-blue-tint peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-blue">
                {a.code}
              </span>
            </label>
          ))}
        </div>
        <TextField label="Other areas or postcodes (optional)" name="otherAreas" maxLength={300} error={errors.areasCovered} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 font-display text-lg font-bold">Accreditation and reputation</legend>
        <SelectField
          label="Relevant Competent Person Scheme"
          name="competentPersonScheme"
          options={competentPersonSchemes}
          value={scheme}
          onChange={(e) => setScheme(e.target.value)}
          error={errors.competentPersonScheme}
        />
        {scheme === "other" && (
          <TextField label="Which scheme?" name="competentPersonSchemeOther" maxLength={120} error={errors.competentPersonSchemeOther} />
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
          Submitting doesn&apos;t guarantee a place in the network. We review every business against our current
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
