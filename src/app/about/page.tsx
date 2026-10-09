import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { primaryRegion } from "@/config/regions";
import { Eyebrow } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "About us",
  description: `${site.name} helps homeowners make better decisions about improving their homes.`,
};

const principles = [
  {
    title: "Say exactly what's happening",
    body: "Our buttons describe what you're doing. When you ask to be put in touch, we tell you who with before we share anything.",
  },
  {
    title: "You choose how many",
    body: "You decide whether to hear from one, two or three specialists. Never more, and never a list of companies competing for your attention.",
  },
  {
    title: "Show the evidence",
    body: "Each specialist's checks are shown on their profile, with the date they were last confirmed.",
  },
  {
    title: "Only promise what's true",
    body: "We don't suggest funding exists when it doesn't, and we don't claim any specialist is \"the best\".",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-12 px-4 py-12 sm:px-6 md:py-16">
      <header className="grid gap-5">
        <Eyebrow>About us</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
          Helping homeowners make better decisions about improving their homes
        </h1>
        <p className="text-lg text-muted sm:text-xl">
          Tell us what you&apos;re looking to improve. We&apos;ll help you find the right solution and a trusted local
          specialist.
        </p>
      </header>

      <section aria-labelledby="why-heading" className="prose max-w-none">
        <h2 id="why-heading">Why we exist</h2>
        <p>
          Finding someone to work on your home shouldn&apos;t feel like a gamble. Most people only replace their windows
          or roof a few times in their lives, so it&apos;s hard to know what good looks like or who to trust.
        </p>
        <p>
          We understand the home-improvement industry, and we use that to help you navigate it. We explain your options
          in plain English, check the businesses we work with, and introduce you to the number of suitable specialists you choose, up to three, who cover
          your area.
        </p>
      </section>

      <section aria-labelledby="principles-heading" className="grid gap-5">
        <h2 id="principles-heading" className="text-[28px] font-bold leading-tight">
          How we work
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <li key={p.title} className="grid content-start gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <h3 className="text-lg font-bold">{p.title}</h3>
              <p className="text-[15px] text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="paid-heading" className="grid gap-3 rounded-[var(--radius-panel)] bg-blue-tint p-6">
        <h2 id="paid-heading" className="text-xl font-bold">
          How we&apos;re paid
        </h2>
        <p>Our service is free for homeowners. Specialists pay us a fee for introductions.</p>
      </section>

      <section aria-labelledby="where-heading" className="grid gap-3">
        <h2 id="where-heading" className="text-[28px] font-bold leading-tight">
          Where we work
        </h2>
        <p className="text-lg text-muted">
          We&apos;re starting in {primaryRegion.name}, with windows, doors, conservatory roofs, extensions and roof replacement. We&apos;ll add more
          services and areas as we build our network.{" "}
          <Link href="/areas" className="text-blue">
            Areas we cover
          </Link>
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/find-a-specialist">
            Find a specialist <ArrowIcon />
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact us
          </ButtonLink>
        </div>
      </section>

      <p className="text-sm text-muted">
        {site.name} is a trading name of {site.legal.companyName}, registered in England and Wales, company no.{" "}
        {site.legal.companyNumber}.
      </p>
    </div>
  );
}
