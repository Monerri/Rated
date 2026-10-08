import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/content";
import { ArticleView, pickRelated } from "@/components/content/ArticleView";

/** Hourly, so scheduled posts go live on their date without a deploy. */
export const revalidate = 3600;

export function generateStaticParams() {
  return getArticles("blog").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const p = getArticle("blog", (await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.description,
      url: `/blog/${p.slug}`,
      publishedTime: p.date,
      modifiedTime: p.updated ?? p.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const p = getArticle("blog", (await params).slug);
  if (!p) notFound();
  return <ArticleView article={p} related={pickRelated(p, [...getArticles("blog"), ...getArticles("guides")])} />;
}
