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
  | "new-build"
  | "loft"
  | "architecture"
  | "bathroom"
  | "kitchen"
  | "garden"
  | "flooring"
  | "plumbing"
  | "electrical"
  | "security"
  | "air-con"
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
  /**
   * Postcode areas or districts covered ("NE", "TD15"). Used when a
   * specialist has no base and radius, and as a fallback when a postcode's
   * location can't be looked up.
   */
  areasCovered: string[];
  /** Where they work: a base and a travel radius (capped in config/coverage.ts). */
  coverage?: SpecialistCoverage;
  about: string;
  googleRating: number;
  googleReviewCount: number;
  checks: VettingCheckResult[];
  /** ISO date the checks were last confirmed. */
  checksLastConfirmed: string;
  /** Services for which they don't want discounted "in 3 to 6 months" leads. */
  skipLaterLeadsFor?: string[];
  /** Per service, the kinds of job they take (see FunnelConfig.leadTypes). Missing means all. */
  leadTypes?: Record<string, string[]>;
  /** For specialists approved on /admin (stored in the database). Absent for demo specialists. */
  onboarding?: SpecialistOnboarding;
}

/** Who did something on /admin. The owner can do everything; an assistant can't pay out or forfeit credits. */
export type AdminRole = "owner" | "assistant";

/** A specialist's agreement to the Specialist terms, stored word for word. */
export interface TermsAcceptance {
  /** The date of the terms version agreed to (config/suppliers.ts specialistTermsVersion). */
  version: string;
  wordingId: string;
  wording: string;
  /** The person who agreed, on the business's behalf. */
  acceptedByName: string;
  acceptedAt: string;
}

/**
 * How a specialist joined. They're approved on /admin after their checks,
 * then sent a link to accept the Specialist terms. Only once they've
 * accepted are they "active" and considered for leads.
 */
export interface SpecialistOnboarding {
  status: "awaiting_terms" | "active";
  /** The application they came from, if any. */
  applicationId: string | null;
  contactName: string;
  phone: string;
  googleProfileUrl: string | null;
  /** What was checked for each of our checks, for our records (never shown to homeowners). */
  checkNotes: { company: string; guarantee: string; scheme: string; google: string };
  checkedBy: AdminRole;
  /** The reference they use on bank transfers, for example VN-REALFLOORS. Unique. */
  paymentReference?: string;
  approvedAt: string;
  approvedBy: AdminRole;
  updatedAt: string;
  updatedBy: AdminRole;
  /** The latest terms link sent. The token is only valid until `expiresAt`. */
  termsInvite: { token: string; sentAt: string; expiresAt: string; sentBy: AdminRole } | null;
  terms: TermsAcceptance | null;
}

/**
 * One line in a specialist's prepaid account. Never edited or deleted: a
 * correction is a new line. The balance is the sum of all lines.
 * Amounts are in whole credits (one credit is worth £1); credits in are
 * positive, a lead is negative.
 * - topup: credits bought; `paidPence` is the money received
 * - bonus: extra credits for a larger top-up; never paid out as cash
 * - promo: free credits we give (for example founding credits); no money
 *   received, never paid out, and used before bought credits
 * - lead, refund: a lead charged, or its credits given back
 * - adjustment: a correction, either way; free credits have no cash value
 * - forfeit: unused credits removed after a leaver's hold period
 * - payout: unused credits refunded as cash when we stop introducing
 *   someone; `paidPence` is the money paid back
 */
export interface LedgerEntry {
  id: string;
  supplierSlug: string;
  createdAt: string;
  kind: "topup" | "bonus" | "promo" | "lead" | "refund" | "adjustment" | "forfeit" | "payout";
  amountCredits: number;
  /** Money in (topup) or out (payout), in pence. Null for every other kind. */
  paidPence?: number | null;
  enquiryId: string | null;
  note: string;
}

/**
 * A manual on/off switch for a specialist's listing. Never edited or deleted:
 * the latest line for a specialist is their current setting. No line means on.
 */
export interface ListingSwitch {
  id: string;
  supplierSlug: string;
  createdAt: string;
  on: boolean;
  note: string;
}

/** A lead a specialist wasn't considered for because their balance was too low. */
export interface MissedLead {
  id: string;
  supplierSlug: string;
  enquiryId: string;
  serviceSlug: string;
  area: string;
  priceCredits: number;
  createdAt: string;
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
  /** Price per specialist for this lead, in credits. Demo specialists aren't charged. */
  priceCredits?: number;
  /** When we emailed the homeowner to ask how it went (once, about two weeks later). */
  feedbackRequestedAt?: string | null;
}

/** What a homeowner told us about one specialist we introduced. */
export interface SpecialistFeedback {
  contacted: "yes" | "no" | "not-yet";
  /** 1 to 5, or null if they didn't rate. */
  rating: number | null;
  comment: string | null;
  /** Permission to quote the comment, with the exact wording agreed to. */
  publishConsent: { wordingId: string; wording: string; givenAt: string } | null;
}

/** One feedback request, sent once per enquiry. Responses are added when the homeowner answers. */
export interface FeedbackRequest {
  kind: "feedback";
  /** Unguessable token used in the feedback link. */
  token: string;
  enquiryId: string;
  serviceSlug: string;
  firstName: string;
  /** Postcode area only, for attributing a published comment ("Sam, NE"). */
  area: string;
  specialistSlugs: string[];
  createdAt: string;
  respondedAt: string | null;
  responses: Record<string, SpecialistFeedback>;
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

export interface SpecialistCoverage {
  /** Their base, as a postcode or district, for example "DH1 3AA" or "DH1". */
  basePostcode: string;
  /** The base's location, looked up once when the specialist is added. */
  lat: number;
  lng: number;
  radiusMiles: number;
  /** Postcode areas or districts inside the radius they don't want, for example ["TD", "DG"]. */
  excluded?: string[];
}

/** The parts of a specialist record that may be shown to homeowners. */
export type PublicSpecialist = Pick<
  Specialist,
  "slug" | "name" | "isDemo" | "services" | "googleRating" | "checks" | "checksLastConfirmed"
>;

/** A business asking to be considered for introductions. Not an approval. */
export interface SupplierApplication {
  kind: "supplier_application";
  id: string;
  status: "received" | "under_review" | "accepted" | "declined";
  /** Set when reviewed on /admin. */
  review?: { at: string; by: AdminRole; specialistSlug: string | null; declineReason: string | null };
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  /** The first service they chose, kept for older records. */
  mainService: string;
  /** Every service they offer, by slug. */
  servicesOffered?: string[];
  /** Per service, the kinds of job they take (for example extension sizes). */
  leadTypes?: Record<string, string[]>;
  /** Anything they do that isn't one of our services. */
  otherServices?: string | null;
  /** Older applications chose postcode areas; newer ones give a base and radius. */
  areasCovered: string[];
  otherAreas: string | null;
  basePostcode?: string | null;
  radiusMiles?: number | null;
  /** Postcodes inside the radius they don't cover, as typed. */
  excludedPostcodes?: string | null;
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
