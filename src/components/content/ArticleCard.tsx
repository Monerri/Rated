import Link from "next/link";
import type { Article } from "@/lib/content";
import { formatDate } from "@/lib/content";

export function ArticleCard({ article, showDate = false }: { article: Article; showDate?: boolean }) {
  return (
    <Link
      href={`/${article.collection}/${article.slug}`}
      className="grid h-full content-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
    >
      <span className="font-mono text-xs text-muted">
        {showDate ? `${formatDate(article.date)} · ` : ""}
        {article.readingMinutes} min read
      </span>
      <h3 className="text-lg font-bold">{article.title}</h3>
      <p className="text-[15px] text-muted">{article.description}</p>
    </Link>
  );
}
