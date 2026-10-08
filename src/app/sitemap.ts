import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getArticles } from "@/lib/content";
import { regions } from "@/config/regions";
import { specialists } from "@/data/specialists";
import { getCatalogue } from "@/lib/catalogue";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (path: string) => `${site.url}${path}`;
  const staticPages = [
    "/",
    "/find-a-specialist",
    "/how-it-works",
    "/how-we-check",
    "/specialists",
    "/areas",
    "/about",
    "/guides",
    "/blog",
    "/for-suppliers",
    "/contact",
    "/privacy",
    "/terms",
  ].map((p) => ({ url: u(p) }));

  const catalogue = await getCatalogue();
  const servicePages = catalogue.map((s) =>
    s.status === "live" ? { url: u(`/find-a-specialist/${s.slug}`) } : { url: u(`/register-interest/${s.slug}`) },
  );

  return [
    ...staticPages,
    ...servicePages,
    ...regions.map((r) => ({ url: u(`/areas/${r.slug}`) })),
    // Demonstration profiles are excluded from search engines.
    ...specialists.filter((s) => !s.isDemo).map((s) => ({ url: u(`/specialists/${s.slug}`) })),
    ...getArticles("guides").map((a) => ({ url: u(`/guides/${a.slug}`), lastModified: a.updated ?? a.date })),
    ...getArticles("blog").map((a) => ({ url: u(`/blog/${a.slug}`), lastModified: a.updated ?? a.date })),
  ];
}
