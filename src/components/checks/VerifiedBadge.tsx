import { verifiedBadge } from "@/config/vetting";

/** A rosette with a tick: the Verified mark. Paired with its name, never shown on colour alone. */
export function VerifiedSeal({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.5l2.3 1.7 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8L22.2 12l-1.7 2.3.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22.5l-2.3-1.7-2.8.3-1.1-2.6-2.6-1.1.3-2.8L1.8 12l1.7-2.3-.3-2.8 2.6-1.1 1.1-2.6 2.8.3z"
      />
      <path d="M7.5 12.2l3 3 6-6.2" fill="none" stroke="var(--color-surface)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The Vetted North Verified badge. Gold, not blue, and always with its name. */
export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 justify-self-start rounded-full border border-[var(--color-honey)] bg-[color-mix(in_srgb,var(--color-honey)_16%,var(--color-surface))] font-semibold text-ink ${
        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-[13px]"
      }`}
    >
      <span className="text-[var(--color-honey)]">
        <VerifiedSeal className={size === "sm" ? "size-4" : "size-5"} />
      </span>
      {verifiedBadge.name}
    </span>
  );
}
