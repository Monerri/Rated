import { site } from "@/config/site";

/** "Who we're looking for", shown on the For Suppliers page. Mirrors the vetting checks. */
export const supplierCriteria = [
  { title: "Established home-improvement businesses", detail: "With a track record of completed work in the areas you cover." },
  { title: "Properly registered companies", detail: "Registered with Companies House. We may also look at financial health." },
  { title: "Appropriate insurance-backed guarantees", detail: "So homeowners are protected for qualifying work." },
  {
    title: "Relevant Competent Person Scheme registration",
    detail: "Where your work requires it, for example FENSA, Certass or Assure for windows and doors.",
  },
  { title: "A Google rating above four stars", detail: "Based on your Google Business profile." },
];

/**
 * Competent Person Schemes offered in the form. Listed alphabetically: we
 * don't rank schemes. "Other" covers schemes for future services.
 */
export const competentPersonSchemes = [
  { value: "assure", label: "Assure" },
  { value: "certass", label: "Certass" },
  { value: "fensa", label: "FENSA" },
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
