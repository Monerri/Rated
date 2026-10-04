import Link from "next/link";
import { liveServices, comingSoonServices } from "@/config/services";
import { ArrowIcon, Icon } from "@/components/ui/Icon";
import { RegisterInterest } from "@/components/home/RegisterInterest";

/**
 * Live services start the questionnaire. Coming-soon services open a
 * register-interest form. Both lists come from config/services.ts.
 */
export function ServicePicker({ area }: { area?: string | null }) {
  const query = area ? `?area=${encodeURIComponent(area)}` : "";
  return (
    <div className="grid gap-4">
      <ul className="grid gap-4 md:grid-cols-2">
        {liveServices.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/find-a-specialist/${s.slug}${query}`}
              className="group grid h-full gap-3 rounded-[var(--radius-panel)] border-[1.5px] border-line bg-surface p-6 text-ink no-underline shadow-[var(--shadow-card)] transition-colors hover:border-blue motion-reduce:transition-none"
            >
              <Icon name={s.icon} className="size-10 text-blue" />
              <h3 className="text-xl font-bold">{s.name}</h3>
              <p className="text-[15px] text-muted">{s.summary}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 font-display text-[15px] font-semibold text-blue">
                Start here <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <RegisterInterest services={comingSoonServices} />
    </div>
  );
}
