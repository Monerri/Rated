import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Guides and blog posts are Markdown files in /content. Adding a file adds a
 * page. Posts dated in the future stay hidden until that date, so a week of
 * posts can be committed at once and appear one a day. Server only.
 */

export type Collection = "guides" | "blog" | "legal";

export interface Article {
  collection: Collection;
  slug: string;
  title: string;
  description: string;
  /** ISO date the article is (or will be) published. */
  date: string;
  /** ISO date of the last meaningful update, if any. */
  updated: string | null;
  /** Related service slug, used for cross-links. */
  service: string | null;
  tags: string[];
  author: string;
  readingMinutes: number;
  /** Display order for guides (lower first). */
  order: number;
  html: string;
}

const ROOT = path.join(process.cwd(), "content");

function toIsoDate(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function readArticle(collection: Collection, file: string): Article {
  const raw = fs.readFileSync(path.join(ROOT, collection, file), "utf8");
  const { data, content } = matter(raw);
  const slug = file.replace(/\.md$/, "");
  const date = toIsoDate(data.date);
  if (!data.title || !data.description || !date) {
    throw new Error(`content/${collection}/${file}: title, description and date are required`);
  }
  const words = content.split(/\s+/).filter(Boolean).length;
  return {
    collection,
    slug,
    title: String(data.title),
    description: String(data.description),
    date,
    updated: toIsoDate(data.updated),
    service: data.service ? String(data.service) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: data.author ? String(data.author) : "The Vetted North team",
    readingMinutes: Math.max(1, Math.round(words / 220)),
    order: typeof data.order === "number" ? data.order : 100,
    html: marked.parse(content, { async: false }),
  };
}

function isPublished(a: Article, now: Date): boolean {
  return new Date(`${a.date}T00:00:00Z`) <= now;
}

/** Published articles in a collection. Guides by `order`, blog posts newest first. */
export function getArticles(collection: Collection, now = new Date()): Article[] {
  const dir = path.join(ROOT, collection);
  if (!fs.existsSync(dir)) return [];
  const all = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => readArticle(collection, f))
    .filter((a) => isPublished(a, now));
  return collection === "guides"
    ? all.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    : all.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export function getArticle(collection: Collection, slug: string, now = new Date()): Article | null {
  return getArticles(collection, now).find((a) => a.slug === slug) ?? null;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A single document from content/legal (privacy, terms). Not date-filtered. */
export function getLegalDocument(slug: string): Article | null {
  const file = path.join(ROOT, "legal", `${slug}.md`);
  return fs.existsSync(file) ? readArticle("legal", `${slug}.md`) : null;
}
