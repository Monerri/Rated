import type { FunnelConfig } from "@/funnels/types";
import { standardQuestions } from "@/funnels/shared";
import { windowsDoorsFunnel } from "@/funnels/windows-doors";
import { conservatoryRoofsFunnel } from "@/funnels/conservatory-roofs";
import { extensionsFunnel } from "@/funnels/extensions";
import { roofingFunnel } from "@/funnels/roofing";

/**
 * Adds the questions every questionnaire must ask (do you own the property,
 * home or business) straight after its first question, so no current or
 * future questionnaire can leave them out.
 */
function withStandardQuestions(config: FunnelConfig): FunnelConfig {
  const own = config.questions.filter((q) => !standardQuestions.some((s) => s.id === q.id));
  return { ...config, questions: [own[0], ...standardQuestions, ...own.slice(1)] };
}

/**
 * Questionnaires by service slug. A live service needs an entry here.
 * Adding a service is a new config file plus one line below.
 */
const funnels: Record<string, FunnelConfig> = Object.fromEntries(
  [windowsDoorsFunnel, conservatoryRoofsFunnel, extensionsFunnel, roofingFunnel].map((f) => [
    f.serviceSlug,
    withStandardQuestions(f),
  ]),
);

export function getFunnel(serviceSlug: string): FunnelConfig | undefined {
  return funnels[serviceSlug];
}

export const funnelSlugs = Object.keys(funnels);
