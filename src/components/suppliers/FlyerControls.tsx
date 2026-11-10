"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";

/** On screen only: choose where the flyer will be left, then print. */
export function FlyerControls({ source, link, siteUrl }: { source: string; link: string; siteUrl: string }) {
  const [where, setWhere] = useState(source === "flyer" ? "" : source);
  return (
    <div data-screen-only className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <h2 className="text-xl font-bold">Print a flyer</h2>
      <p className="text-[15px] text-muted">
        Say where you&apos;ll leave this batch, for example &ldquo;Jewson Durham&rdquo;. The QR code then records it, so you
        can see which places bring in applications. Print on A4.
      </p>
      <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextField label="Where it'll be left" name="source" value={where} onChange={(e) => setWhere(e.target.value)} />
        <button type="submit" className={buttonClass("secondary")}>
          Update the QR code
        </button>
      </form>
      <p className="break-all font-mono text-xs text-muted">QR code link: {link}</p>
      <p className="text-[15px]">
        <strong>Before printing:</strong> the QR code points to {siteUrl}. Only print once that web address is connected
        to the site.
      </p>
      <button type="button" onClick={() => window.print()} className={`${buttonClass("primary")} justify-self-start`}>
        Print
      </button>
    </div>
  );
}
