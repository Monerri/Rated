"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { Service } from "@/lib/types";
import { matchesSearch } from "@/lib/serviceSearch";
import { buttonClass } from "@/components/ui/Button";
import { LiveServiceCards } from "@/components/home/ServiceCards";
import { RegisterInterest } from "@/components/interest/RegisterInterest";

/**
 * A search box above the service cards. Typing narrows the cards. When
 * nothing matches, we first ask people to look through every service (it
 * may be listed under another name), and only say we don't cover it once
 * they've looked.
 */
export function ServiceSearch({ live, comingSoon }: { live: Service[]; comingSoon: Service[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [looked, setLooked] = useState(false);
  const typed = query.trim();

  const matches = useMemo(
    () => ({ live: live.filter((s) => matchesSearch(s, typed)), comingSoon: comingSoon.filter((s) => matchesSearch(s, typed)) }),
    [live, comingSoon, typed],
  );
  const noMatch = typed !== "" && matches.live.length === 0 && matches.comingSoon.length === 0;
  const shown = noMatch ? { live, comingSoon } : matches;
  const count = matches.live.length + matches.comingSoon.length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor={id} className="text-[15px] font-semibold">
          Select below or type to search
        </label>
        <div className="relative">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            id={id}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="For example: boiler, bi-fold doors, loft"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLooked(false);
            }}
            className="min-h-[56px] w-full rounded-full border-[1.5px] border-line-strong bg-surface pl-12 pr-24 [&::-webkit-search-cancel-button]:hidden text-[17px] text-ink placeholder:text-muted focus:border-blue focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLooked(false);
              }}
              className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 rounded-full px-4 font-display text-[15px] font-semibold text-blue"
            >
              Clear<span className="sr-only"> search</span>
            </button>
          )}
        </div>
        <p className="text-sm text-muted" role="status" aria-live="polite">
          {typed === "" ? "" : noMatch ? "" : `${count} ${count === 1 ? "service matches" : "services match"} "${typed}".`}
        </p>
      </div>

      {noMatch && !looked && (
        <div className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-5" role="status">
          <p className="font-semibold">We couldn&apos;t find a match for &ldquo;{typed}&rdquo;.</p>
          <p className="text-muted">
            It may be listed under a different name, so please have a look through all our services below.
          </p>
          <button type="button" onClick={() => setLooked(true)} className={buttonClass("secondary", "sm", "justify-self-start")}>
            I&apos;ve looked and it isn&apos;t listed
          </button>
        </div>
      )}

      {noMatch && looked && (
        <div className="grid gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-5" role="status">
          <p className="font-semibold">Sorry, we don&apos;t cover {typed} yet.</p>
          <p className="text-muted">
            We&apos;re adding services as we check more specialists. Tell us what you need and we&apos;ll bear it in mind.
          </p>
          <Link href="/contact" className={buttonClass("secondary", "sm", "justify-self-start")}>
            Tell us what you need
          </Link>
        </div>
      )}

      <LiveServiceCards services={shown.live} />
      <RegisterInterest services={shown.comingSoon} />
    </div>
  );
}
