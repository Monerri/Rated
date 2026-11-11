import type { Specialist, VettingCheckResult } from "@/lib/types";

/**
 * The illustrative example specialist shown on information pages. It's
 * fictional, flagged `isDemo`, and labelled as an example wherever it
 * appears. Its company number is a placeholder.
 */

const ALL_NE = ["NE", "DH", "SR", "DL", "TS", "TD15"];
const CONFIRMED = "2026-09-01";

function checks(companyNo: string, rating: number, reviews: number, scheme: string | null): VettingCheckResult[] {
  return [
    { id: "registered_company", passed: true, evidence: `Companies House no. ${companyNo}` },
    { id: "insurance_backed_guarantee", passed: true, evidence: "Provider: Example IBG" },
    scheme
      ? { id: "competent_person_scheme", passed: true, evidence: `Scheme: ${scheme}` }
      : {
          id: "competent_person_scheme",
          passed: false,
          evidence: "",
          notApplicableReason: "Not applicable: building control approves the work",
        },
    { id: "google_rating", passed: true, evidence: `${rating.toFixed(1)} from ${reviews} reviews` },
  ];
}

function demo(
  slug: string,
  name: string,
  services: string[],
  areasCovered: string[],
  rating: number,
  reviews: number,
  companyNo: string,
  scheme: string | null,
  about: string,
  extra: Partial<Specialist> = {},
): Specialist {
  return {
    slug,
    name,
    isDemo: true,
    enquiryEmail: `${slug}@example.com`,
    services,
    areasCovered,
    about: `${about} This is a fictional company used for demonstration. None of these details describe a real business.`,
    googleRating: rating,
    googleReviewCount: reviews,
    checks: checks(companyNo, rating, reviews, scheme),
    checksLastConfirmed: CONFIRMED,
    ...extra,
  };
}

/**
 * Specialists defined in code. Empty: the demonstration companies were
 * removed in November 2026, and real specialists are approved on /admin and
 * stored in the database (see lib/specialistDirectory.ts).
 */
export const specialists: Specialist[] = [];

/**
 * A fictional example, shown on the homepage, How it works and How we check
 * to illustrate the evidence we display. Never matched or sent leads, and
 * labelled as an example wherever it appears.
 */
export const demoSpecialist: Specialist = demo(
  "example-glazing",
  "Example Glazing Ltd",
  ["windows-doors", "conservatory-roofs"],
  ALL_NE,
  4.7,
  212,
  "00000001",
  "Example scheme",
  "A family-run window, door and conservatory installer.",
);

export function getSpecialist(slug: string): Specialist | undefined {
  return specialists.find((s) => s.slug === slug);
}
