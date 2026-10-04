import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getService } from "@/config/services";
import { knownPostcodeArea } from "@/config/regions";
import { funnelSlugs, getFunnel } from "@/funnels";
import { Funnel } from "@/components/funnel/Funnel";

export function generateStaticParams() {
  return funnelSlugs.map((service) => ({ service }));
}

export async function generateMetadata({ params }: PageProps<"/find-a-specialist/[service]">): Promise<Metadata> {
  const service = getService((await params).service);
  return { title: service ? `${service.name}: find a specialist` : "Find a specialist", robots: { index: false } };
}

export default async function ServiceFunnelPage({ params, searchParams }: PageProps<"/find-a-specialist/[service]">) {
  const slug = (await params).service;
  const service = getService(slug);
  const config = getFunnel(slug);
  if (!service || service.status !== "live" || !config) notFound();

  return <Funnel service={service} initialArea={knownPostcodeArea((await searchParams).area)} />;
}
