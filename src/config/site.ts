/**
 * Brand and company details live here so a rename or a new market
 * is a configuration change, not a code change.
 */
export const site = {
  name: "Vetted North",
  tagline: "Helping homeowners make better decisions about improving their homes.",
  description:
    "Tell us what you're looking to improve. We'll help you find the right solution and a trusted local specialist.",
  contactEmail: "hello@example.com",
  /** Placeholders until the company is registered. Shown in the footer. */
  legal: {
    companyName: "[Company name] Ltd",
    companyNumber: "[to be confirmed]",
    icoNumber: "[to be confirmed]",
  },
} as const;
