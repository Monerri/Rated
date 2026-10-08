import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex, blogPageCount } from "@/components/content/BlogIndex";

export const dynamicParams = false;

/** Pages 2 onwards. Page 1 is /blog. */
export function generateStaticParams() {
  const pages = blogPageCount();
  // Next.js needs at least one entry; page "1" here is unused and returns a 404.
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) })) : [{ n: "1" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/page/[n]">): Promise<Metadata> {
  const { n } = await params;
  return { title: `Blog: page ${n}`, alternates: { canonical: `/blog/page/${n}` } };
}

export default async function BlogPaginatedPage({ params }: PageProps<"/blog/page/[n]">) {
  const page = Number((await params).n);
  if (!Number.isInteger(page) || page < 2 || page > blogPageCount()) notFound();
  return <BlogIndex page={page} />;
}
