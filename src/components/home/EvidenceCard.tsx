import { vettingChecks } from "@/config/vetting";
import { formatMonthYear } from "@/lib/format";
import { getService } from "@/config/services";
import type { PublicSpecialist } from "@/lib/types";
import { TickIcon } from "@/components/ui/Icon";

/**
 * Shows a specialist's checks as evidence. Check titles come from the vetting
 * config, so a new check appears here automatically.
 */
export function EvidenceCard({ specialist }: { specialist: PublicSpecialist }) {
  const serviceNames = specialist.services.map((s) => getService(s)?.name).filter(Boolean).join(" · ");

  return (
    <figure
      className="grid gap-4 rounded-[var(--radius-panel)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
      aria-label={`Checks for ${specialist.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold leading-snug">{specialist.name}</p>
          <p className="text-sm text-muted">{serviceNames}</p>
        </div>
        {specialist.isDemo && (
          <span className="whitespace-nowrap rounded border border-dashed border-line px-1.5 py-1 font-mono text-[11px] text-muted">
            DEMO DATA
          </span>
        )}
      </div>

      <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full bg-green-tint px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-green">
        <TickIcon />
        Vetted specialist
      </span>

      <ul className="grid gap-2.5">
        {vettingChecks.map((def) => {
          const result = specialist.checks.find((c) => c.id === def.id);
          const notApplicable = !!result?.notApplicableReason && !result.passed;
          if (!result?.passed && !notApplicable) return null;
          const title =
            def.id === "google_rating" ? `${specialist.googleRating.toFixed(1)} ★ Google rating` : def.title;
          return (
            <li key={def.id} className="grid grid-cols-[22px_1fr] items-start gap-2.5">
              <span
                className={`mt-0.5 grid size-[22px] place-items-center rounded-full ${notApplicable ? "border-[1.5px] border-line text-muted" : "bg-green text-surface"}`}
                aria-hidden="true"
              >
                {notApplicable ? "–" : <TickIcon />}
              </span>
              <span>
                <span className="block text-[15px] font-semibold leading-snug">
                  {title}
                  <span className="sr-only">{notApplicable ? ": not applicable" : ": passed"}</span>
                </span>
                <span className="font-mono text-[13px] text-muted">{notApplicable ? result?.notApplicableReason : result?.evidence}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <figcaption className="border-t border-line pt-3 font-mono text-[13px] text-muted">
        Checks last confirmed: {formatMonthYear(specialist.checksLastConfirmed)}
      </figcaption>
    </figure>
  );
}
