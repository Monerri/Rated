import { vettingChecks, verifiedBadge } from "@/config/vetting";
import { formatMonthYear } from "@/lib/format";
import { getService } from "@/config/services";
import { checkStatus, isVerified } from "@/lib/vetting";
import type { PublicSpecialist } from "@/lib/types";
import { TickIcon } from "@/components/ui/Icon";
import { VerifiedBadge } from "@/components/checks/VerifiedBadge";

/**
 * Shows a specialist's checks as evidence: the Verified badge if they've
 * passed every check, then each check as passed, not required (with the
 * reason) or not checked. Check titles come from the vetting config, so a new
 * check appears here automatically. Status is always in words, not colour.
 */
export function EvidenceCard({ specialist }: { specialist: PublicSpecialist }) {
  const serviceNames = specialist.services.map((s) => getService(s)?.name).filter(Boolean).join(" · ");
  const verified = isVerified(specialist);
  const soleTrader = specialist.checks.some((c) => c.id === "registered_company" && c.soleTrader);

  return (
    <figure
      className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      aria-label={`Checks for ${specialist.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-xl font-semibold leading-snug">{specialist.name}</p>
          <p className="text-sm text-muted">{serviceNames}</p>
        </div>
        {specialist.isDemo && (
          <span className="whitespace-nowrap rounded border border-dashed border-line px-1.5 py-1 font-mono text-[11px] text-muted">
            EXAMPLE
          </span>
        )}
      </div>

      {verified ? (
        <div className="grid gap-1">
          <VerifiedBadge />
          <p className="text-[13px] text-muted">{verifiedBadge.summary}</p>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          <TickIcon />
          Checked specialist
        </span>
      )}

      <ul className="grid gap-2.5">
        {vettingChecks.map((def) => {
          const status = checkStatus(specialist, def.id);
          const result = specialist.checks.find((c) => c.id === def.id);
          // Older records may not have every check; a missing legal registration means none was needed then.
          if (status === "not_recorded" && def.id === "legal_registration") return null;
          const title = def.id === "google_rating" ? `${specialist.googleRating.toFixed(1)} ★ Google rating` : def.title;
          const detail =
            status === "passed"
              ? def.id === "registered_company" && result?.soleTrader
                ? "Sole trader*"
                : result?.evidence
              : status === "not_required"
                ? result?.notApplicableReason
                : "Not checked";
          const symbol = status === "passed" ? <TickIcon /> : status === "not_required" ? "–" : "○";
          const label = status === "passed" ? "passed" : status === "not_required" ? "not required" : "not checked";
          return (
            <li key={def.id} className="grid grid-cols-[22px_1fr] items-start gap-2.5">
              <span
                className={`mt-0.5 grid size-[22px] place-items-center rounded-full ${
                  status === "passed" ? "bg-green text-surface" : "border-[1.5px] border-line text-muted"
                }`}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <span>
                <span className={`block text-[15px] font-semibold leading-snug ${status === "passed" || status === "not_required" ? "" : "text-muted"}`}>
                  {title}
                  <span className="sr-only">: {label}</span>
                </span>
                <span className="font-mono text-[13px] text-muted">{detail}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <figcaption className="grid gap-1 border-t border-line pt-3 font-mono text-[13px] text-muted">
        <span>Checks last confirmed: {formatMonthYear(specialist.checksLastConfirmed)}</span>
        {soleTrader && (
          <span className="font-sans">*Sole traders aren&apos;t on Companies House, so we checked the owner&apos;s identity and address instead.</span>
        )}
      </figcaption>
    </figure>
  );
}
