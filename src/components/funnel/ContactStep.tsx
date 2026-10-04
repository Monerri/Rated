"use client";

import { useState } from "react";
import type { PublicSpecialist, Service } from "@/lib/types";
import type { Answers } from "@/funnels/types";
import { ELSEWHERE } from "@/funnels/types";
import { shareWithSpecialistWording } from "@/lib/consent";
import { normalisePostcode, postcodeArea } from "@/lib/postcode";
import { getSourceInfo } from "@/lib/source";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError, TextField } from "@/components/ui/Form";

export interface EnquiryResult {
  reference: string;
  summary: { questionId: string; label: string; value: string }[];
  specialist: PublicSpecialist;
  firstName: string;
  email: string;
  postcodeArea: string;
}

type Errors = Partial<Record<"postcode" | "firstName" | "lastName" | "email" | "phone", string>>;

export function ContactStep({
  headingRef,
  service,
  answers,
  researchingConfirmed,
  onSubmitted,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  service: Service;
  answers: Answers;
  researchingConfirmed: boolean;
  onSubmitted: (r: EnquiryResult) => void;
}) {
  const consent = shareWithSpecialistWording(service.name);
  const knownPostcode = answers.postcodeArea === ELSEWHERE ? String(answers.postcodeEarly ?? "") : "";
  const area = answers.postcodeArea !== ELSEWHERE ? String(answers.postcodeArea ?? "") : null;

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    const next: Errors = {};
    const postcode = normalisePostcode(get("postcode"));
    if (!postcode) next.postcode = "Please enter a full UK postcode, for example NE1 4ST.";
    else if (area && postcodeArea(postcode) !== area)
      next.postcode = `This postcode doesn't start with ${area}. Please check it, or go back and change your area.`;
    if (!get("firstName")) next.firstName = "Please enter your first name.";
    if (!get("lastName")) next.lastName = "Please enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) next.email = "Please enter a valid email address.";
    if (get("phone").replace(/\D/g, "").length < 10) next.phone = "Please enter a UK phone number.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!agreed) return setFormError("Please tick the box so we can share your details with the specialist.");

    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSlug: service.slug,
          answers,
          postcode,
          contact: { firstName: get("firstName"), lastName: get("lastName"), email: get("email"), phone: get("phone") },
          consent: { ...consent, given: true },
          researchingConfirmed,
          source: getSourceInfo(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Something went wrong.");
      onSubmitted({ ...body, firstName: get("firstName"), email: get("email"), postcodeArea: postcodeArea(postcode!) });
    } catch (err) {
      setFormError(`${err instanceof Error ? err.message : "Something went wrong."} Please try again.`);
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <header className="grid gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-[30px]">
          Almost there. Let&apos;s find your local specialist.
        </h1>
        <p className="text-muted">
          We&apos;ll use the information you&apos;ve provided to identify one suitable vetted specialist covering your
          area.
        </p>
      </header>

      <div className="grid gap-4">
        <TextField
          label="Postcode of the property"
          name="postcode"
          autoComplete="postal-code"
          autoCapitalize="characters"
          defaultValue={knownPostcode}
          error={errors.postcode}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" name="firstName" autoComplete="given-name" maxLength={80} error={errors.firstName} />
          <TextField label="Last name" name="lastName" autoComplete="family-name" maxLength={80} error={errors.lastName} />
        </div>
        <TextField label="Email" name="email" type="email" autoComplete="email" maxLength={254} error={errors.email} />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="The specialist may call you to talk through your project."
          error={errors.phone}
        />
      </div>

      <div className="grid gap-3 rounded-[var(--radius-card)] bg-blue-tint p-4">
        <h2 className="font-display text-[17px] font-bold">What happens when you continue</h2>
        <ol className="grid list-decimal gap-1.5 pl-5 text-[15px]">
          <li>We match you with one vetted {service.name.toLowerCase()} specialist covering your postcode.</li>
          <li>We show you who it is straight away, and email you their name and checks.</li>
          <li>We then send them your answers and contact details so they can get in touch.</li>
        </ol>
        <p className="text-[15px]">No other company receives your details. There&apos;s no obligation to go ahead.</p>
      </div>

      <ConsentCheckbox name="consent" wording={consent.wording} checked={agreed} onChange={setAgreed} />

      {formError && <FormError>{formError}</FormError>}

      <button type="submit" disabled={submitting} className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        {submitting ? "Finding your specialist…" : "Find my specialist"}
      </button>
    </form>
  );
}
