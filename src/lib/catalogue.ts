import { services as baseServices } from "@/config/services";
import { getFunnel } from "@/funnels";
import { recordStore } from "@/lib/records";
import type { Service } from "@/lib/types";

/**
 * The service catalogue as it stands right now: the definitions in
 * config/services.ts with any runtime overrides applied. This is what lets a
 * service move from coming soon to live without rebuilding the site.
 * Server only.
 */
export async function getCatalogue(): Promise<Service[]> {
  const overrides = await recordStore.getServiceOverrides();
  return baseServices.map((s) => {
    const o = overrides.find((x) => x.serviceSlug === s.slug);
    if (!o) return s;
    // A service can only be live if its questionnaire exists.
    const status = o.status === "live" && !getFunnel(s.slug) ? "coming_soon" : o.status;
    return { ...s, status, regions: o.regions };
  });
}

export async function getCatalogueService(slug: string): Promise<Service | undefined> {
  return (await getCatalogue()).find((s) => s.slug === slug);
}

export async function getCatalogueLists() {
  const all = await getCatalogue();
  return {
    live: all.filter((s) => s.status === "live"),
    comingSoon: all.filter((s) => s.status === "coming_soon"),
  };
}
