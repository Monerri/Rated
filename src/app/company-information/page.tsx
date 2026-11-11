import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Company information",
  description: `The company behind ${site.name}.`,
};

/**
 * The details UK law requires a company's website to show: its registered
 * name, number, where it's registered and its registered office (Companies
 * Trading Disclosures Regulations 2015), plus a geographic address and email
 * (Electronic Commerce Regulations 2002). Linked from every page's footer,
 * so the rest of the site can show just the trading name and company number.
 */
export default function CompanyInformationPage() {
  const rows: [string, React.ReactNode][] = [
    ["Trading name", site.name],
    ["Registered company name", site.legal.companyName],
    ["Company number", site.legal.companyNumber],
    ["Registered in", site.legal.placeOfRegistration],
    ["Registered office", site.legal.registeredOffice],
    ["ICO registration", site.legal.icoNumber],
    [
      "Email",
      <a key="email" href={`mailto:${site.contactEmail}`} className="text-blue underline">
        {site.contactEmail}
      </a>,
    ],
  ];
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-12 sm:px-6">
      <h1 className="text-[32px] font-bold leading-tight">Company information</h1>
      <p className="text-lg text-muted">
        {site.name} is a trading name of {site.legal.companyName}. The registered office is for official post only. To get
        in touch, please use our{" "}
        <Link href="/contact" className="text-blue underline">
          contact page
        </Link>
        .
      </p>
      <dl className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 text-[15px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-0.5 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold">{k}</dt>
            <dd className="text-muted">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
