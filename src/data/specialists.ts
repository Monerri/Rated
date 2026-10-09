import type { Specialist, VettingCheckResult } from "@/lib/types";

/**
 * Prototype specialist directory. Every entry is fictional and flagged
 * `isDemo`, and every page or email that shows one labels it as demonstration
 * data. Company numbers are placeholders. Replace with database records once
 * real specialists are vetted.
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
  };
}

export const specialists: Specialist[] = [
  // Windows, doors and conservatory roofs
  demo("example-glazing", "Example Glazing Ltd", ["windows-doors", "conservatory-roofs"], ["NE", "DH", "SR", "TD15"], 4.7, 212, "00000001", "Example scheme", "A family-run window, door and conservatory installer."),
  demo("sample-home-improvements", "Sample Home Improvements Ltd", ["windows-doors", "conservatory-roofs"], ["DL", "TS"], 4.6, 148, "00000002", "Example scheme", "An installer covering the south of the region."),
  demo("demo-windows-conservatories", "Demo Windows & Conservatories Ltd", ["windows-doors", "conservatory-roofs"], ALL_NE, 4.5, 96, "00000003", "Example scheme", "A regional installer of windows, doors and conservatory roofs."),
  demo("illustrative-glazing", "Illustrative Glazing Co Ltd", ["windows-doors"], ["NE", "SR", "DL", "TS"], 4.8, 61, "00000004", "Example scheme", "A small specialist in replacement windows and composite doors."),
  // Extensions
  demo("example-extensions", "Example Extensions Ltd", ["extensions"], ALL_NE, 4.6, 87, "00000005", null, "A builder specialising in single and two-storey extensions."),
  demo("sample-build-extend", "Sample Build & Extend Ltd", ["extensions"], ["NE", "DH", "SR", "TS"], 4.7, 133, "00000006", null, "A design-and-build extension company."),
  demo("demo-builders", "Demo Builders Ltd", ["extensions"], ["NE", "DL", "TS"], 4.4, 52, "00000007", null, "A general builder with an in-house extensions team."),
  // Roofing
  demo("example-roofing", "Example Roofing Ltd", ["roofing"], ALL_NE, 4.8, 174, "00000008", "Example roofing scheme", "Pitched and flat roof replacement and repairs."),
  demo("demo-roofline", "Demo Roofline Ltd", ["roofing"], ["NE", "DH", "DL", "TS"], 4.5, 79, "00000009", "Example roofing scheme", "Re-roofing, fascias, soffits and guttering."),
  demo("sample-slate-tile", "Sample Slate & Tile Ltd", ["roofing"], ["NE", "SR", "TS", "TD15"], 4.6, 58, "00000010", "Example roofing scheme", "Slate and tile roofing, including period homes."),
];

/** Shown on the homepage hero as an example of the evidence we display. */
export const demoSpecialist = specialists[0];

export function getSpecialist(slug: string): Specialist | undefined {
  return specialists.find((s) => s.slug === slug);
}
