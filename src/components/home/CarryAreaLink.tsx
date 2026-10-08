"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { knownPostcodeArea } from "@/config/regions";

/**
 * A link that passes on a postcode area chosen earlier (?area=NE), read in
 * the browser so the page itself can be pre-built.
 */
export function CarryAreaLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        const area = knownPostcodeArea(new URLSearchParams(window.location.search).get("area") ?? undefined);
        if (!area || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        router.push(`${href}?area=${area}`);
      }}
    >
      {children}
    </Link>
  );
}
