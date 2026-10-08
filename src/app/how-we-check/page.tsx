import type { Metadata } from "next";
import Link from "next/link";
import { vettingChecks, vettingStandard } from "@/config/vetting";
import { demoSpecialist } from "@/data/specialists";
import { formatMonthYear } from "@/lib/format";
import { EvidenceCard } from "@/components/home/EvidenceCard";
import { Eyebrow } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon, TickIcon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "How we check our specialists",
  description: "The four checks every specialist passes before we recommend them, and how we keep them up to date.",
};

const tips = [
  "Get the quote, the work and the price agreed in writing before work starts.",
  "Ask what the insurance-backed guarantee covers and how long it lasts.",
  "For windows and doors, check you receive a Building Regulations compliance certificate afterwards.",
  "Read a few recent reviews, not just the overall rating.",
];

export default function HowWeCheckPage() {
  return (
    <>
      <section aria-labelledby="hwc-heading" className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
          <div className="grid max-w-2xl gap-5">
            <Eyebrow>How we check our specialists</Eyebrow>
            <h1 id="hwc-heading" className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
              Four checks before we recommend anyone
            </h1>
            <p className="text-lg text-muted sm:text-xl">
              Every specialist we recommend has passed the same four checks. We show you the evidence and the date the
              checks were last confirmed, so you can see for yourself.
            </p>
            <p className="font-mono text-sm text-muted">
              Our standard was last reviewed: {formatMonthYear(vettingStandard.lastReviewed)}
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            <EvidenceCard specialist={demoSpecialist} />
            <p className="mt-3 text-center text-[13px] text-muted">How the checks appear on a specialist&apos;s profile. This company is fictional.</p>
          </div>
        </div>
      </section>

      <section aria-label="The four checks" className="mx-auto grid max-w-4xl gap-6 px-4 py-14 sm:px-6 md:py-20">
        <ol className="grid gap-6">
          {vettingChecks.map((c, i) => (
            <li key={c.id} className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:grid-cols-[48px_1fr] sm:p-7">
              <span className="grid size-10 place-items-center rounded-full bg-green text-surface" aria-hidden="true">
                <TickIcon className="size-4" />
              </span>
              <div className="grid gap-4">
                <h2 className="text-2xl font-bold">
                  <span className="sr-only">Check {i + 1}: </span>
                  {c.title}
                </h2>
                <p className="text-lg">{c.summary}</p>
                <dl className="grid gap-4">
                  <div className="grid gap-1">
                    <dt className="font-display font-bold">What we check</dt>
                    <dd className="text-muted">{c.whatWeCheck}</dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className="font-display font-bold">Why it matters</dt>
                    <dd className="text-muted">{c.whyItMatters}</dd>
                  </div>
                  <div className="grid gap-1 rounded-[var(--radius-card)] bg-ground p-4">
                    <dt className="font-display font-bold">Worth knowing</dt>
                    <dd className="text-muted">{c.worthKnowing}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="uptodate-heading" className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-4xl gap-5 px-4 py-14 sm:px-6">
          <h2 id="uptodate-heading" className="text-[28px] font-bold leading-tight">
            Keeping checks up to date
          </h2>
          <ul className="grid gap-3 text-lg">
            <li>
              We reconfirm every specialist&apos;s checks at least every {vettingStandard.checkValidityMonths} months. Each
              profile shows <span className="font-mono text-base">Checks last confirmed: [date]</span>.
            </li>
            <li>If a specialist&apos;s checks lapse, or they no longer meet one of them, we stop recommending them.</li>
            <li>We review the standard itself and may add checks over time. When we do, we&apos;ll update this page.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="tips-heading" className="mx-auto grid max-w-4xl gap-5 px-4 py-14 sm:px-6 md:py-20">
        <h2 id="tips-heading" className="text-[28px] font-bold leading-tight">
          Checks are a good starting point
        </h2>
        <p className="text-lg text-muted">
          Our checks tell you a business is properly set up. They can&apos;t guarantee how a particular job will go, so
          it&apos;s still worth doing a few things yourself:
        </p>
        <ul className="grid gap-2 pl-5 text-lg [list-style:disc]">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/find-a-specialist">
            Find a specialist <ArrowIcon />
          </ButtonLink>
          <ButtonLink href="/specialists" variant="secondary">
            Our specialists
          </ButtonLink>
        </div>
        <p className="text-[15px] text-muted">
          Run a home-improvement business?{" "}
          <Link href="/for-suppliers" className="text-blue">
            See how to be considered for our network
          </Link>
          .
        </p>
      </section>
    </>
  );
}
