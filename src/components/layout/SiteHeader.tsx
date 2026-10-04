"use client";

import Link from "next/link";
import { useState } from "react";
import { primaryNav, supplierNav } from "@/config/navigation";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Home" className="no-underline">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {primaryNav.map((l) => (
            <Link key={l.href} href={l.href} className="text-[15px] font-medium text-ink no-underline hover:text-blue">
              {l.label}
            </Link>
          ))}
          <Link href={supplierNav.href} className="text-[15px] font-medium text-muted no-underline hover:text-blue">
            {supplierNav.label}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <Link href="/find-a-specialist" className={buttonClass("primary", "sm")}>
              Find a specialist
            </Link>
          </span>
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
        <nav id="mobile-menu" aria-label="Main" className="border-t border-line bg-surface px-4 pb-6 pt-2 lg:hidden">
          <ul className="grid">
            {[...primaryNav, supplierNav].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-line font-display text-lg font-semibold text-ink no-underline"
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
