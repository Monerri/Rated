"use client";

import { useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/types";
import { getSourceInfo } from "@/lib/source";
import { Icon } from "@/components/ui/Icon";
import { InterestForm } from "@/components/interest/InterestForm";

/**
 * Coming-soon service cards. Each is a real link to its register-interest
 * page, upgraded to open the form in a dialog when JavaScript is available.
 */
export function RegisterInterest({ services }: { services: Service[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [service, setService] = useState<Service | null>(null);

  useEffect(() => {
    // Record the landing source on first render, before any navigation.
    getSourceInfo();
  }, []);

  function open(e: React.MouseEvent, s: Service) {
    if (!dialogRef.current?.showModal) return; // fall back to the page
    e.preventDefault();
    setService(s);
    dialogRef.current.showModal();
  }

  if (services.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {services.map((s) => (
          <li key={s.slug}>
            <a
              href={`/register-interest/${s.slug}`}
              onClick={(e) => open(e, s)}
              aria-haspopup="dialog"
              className="grid h-full w-full justify-items-start gap-2 rounded-[var(--radius-card)] border-[1.5px] border-dashed border-line p-4 text-left text-ink no-underline transition-colors hover:border-solid hover:border-blue motion-reduce:transition-none"
            >
              <Icon name={s.icon} className="size-7 text-muted" />
              <span className="font-display text-[15px] font-semibold leading-tight">{s.name}</span>
              <span className="rounded-full bg-ground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Coming soon
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Coming soon? Tap a service to hear when it becomes available in your area.</p>

      <dialog
        ref={dialogRef}
        aria-label={service ? `Register interest in ${service.name}` : "Register interest"}
        className="m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md overflow-y-auto rounded-[var(--radius-panel)] border border-line bg-surface p-6 text-ink"
        onClose={() => setService(null)}
      >
        {/* Keyed so the form resets each time a different service is opened. */}
        {service && <InterestForm key={service.slug} service={service} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}
