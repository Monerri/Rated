import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { contactTopics } from "@/lib/notifications";
import { Eyebrow } from "@/components/ui/Section";
import { ContactForm } from "@/components/pages/ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${site.name}.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.2fr] md:py-16">
      <header className="grid content-start gap-4">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">Get in touch</h1>
        <p className="text-lg text-muted">Send us a message and we&apos;ll reply by email.</p>
        <p>
          Email:{" "}
          <a href={`mailto:${site.contactEmail}`} className="text-blue">
            {site.contactEmail}
          </a>
        </p>
        <ul className="grid gap-2 pt-2 text-[15px] text-muted">
          <li>
            Looking for a specialist?{" "}
            <Link href="/find-a-specialist" className="text-blue">
              Start here
            </Link>
          </li>
          <li>
            Run a home-improvement business?{" "}
            <Link href="/for-suppliers" className="text-blue">
              For suppliers
            </Link>
          </li>
          <li>
            Questions about your data?{" "}
            <Link href="/privacy" className="text-blue">
              Privacy notice
            </Link>
          </li>
        </ul>
      </header>
      <ContactForm topics={contactTopics} />
    </div>
  );
}
