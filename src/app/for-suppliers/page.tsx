import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { services } from "@/config/services";
import { supplierCriteria } from "@/config/suppliers";
import { primaryRegion } from "@/config/regions";
import { vettingChecks } from "@/config/vetting";
import { Eyebrow } from "@/components/ui/Section";
import { ArrowIcon, TickIcon } from "@/components/ui/Icon";
import { SupplierForm } from "@/components/suppliers/SupplierForm";

export const metadata: Metadata = {
  title: "For suppliers",
  description: `Become a ${site.name} specialist. We're building a network of trusted home-improvement specialists across ${primaryRegion.name}.`,
};

const process = [
  { title: "Tell us about your business", body: "Complete the form below. It takes about five minutes." },
  {
    title: "We review it against our requirements",
    body: `We check the details you give us against our ${vettingChecks.length} current checks, using public records where we can.`,
  },
  {
    title: "We get in touch if it's a good fit",
    body: "We'll talk you through how introductions work, including our fees, before anything is agreed.",
  },
];

export default function ForSuppliersPage() {
  return (
    <>
      <section aria-labelledby="suppliers-heading" className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-12">
          <div className="grid max-w-2xl gap-5">
            <Eyebrow>For suppliers</Eyebrow>
            <h1 id="suppliers-heading" className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
              Become a {site.name} specialist
            </h1>
            <p className="text-lg text-muted sm:text-xl">
              We&apos;re building a network of trusted home-improvement specialists across {primaryRegion.name}. If you
              run an established business and would like to be considered for our network, we&apos;d like to hear from
              you.
            </p>
            <Link href="#apply" className="inline-flex items-center gap-1.5 justify-self-start font-display font-semibold text-blue">
              Go to the form <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-ground p-5 sm:p-6">
            <p className="font-display text-lg font-bold">How we work with specialists</p>
            <ul className="grid gap-2 text-[15px]">
              <li>One specialist per homeowner enquiry. We never send the same enquiry to several companies.</li>
              <li>Homeowners are told who you are, and see your checks, before you contact them.</li>
              <li>Every enquiry comes from a homeowner who has agreed to be contacted by you.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="criteria-heading" className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:py-20">
        <div className="grid max-w-2xl gap-3">
          <h2 id="criteria-heading" className="text-[28px] font-bold leading-tight md:text-[34px]">
            Who we&apos;re looking for
          </h2>
          <p className="text-lg text-muted">
            Every business is considered against our vetting requirements. We review them regularly and may add to them
            over time.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplierCriteria.map((c) => (
            <li key={c.title} className="grid content-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <span className="grid size-7 place-items-center rounded-full bg-green text-surface" aria-hidden="true">
                <TickIcon className="size-3.5" />
              </span>
              <h3 className="text-[17px] font-bold">{c.title}</h3>
              <p className="text-[15px] text-muted">{c.detail}</p>
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-[15px] text-muted">
          Meeting these requirements doesn&apos;t guarantee a place. We also consider the services and areas we need
          to cover.{" "}
          <Link href="/how-we-check" className="text-blue">
            How we check our specialists
          </Link>
        </p>
      </section>

      <section aria-labelledby="process-heading" className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6">
          <h2 id="process-heading" className="text-[28px] font-bold leading-tight">
            What happens next
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {process.map((s, i) => (
              <li key={s.title} className="grid content-start gap-2">
                <span className="grid size-10 place-items-center rounded-full border-[1.5px] border-blue font-display font-bold text-blue" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="text-[15px] text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="apply" aria-labelledby="apply-heading" className="mx-auto grid max-w-3xl gap-6 px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-3">
          <h2 id="apply-heading" className="text-[28px] font-bold leading-tight md:text-[34px]">
            Interested in being considered?
          </h2>
          <p className="text-lg text-muted">All fields are required unless marked optional.</p>
        </div>
        <SupplierForm services={services.map(({ slug, name }) => ({ slug, name }))} />
      </section>
    </>
  );
}
