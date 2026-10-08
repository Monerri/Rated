import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/content";
import { Eyebrow } from "@/components/ui/Section";
import { ArticleCard } from "@/components/content/ArticleCard";

/** Hourly, so posts scheduled for today appear without a deploy. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical, timely advice on improving your home in North East England.",
  alternates: { canonical: "/blog" },
};

const PAGE_SIZE = 12;

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const posts = getArticles("blog");
  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const requested = Number((await searchParams).page ?? 1);
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pages ? requested : 1;
  const shown = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid max-w-2xl gap-4">
        <Eyebrow>Blog</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Advice for your home</h1>
        <p className="text-lg text-muted">
          Short, practical pieces on improving your home. For in-depth explanations, see our{" "}
          <Link href="/guides" className="text-blue">
            guides
          </Link>
          .
        </p>
      </header>

      {shown.length === 0 ? (
        <p className="text-muted">No posts yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug}>
              <ArticleCard article={p} showDate />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Blog pages" className="flex items-center gap-4">
          {page > 1 && (
            <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`} className="font-display font-semibold text-blue">
              ← Newer posts
            </Link>
          )}
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={`/blog?page=${page + 1}`} className="font-display font-semibold text-blue">
              Older posts →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
