"use client";

import { useMemo, useState } from "react";
import { maxRadiusMiles } from "@/config/coverage";
import { services as allServices } from "@/config/services";
import { competentPersonSchemes } from "@/config/suppliers";
import { getFunnel } from "@/funnels";
import { launch } from "@/config/launch";
import { verifiedBadge } from "@/config/vetting";
import { buttonClass } from "@/components/ui/Button";
import { FormError, TextField } from "@/components/ui/Form";
import type { Specialist, SupplierApplication } from "@/lib/types";

type CheckChoice = "passed" | "not_passed" | "not_required";

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
  businessType: "limited" | "sole_trader";
  companiesHouseNumber: string;
  businessCheck: string;
  legalNeeded: boolean;
  legalScheme: string;
  legalRegistration: string;
  legalCheck: string;
  identityStatus: "passed" | "not_passed";
  identityCheck: string;
  guaranteeStatus: CheckChoice;
  guaranteeProvider: string;
  guaranteeCheck: string;
  guaranteeReason: string;
  schemeStatus: CheckChoice;
  schemeName: string;
  schemeRegistration: string;
  schemeCheck: string;
  schemeReason: string;
  checksConfirmedOn: string;
  checkerConfirmed: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const LEGAL_SCHEMES = ["gas-safe", "f-gas"];

function allKinds(slug: string): string[] | null {
  return getFunnel(slug)?.leadTypes?.options.map((o) => o.value) ?? null;
}

export function valuesFromApplication(a: SupplierApplication): Values {
  const scheme = competentPersonSchemes.find((s) => a.competentPersonScheme.startsWith(s.label));
  const legal = !!scheme && LEGAL_SCHEMES.includes(scheme.value);
  const named = !!scheme && !["other", "none", "not-applicable"].includes(scheme.value) && !legal;
  const provider = a.insuranceBackedGuaranteeProvider?.trim() ?? "";
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
    businessType: a.businessType ?? "limited",
    companiesHouseNumber: a.companiesHouseNumber ?? "",
    legalNeeded: legal,
    legalScheme: legal ? scheme!.label : "",
    guaranteeStatus: provider ? "passed" : "not_passed",
    guaranteeProvider: provider,
    schemeStatus: a.competentPersonScheme.startsWith("Not applicable") ? "not_required" : named ? "passed" : "not_passed",
    schemeName: named ? scheme!.label : "",
  };
}

function choiceOf(s: Specialist, id: Specialist["checks"][number]["id"]): CheckChoice {
  const r = s.checks.find((c) => c.id === id);
  return r?.passed ? "passed" : r?.notApplicableReason ? "not_required" : "not_passed";
}

const reasonOf = (s: Specialist, id: Specialist["checks"][number]["id"]) =>
  s.checks.find((c) => c.id === id)?.notApplicableReason?.replace(/^Not applicable: /, "") ?? "";

export function valuesFromSpecialist(s: Specialist): Values {
  const business = s.checks.find((c) => c.id === "registered_company");
  const legal = s.checks.find((c) => c.id === "legal_registration");
  const legalMatch = legal?.passed ? legal.evidence.match(/^(.*?)(?:, registration (.*))?$/) : null;
  const scheme = s.checks.find((c) => c.id === "competent_person_scheme");
  const match = scheme?.passed ? scheme.evidence.match(/^Scheme: (.*?)(?:, registration (.*))?$/) : null;
  const notes = s.onboarding?.checkNotes;
  const soleTrader = !!business?.soleTrader;
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
    businessType: soleTrader ? "sole_trader" : "limited",
    companiesHouseNumber: soleTrader ? "" : (business?.evidence.replace("Companies House no. ", "") ?? ""),
    businessCheck: notes?.company ?? "",
    legalNeeded: !!legal?.passed,
    legalScheme: legalMatch?.[1] ?? "",
    legalRegistration: legalMatch?.[2] ?? "",
    legalCheck: legal?.passed ? (notes?.legal ?? "") : "",
    identityStatus: choiceOf(s, "identity") === "passed" ? "passed" : "not_passed",
    identityCheck: choiceOf(s, "identity") === "passed" && !soleTrader ? (notes?.identity ?? "") : "",
    guaranteeStatus: choiceOf(s, "insurance_backed_guarantee"),
    guaranteeProvider: s.checks.find((c) => c.id === "insurance_backed_guarantee" && c.passed)?.evidence.replace("Provider: ", "") ?? "",
    guaranteeCheck: choiceOf(s, "insurance_backed_guarantee") === "passed" ? (notes?.guarantee ?? "") : "",
    guaranteeReason: reasonOf(s, "insurance_backed_guarantee"),
    schemeStatus: choiceOf(s, "competent_person_scheme"),
    schemeName: match?.[1] ?? "",
    schemeRegistration: match?.[2] ?? "",
    schemeCheck: choiceOf(s, "competent_person_scheme") === "passed" ? (notes?.scheme ?? "") : "",
    schemeReason: reasonOf(s, "competent_person_scheme"),
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
    businessType: "limited",
    companiesHouseNumber: "",
    businessCheck: "",
    legalNeeded: false,
    legalScheme: "",
    legalRegistration: "",
    legalCheck: "",
    identityStatus: "not_passed",
    identityCheck: "",
    guaranteeStatus: "not_passed",
    guaranteeProvider: "",
    guaranteeCheck: "",
    guaranteeReason: "",
    schemeStatus: "not_passed",
    schemeName: "",
    schemeRegistration: "",
    schemeCheck: "",
    schemeReason: "",
    checksConfirmedOn: today(),
    checkerConfirmed: false,
  };
}

