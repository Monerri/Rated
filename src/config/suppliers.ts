import { site } from "@/config/site";

/** "Who we're looking for", shown on the For Suppliers page. Mirrors the vetting checks. */
export const supplierCriteria = [
  { title: "Established home-improvement businesses", detail: "With a track record of completed work in the areas you cover." },
  {
    title: "Limited companies and sole traders",
    detail: "Companies registered at Companies House, or sole traders, for whom we check identity and address instead.",
  },
  { title: "Legal registration for the work", detail: "Gas Safe for any gas work, and F gas certification for refrigerant work, which the law requires." },
  { title: "A Google rating above four stars", detail: "From at least ten reviews on your Google Business profile." },
];

/** What a specialist needs for the Verified badge, shown on the For suppliers page. */
export const badgeCriteria = [
  { title: "Identity confirmed", detail: "For companies, your contact is a listed director. For sole traders, it's part of the identity check." },
  { title: "An insurance-backed guarantee", detail: "Where it's relevant to your work, so homeowners are protected for qualifying work." },
  {
    title: "The right trade scheme registration",
    detail: "Where your trade has one, for example FENSA or Certass for windows, NICEIC or NAPIT for electrical work, or MCS for solar and heat pumps.",
  },
];

/**
 * Trade schemes offered in the form. Listed alphabetically: we don't rank
 * schemes. "Other" covers anything not listed. See config/schemes.ts for
 * which service needs which.
 */
export const competentPersonSchemes = [
  { value: "aphc", label: "APHC" },
  { value: "arb", label: "Architects Registration Board" },
  { value: "assure", label: "Assure" },
  { value: "certass", label: "Certass" },
  { value: "competent-roofer", label: "Competent Roofer" },
  { value: "f-gas", label: "F gas company certificate" },
  { value: "fensa", label: "FENSA" },
  { value: "gas-safe", label: "Gas Safe Register" },
  { value: "hetas", label: "HETAS" },
  { value: "iaa", label: "Installation Assurance Authority (formerly CIGA)" },
  { value: "mcs", label: "MCS" },
  { value: "napit", label: "NAPIT" },
  { value: "niceic", label: "NICEIC" },
  { value: "nsi", label: "NSI" },
  { value: "oftec", label: "OFTEC" },
  { value: "ssaib", label: "SSAIB" },
  { value: "trustmark", label: "TrustMark" },
  { value: "other", label: "Another scheme" },
  { value: "not-applicable", label: "Not applicable to my work" },
  { value: "none", label: "Not currently registered" },
];

export function supplierDeclarationWording() {
  return {
    wordingId: "supplier_declaration.v1",
    wording: `I confirm the information above is accurate, that I'm authorised to submit it for this business, and that ${site.name} may check it against public records and use it to review our application.`,
  };
}

/**
 * The version of the Specialist terms that specialists agree to: the date in
 * content/legal/supplier-terms.md. Change both together when the terms change,
 * so every acceptance records which version it was.
 */
export const specialistTermsVersion = "2026-11-28";

/** How long a "please accept our terms" link stays valid. */
export const termsInviteDays = 30;

function termsDate(): string {
  return new Date(`${specialistTermsVersion}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * What an applicant ticks on the For suppliers form to accept the terms in
 * advance. They only take effect if we approve the business, which then goes
 * live straight away. Stored word for word with the application.
 */
export function applicationTermsWording() {
  return {
    wordingId: `specialist_terms_on_application.${specialistTermsVersion}`,
    wording: `I'm authorised to act for this business. If you accept it, I agree on its behalf to the ${site.name} Specialist terms dated ${termsDate()}, including how prepaid credits, bonus credits and refunds work.`,
  };
}

/** What a specialist ticks to accept the terms from an emailed link, stored word for word with their acceptance. */
export function specialistTermsWording(companyName: string) {
  return {
    wordingId: `specialist_terms.${specialistTermsVersion}`,
    wording: `I'm authorised to act for ${companyName}, and on its behalf I agree to the ${site.name} Specialist terms dated ${new Date(`${specialistTermsVersion}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, including how prepaid credits, bonus credits and refunds work.`,
  };
}
