"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Form";

/** Asks for a click before stopping offers, so link scanners can't do it by accident. */
export function StopOffers({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function stop() {
    setStatus("working");
    const res = await fetch(`/api/offers/${encodeURIComponent(token)}/stop`, { method: "POST" }).catch(() => null);
    setStatus(res?.ok ? "done" : "error");
  }

  return (
    <div className="mx-auto grid max-w-xl justify-items-start gap-4 px-4 py-16 sm:px-6">
      {status === "done" ? (
        <>
          <h1 className="text-[28px] font-bold">Done: no more offers</h1>
          <p className="text-muted">
            We won&apos;t email you offers like this again. You&apos;ll still receive introductions and emails about your account.
          </p>
          <Link href="/" className={buttonClass("secondary")}>
            Back to the homepage
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-[28px] font-bold">Stop offers</h1>
          <p className="text-muted">
            Stop emails about offers such as referral credits. You&apos;ll still receive introductions and emails about your account.
          </p>
          {status === "error" && <FormError>We couldn&apos;t do that just now. Please try again, or reply to our email.</FormError>}
          <button type="button" className={buttonClass("primary")} onClick={stop} disabled={status === "working"}>
            {status === "working" ? "Stopping…" : "Stop offers"}
          </button>
        </>
      )}
    </div>
  );
}
