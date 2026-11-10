import type { Metadata } from "next";
import Link from "next/link";
import { getService } from "@/config/services";
import { site } from "@/config/site";
import { specialistTermsVersion, specialistTermsWording } from "@/config/suppliers";
import { specialistForTermsToken } from "@/lib/onboarding";
import { AcceptTermsForm } from "@/components/suppliers/AcceptTermsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept the Specialist terms",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

/** Where an approved specialist accepts the Specialist terms, from the link we emailed. */
export default async function AcceptTermsPage({ params }: Props) {
  const { token } = await params;
  const found = await specialistForTermsToken(token);

  if (!found || found.expired) {
    return (
      <div className="mx-auto grid max-w-2xl gap-4 px-4 py-12 sm:px-6">
        <h1 className="text-[32px] font-bold leading-tight">{found ? "This link has expired" : "This link isn't valid"}</h1>
        <p className="text-lg text-muted">
          {found
            ? "Links to accept our terms work for a limited time."
            : "It may have been replaced by a newer link, or the terms may already have been accepted."}{" "}
          Please reply to our email, or contact {site.supplierApplicationsEmail}, and we&apos;ll help.
        </p>
      </div>
    );
  }

  const s = found.specialist;
  const consent = specialistTermsWording(s.name);
  return (
    <div className="mx-auto grid max-w-2xl gap-8 px-4 py-12 sm:px-6">
      <header className="grid gap-3">
        <h1 className="text-[32px] font-bold leading-tight">Accept the Specialist terms</h1>
        <p className="text-lg text-muted">
          {s.name} has passed our checks for {s.services.map((slug) => getService(slug)?.name ?? slug).join(", ")}. Before we
          can send you introductions, please read and accept our terms.
        </p>
      </header>
      <section className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 text-[15px]">
        <h2 className="text-xl font-bold">The main points</h2>
        <ul className="grid list-disc gap-2 pl-5">
          <li>You pay for introductions in advance with credits. One credit is worth £1, and larger top-ups come with bonus credits.</li>
          <li>You&apos;re only charged when an introduction is sent to you. Bonus credits are never paid out as cash.</li>
          <li>Contact each homeowner {site.specialistResponseTime} of receiving their details.</li>
          <li>Use homeowners&apos; details only to discuss and quote for the work they asked about.</li>
        </ul>
        <p>
          <Link href="/supplier-terms" target="_blank" className="font-semibold text-blue underline">
            Read the full Specialist terms (opens in a new tab)
          </Link>
          , dated{" "}
          {new Date(`${specialistTermsVersion}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.
        </p>
      </section>
      <AcceptTermsForm token={token} consent={consent} />
    </div>
  );
}
