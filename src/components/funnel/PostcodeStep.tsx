"use client";

import { useState } from "react";
import { normalisePostcode } from "@/lib/postcode";
import { buttonClass } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";

type LocateState =
  | { kind: "idle" }
  | { kind: "finding" }
  | { kind: "found"; postcode: string }
  | { kind: "failed"; message: string; showHelp?: boolean };

type Device = "ios" | "android" | "computer";

function deviceType(): Device {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "computer";
}

/**
 * A site can't switch location on itself, and once it's been blocked the
 * browser won't ask again, so we explain where to switch it on.
 */
const LOCATION_HELP: Record<Device, string[]> = {
  ios: [
    "Open Settings, then Privacy & Security, then Location Services, and check it's on.",
    "In the same list, tap Safari Websites (or Chrome, if you use it) and choose While Using the App.",
    "Back here, tap the page settings button in the address bar (it may show aA), then Website Settings, and set Location to Ask or Allow.",
    "Tap Try again.",
  ],
  android: [
    "Swipe down from the top of the screen and check Location is switched on.",
    "Tap the icon to the left of the web address, then Permissions or Site settings, and allow Location.",
    "Tap Try again.",
  ],
  computer: [
    "Click the icon to the left of the web address and allow Location for this site.",
    "Check location is switched on in your computer's privacy settings.",
    "Click Try again.",
  ],
};

/**
 * The property's postcode, asked once near the start. Typed, or filled in
 * from the phone or computer's location if the person chooses. The
 * postcode is checked against the official list before moving on; if that
 * check can't be made, a correctly formatted postcode is accepted.
 */
export function PostcodeStep({ initial, onSubmit }: { initial: string; onSubmit: (postcode: string) => void }) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [locate, setLocate] = useState<LocateState>({ kind: "idle" });
  const canLocate = typeof navigator !== "undefined" && "geolocation" in navigator;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const pc = normalisePostcode(text);
    if (!pc) return setError("Please enter a full UK postcode, for example NE1 4ST.");
    setText(pc);
    setError(null);
    setChecking(true);
    const res = await fetch(`/api/postcode?postcode=${encodeURIComponent(pc)}`).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { exists?: boolean | null } | null;
    setChecking(false);
    if (body?.exists === false) {
      return setError(`We couldn't find ${pc}. Please check it, for example for an O typed instead of a 0.`);
    }
    onSubmit(pc);
  }

  function useLocation() {
    setError(null);
    setLocate({ kind: "finding" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const params = new URLSearchParams({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) });
        const res = await fetch(`/api/postcode?${params}`).catch(() => null);
        const body = (await res?.json().catch(() => null)) as { postcode?: string; error?: string } | null;
        if (res?.ok && body?.postcode) {
          setText(body.postcode);
          setLocate({ kind: "found", postcode: body.postcode });
        } else {
          setLocate({ kind: "failed", message: body?.error ?? "We couldn't find your postcode. Please type it instead." });
        }
      },
      (err) =>
        setLocate({
          kind: "failed",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location is switched off for this site. You can type your postcode above, or switch location on and try again."
              : "We couldn't get your location. You can type your postcode above, or check location is switched on and try again.",
          showHelp: err.code !== err.TIMEOUT,
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      <TextField
        label="Postcode"
        name="postcode"
        autoComplete="postal-code"
        autoCapitalize="characters"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (locate.kind !== "idle") setLocate({ kind: "idle" });
        }}
        onBlur={() => {
          const pc = normalisePostcode(text);
          if (pc) setText(pc);
        }}
        error={error}
      />

      {canLocate && (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={useLocation}
            disabled={locate.kind === "finding"}
            className={buttonClass("secondary", "md", "w-full sm:w-auto sm:justify-self-start")}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {locate.kind === "finding" ? "Finding your postcode…" : "Use my location"}
          </button>
          <p className="text-sm text-muted" role="status" aria-live="polite">
            {locate.kind === "found"
              ? `We found ${locate.postcode}. Please check it's the property's postcode, then continue.`
              : locate.kind === "failed"
                ? locate.message
                : "We use your location once, to find your postcode. We don't keep it."}
          </p>
          {locate.kind === "failed" && locate.showHelp && (
            <details className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
              <summary className="cursor-pointer font-semibold text-blue">How to switch on location</summary>
              <ol className="mt-3 grid list-decimal gap-2 pl-5">
                {LOCATION_HELP[deviceType()].map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <button type="button" onClick={useLocation} className={buttonClass("secondary", "sm", "mt-4")}>
                Try again
              </button>
            </details>
          )}
        </div>
      )}

      <div className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-[15px]">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 flex-none text-green" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </svg>
        <p>
          <strong className="font-semibold">Our promise:</strong> we won&apos;t pass your postcode, or anything else you
          tell us, to any company until you ask us to put you in touch.
        </p>
      </div>

      <button
        type="submit"
        disabled={checking}
        className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}
      >
        {checking ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
