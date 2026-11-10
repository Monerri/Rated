/**
 * Brand and company details live here so a rename or a new market is a
 * configuration change, not a code change. See docs/RENAMING.md.
 *
 * The brand's web address. Email addresses below are built from it, so a new
 * domain is a one-line change here (plus the steps in docs/RENAMING.md).
 */
const domain = "vettednorth.com";

export const site = {
  /** The trading name shown everywhere: pages, emails, page titles and legal pages. */
  name: "Vetted North",
  domain,
  tagline: "Helping homeowners make better decisions about improving their homes.",
  description:
    "Tell us what you're looking to improve. We'll help you find the right solution and a trusted local specialist.",
  /** Canonical address. Override with SITE_URL in other environments. */
  url: process.env.SITE_URL ?? `https://${domain}`,
  contactEmail: `hello@${domain}`,
  privacyEmail: `privacy@${domain}`,
  /** Where new supplier applications are sent for review. */
  supplierApplicationsEmail: `suppliers@${domain}`,
  /**
   * When homeowners can expect to hear from their specialist. Specialists
   * agree to this in section 9 of the Specialist terms, so change both together.
   */
  specialistResponseTime: "within three days",
  /**
   * The company behind the trading name. Shown in the footer, on the About
   * page and in the legal pages, as UK company law requires on websites.
   */
  legal: {
    companyName: "Roberto Monerri Ltd",
    companyNumber: "10312351",
    placeOfRegistration: "England and Wales",
    registeredOffice: "16 Fairburn Avenue, Houghton le Spring, Durham DH5 8LA",
    /** "pending" until the ICO confirms the registration, then the number, for example "ZB123456". */
    icoNumber: "pending",
  },
} as const;

/**
 * Placeholders that Markdown content (guides, blog posts, legal pages) can
 * use instead of typing the name or company details, for example
 * "{{name}} is a trading name of {{companyName}}". Filled in when pages are built.
 */
export const contentPlaceholders: Record<string, string> = {
  name: site.name,
  domain: site.domain,
  contactEmail: site.contactEmail,
  privacyEmail: site.privacyEmail,
  suppliersEmail: site.supplierApplicationsEmail,
  companyName: site.legal.companyName,
  companyNumber: site.legal.companyNumber,
  placeOfRegistration: site.legal.placeOfRegistration,
  registeredOffice: site.legal.registeredOffice,
  icoNumber: site.legal.icoNumber,
};

/** Replaces {{placeholder}} tokens with the values above. Unknown tokens are left as they are. */
export function fillPlaceholders(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => contentPlaceholders[key] ?? match);
}
