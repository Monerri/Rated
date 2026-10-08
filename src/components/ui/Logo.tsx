import { site } from "@/config/site";

/** Placeholder mark (roof and tick). To be replaced with the final logo. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#1B5CA8" />
      <path d="M9.5 19.5 20 10.5l10.5 9" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m14 25.5 4.5 4.5 8-8.5" fill="none" stroke="#7BE3B1" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5 font-display text-[19px] font-extrabold tracking-tight text-ink">
      <LogoMark />
      {site.name}
    </span>
  );
}
