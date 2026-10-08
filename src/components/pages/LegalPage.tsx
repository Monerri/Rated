import { notFound } from "next/navigation";
import { formatDate, getLegalDocument } from "@/lib/content";

export function LegalPage({ slug }: { slug: string }) {
  const doc = getLegalDocument(slug);
  if (!doc) notFound();
  return (
    <article className="mx-auto grid max-w-3xl gap-6 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid gap-3">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[44px]">{doc.title}</h1>
        <p className="font-mono text-[13px] text-muted">Last updated: {formatDate(doc.updated ?? doc.date)}</p>
      </header>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
