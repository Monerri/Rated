import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialist, specialists } from "@/data/specialists";
import { getService } from "@/config/services";
import { regions } from "@/config/regions";
import { vettingChecks } from "@/config/vetting";
import { formatMonthYear } from "@/lib/format";
import { checksExpire, isCurrentlyVetted } from "@/lib/vetting";
import { Icon, TickIcon } from "@/components/ui/Icon";
import { ButtonLink } from "@/components/ui/Button";

/** Only the pages generated at build time exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return specialists.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/specialists/[slug]">): Promise<Metadata> {
  const s = getSpecialist((await params).slug);
  if (!s) return {};
  return {
    title: s.isDemo ? `${s.name} (demonstration)` : s.name,
    description: `${s.name}: vetted specialist. Checks last confirmed ${formatMonthYear(s.checksLastConfirmed)}.`,
    robots: s.isDemo ? { index: false } : undefined,
  };
}

const placeFor = (code: string) =>
  regions.flatMap((r) => r.postcodeAreas).find((a) => a.code === code)?.places ?? (code === "TD15" ? "Berwick-upon-Tweed" : "");

export default async function SpecialistProfilePage({ params }: PageProps<"/specialists/[slug]">) {
  const s = getSpecialist((await params).slug);
  if (!s) notFound();
  const vetted = isCurrentlyVetted(s);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:py-14">
      {s.isDemo && (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-4 py-3 text-[15px]">
          <strong>Demonstration profile.</strong> This company is fictional. It shows how real specialist profiles will
          look. None of the details describe a real business.
        </p>
      )}

      <header className="grid gap-3">
        <p className="text-sm text-muted">
          <Link href="/specialists" className="text-blue">
            Our specialists
          </Link>{" "}
          / {s.name}
        </p>
        <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[44px]">{s.name}</h1>
        {vetted ? (
          <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-green-tint px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-green">
            <TickIcon /> Vetted specialist
          </span>
        ) : (
          <span className="justify-self-start rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold">
            Checks due for renewal: not currently recommended
          </span>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-8">
          <section aria-labelledby="checks-heading" className="grid gap-4">
            <h2 id="checks-heading" className="text-2xl font-bold">
              Checks
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {vettingChecks.map((def) => {
                const r = s.checks.find((c) => c.id === def.id);
                const ok = !!r && (r.passed || !!r.notApplicableReason);
                const title = def.id === "google_rating" ? `${s.googleRating.toFixed(1)} ★ Google rating` : def.title;
                return (
                  <li key={def.id} className="grid grid-cols-[32px_1fr] gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                    <span
                      className={`grid size-8 place-items-center rounded-full ${ok ? "bg-green text-surface" : "border-[1.5px] border-line text-muted"}`}
                      aria-hidden="true"
                    >
                      {ok ? <TickIcon className="size-3.5" /> : "–"}
                    </span>
                    <div className="grid gap-0.5">
                      <h3 className="text-[17px] font-bold">
                        {title}
                        <span className="sr-only">{ok ? ": passed" : ": not confirmed"}</span>
                      </h3>
                      <p className="font-mono text-[13px] text-muted">
                        {r?.notApplicableReason ?? r?.evidence ?? "Not confirmed"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="font-mono text-sm">
              Checks last confirmed: {formatMonthYear(s.checksLastConfirmed)} · Next due by{" "}
              {formatMonthYear(checksExpire(s).toISOString())}
            </p>
            <Link href="/how-we-check" className="justify-self-start text-[15px] text-blue">
              What these checks mean
            </Link>
          </section>

          <section aria-labelledby="about-heading" className="grid gap-3">
            <h2 id="about-heading" className="text-2xl font-bold">
              About the business
            </h2>
            <p className="max-w-2xl text-lg text-muted">{s.about}</p>
          </section>
        </div>

        <aside className="grid gap-6 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
          <section aria-labelledby="services-heading" className="grid gap-3">
            <h2 id="services-heading" className="text-lg font-bold">
              Services
            </h2>
            <ul className="grid gap-2">
              {s.services.map((slug) => {
                const svc = getService(slug);
                return svc ? (
                  <li key={slug} className="flex items-center gap-3">
                    <Icon name={svc.icon} className="size-7 text-blue" />
                    <span className="font-display font-semibold">{svc.name}</span>
                  </li>
                ) : null;
              })}
            </ul>
          </section>
          <section aria-labelledby="areas-heading" className="grid gap-3">
            <h2 id="areas-heading" className="text-lg font-bold">
              Areas covered
            </h2>
            <ul className="grid gap-2">
              {s.areasCovered.map((code) => (
                <li key={code} className="grid grid-cols-[56px_1fr] items-baseline gap-2">
                  <span className="font-display text-lg font-bold">{code}</span>
                  <span className="text-sm text-muted">{placeFor(code)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="grid gap-3 border-t border-line pt-5">
            <p className="text-[15px] text-muted">
              We match each enquiry with one specialist who covers your postcode and the work you need. Tell us about
              your project to find yours.
            </p>
            <ButtonLink href="/find-a-specialist">Find a specialist</ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  );
}
