import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon, TickIcon } from "@/components/ui/Icon";
import { vettingChecks } from "@/config/vetting";
import { getArticles } from "@/lib/content";
import { ArticleCard } from "@/components/content/ArticleCard";
import { primaryRegion } from "@/config/regions";

export const steps = [
  {
    title: "Tell us what you need",
    body: "Answer a few simple questions about your home and what you're looking to improve.",
  },
  {
    title: "We find a suitable specialist",
    body: "We use your requirements and location to identify an appropriate vetted local company.",
  },
  {
    title: "They contact you",
    body: "The specialist gets in touch to discuss your project and arrange the next step.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" eyebrow="How it works" title="Three simple steps" tone="surface">
      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="grid content-start gap-2">
            <span
              className="grid size-10 place-items-center rounded-full border-[1.5px] border-blue font-display text-base font-bold text-blue"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <h3 className="text-lg font-bold">{s.title}</h3>
            <p className="text-[16px] text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function ChecksSection() {
  return (
    <Section
      id="checks"
      eyebrow="How we check our specialists"
      title="Four checks before we recommend anyone"
      intro="Every specialist we work with has passed these checks. We review them regularly and show you when they were last confirmed."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vettingChecks.map((c) => (
          <li key={c.id} className="grid content-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <span className="grid size-7 place-items-center rounded-full bg-green text-surface" aria-hidden="true">
              <TickIcon className="size-3.5" />
            </span>
            <h3 className="text-[17px] font-bold">{c.title}</h3>
            <p className="text-[15px] text-muted">{c.summary}</p>
          </li>
        ))}
      </ul>
      <p className="max-w-2xl text-[15px] text-muted">
        Checks help you start with a properly set-up business. They don&apos;t guarantee how a particular job will go,
        so we&apos;ll always encourage you to ask questions and get everything agreed in writing.
      </p>
      <Link href="/how-we-check" className="inline-flex items-center gap-1.5 justify-self-start font-display font-semibold text-blue">
        How we check our specialists <ArrowIcon />
      </Link>
    </Section>
  );
}

export const nextSteps = [
  {
    title: "We review your answers",
    body: "We match your project and postcode with vetted specialists who cover your area and do the work you need. You choose whether to hear from one, two or three.",
  },
  {
    title: "We tell you who they are",
    body: "We show you each specialist's name and checks, and email them to you, before they get in touch, so you know who to expect.",
  },
  {
    title: "They contact you",
    body: "The specialist calls or emails to talk through your project. Any quote is between you and them.",
  },
  {
    title: "You decide",
    body: "There's no obligation to go ahead. If it isn't right for you, just say so.",
  },
];

export function WhatHappensNext() {
  return (
    <Section
      id="what-happens-next"
      eyebrow="After you get in touch"
      title="You'll know who's contacting you, and why"
      tone="surface"
    >
      <ol className="grid gap-6 md:grid-cols-4">
        {nextSteps.map((s) => (
          <li key={s.title} className="grid content-start gap-2 border-t-2 border-blue pt-4">
            <h3 className="text-[17px] font-bold">{s.title}</h3>
            <p className="text-[15px] text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function GuidesTeaser() {
  const featured = getArticles("guides").slice(0, 3);
  const latest = getArticles("blog").slice(0, 3);
  return (
    <Section
      id="guides"
      eyebrow="Guides"
      title="Understand your options first"
      intro="Plain-English guides to help you make a good decision, whether or not you use us."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {featured.map((g) => (
          <li key={g.slug}>
            <ArticleCard article={g} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/guides" className="inline-flex items-center gap-1.5 font-display font-semibold text-blue">
          All guides <ArrowIcon />
        </Link>
        {latest.length > 0 && (
          <Link href="/blog" className="inline-flex items-center gap-1.5 font-display font-semibold text-blue">
            Latest from the blog <ArrowIcon />
          </Link>
        )}
      </div>
    </Section>
  );
}

export function AreaSection() {
  return (
    <Section
      id="areas"
      eyebrow="Where we work"
      title={`Currently helping homeowners across ${primaryRegion.name}`}
      intro="Choose the start of your postcode to begin."
      tone="surface"
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {primaryRegion.postcodeAreas.map((a) => (
          <li key={a.code}>
            <Link
              href={`/find-a-specialist?area=${a.code}`}
              className="grid h-full content-start gap-1 rounded-[var(--radius-card)] border-[1.5px] border-line bg-surface p-4 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none"
            >
              <span className="font-display text-2xl font-bold tracking-wide">{a.code}</span>
              <span className="text-[13px] leading-snug text-muted">{a.places}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/areas"
            className="grid h-full content-start gap-1 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line p-4 text-ink no-underline transition-colors hover:border-solid hover:border-blue motion-reduce:transition-none"
          >
            <span className="font-display text-lg font-semibold">Elsewhere</span>
            <span className="text-[13px] leading-snug text-muted">See where we&apos;re coming next</span>
          </Link>
        </li>
      </ul>
    </Section>
  );
}

export const faqs: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "Does it cost anything?",
    a: "No. Our service is free for homeowners. Specialists pay us a fee for introductions.",
  },
  {
    q: "How many companies will contact me?",
    a: "You decide: one, two or three. We'll never pass your details to more than the number you choose, and we tell you who they are before they get in touch.",
  },
  {
    q: "Do I have to go ahead?",
    a: "No. Talking to a specialist doesn't commit you to anything. Any quote or contract is between you and them.",
  },
  {
    q: "Who sees my details?",
    a: "We do, and the specialists we introduce, up to the number you choose and only once you've agreed. If you're only researching, we don't share your details with anyone.",
  },
  {
    q: "What if I'm not ready yet?",
    a: "Tell us you're just researching. We'll let you know whether a vetted specialist covers your area, and you choose whether to be put in touch, save your progress, or delete your answers.",
  },
  {
    q: "Can you help me get a grant?",
    a: "No. We don't offer grants, and there's nothing to \"qualify\" for. Be wary of websites and callers that promise free or government-funded improvements in return for your details.",
    link: { href: "/guides/misleading-grants-and-offers", label: "How to spot misleading grants and offers" },
  },
];

export function Faq() {
  return (
    <Section id="faq" eyebrow="Questions" title="Good questions to ask">
      <div className="grid max-w-3xl divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden="true" className="text-2xl font-normal text-blue transition-transform group-open:rotate-45 motion-reduce:transition-none">
                +
              </span>
            </summary>
            <p className="pb-4 pr-8 text-muted">
              {f.a}
              {f.link && (
                <>
                  {" "}
                  <Link href={f.link.href} className="text-blue">
                    {f.link.label}
                  </Link>
                  .
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="border-t border-line bg-blue-tint">
      <div className="mx-auto grid max-w-6xl justify-items-start gap-5 px-4 py-14 sm:px-6 md:py-16">
        <h2 id="final-cta-heading" className="text-[28px] font-bold leading-tight md:text-[34px]">
          Tell us about your project
        </h2>
        <p className="max-w-xl text-lg text-muted">
          It takes about two minutes. We&apos;ll explain exactly what happens before anyone contacts you.
        </p>
        <ButtonLink href="/find-a-specialist">
          Find a specialist <ArrowIcon />
        </ButtonLink>
      </div>
    </section>
  );
}
