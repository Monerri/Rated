import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getService } from "@/config/services";
import { getArticles } from "@/lib/content";
import { getCatalogue, getCatalogueService } from "@/lib/catalogue";
import { Icon } from "@/components/ui/Icon";
import { InterestForm } from "@/components/interest/InterestForm";

/** Pre-built for coming-soon services. Live services redirect to their questionnaire (see next.config.ts). */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCatalogue()).filter((s) => s.status !== "live").map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/register-interest/[service]">): Promise<Metadata> {
  const service = getService((await params).service);
  return {
    title: service ? `${service.name}: coming soon` : "Register interest",
    description: service
      ? `${service.name} is coming soon. Leave your details and we'll email you once when it's available in your area.`
      : undefined,
  };
}

/**
 * Full-page register-interest form, for links from guides, adverts and
 * people without JavaScript. Live services go straight to the questionnaire.
 */
export default async function RegisterInterestPage({ params }: PageProps<"/register-interest/[service]">) {
  const slug = (await params).service;
  const service = await getCatalogueService(slug);
  if (!service) notFound();
  if (service.status === "live") notFound();

  const related = getArticles("guides").filter((g) => g.service === slug);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_0.8fr] md:py-16">
      <div className="grid content-start gap-6">
        <Icon name={service.icon} className="size-12 text-blue" />
        <InterestForm service={service} headingLevel="h1" />
      </div>

      <aside className="grid content-start gap-5 md:pt-16">
        <section className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">What happens when you register</h2>
          <ul className="grid list-disc gap-2 pl-5 text-[15px]">
            <li>We email you once to confirm, with a link to unsubscribe.</li>
            <li>When {service.name} is available in your area, we email you once more.</li>
            <li>Nobody contacts you and we don&apos;t share your details. If you decide to go ahead then, you start an enquiry yourself.</li>
          </ul>
        </section>
        {related.length > 0 && (
          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Read up in the meantime</h2>
            <ul className="grid gap-2">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="font-display font-semibold text-blue">
                    {g.title}
                  </Link>
                  <p className="text-[15px] text-muted">{g.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
