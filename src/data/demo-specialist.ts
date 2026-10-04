import type { Specialist } from "@/lib/types";

/**
 * Fictional company used to demonstrate how evidence is displayed.
 * Every page that shows it must label it as demonstration data.
 */
export const demoSpecialist: Specialist = {
  slug: "example-glazing",
  name: "Example Glazing Ltd",
  isDemo: true,
  services: ["windows-doors", "conservatory-roofs"],
  areasCovered: ["NE", "DH", "SR"],
  about:
    "A fictional family-run installer used to show how a specialist profile will look. None of these details describe a real business.",
  googleRating: 4.7,
  googleReviewCount: 212,
  checks: [
    { id: "registered_company", passed: true, evidence: "Companies House no. 00000000" },
    { id: "insurance_backed_guarantee", passed: true, evidence: "Provider: Example IBG" },
    { id: "competent_person_scheme", passed: true, evidence: "Scheme: Example scheme" },
    { id: "google_rating", passed: true, evidence: "4.7 from 212 reviews" },
  ],
  checksLastConfirmed: "2026-09-01",
};
