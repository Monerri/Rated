import type { VettingCheckId } from "@/lib/types";

export interface VettingCheckDefinition {
  id: VettingCheckId;
  title: string;
  /** Plain-English explanation for homeowners. */
  summary: string;
}

/**
 * The current consumer-facing baseline. Order is the display order.
 * Add a check here (and to VettingCheckId) to extend the standard.
 */
export const vettingChecks: VettingCheckDefinition[] = [
  {
    id: "registered_company",
    title: "Registered company",
    summary: "We check that businesses are properly registered.",
  },
  {
    id: "insurance_backed_guarantee",
    title: "Insurance-backed guarantee",
    summary: "We check that appropriate insurance-backed protection is available for qualifying work.",
  },
  {
    id: "competent_person_scheme",
    title: "Competent Person Scheme",
    summary: "Where relevant, we check registration with an appropriate Competent Person Scheme.",
  },
  {
    id: "google_rating",
    title: "Google rating",
    summary: "We look for businesses with a Google rating above four stars.",
  },
];
