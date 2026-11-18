import { formatMonthYear } from "@/lib/format";
import { getService } from "@/config/services";
import { isVerified } from "@/lib/vetting";
import { checkRows } from "@/lib/checkSummary";
import type { PublicSpecialist } from "@/lib/types";
import { TickIcon } from "@/components/ui/Icon";
import { VerifiedBadge } from "@/components/checks/VerifiedBadge";

/**
 * Shows a specialist's checks as evidence: the Verified badge if they've
 * passed every check, then four rows (see lib/checkSummary.ts), each with one
 * line of detail. Status is always a symbol and words, not colour alone.
 */
export function EvidenceCard({ specialist }: { specialist: PublicSpecialist }) {
  const serviceNames = specialist.services.map((s) => getService(s)?.name).filter(Boolean).join(" · ");
  const verified = isVerified(specialist);
  const soleTrader = specialist.checks.some((c) => c.id === "registered_company" && c.soleTrader);

  return (
    <figure
      className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-6"
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
        <VerifiedBadge />
      ) : (
        <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
          <TickIcon />
          Checked specialist
        </span>
      )}

      <ul className="grid gap-2.5">
        {checkRows(specialist).map((row) => {
          const label = row.status === "passed" ? "passed" : row.status === "not_required" ? "not required" : "not fully checked";
          return (
            <li key={row.title} className="grid min-w-0 grid-cols-[22px_1fr] items-start gap-2.5">
              <span
                className={`mt-0.5 grid size-[22px] place-items-center rounded-full ${
                  row.status === "passed" ? "bg-green text-surface" : "border-[1.5px] border-line text-muted"
                }`}
                aria-hidden="true"
              >
                {row.status === "passed" ? <TickIcon /> : row.status === "not_required" ? "–" : "○"}
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-semibold leading-snug ${row.status === "partial" ? "text-muted" : ""}`}>
                  {row.title}
                  <span className="sr-only">: {label}</span>
                </span>
                {/* Always one line; the full text is in the tooltip if it ever has to be cut short. */}
                <span className="block truncate text-[13px] text-muted" title={row.detail}>
                  {row.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <figcaption className="grid gap-1 border-t border-line pt-3 text-[13px] text-muted">
        <span>Checks last confirmed: {formatMonthYear(specialist.checksLastConfirmed)}</span>
        {soleTrader && (
          <span className="font-sans">*Sole traders aren&apos;t on Companies House, so we checked the owner&apos;s identity and address instead.</span>
        )}
      </figcaption>
    </figure>
  );
}
