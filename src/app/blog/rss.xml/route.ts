import { getArticles } from "@/lib/content";
import { site } from "@/config/site";

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS feed of published blog posts. */
export function GET() {
  const posts = getArticles("blog").slice(0, 50);
  const items = posts
    .map((p) => {
      const url = `${site.url}/blog/${p.slug}`;
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(`${p.date}T08:00:00Z`).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)} blog</title><link>${site.url}/blog</link><description>${esc(site.tagline)}</description><language>en-gb</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
