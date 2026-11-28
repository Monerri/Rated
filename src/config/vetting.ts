import { site } from "@/config/site";
import type { VettingCheckId } from "@/lib/types";

export interface VettingCheckDefinition {
  id: VettingCheckId;
  /**
   * "required": every specialist we recommend has passed it (or it doesn't
   * apply). "verified": also needed for the Verified badge.
   */
  tier: "required" | "verified";
  title: string;
  /** One line for cards and summaries. */
  summary: string;
  /** Longer explanation for the How we check page. */
  whatWeCheck: string;
  whyItMatters: string;
  /** What the check does not tell you. Factual, not alarming. */
  worthKnowing: string;
}

/** Facts about the standard as a whole. Used by the pages and by matching. */
export const vettingStandard = {
  /** When the four checks themselves were last reviewed. */
  lastReviewed: "2026-10-01",
  /** Checks must be reconfirmed within this period, or we stop recommending the specialist. */
  checkValidityMonths: 12,
  /** Minimum Google rating. The rating must be above this. */
  minimumGoogleRating: 4,
  /** The rating must come from at least this many reviews. */
  minimumGoogleReviews: 10,
};

/**
 * The badge for specialists who pass every check, required and verified.
 * Display only: it doesn't change who receives a lead. Never sold.
 */
export const verifiedBadge = {
  name: `${site.name} Verified`,
  summary: "Passed every one of our checks, including identity, an insurance-backed guarantee and trade scheme registration where the work needs them.",
};

/**
 * The current consumer-facing baseline. Order is the display order.
 * Add a check here (and to VettingCheckId) to extend the standard.
 */
export const vettingChecks: VettingCheckDefinition[] = [
  {
    id: "registered_company",
    tier: "required",
    title: "Registered business",
    summary: "We check that the business is properly registered, or for sole traders, who they are and where they're based.",
    whatWeCheck:
      "For limited companies: that the company is registered at Companies House, that it's active, and that the details match the business you'll deal with. Sole traders aren't on Companies House, so instead we check the owner's identity and address. We may also look at filed accounts for signs of financial difficulty.",
    whyItMatters: "You know exactly who you're dealing with, and that they have a traceable, public or verified identity.",
    worthKnowing:
      "Being on the Companies House register isn't an endorsement by Companies House. It confirms the company exists and files information as required.",
  },
  {
    id: "legal_registration",
    tier: "required",
    title: "Legal registration for the work",
    summary: "Where the law requires a registration for the work, such as Gas Safe for gas, we check it.",
    whatWeCheck:
      "Anyone working on gas appliances or pipes must be on the Gas Safe Register, and businesses handling refrigerant gas, for example fitting air conditioning or some heat pumps, need F gas certification. If a specialist does that kind of work, we check they're registered. If they don't, this check doesn't apply.",
    whyItMatters: "These registrations are a legal requirement for safety reasons. We never recommend anyone for work they aren't legally registered to do.",
    worthKnowing: "Always ask to see a Gas Safe engineer's ID card when they arrive. You can check it on the Gas Safe Register website.",
  },
  {
    id: "google_rating",
    tier: "required",
    title: "Google rating",
    summary: "We look for businesses rated above four stars on Google, from at least ten reviews.",
    whatWeCheck: "That the business's Google rating is above four stars, from at least ten reviews, when we confirm its checks.",
    whyItMatters: "Ratings give a picture of how other local customers found the experience.",
    worthKnowing:
      "Ratings change over time and a high score from a handful of reviews tells you less than one from hundreds. It's worth reading a few recent reviews yourself.",
  },
  {
    id: "identity",
    tier: "verified",
    title: "Identity confirmed",
    summary: "We confirm the person we deal with runs the business.",
    whatWeCheck:
      "For limited companies, that our contact is a director listed at Companies House. For sole traders, this is covered by our identity and address check.",
    whyItMatters: "It helps make sure the business is being represented by the people responsible for it.",
    worthKnowing: "We check identity when a specialist joins and at each yearly recheck, not on every job.",
  },
  {
    id: "insurance_backed_guarantee",
    tier: "verified",
    title: "Insurance-backed guarantee",
    summary: "We check the business offers an insurance-backed guarantee, where it's relevant to the work.",
    whatWeCheck:
      "That the business offers an insurance-backed guarantee for qualifying work, and who provides it. For work where guarantees like this aren't offered, for example design and planning, this check doesn't apply. Separately, we show how long the business guarantees its own workmanship, from its written guarantee.",
    whyItMatters:
      "An insurance-backed guarantee is designed to protect the installer's workmanship guarantee if the company stops trading during the guarantee period.",
    worthKnowing:
      "What's covered, for how long and for which work varies between policies. Ask your specialist for the policy details before work starts, and check you receive the certificate afterwards.",
  },
  {
    id: "competent_person_scheme",
    tier: "verified",
    title: "Trade scheme registration",
    summary: "We check registration with the trade scheme for the work, such as FENSA, NICEIC or MCS, where there is one.",
    whatWeCheck:
      "That the business is registered with the scheme its work needs, such as FENSA or Certass for windows, NICEIC or NAPIT for electrical work, and MCS for solar panels and heat pumps. Extensions are approved by building control rather than a scheme, so for builders who only do extensions this check doesn't apply.",
    whyItMatters:
      "Registration shows the business is qualified for that kind of work. Where a registered business certifies its own work, you get a compliance certificate without arranging a separate council inspection, and you'll need that certificate when you sell.",
    worthKnowing:
      "Scheme registration is about competence and meeting regulations. It isn't a rating of overall quality, and we don't rank one scheme above another. The full list for each service is further down this page.",
  },
];

export const requiredChecks = vettingChecks.filter((c) => c.tier === "required");
export const verifiedChecks = vettingChecks.filter((c) => c.tier === "verified");

/**
 * How we check a sole trader's identity and address (they aren't on
 * Companies House). Shown as a checklist on /admin so every sole trader is
 * checked the same way. Required items must all be ticked to approve; the
 * HMRC item is optional. We note what we saw but never keep copies.
 */
export const soleTraderChecklist: { id: string; label: string; hint: string; required: boolean }[] = [
  {
    id: "photo-id",
    label: "Photo ID seen",
    hint: "A passport or photocard driving licence, in date.",
    required: true,
  },
  {
    id: "name-matches",
    label: "The name on the ID matches the person applying",
    hint: "The owner of the business, not an employee.",
    required: true,
  },
  {
    id: "proof-of-address",
    label: "Proof of address seen, dated in the last 3 months",
    hint: "A utility bill, bank statement or council tax bill in the owner's name.",
    required: true,
  },
  {
    id: "address-matches",
    label: "The address matches where they trade from",
    hint: "Or, if they trade from elsewhere, you've confirmed that address too.",
    required: true,
  },
  {
    id: "hmrc",
    label: "Optional: registered with HMRC for Self Assessment",
    hint: "For example a letter from HMRC showing their UTR. Shows they're a genuine business.",
    required: false,
  },
];
