import { CarryAreaLink } from "@/components/home/CarryAreaLink";
import { ArrowIcon, Icon } from "@/components/ui/Icon";
import type { Service } from "@/lib/types";

/** Cards for live services. Each starts that service's questionnaire. */
export function LiveServiceCards({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {services.map((s) => (
        <li key={s.slug}>
          <CarryAreaLink
            href={`/find-a-specialist/${s.slug}`}
            className="group grid h-full content-start gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-6 text-ink no-underline transition-colors hover:border-blue motion-reduce:transition-none sm:p-7"
          >
            <span className="grid size-14 place-items-center rounded-[var(--radius-card)] border border-line bg-ground">
              <Icon name={s.icon} className="size-8 text-blue" />
            </span>
            <h3 className="text-[22px] font-semibold leading-tight">{s.name}</h3>
            <p className="text-[15px] text-muted">{s.summary}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 font-display text-[15px] font-semibold text-blue">
              Start here <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </span>
          </CarryAreaLink>
        </li>
      ))}
    </ul>
  );
}
