import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getService } from "@/config/services";
import { knownPostcodeArea } from "@/config/regions";
import { getFunnel } from "@/funnels";
import { getCatalogueLists, getCatalogueService } from "@/lib/catalogue";
import { Funnel } from "@/components/funnel/Funnel";

export async function generateMetadata({ params }: PageProps<"/find-a-specialist/[service]">): Promise<Metadata> {
  const service = getService((await params).service);
  return { title: service ? `${service.name}: find a specialist` : "Find a specialist", robots: { index: false } };
}

export default async function ServiceFunnelPage({ params, searchParams }: PageProps<"/find-a-specialist/[service]">) {
  const slug = (await params).service;
  const service = await getCatalogueService(slug);
  if (!service) notFound();
  // Not live yet: offer to register interest instead of starting an enquiry.
  if (service.status !== "live" || !getFunnel(slug)) redirect(`/register-interest/${slug}`);

  const { comingSoon } = await getCatalogueLists();
  return (
    <Funnel
      service={service}
      comingSoon={comingSoon}
      initialArea={knownPostcodeArea((await searchParams).area)}
    />
  );
}
