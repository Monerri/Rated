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
