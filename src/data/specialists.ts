import type { Specialist } from "@/lib/types";

/**
 * Prototype specialist directory. Every entry is fictional and flagged
 * `isDemo`, and every page or email that shows one labels it as demonstration
 * data. Replace with database records once real specialists are vetted.
 */
export const specialists: Specialist[] = [
  {
    slug: "example-glazing",
    name: "Example Glazing Ltd",
    isDemo: true,
    enquiryEmail: "enquiries@example.com",
    services: ["windows-doors", "conservatory-roofs"],
    areasCovered: ["NE", "DH", "SR", "TD15"],
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
  },
  {
    slug: "sample-home-improvements",
    name: "Sample Home Improvements Ltd",
    isDemo: true,
    enquiryEmail: "enquiries@example.org",
    services: ["windows-doors", "conservatory-roofs"],
    areasCovered: ["DL", "TS"],
    about:
      "A fictional installer covering the south of the region, used for demonstration only. None of these details describe a real business.",
    googleRating: 4.6,
    googleReviewCount: 148,
    checks: [
      { id: "registered_company", passed: true, evidence: "Companies House no. 11111111" },
      { id: "insurance_backed_guarantee", passed: true, evidence: "Provider: Example IBG" },
      { id: "competent_person_scheme", passed: true, evidence: "Scheme: Example scheme" },
      { id: "google_rating", passed: true, evidence: "4.6 from 148 reviews" },
    ],
    checksLastConfirmed: "2026-09-01",
  },
];

/** Shown on the homepage hero as an example of the evidence we display. */
export const demoSpecialist = specialists[0];

export function getSpecialist(slug: string): Specialist | undefined {
  return specialists.find((s) => s.slug === slug);
}
