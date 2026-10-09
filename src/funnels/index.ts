import type { FunnelConfig } from "@/funnels/types";
import { windowsDoorsFunnel } from "@/funnels/windows-doors";
import { conservatoryRoofsFunnel } from "@/funnels/conservatory-roofs";
import { extensionsFunnel } from "@/funnels/extensions";
import { roofingFunnel } from "@/funnels/roofing";

/**
 * Questionnaires by service slug. A live service needs an entry here.
 * Adding a service is a new config file plus one line below.
 */
const funnels: Record<string, FunnelConfig> = {
  [windowsDoorsFunnel.serviceSlug]: windowsDoorsFunnel,
  [conservatoryRoofsFunnel.serviceSlug]: conservatoryRoofsFunnel,
  [extensionsFunnel.serviceSlug]: extensionsFunnel,
  [roofingFunnel.serviceSlug]: roofingFunnel,
};

export function getFunnel(serviceSlug: string): FunnelConfig | undefined {
  return funnels[serviceSlug];
}

export const funnelSlugs = Object.keys(funnels);
