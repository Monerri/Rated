export interface NavLink {
  href: string;
  label: string;
}

export const primaryNav: NavLink[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/#services", label: "Services" },
  { href: "/how-we-check", label: "How we check" },
  { href: "/guides", label: "Guides" },
];

export const supplierNav: NavLink = { href: "/for-suppliers", label: "For suppliers" };

export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Homeowners",
    links: [
      { href: "/find-a-specialist", label: "Find a specialist" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/specialists", label: "Our specialists" },
      { href: "/how-we-check", label: "How we check our specialists" },
      { href: "/areas", label: "Areas we cover" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/for-suppliers", label: "For suppliers" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];
