import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegion, regions } from "@/config/regions";
import { getCatalogue } from "@/lib/catalogue";
import { Eyebrow } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";

export function generateStaticParams() {
  return regions.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/areas/[region]">): Promise<Metadata> {
  const r = getRegion((await params).region);
  return r
    ? { title: `Home-improvement specialists in ${r.name}`, description: `Vetted local specialists across ${r.name}.` }
    : {};
}

export default async function RegionPage({ params }: PageProps<"/areas/[region]">) {
  const region = getRegion((await params).region);
  if (!region) notFound();
  const catalogue = await getCatalogue();
  const live = catalogue.filter((s) => s.status === "live" && s.regions.includes(region.slug));
  const soon = catalogue.filter((s) => !live.includes(s));

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid max-w-2xl gap-4">
        <Eyebrow>
          <Link href="/areas" className="text-blue">
            Areas we cover
          </Link>
        </Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">{region.name}</h1>
        <p className="text-lg text-muted">
          We introduce homeowners across {region.name} to vetted local specialists. Choose the start of your postcode to
          begin.
        </p>
      </header>

      <section aria-labelledby="postcodes-heading" className="grid gap-4">
        <h2 id="postcodes-heading" className="text-2xl font-bold">
          Postcode areas
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {region.postcodeAreas.map((a) => (
            <li key={a.code}>
              <Link
                href={`/find-a-specialist?area=${a.code}`}
                className="grid h-full content-start gap-1 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
              >
                <span className="font-display text-2xl font-bold tracking-wide">{a.code}</span>
                <span className="text-[13px] leading-snug text-muted">{a.places}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="services-heading" className="grid gap-4">
        <h2 id="services-heading" className="text-2xl font-bold">
          Services
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {live.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/find-a-specialist/${s.slug}`}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface p-4 text-ink no-underline hover:border-blue"
              >
                <Icon name={s.icon} className="size-8 text-blue" />
                <span className="font-display font-semibold">{s.name}</span>
              </Link>
            </li>
          ))}
          {soon.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/register-interest/${s.slug}`}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line p-4 text-ink no-underline hover:border-solid hover:border-blue"
              >
                <Icon name={s.icon} className="size-8 text-muted" />
                <span className="font-display font-semibold">{s.name}</span>
                <span className="ml-auto rounded-full bg-surface px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Coming soon
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
