import Link from "next/link";
import { footerNav } from "@/config/navigation";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-xs text-[15px] text-muted">{site.tagline}</p>
        </div>
        {footerNav.map((group) => (
          <nav key={group.heading} aria-label={group.heading} className="grid content-start gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.09em] text-muted" style={{ fontFamily: "var(--font-sans)" }}>
              {group.heading}
            </h2>
            <ul className="grid gap-2">
              {group.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] text-ink no-underline hover:text-blue hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-1 px-4 py-6 text-[13px] text-muted sm:px-6">
          <p>
            {site.name} is a trading name of {site.legal.companyName}, registered in England and Wales, company no.{" "}
            {site.legal.companyNumber}. ICO registration {site.legal.icoNumber}.
          </p>
          <p>Our service is free for homeowners. Specialists pay us a fee for introductions.</p>
        </div>
      </div>
    </footer>
  );
}
