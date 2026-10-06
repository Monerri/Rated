"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Form";

/** Asks for a click before unsubscribing, so link scanners can't do it by accident. */
export function Unsubscribe({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  async function unsubscribe() {
    setStatus("working");
    const res = await fetch(`/api/interest/${encodeURIComponent(token)}/unsubscribe`, { method: "POST" }).catch(() => null);
    setStatus(res?.ok ? "done" : "error");
  }

  return (
    <div className="mx-auto grid max-w-xl justify-items-start gap-4 px-4 py-16 sm:px-6">
      {status === "done" ? (
        <>
          <h1 className="text-[28px] font-bold">You&apos;ve unsubscribed</h1>
          <p className="text-muted">We won&apos;t email you about this service. You don&apos;t need to do anything else.</p>
          <Link href="/" className={buttonClass("secondary")}>
            Back to the homepage
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-[28px] font-bold">Unsubscribe</h1>
          <p className="text-muted">
            Stop the email we promised to send when this service becomes available in your area.
          </p>
          {status === "error" && <FormError>We couldn&apos;t unsubscribe you just now. Please try again.</FormError>}
          <button type="button" className={buttonClass("primary")} onClick={unsubscribe} disabled={status === "working"}>
            {status === "working" ? "Unsubscribing…" : "Unsubscribe"}
          </button>
        </>
      )}
    </div>
  );
}
