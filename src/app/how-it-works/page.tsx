import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { Eyebrow } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/Icon";
import { faqs, nextSteps, steps } from "@/components/home/HomeSections";

export const metadata: Metadata = {
  title: "How it works",
  description: "Tell us what you need, we find one suitable vetted specialist, and they contact you. Here's exactly what happens.",
};

const asks = [
  { q: "What you want to improve", why: "So we only match you with specialists who do that work." },
  { q: "The start of your postcode", why: "So we can check early that we cover your area, before you answer anything else." },
  { q: "A few questions about your home", why: "Property type, what you have now and what matters to you, so the specialist understands your project before they call." },
  { q: "Whether the property is listed or in a conservation area", why: "Because extra rules can apply, and the specialist should know." },
  { q: "When you're looking to do the work", why: "If you're only researching, we won't pass your details on." },
  { q: "Your contact details", why: "Asked last, only once you've seen exactly what happens next." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section aria-labelledby="hiw-heading" className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:py-16">
          <div className="grid max-w-2xl gap-5">
            <Eyebrow>How it works</Eyebrow>
            <h1 id="hiw-heading" className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
              One suitable specialist, introduced openly
            </h1>
            <p className="text-lg text-muted sm:text-xl">
              It takes about two minutes. You&apos;ll know who will contact you, and why, before anyone does.
            </p>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="grid content-start gap-2">
                <span className="grid size-10 place-items-center rounded-full border-[1.5px] border-blue font-display font-bold text-blue" aria-hidden="true">
                  {i + 1}
                </span>
                <h2 className="text-lg font-bold">{s.title}</h2>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="asks-heading" className="mx-auto grid max-w-4xl gap-6 px-4 py-14 sm:px-6">
        <h2 id="asks-heading" className="text-[28px] font-bold leading-tight">
          What we ask, and why
        </h2>
        <dl className="grid divide-y divide-line rounded-[var(--radius-panel)] border border-line bg-surface">
          {asks.map((a) => (
            <div key={a.q} className="grid gap-1 p-5 sm:grid-cols-[260px_1fr] sm:gap-6">
              <dt className="font-display font-bold">{a.q}</dt>
              <dd className="text-muted">{a.why}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="after-heading" className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6">
          <h2 id="after-heading" className="text-[28px] font-bold leading-tight">
            After you get in touch
          </h2>
          <ol className="grid gap-6 md:grid-cols-4">
            {nextSteps.map((s) => (
              <li key={s.title} className="grid content-start gap-2 border-t-2 border-blue pt-4">
                <h3 className="text-[17px] font-bold">{s.title}</h3>
                <p className="text-[15px] text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="text-muted">
            Not ready yet? Tell us you&apos;re just researching. We won&apos;t share your details, and you can save your
            progress or delete your answers.
          </p>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto grid max-w-4xl gap-6 px-4 py-14 sm:px-6">
        <h2 id="faq-heading" className="text-[28px] font-bold leading-tight">
          Questions
        </h2>
        <div className="grid divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <div key={f.q} className="grid gap-1 py-4">
              <h3 className="text-lg font-bold">{f.q}</h3>
              <p className="text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="text-muted">
          How do we choose who to work with? See{" "}
          <Link href="/how-we-check" className="text-blue">
            how we check our specialists
          </Link>
          . {site.name} is free for homeowners. Specialists pay us a fee for introductions.
        </p>
        <ButtonLink href="/find-a-specialist" className="justify-self-start">
          Find a specialist <ArrowIcon />
        </ButtonLink>
      </section>
    </>
  );
}
