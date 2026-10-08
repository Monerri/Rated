import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/content";
import { ArticleView, pickRelated } from "@/components/content/ArticleView";

export function generateStaticParams() {
  return getArticles("guides").map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = getArticle("guides", (await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, url: `/guides/${g.slug}` },
  };
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const g = getArticle("guides", (await params).slug);
  if (!g) notFound();
  return <ArticleView article={g} related={pickRelated(g, [...getArticles("guides"), ...getArticles("blog")])} />;
}
