import type { Metadata } from "next";
import Link from "next/link";
import { regions } from "@/config/regions";
import { Eyebrow } from "@/components/ui/Section";
import { ArrowIcon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Areas we cover",
  description: "Where we currently introduce vetted home-improvement specialists.",
};

export default function AreasPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid gap-4">
        <Eyebrow>Areas we cover</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Where we work</h1>
        <p className="text-lg text-muted">We&apos;re starting in one region and will expand as we build our network.</p>
      </header>
      <ul className="grid gap-4">
        {regions.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/areas/${r.slug}`}
              className="grid gap-2 rounded-[var(--radius-panel)] border-[1.5px] border-line bg-surface p-6 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
            >
              <h2 className="text-2xl font-bold">{r.name}</h2>
              <p className="text-muted">Postcode areas {r.postcodeAreas.map((a) => a.code).join(", ")}</p>
              <span className="inline-flex items-center gap-1.5 font-display font-semibold text-blue">
                See services in {r.name} <ArrowIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-muted">
        Somewhere else? Start a{" "}
        <Link href="/find-a-specialist" className="text-blue">
          search
        </Link>{" "}
        and choose &quot;Elsewhere&quot;. If we don&apos;t cover your postcode yet, you can ask us to let you know when we
        do.
      </p>
    </div>
  );
}
