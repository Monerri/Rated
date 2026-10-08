import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getService } from "@/config/services";
import { getFunnel } from "@/funnels";
import { getCatalogue, getCatalogueLists, getCatalogueService } from "@/lib/catalogue";
import { Funnel } from "@/components/funnel/Funnel";

/** Only live services with a questionnaire get a page. Coming-soon ones redirect (see next.config.ts). */
export const dynamicParams = false;

export async function generateStaticParams() {
  const catalogue = await getCatalogue();
  return catalogue.filter((s) => s.status === "live" && getFunnel(s.slug)).map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/find-a-specialist/[service]">): Promise<Metadata> {
  const service = getService((await params).service);
  return { title: service ? `${service.name}: find a specialist` : "Find a specialist", robots: { index: false } };
}

export default async function ServiceFunnelPage({ params }: PageProps<"/find-a-specialist/[service]">) {
  const service = await getCatalogueService((await params).service);
  if (!service || service.status !== "live") notFound();
  const { comingSoon } = await getCatalogueLists();
  return <Funnel service={service} comingSoon={comingSoon} />;
}
