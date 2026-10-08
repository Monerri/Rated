import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate } from "@/lib/content";
import { getCatalogueService } from "@/lib/catalogue";
import { site } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon, Icon } from "@/components/ui/Icon";

/** Shared layout for guides and blog posts. */
export async function ArticleView({ article, related }: { article: Article; related: Article[] }) {
  const service = article.service ? await getCatalogueService(article.service) : undefined;
  const section = article.collection === "guides" ? { href: "/guides", label: "Guides" } : { href: "/blog", label: "Blog" };
  const url = `${site.url}/${article.collection}/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.collection === "blog" ? "BlogPosting" : "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: url,
  };

  return (
    <article className="mx-auto grid max-w-3xl gap-8 px-4 py-10 sm:px-6 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="grid gap-4">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href={section.href} className="text-blue">
            {section.label}
          </Link>{" "}
          / <span aria-current="page">{article.title}</span>
        </nav>
        <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[44px]">{article.title}</h1>
        <p className="text-xl text-muted">{article.description}</p>
        <p className="font-mono text-[13px] text-muted">
          {article.collection === "blog" ? `${formatDate(article.date)} · ` : ""}
          {article.readingMinutes} min read
          {article.updated ? ` · Updated ${formatDate(article.updated)}` : ""}
        </p>
      </header>

      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.html }} />

      {service && (
        <aside className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-5 sm:grid-cols-[48px_1fr] sm:items-start sm:p-6">
          <Icon name={service.icon} className="size-10 text-blue" />
          <div className="grid justify-items-start gap-3">
            {service.status === "live" ? (
              <>
                <p className="font-display text-lg font-bold">Thinking about {service.name.toLowerCase()}?</p>
                <p className="text-muted">
                  Answer a few questions and we&apos;ll match you with one vetted local specialist. We&apos;ll tell you
                  who it is before they get in touch.
                </p>
                <ButtonLink href={`/find-a-specialist/${service.slug}`}>
                  Find a specialist <ArrowIcon />
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-bold">{service.name} is coming soon</p>
                <p className="text-muted">We&apos;re building our network. Leave your details and we&apos;ll let you know when it&apos;s available.</p>
                <ButtonLink href={`/register-interest/${service.slug}`} variant="secondary">
                  Register your interest
                </ButtonLink>
              </>
            )}
          </div>
        </aside>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="grid gap-4 border-t border-line pt-8">
          <h2 id="related-heading" className="text-xl font-bold">
            Read next
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={`${r.collection}-${r.slug}`}>
                <Link
                  href={`/${r.collection}/${r.slug}`}
                  className="grid h-full gap-1 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
                >
                  <span className="font-display font-bold">{r.title}</span>
                  <span className="text-sm text-muted">{r.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** Up to `n` other articles, preferring ones about the same service. */
export function pickRelated(article: Article, pool: Article[], n = 2): Article[] {
  const others = pool.filter((a) => !(a.collection === article.collection && a.slug === article.slug));
  const same = others.filter((a) => article.service && a.service === article.service);
  const rest = others.filter((a) => !same.includes(a));
  return [...same, ...rest].slice(0, n);
}
