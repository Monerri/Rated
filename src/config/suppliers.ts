import { site } from "@/config/site";

/** "Who we're looking for", shown on the For Suppliers page. Mirrors the vetting checks. */
export const supplierCriteria = [
  { title: "Established home-improvement businesses", detail: "With a track record of completed work in the areas you cover." },
  { title: "Properly registered companies", detail: "Registered with Companies House. We may also look at financial health." },
  { title: "Appropriate insurance-backed guarantees", detail: "So homeowners are protected for qualifying work." },
  {
    title: "The right trade scheme registration",
    detail: "Gas Safe for any gas work, which the law requires. Otherwise the scheme your trade needs, for example FENSA or Certass for windows, NICEIC or NAPIT for electrical work, or MCS for solar and heat pumps.",
  },
  { title: "A Google rating above four stars", detail: "Based on your Google Business profile." },
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
export const specialistTermsVersion = "2026-11-10";

/** How long a "please accept our terms" link stays valid. */
export const termsInviteDays = 30;

/** What a specialist ticks to accept the terms, stored word for word with their acceptance. */
export function specialistTermsWording(companyName: string) {
  return {
    wordingId: `specialist_terms.${specialistTermsVersion}`,
    wording: `I'm authorised to act for ${companyName}, and on its behalf I agree to the ${site.name} Specialist terms dated ${new Date(`${specialistTermsVersion}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, including how prepaid credits, bonus credits and refunds work.`,
  };
}
