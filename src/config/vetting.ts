import type { VettingCheckId } from "@/lib/types";

export interface VettingCheckDefinition {
  id: VettingCheckId;
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
};

/**
 * The current consumer-facing baseline. Order is the display order.
 * Add a check here (and to VettingCheckId) to extend the standard.
 */
export const vettingChecks: VettingCheckDefinition[] = [
  {
    id: "registered_company",
    title: "Registered company",
    summary: "We check that businesses are properly registered.",
    whatWeCheck:
      "That the business is a limited company registered at Companies House, that it's active, and that the details match the business you'll deal with. We may also look at its filed accounts for signs of financial difficulty.",
    whyItMatters: "You know exactly who you're contracting with, and that the company has a public, traceable record.",
    worthKnowing:
      "Being on the Companies House register isn't an endorsement by Companies House. It confirms the company exists and files information as required.",
  },
  {
    id: "insurance_backed_guarantee",
    title: "Insurance-backed guarantee",
    summary: "We check that appropriate insurance-backed protection is available for qualifying work.",
    whatWeCheck:
      "That the business offers an insurance-backed guarantee for qualifying work, and who provides it.",
    whyItMatters:
      "An insurance-backed guarantee is designed to protect the installer's workmanship guarantee if the company stops trading during the guarantee period.",
    worthKnowing:
      "What's covered, for how long and for which work varies between policies. Ask your specialist for the policy details before work starts, and check you receive the certificate afterwards.",
  },
  {
    id: "competent_person_scheme",
    title: "Competent Person Scheme",
    summary: "Where relevant, we check registration with an appropriate Competent Person Scheme.",
    whatWeCheck:
      "Where the work needs it, that the business is registered with an appropriate government-authorised Competent Person Scheme. For windows and doors, examples include FENSA, Certass and Assure. For roofing, an example is Competent Roofer. Extensions are approved by building control rather than a scheme, so this check doesn't apply to builders who only do extensions, and we show it as not applicable.",
    whyItMatters:
      "Replacement windows and doors must meet Building Regulations. A registered installer can certify that their work complies, so you don't need to arrange a separate inspection with your council.",
    worthKnowing:
      "Scheme registration is about meeting Building Regulations. It isn't a rating of overall quality, and we don't rank one scheme above another. Some work, such as certain conservatory roof replacements, may need approval from building control instead.",
  },
  {
    id: "google_rating",
    title: "Google rating",
    summary: "We look for businesses with a Google rating above four stars.",
    whatWeCheck: "That the business's Google rating is above four stars when we confirm its checks. We also note how many reviews it has.",
    whyItMatters: "Ratings give a picture of how other local customers found the experience.",
    worthKnowing:
      "Ratings change over time and a high score from a handful of reviews tells you less than one from hundreds. It's worth reading a few recent reviews yourself.",
  },
];
