import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/content";
import { services } from "@/config/services";
import { Eyebrow } from "@/components/ui/Section";
import { ArticleCard } from "@/components/content/ArticleCard";

export const metadata: Metadata = {
  title: "Guides",
  description: "Plain-English guides to help you make good decisions about improving your home.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  const guides = getArticles("guides");
  const groups = services
    .map((s) => ({ service: s, items: guides.filter((g) => g.service === s.slug) }))
    .filter((g) => g.items.length > 0);
  const ungrouped = guides.filter((g) => !g.service || !services.some((s) => s.slug === g.service));

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid max-w-2xl gap-4">
        <Eyebrow>Guides</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Understand your options first</h1>
        <p className="text-lg text-muted">
          Plain-English guides to help you make a good decision, whether or not you use us. For shorter, timely pieces,
          see our{" "}
          <Link href="/blog" className="text-blue">
            blog
          </Link>
          .
        </p>
      </header>

      {groups.map(({ service, items }) => (
        <section key={service.slug} aria-labelledby={`g-${service.slug}`} className="grid gap-4">
          <h2 id={`g-${service.slug}`} className="text-2xl font-bold">
            {service.name}
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((g) => (
              <li key={g.slug}>
                <ArticleCard article={g} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {ungrouped.length > 0 && (
        <section aria-labelledby="g-other" className="grid gap-4">
          <h2 id="g-other" className="text-2xl font-bold">
            More guides
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ungrouped.map((g) => (
              <li key={g.slug}>
                <ArticleCard article={g} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
