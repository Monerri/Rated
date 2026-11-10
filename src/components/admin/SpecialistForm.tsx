"use client";

import { useMemo, useState } from "react";
import { maxRadiusMiles } from "@/config/coverage";
import { services as allServices } from "@/config/services";
import { competentPersonSchemes } from "@/config/suppliers";
import { getFunnel } from "@/funnels";
import { buttonClass } from "@/components/ui/Button";
import { FormError, TextField } from "@/components/ui/Form";
import type { Specialist, SupplierApplication } from "@/lib/types";

/** The form's values, as typed. Sent to the server, which checks them again. */
interface Values {
  companyName: string;
  contactName: string;
  enquiryEmail: string;
  phone: string;
  googleProfileUrl: string;
  services: string[];
  leadTypes: Record<string, string[]>;
  skipLaterLeadsFor: string[];
  basePostcode: string;
  radiusMiles: string;
  excluded: string;
  about: string;
  googleRating: string;
  googleReviewCount: string;
  companiesHouseNumber: string;
  companyCheck: string;
  guaranteeProvider: string;
  guaranteeCheck: string;
  schemeNeeded: boolean;
  schemeName: string;
  schemeRegistration: string;
  schemeCheck: string;
  schemeReason: string;
  checksConfirmedOn: string;
  checkerConfirmed: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

function allKinds(slug: string): string[] | null {
  return getFunnel(slug)?.leadTypes?.options.map((o) => o.value) ?? null;
}

export function valuesFromApplication(a: SupplierApplication): Values {
  const scheme = competentPersonSchemes.find((s) => s.value === a.competentPersonScheme);
  const notNeeded = a.competentPersonScheme === "not-applicable";
  return {
    ...blankValues(),
    companyName: a.companyName,
    contactName: a.contactName,
    enquiryEmail: a.email,
    phone: a.phone,
    googleProfileUrl: a.googleProfileUrl ?? "",
    services: a.servicesOffered ?? [a.mainService].filter((s) => allServices.some((x) => x.slug === s)),
    leadTypes: a.leadTypes ?? {},
    basePostcode: a.basePostcode ?? "",
    radiusMiles: a.radiusMiles ? String(a.radiusMiles) : "",
    excluded: a.excludedPostcodes ?? "",
    about: a.description.slice(0, 600),
    companiesHouseNumber: a.companiesHouseNumber,
    guaranteeProvider: a.insuranceBackedGuaranteeProvider,
    schemeNeeded: !notNeeded,
    schemeName: scheme && !["other", "none", "not-applicable"].includes(scheme.value) ? scheme.label : "",
  };
}

export function valuesFromSpecialist(s: Specialist): Values {
  const scheme = s.checks.find((c) => c.id === "competent_person_scheme");
  const match = scheme?.evidence.match(/^Scheme: (.*?)(?:, registration (.*))?$/);
  const notes = s.onboarding?.checkNotes;
  return {
    ...blankValues(),
    companyName: s.name,
    contactName: s.onboarding?.contactName ?? "",
    enquiryEmail: s.enquiryEmail,
    phone: s.onboarding?.phone ?? "",
    googleProfileUrl: s.onboarding?.googleProfileUrl ?? "",
    services: s.services,
    leadTypes: s.leadTypes ?? {},
    skipLaterLeadsFor: s.skipLaterLeadsFor ?? [],
    basePostcode: s.coverage?.basePostcode ?? "",
    radiusMiles: s.coverage ? String(s.coverage.radiusMiles) : "",
    excluded: s.coverage?.excluded?.join(", ") ?? "",
    about: s.about,
    googleRating: String(s.googleRating),
    googleReviewCount: String(s.googleReviewCount),
    companiesHouseNumber: s.checks.find((c) => c.id === "registered_company")?.evidence.replace("Companies House no. ", "") ?? "",
    companyCheck: notes?.company ?? "",
    guaranteeProvider: s.checks.find((c) => c.id === "insurance_backed_guarantee")?.evidence.replace("Provider: ", "") ?? "",
    guaranteeCheck: notes?.guarantee ?? "",
    schemeNeeded: !scheme?.notApplicableReason,
    schemeName: match?.[1] ?? "",
    schemeRegistration: match?.[2] ?? "",
    schemeCheck: scheme?.notApplicableReason ? "" : (notes?.scheme ?? ""),
    schemeReason: scheme?.notApplicableReason?.replace(/^Not applicable: /, "") ?? "",
    checksConfirmedOn: s.checksLastConfirmed,
  };
}

export function blankValues(): Values {
  return {
    companyName: "",
    contactName: "",
    enquiryEmail: "",
    phone: "",
    googleProfileUrl: "",
    services: [],
    leadTypes: {},
    skipLaterLeadsFor: [],
    basePostcode: "",
    radiusMiles: "",
    excluded: "",
    about: "",
    googleRating: "",
    googleReviewCount: "",
    companiesHouseNumber: "",
    companyCheck: "",
    guaranteeProvider: "",
    guaranteeCheck: "",
    schemeNeeded: true,
    schemeName: "",
    schemeRegistration: "",
    schemeCheck: "",
    schemeReason: "",
    checksConfirmedOn: today(),
    checkerConfirmed: false,
  };
}

const textareaClass =
  "min-h-[110px] w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 py-3 text-[17px] text-ink focus:border-blue focus:outline-none focus:ring-[3px] focus:ring-blue-tint";

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid min-w-0 gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1 text-lg font-bold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3 text-[15px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-[20px] accent-blue" />
      <span>
        {label}
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * Approve a specialist (from an application or from scratch), or edit one.
 * Approving saves them "awaiting terms" and emails them the link to accept
 * the Specialist terms.
 */
export function SpecialistForm({
  token,
  mode,
  initial,
  applicationId,
  slug,
  onDone,
  onCancel,
}: {
  token: string;
  mode: "approve" | "edit";
  initial: Values;
  applicationId?: string;
  slug?: string;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Values>(k: K, value: Values[K]) => setV((x) => ({ ...x, [k]: value }));
  const live = useMemo(() => allServices.filter((s) => s.status === "live" || v.services.includes(s.slug)), [v.services]);

  function toggleService(slug: string, on: boolean) {
    setV((x) => ({ ...x, services: on ? [...x.services, slug] : x.services.filter((s) => s !== slug) }));
  }
  function kindsFor(slug: string): string[] {
    return v.leadTypes[slug] ?? allKinds(slug) ?? [];
  }
  function toggleKind(slug: string, kind: string, on: boolean) {
    const current = kindsFor(slug);
    set("leadTypes", { ...v.leadTypes, [slug]: on ? [...current, kind] : current.filter((k) => k !== kind) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    setBusy(true);
    const payload = {
      ...v,
      leadTypes: Object.fromEntries(v.services.filter((s) => allKinds(s)).map((s) => [s, kindsFor(s)])),
      scheme: v.schemeNeeded
        ? { needed: true, name: v.schemeName, registration: v.schemeRegistration, check: v.schemeCheck }
        : { needed: false, reason: v.schemeReason },
      applicationId,
    };
    const res = await fetch(mode === "edit" ? `/api/admin/specialists/${slug}` : "/api/admin/specialists", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    const body = (await res?.json().catch(() => null)) as { errors?: Record<string, string>; error?: string; termsEmailSent?: boolean } | null;
    if (!res?.ok) {
      if (body?.errors) {
        setErrors(body.errors);
        return setFormError("Please check the fields marked above.");
      }
      return setFormError(body?.error ?? "That didn't work. Please try again.");
    }
    onDone(
      mode === "edit"
        ? `${v.companyName}'s details are saved.`
        : body?.termsEmailSent
          ? `${v.companyName} is approved. We've emailed them a link to accept the Specialist terms. They'll be considered for leads once they accept and you've recorded their first top-up.`
          : `${v.companyName} is approved, but the terms email couldn't be sent. Use "Send the terms link again" on their entry.`,
    );
  }

  return (
    <form onSubmit={submit} className="grid min-w-0 gap-6" noValidate>
      <Fieldset legend="The business">
        <TextField label="Company name" value={v.companyName} onChange={(e) => set("companyName", e.target.value)} error={errors.companyName} />
        <TextField label="Contact name" value={v.contactName} onChange={(e) => set("contactName", e.target.value)} error={errors.contactName} />
        <TextField
          label="Email for leads"
          type="email"
          hint="Introductions, the terms link and statements go here."
          value={v.enquiryEmail}
          onChange={(e) => set("enquiryEmail", e.target.value)}
          error={errors.enquiryEmail}
        />
        <TextField label="Phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <div className="grid gap-1.5">
          <label htmlFor="about" className="text-[15px] font-semibold">
            About the business
          </label>
          <p className="-mt-1 text-sm text-muted">One or two sentences. Homeowners see this when they&apos;re introduced.</p>
          <textarea id="about" className={textareaClass} maxLength={600} value={v.about} onChange={(e) => set("about", e.target.value)} aria-invalid={errors.about ? true : undefined} />
          {errors.about && <p className="text-sm font-semibold">{errors.about}</p>}
        </div>
      </Fieldset>

      <Fieldset legend="Services and the work they take">
        {errors.services && <p className="font-semibold">{errors.services}</p>}
        <div className="grid gap-3">
          {live.map((s) => {
            const on = v.services.includes(s.slug);
            const kinds = getFunnel(s.slug)?.leadTypes?.options;
            return (
              <div key={s.slug} className="grid gap-2">
                <Check label={s.name} checked={on} onChange={(c) => toggleService(s.slug, c)} />
                {on && (
                  <div className="ml-9 grid gap-2 border-l-2 border-line pl-4">
                    {kinds?.map((k) => (
                      <Check key={k.value} label={k.label} checked={kindsFor(s.slug).includes(k.value)} onChange={(c) => toggleKind(s.slug, k.value, c)} />
                    ))}
                    <Check
                      label="Opt out of non-urgent jobs"
                      hint="Tick this and they'll only be sent homeowners who want the work done within 3 months. They won't receive jobs planned in 3 to 6 months, which are charged at a discount."
                      checked={v.skipLaterLeadsFor.includes(s.slug)}
                      onChange={(c) =>
                        set("skipLaterLeadsFor", c ? [...v.skipLaterLeadsFor, s.slug] : v.skipLaterLeadsFor.filter((x) => x !== s.slug))
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Fieldset>

      <Fieldset legend="Where they work">
        <TextField
          label="Base postcode"
          hint="A full postcode, for example DH1 3AA."
          autoCapitalize="characters"
          value={v.basePostcode}
          onChange={(e) => set("basePostcode", e.target.value)}
          error={errors.basePostcode}
        />
        <TextField
          label="Travel distance (miles)"
          inputMode="numeric"
          hint={`Up to ${maxRadiusMiles} miles, measured in a straight line.`}
          value={v.radiusMiles}
          onChange={(e) => set("radiusMiles", e.target.value)}
          error={errors.radiusMiles}
        />
        <TextField
          label="Postcodes they don't cover (optional)"
          hint="Areas or districts inside that distance, separated by commas, for example TD, DG, NE71."
          value={v.excluded}
          onChange={(e) => set("excluded", e.target.value)}
          error={errors.excluded}
        />
      </Fieldset>

      <Fieldset legend="Our checks">
        <p className="text-[15px] text-muted">
          Check each item against the official source. What you write under &ldquo;What you checked&rdquo; is kept for our records and
          never shown to homeowners. The company number, guarantee provider, scheme and rating are shown to homeowners.
        </p>
        <h3 className="font-bold">1. Registered company</h3>
        <TextField
          label="Companies House number"
          value={v.companiesHouseNumber}
          onChange={(e) => set("companiesHouseNumber", e.target.value)}
          error={errors.companiesHouseNumber}
        />
        {/^[A-Z0-9]{8}$/i.test(v.companiesHouseNumber.trim()) && (
          <a
            href={`https://find-and-update.company-information.service.gov.uk/company/${v.companiesHouseNumber.trim().toUpperCase()}`}
            target="_blank"
            rel="noreferrer"
            className="-mt-2 text-[15px] font-semibold text-blue underline"
          >
            Open on Companies House (new tab)
          </a>
        )}
        <TextField
          label="What you checked"
          hint="For example: Active, incorporated 2014, registered address and directors match."
          value={v.companyCheck}
          onChange={(e) => set("companyCheck", e.target.value)}
          error={errors.companyCheck}
        />

        <h3 className="font-bold">2. Insurance-backed guarantee</h3>
        <TextField label="Provider" value={v.guaranteeProvider} onChange={(e) => set("guaranteeProvider", e.target.value)} error={errors.guaranteeProvider} />
        <TextField
          label="What you checked"
          hint="For example: Membership certificate seen, valid to March 2027."
          value={v.guaranteeCheck}
          onChange={(e) => set("guaranteeCheck", e.target.value)}
          error={errors.guaranteeCheck}
        />

        <h3 className="font-bold">3. Trade scheme</h3>
        <p className="-mt-2 text-sm text-muted">
          Which schemes each service needs is listed on the{" "}
          <a href="/how-we-check" target="_blank" className="font-semibold text-blue underline">
            How we check page (new tab)
          </a>
          . Gas work always needs Gas Safe.
        </p>
        <Check
          label="No scheme is needed for the services above"
          checked={!v.schemeNeeded}
          onChange={(c) => set("schemeNeeded", !c)}
        />
        {v.schemeNeeded ? (
          <>
            <TextField label="Scheme" hint="For example: Gas Safe Register, NICEIC, FENSA, MCS." value={v.schemeName} onChange={(e) => set("schemeName", e.target.value)} error={errors.schemeName} />
            <TextField label="Registration number (optional)" value={v.schemeRegistration} onChange={(e) => set("schemeRegistration", e.target.value)} />
            <TextField
              label="What you checked"
              hint="For example: Found on the Gas Safe register, registration current."
              value={v.schemeCheck}
              onChange={(e) => set("schemeCheck", e.target.value)}
              error={errors.schemeCheck}
            />
          </>
        ) : (
          <TextField
            label="Why no scheme is needed"
            hint="Shown to homeowners, for example: Building control approves the work."
            value={v.schemeReason}
            onChange={(e) => set("schemeReason", e.target.value)}
            error={errors.schemeReason}
          />
        )}

        <h3 className="font-bold">4. Google rating</h3>
        <TextField label="Rating" inputMode="decimal" hint="Must be above 4, for example 4.7." value={v.googleRating} onChange={(e) => set("googleRating", e.target.value)} error={errors.googleRating} />
        <TextField label="Number of reviews" inputMode="numeric" value={v.googleReviewCount} onChange={(e) => set("googleReviewCount", e.target.value)} error={errors.googleReviewCount} />
        <TextField
          label="Google profile link (optional)"
          type="url"
          value={v.googleProfileUrl}
          onChange={(e) => set("googleProfileUrl", e.target.value)}
          error={errors.googleProfileUrl}
        />

        <TextField
          label="Date you did these checks"
          type="date"
          hint="Checks must be redone within 12 months, or they stop receiving leads."
          value={v.checksConfirmedOn}
          onChange={(e) => set("checksConfirmedOn", e.target.value)}
          error={errors.checksConfirmedOn}
        />
      </Fieldset>

      <div className="grid gap-2">
        <Check
          label="I've checked each item above against the official source, and the details are correct."
          checked={v.checkerConfirmed}
          onChange={(c) => set("checkerConfirmed", c)}
        />
        {errors.checkerConfirmed && <p className="text-sm font-semibold">{errors.checkerConfirmed}</p>}
      </div>

      {formError && <FormError>{formError}</FormError>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={buttonClass("primary")}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Approve and send the terms"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
