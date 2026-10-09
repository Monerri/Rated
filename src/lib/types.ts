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
  | "extension"
  | "roof"
  | "single-storey"
  | "two-storey"
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
  /** Outward codes covered outside those areas, for example TD15 (Berwick-upon-Tweed). */
  extraOutwardCodes?: string[];
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
  /** Unguessable token used in the unsubscribe link. */
  token: string;
  serviceSlug: string;
  firstName: string;
  email: string;
  postcodeArea: string | null;
  /** Full postcode, when given (for example by someone outside the areas we cover). */
  postcode: string | null;
  consent: ConsentRecord;
  source: SourceInfo;
  createdAt: string;
  /** When we sent the one "now available" email this consent covers. */
  notifiedAt: string | null;
  unsubscribedAt: string | null;
}

/** A change to a service's availability made at runtime, without a rebuild. */
export interface ServiceOverride {
  serviceSlug: string;
  status: ServiceStatus;
  regions: string[];
  changedAt: string;
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
  /** Where enquiries are sent. */
  enquiryEmail: string;
  services: string[];
  areasCovered: string[];
  about: string;
  googleRating: number;
  googleReviewCount: number;
  checks: VettingCheckResult[];
  /** ISO date the checks were last confirmed. */
  checksLastConfirmed: string;
}

/** A homeowner's request to be put in touch with a specialist. */
export interface Enquiry {
  kind: "enquiry";
  id: string;
  serviceSlug: string;
  /** Raw answers to the visible questions, by question id. */
  answers: Record<string, string | string[]>;
  /** Snapshot of the questions and answers as worded at the time. */
  summary: { questionId: string; label: string; value: string }[];
  postcode: string;
  regionSlug: string;
  contact: { firstName: string; lastName: string; email: string; phone: string };
  consent: ConsentRecord;
  source: SourceInfo;
  createdAt: string;
  /** How many specialists the homeowner asked to hear from (1 to 3). */
  specialistsRequested: number;
  /** The specialists introduced. Can be fewer than requested if fewer cover the area. */
  matchedSpecialistSlugs: string[];
  /** When the homeowner was emailed the specialists' details. */
  customerNotifiedAt: string | null;
  /** When each specialist was sent the enquiry. Always after customerNotifiedAt. */
  specialistNotifications: { slug: string; notifiedAt: string }[];
}

/** Answers saved by someone who isn't ready yet. Deleted on request. */
export interface SavedProgress {
  kind: "saved_progress";
  /** Unguessable token used in resume and delete links. */
  token: string;
  serviceSlug: string;
  answers: Record<string, string | string[]>;
  email: string;
  consent: ConsentRecord;
  source: SourceInfo;
  createdAt: string;
}

/** The parts of a specialist record that may be shown to homeowners. */
export type PublicSpecialist = Pick<
  Specialist,
  "slug" | "name" | "isDemo" | "services" | "googleRating" | "checks" | "checksLastConfirmed"
>;

/** A business asking to be considered for the network. Not an approval. */
export interface SupplierApplication {
  kind: "supplier_application";
  id: string;
  status: "received" | "under_review" | "accepted" | "declined";
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  mainService: string;
  areasCovered: string[];
  otherAreas: string | null;
  companiesHouseNumber: string;
  competentPersonScheme: string;
  insuranceBackedGuaranteeProvider: string;
  googleProfileUrl: string;
  description: string;
  anythingElse: string | null;
  /** The confirmation the applicant ticked, stored word for word. */
  declaration: { wordingId: string; wording: string; givenAt: string };
  source: SourceInfo;
  createdAt: string;
}
