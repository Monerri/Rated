"use client";

import { useState } from "react";
import { site } from "@/config/site";
import { notifyServiceAvailableWording, numberWord } from "@/lib/consent";
import { getSourceInfo } from "@/lib/source";
import { EvidenceCard } from "@/components/home/EvidenceCard";
import { buttonClass } from "@/components/ui/Button";
import { ConsentCheckbox, FormError } from "@/components/ui/Form";
import type { EnquiryResult } from "@/components/funnel/ContactStep";
import type { Service } from "@/lib/types";

export function Confirmation({
  headingRef,
  result,
  comingSoon,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  result: EnquiryResult;
  comingSoon: Service[];
}) {
  const list = result.specialists;
  const n = list.length;
  const many = n > 1;
  const names = list.map((s) => s.name);
  const nameList = many ? `${names.slice(0, -1).join(", ")} and ${names[n - 1]}` : names[0];
  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <span className="justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          Enquiry sent
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold leading-tight outline-none sm:text-[32px]">
          We&apos;ve got your details
        </h1>
        <p className="text-lg text-muted">
          Thanks, {result.firstName}. {many ? "Your recommended specialists are " : "Your recommended specialist is "}
          <strong className="text-ink">{nameList}</strong>. We&apos;ve emailed their details to{" "}
          {result.email}.
        </p>
        {n < result.requested && (
          <p className="rounded-[var(--radius-card)] bg-blue-tint px-4 py-3 text-[15px]">
            You asked to hear from {numberWord(result.requested)}. At the moment {numberWord(n)} vetted{" "}
            {n === 1 ? "specialist covers" : "specialists cover"} your area, so we&apos;ve introduced{" "}
            {n === 1 ? "them" : "all of them"}.
          </p>
        )}
      </header>

      <section aria-labelledby="specialist-heading" className="grid gap-3">
        <h2 id="specialist-heading" className="text-xl font-bold">
          {many ? "Your specialists" : "Your specialist"}
        </h2>
        <div className={many ? "grid gap-4 md:grid-cols-2" : "grid"}>
          {list.map((s) => (
            <EvidenceCard key={s.slug} specialist={s} />
          ))}
        </div>
        {list.some((s) => s.isDemo) && (
          <p className="text-[13px] text-muted">
            This is a prototype. The {many ? "specialists shown are" : "specialist shown is"} fictional demonstration data.
          </p>
        )}
      </section>

      <section aria-labelledby="next-heading" className="grid gap-3">
        <h2 id="next-heading" className="text-xl font-bold">
          What happens next
        </h2>
        <ol className="grid gap-3">
          {[
            `We've sent ${nameList} your answers and contact details. No other company has them.`,
            `${many ? "Each will" : `${names[0]} will`} contact you ${site.specialistResponseTime} by phone or email to talk about your project.`,
            "Any quote is between you and them. There's no obligation to go ahead.",
          ].map((t, i) => (
            <li key={t} className="grid grid-cols-[32px_1fr] items-start gap-3">
              <span className="grid size-8 place-items-center rounded-full border-[1.5px] border-blue font-display text-sm font-bold text-blue" aria-hidden="true">
                {i + 1}
              </span>
              <span className="pt-1">{t}</span>
            </li>
          ))}
        </ol>
        <p className="text-[15px] text-muted">
          Changed your mind? Reply to our email and we&apos;ll let {many ? "them" : names[0]} know.
        </p>
      </section>

      <section aria-labelledby="summary-heading" className="grid gap-3">
        <h2 id="summary-heading" className="text-xl font-bold">
          Your enquiry
        </h2>
        <dl className="grid divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {result.summary.map((r) => (
            <div key={r.questionId} className="grid gap-0.5 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{r.label}</dt>
              <dd className="text-[15px] font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-xs text-muted">Reference: {result.reference}</p>
      </section>

      <FutureServices result={result} services={comingSoon} />
    </div>
  );
}

/** Separate, optional consent for each coming-soon service. Never pre-ticked. */
function FutureServices({ result, services: comingSoonServices }: { result: EnquiryResult; services: Service[] }) {
  const [ticked, setTicked] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  if (comingSoonServices.length === 0) return null;

  async function onSave() {
    setStatus("saving");
    try {
      const responses = await Promise.all(
        ticked.map((slug) => {
          const service = comingSoonServices.find((s) => s.slug === slug)!;
          return fetch("/api/interest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceSlug: slug,
              firstName: result.firstName,
              email: result.email,
              postcodeArea: result.postcodeArea,
              consent: { ...notifyServiceAvailableWording(service.name), given: true },
              source: getSourceInfo(),
            }),
          });
        }),
      );
      setStatus(responses.every((r) => r.ok) ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-labelledby="future-heading" className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6">
      <h2 id="future-heading" className="text-xl font-bold">
        Want to hear when more services become available?
      </h2>
      {status === "done" ? (
        <p role="status">Thanks. We&apos;ll only email you about the services you ticked.</p>
      ) : (
        <>
          <p className="text-[15px] text-muted">Optional. Tick any you&apos;d like us to email you about.</p>
          <div className="grid gap-3">
            {comingSoonServices.map((s) => (
              <ConsentCheckbox
                key={s.slug}
                name={`interest-${s.slug}`}
                wording={notifyServiceAvailableWording(s.name).wording}
                checked={ticked.includes(s.slug)}
                onChange={(on) => setTicked((t) => (on ? [...t, s.slug] : t.filter((x) => x !== s.slug)))}
              />
            ))}
          </div>
          {status === "error" && <FormError>We couldn&apos;t save that. Please try again.</FormError>}
          <button
            type="button"
            className={buttonClass("secondary", "md", "justify-self-start")}
            disabled={ticked.length === 0 || status === "saving"}
            onClick={onSave}
          >
            {status === "saving" ? "Saving…" : "Save my choices"}
          </button>
        </>
      )}
    </section>
  );
}
