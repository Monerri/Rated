import { services } from "@/config/services";
import { schemeLevelLabels, serviceSchemes } from "@/config/schemes";
import { Icon } from "@/components/ui/Icon";

/** The trade schemes we check, service by service. Levels are shown in words with a symbol, never colour alone. */
export function SchemesByService() {
  const ordered = [...services.filter((s) => s.status === "live"), ...services.filter((s) => s.status !== "live")];
  return (
    <div className="grid gap-4">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]" aria-label="Key">
        {Object.values(schemeLevelLabels).map((l) => (
          <li key={l.label}>
            <span aria-hidden="true" className="font-bold">
              {l.symbol}
            </span>{" "}
            {l.label}
          </li>
        ))}
      </ul>
      <ul className="grid gap-4 md:grid-cols-2">
        {ordered.map((service) => {
          const info = serviceSchemes[service.slug];
          if (!info) return null;
          return (
            <li key={service.slug} className="grid content-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Icon name={service.icon} className="size-6 flex-none text-blue" />
                {service.name}
                {service.status !== "live" && <span className="text-sm font-normal text-muted">(coming soon)</span>}
              </h3>
              {info.requirements.length > 0 && (
                <ul className="grid gap-3">
                  {info.requirements.map((r) => {
                    const level = schemeLevelLabels[r.level];
                    return (
                      <li key={r.covers} className="grid gap-1 text-[15px]">
                        <p className="font-semibold">
                          <span aria-hidden="true">{level.symbol} </span>
                          {level.label}:{" "}
                          {r.anyOf.map((s, i) => (
                            <span key={s.name}>
                              {i > 0 && (i === r.anyOf.length - 1 ? " or " : ", ")}
                              {s.url ? (
                                <a href={s.url} className="text-blue" target="_blank" rel="noopener noreferrer">
                                  {s.name}
                                </a>
                              ) : (
                                s.name
                              )}
                            </span>
                          ))}
                        </p>
                        <p className="text-muted">{r.covers}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              {info.note && <p className="text-[15px] text-muted">{info.note}</p>}
            </li>
          );
        })}
      </ul>
      <p className="text-[15px] text-muted">
        Links go to each scheme&apos;s own website, where you can check a business is registered. We show scheme names
        rather than logos: the logos belong to the schemes, and using them without permission could suggest an
        endorsement we don&apos;t have.
      </p>
    </div>
  );
}
