import type { FunnelConfig } from "@/funnels/types";
import { windowsDoorsFunnel } from "@/funnels/windows-doors";

/**
 * Questionnaires by service slug. A live service needs an entry here.
 * Adding a service is a new config file plus one line below.
 */
const funnels: Record<string, FunnelConfig> = {
  [windowsDoorsFunnel.serviceSlug]: windowsDoorsFunnel,
};

export function getFunnel(serviceSlug: string): FunnelConfig | undefined {
  return funnels[serviceSlug];
}

export const funnelSlugs = Object.keys(funnels);