/** Three choices for a badge check, as labelled radio buttons. */
function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-3 text-[15px] ${
            value === o.value ? "border-ink font-semibold" : "border-line"
          }`}
        >
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-blue" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const BADGE_CHOICES: { value: CheckChoice; label: string }[] = [
  { value: "passed", label: "Passed" },
  { value: "not_passed", label: "Not passed or not checked" },
  { value: "not_required", label: "Not required" },
];

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
  termsAccepted = false,
  slug,
  onDone,
  onCancel,
}: {
  token: string;
  mode: "approve" | "edit";
  initial: Values;
  applicationId?: string;
  /** The application already accepts the current Specialist terms, so approving makes them live. */
  termsAccepted?: boolean;
  slug?: string;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Values>(k: K, value: Values[K]) => setV((x) => ({ ...x, [k]: value }));
  const badgeGaps = [
    v.businessType === "limited" && v.identityStatus !== "passed" ? "identity" : null,
    v.guaranteeStatus === "not_passed" ? "insurance-backed guarantee" : null,
    v.schemeStatus === "not_passed" ? "trade scheme" : null,
  ].filter(Boolean) as string[];
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
      business: { type: v.businessType, companiesHouseNumber: v.companiesHouseNumber, check: v.businessCheck },
      legal: { needed: v.legalNeeded, scheme: v.legalScheme, registration: v.legalRegistration, check: v.legalCheck },
      identity: { status: v.identityStatus, check: v.identityCheck },
      guarantee: { status: v.guaranteeStatus, provider: v.guaranteeProvider, check: v.guaranteeCheck, reason: v.guaranteeReason },
      scheme: { status: v.schemeStatus, name: v.schemeName, registration: v.schemeRegistration, check: v.schemeCheck, reason: v.schemeReason },
      applicationId,
    };
    const res = await fetch(mode === "edit" ? `/api/admin/specialists/${slug}` : "/api/admin/specialists", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    const body = (await res?.json().catch(() => null)) as {
      errors?: Record<string, string>;
      error?: string;
      activated?: boolean;
      welcomeEmailSent?: boolean;
      termsEmailSent?: boolean;
    } | null;
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
        : body?.activated
          ? `${v.companyName} is approved and live. They accepted the Specialist terms when they applied${launch.welcomeCredits + launch.foundingCredits > 0 ? ", and their free credits have been added" : ""}. ${body.welcomeEmailSent ? "We've emailed them a welcome with how to top up." : "The welcome email couldn't be sent, so please let them know."}`
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

      <Fieldset legend="Required checks: needed to be recommended">
        <p className="text-[15px] text-muted">
          Check each item against the official source. What you write under &ldquo;What you checked&rdquo; is kept for our records and
          never shown to homeowners. Company numbers, registrations, providers, schemes, ratings and &ldquo;not required&rdquo; reasons
          are shown to homeowners.
        </p>
        <h3 className="font-bold">1. Registered business</h3>
        <Choice
          name="businessType"
          value={v.businessType}
          options={[
            { value: "limited", label: "Limited company" },
            { value: "sole_trader", label: "Sole trader" },
          ]}
          onChange={(x) => set("businessType", x)}
        />
        {v.businessType === "limited" ? (
          <>
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
          </>
        ) : (
          <p className="-mt-1 text-sm text-muted">
            Sole traders aren&apos;t on Companies House. Check photo ID (passport or driving licence) and proof of address (for
            example a recent utility or council tax bill) in the owner&apos;s name. Note what you saw, but don&apos;t keep copies.
          </p>
        )}
        <TextField
          label="What you checked"
          hint={
            v.businessType === "limited"
              ? "For example: Active, incorporated 2014, registered address and directors match."
              : "For example: Driving licence and council tax bill seen, name and address match."
          }
          value={v.businessCheck}
          onChange={(e) => set("businessCheck", e.target.value)}
          error={errors.businessCheck}
        />

        <h3 className="font-bold">2. Legal registration for the work</h3>
        <Choice
          name="legalNeeded"
          value={v.legalNeeded ? "yes" : "no"}
          options={[
            { value: "no", label: "Not needed: no gas or refrigerant work" },
            { value: "yes", label: "Needed: they do gas or refrigerant work" },
          ]}
          onChange={(x) => set("legalNeeded", x === "yes")}
        />
        {v.legalNeeded && (
          <>
            <TextField label="Registration" hint="Gas Safe Register for gas work. F gas certification for air conditioning and refrigerant work." value={v.legalScheme} onChange={(e) => set("legalScheme", e.target.value)} error={errors.legalScheme} />
            <TextField label="Registration number (optional)" value={v.legalRegistration} onChange={(e) => set("legalRegistration", e.target.value)} />
            <TextField
              label="What you checked"
              hint="For example: Found on the Gas Safe register, registration current."
              value={v.legalCheck}
              onChange={(e) => set("legalCheck", e.target.value)}
              error={errors.legalCheck}
            />
          </>
        )}

        <h3 className="font-bold">3. Google rating</h3>
        <TextField label="Rating" inputMode="decimal" hint="Must be above 4, for example 4.7." value={v.googleRating} onChange={(e) => set("googleRating", e.target.value)} error={errors.googleRating} />
        <TextField label="Number of reviews" inputMode="numeric" hint="At least 10." value={v.googleReviewCount} onChange={(e) => set("googleReviewCount", e.target.value)} error={errors.googleReviewCount} />
        <TextField
          label="Google profile link (optional)"
          type="url"
          value={v.googleProfileUrl}
          onChange={(e) => set("googleProfileUrl", e.target.value)}
          error={errors.googleProfileUrl}
        />
      </Fieldset>

      <Fieldset legend={`For the ${verifiedBadge.name} badge`}>
        <p className="text-[15px] text-muted">
          They show the badge when each of these is Passed or Not required. &ldquo;Not required&rdquo; needs a reason, which
          homeowners see, for example &ldquo;design work only&rdquo;.
        </p>

        <h3 className="font-bold">4. Identity confirmed</h3>
        {v.businessType === "sole_trader" ? (
          <p className="-mt-1 text-[15px]">✓ Covered by the identity and address check above.</p>
        ) : (
          <>
            <Choice
              name="identityStatus"
              value={v.identityStatus}
              options={[
                { value: "passed", label: "Passed" },
                { value: "not_passed", label: "Not passed or not checked" },
              ]}
              onChange={(x) => set("identityStatus", x)}
            />
            {v.identityStatus === "passed" && (
              <TextField
                label="What you checked"
                hint="For example: Sam Fitter is a listed director on Companies House."
                value={v.identityCheck}
                onChange={(e) => set("identityCheck", e.target.value)}
                error={errors.identityCheck}
              />
            )}
          </>
        )}

        <h3 className="font-bold">5. Insurance-backed guarantee</h3>
        <Choice name="guaranteeStatus" value={v.guaranteeStatus} options={BADGE_CHOICES} onChange={(x) => set("guaranteeStatus", x)} />
        {v.guaranteeStatus === "passed" && (
          <>
            <TextField label="Provider" value={v.guaranteeProvider} onChange={(e) => set("guaranteeProvider", e.target.value)} error={errors.guaranteeProvider} />
            <TextField
              label="What you checked"
              hint="For example: Membership certificate seen, valid to March 2027."
              value={v.guaranteeCheck}
              onChange={(e) => set("guaranteeCheck", e.target.value)}
              error={errors.guaranteeCheck}
            />
          </>
        )}
        {v.guaranteeStatus === "not_required" && (
          <TextField
            label="Why it isn't needed"
            hint="Shown to homeowners, for example: Design and planning work only."
            value={v.guaranteeReason}
            onChange={(e) => set("guaranteeReason", e.target.value)}
            error={errors.guaranteeReason}
          />
        )}

        <h3 className="font-bold">6. Trade scheme</h3>
        <p className="-mt-2 text-sm text-muted">
          Which schemes each service needs is listed on the{" "}
          <a href="/how-we-check" target="_blank" className="font-semibold text-blue underline">
            How we check page (new tab)
          </a>
          .
        </p>
        <Choice name="schemeStatus" value={v.schemeStatus} options={BADGE_CHOICES} onChange={(x) => set("schemeStatus", x)} />
        {v.schemeStatus === "passed" && (
          <>
            <TextField label="Scheme" hint="For example: NICEIC, FENSA, MCS." value={v.schemeName} onChange={(e) => set("schemeName", e.target.value)} error={errors.schemeName} />
            <TextField label="Registration number (optional)" value={v.schemeRegistration} onChange={(e) => set("schemeRegistration", e.target.value)} />
            <TextField
              label="What you checked"
              hint="For example: Found on the NICEIC register, registration current."
              value={v.schemeCheck}
              onChange={(e) => set("schemeCheck", e.target.value)}
              error={errors.schemeCheck}
            />
          </>
        )}
        {v.schemeStatus === "not_required" && (
          <TextField
            label="Why no scheme is needed"
            hint="Shown to homeowners, for example: Building control approves the work."
            value={v.schemeReason}
            onChange={(e) => set("schemeReason", e.target.value)}
            error={errors.schemeReason}
          />
        )}

        <p className="rounded-[var(--radius-card)] border border-line p-3 text-[15px] font-semibold" role="status">
          {badgeGaps.length === 0
            ? `★ They'll show the ${verifiedBadge.name} badge.`
            : `○ No badge yet. Still needed: ${badgeGaps.join(", ")}.`}
        </p>
      </Fieldset>

      <Fieldset legend="Date of the checks">
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
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : termsAccepted ? "Approve: they go live now" : "Approve and send the terms"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass("secondary")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
