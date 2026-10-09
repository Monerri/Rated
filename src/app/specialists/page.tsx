import type { Metadata } from "next";
import Link from "next/link";
import { specialists } from "@/data/specialists";
import { primaryRegion } from "@/config/regions";
import { getService } from "@/config/services";
import { formatMonthYear } from "@/lib/format";
import { isCurrentlyVetted } from "@/lib/vetting";
import { Eyebrow } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon, TickIcon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Our specialists",
  description: `The vetted home-improvement specialists we work with across ${primaryRegion.name}.`,
};

export default function SpecialistsPage() {
  const listed = specialists.filter((s) => isCurrentlyVetted(s));
  const allDemo = listed.every((s) => s.isDemo);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid max-w-2xl gap-4">
        <Eyebrow>Our specialists</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          Local specialists we&apos;ve checked
        </h1>
        <p className="text-lg text-muted">
          We&apos;re building our network across {primaryRegion.name}. Every specialist here has passed{" "}
          <Link href="/how-we-check" className="text-blue">
            our four checks
          </Link>
          , and each profile shows the evidence and when it was last confirmed.
        </p>
      </header>

      {allDemo && (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-4 py-3 text-[15px]">
          <strong>Demonstration data.</strong> The companies below are fictional and show how profiles will look. Real
          specialists will appear here once they&apos;ve been checked.
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {listed.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/specialists/${s.slug}`}
              className="grid h-full gap-3 rounded-[var(--radius-panel)] border-[1.5px] border-line bg-surface p-6 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold">{s.name}</h2>
                {s.isDemo && (
                  <span className="whitespace-nowrap rounded border border-dashed border-line px-1.5 py-1 font-mono text-[11px] text-muted">
                    DEMO DATA
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-green-tint px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-green">
                <TickIcon /> Vetted specialist
              </span>
              <p className="text-[15px] text-muted">
                {s.services.map((x) => getService(x)?.name).filter(Boolean).join(" · ")} · Covers {s.areasCovered.join(", ")}
              </p>
              <p className="text-[15px]">{s.googleRating.toFixed(1)} ★ Google rating</p>
              <p className="font-mono text-[13px] text-muted">Checks last confirmed: {formatMonthYear(s.checksLastConfirmed)}</p>
              <span className="inline-flex items-center gap-1.5 font-display text-[15px] font-semibold text-blue">
                View profile <ArrowIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="grid justify-items-start gap-3 rounded-[var(--radius-panel)] bg-blue-tint p-6">
        <h2 className="text-xl font-bold">You don&apos;t need to choose</h2>
        <p className="max-w-2xl text-muted">
          Tell us about your project and choose whether to hear from one, two or three specialists who cover your postcode and the work you
          need. We&apos;ll tell you who they are before they get in touch.
        </p>
        <ButtonLink href="/find-a-specialist">
          Find a specialist <ArrowIcon />
        </ButtonLink>
      </section>
    </div>
  );
}
