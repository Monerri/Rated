"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mobileExtraNav, primaryNav, supplierNav } from "@/config/navigation";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";

/** True when `href` is the current page or a parent section of it. */
function isCurrent(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The questionnaire has its own progress and back controls, so the header CTA would be noise there.
  const inFunnel = pathname.startsWith("/find-a-specialist/");

  // Close the menu with Escape, and stop the page behind it scrolling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass = (href: string, muted = false) =>
    `text-[15px] font-medium no-underline hover:text-blue aria-[current=page]:text-blue aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8 ${muted ? "text-muted" : "text-ink"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Vetted North home" className="no-underline" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {primaryNav.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)} aria-current={isCurrent(pathname, l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
          <Link
            href={supplierNav.href}
            className={linkClass(supplierNav.href, true)}
            aria-current={isCurrent(pathname, supplierNav.href) ? "page" : undefined}
          >
            {supplierNav.label}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!inFunnel && (
            <span className="hidden sm:block">
              <Link href="/find-a-specialist" className={buttonClass("primary", "sm")}>
                Find a specialist
              </Link>
            </span>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line px-4 font-display text-[15px] font-semibold text-blue lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-line bg-surface px-4 pb-8 pt-4 lg:hidden"
        >
          {!inFunnel && (
            <Link href="/find-a-specialist" onClick={() => setOpen(false)} className={buttonClass("primary", "md", "mb-3 w-full")}>
              Find a specialist
            </Link>
          )}
          <ul className="grid">
            {[...primaryNav, ...mobileExtraNav, supplierNav].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
                  className="flex min-h-12 items-center border-b border-line font-display text-lg font-semibold text-ink no-underline aria-[current=page]:text-blue"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
