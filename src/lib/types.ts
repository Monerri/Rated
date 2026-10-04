/**
 * Domain types shared by the site, the API routes and (later) the database.
 * Field names mirror the planned Supabase tables so records can be persisted
 * without reshaping.
 */

export type ServiceStatus = "live" | "coming_soon";

export type IconName =
  | "window"
  | "door"
  | "backdoor"
  | "french"
  | "sliding"
  | "bifold"
  | "unsure"
  | "windows-doors"
  | "conservatory-roof"
  | "solar-battery"
  | "heat-pump"
  | "ev-charging"
  | "insulation";

export interface Service {
  /** URL-safe identifier, used in routes and stored on every record. */
  slug: string;
  name: string;
  /** One line shown on service cards. */
  summary: string;
  icon: IconName;
  status: ServiceStatus;
  /** Region slugs where the service is live. Ignored while coming soon. */
  regions: string[];
}

export interface PostcodeArea {
  /** Outward postcode area, for example "NE". */
  code: string;
  /** Familiar places, to help people recognise their area. */
  places: string;
}

export interface Region {
  slug: string;
  name: string;
  /** Postcode areas offered as quick choices, in order of importance. */
  postcodeAreas: PostcodeArea[];
}

/** Where a visitor came from. Captured on every record for the audit trail. */
export interface SourceInfo {
  referrer: string | null;
  landingPath: string | null;
  utm: Partial<Record<"source" | "medium" | "campaign" | "term" | "content", string>>;
}

/**
 * A single consent, stored with the exact wording the person saw.
 * One record per purpose: there is never a blanket consent.
 */
export interface ConsentRecord {
  purpose: "share_with_specialist" | "notify_service_available" | "retain_progress";
  serviceSlug: string;
  wordingId: string;
  wording: string;
  given: boolean;
  givenAt: string;
}

/** Someone asking to hear when a coming-soon service goes live. Not an enquiry. */
export interface InterestRegistration {
  kind: "interest_registration";
  serviceSlug: string;
  firstName: string;
  email: string;
  postcodeArea: string | null;
  consent: ConsentRecord;
  source: SourceInfo;
  createdAt: string;
}

/** The checks a specialist must pass. New checks are added here, not hard-coded in pages. */
export type VettingCheckId =
  | "registered_company"
  | "insurance_backed_guarantee"
  | "competent_person_scheme"
  | "google_rating";

export interface VettingCheckResult {
  id: VettingCheckId;
  passed: boolean;
  /** Evidence shown to homeowners, for example a company number or scheme name. */
  evidence: string;
  /** Present when a check does not apply to this specialist's work. */
  notApplicableReason?: string;
}

export interface Specialist {
  slug: string;
  name: string;
  isDemo: boolean;
  services: string[];
  areasCovered: string[];
  about: string;
  googleRating: number;
  googleReviewCount: number;
  checks: VettingCheckResult[];
  /** ISO date the checks were last confirmed. */
  checksLastConfirmed: string;
}
