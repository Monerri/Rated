"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getService } from "@/config/services";
import { getFunnel } from "@/funnels";
import { summarise } from "@/funnels/engine";
import type { Answers } from "@/funnels/types";
import { storageKey } from "@/components/funnel/Funnel";
import { buttonClass } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Form";

type Loaded = { serviceSlug: string; answers: Answers; createdAt: string };
type State = { status: "loading" } | { status: "missing" } | { status: "ready"; data: Loaded } | { status: "deleted" };

export function SavedProgress({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/saved-progress/${encodeURIComponent(token)}`)
      .then(async (res) => (res.ok ? ((await res.json()) as Loaded) : null))
      .catch(() => null)
      .then((data) => {
        if (!cancelled) setState(data ? { status: "ready", data } : { status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function remove() {
    const res = await fetch(`/api/saved-progress/${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) setState({ status: "deleted" });
    else setError("We couldn't delete your answers just now. Please try again.");
  }

  function carryOn(data: Loaded) {
    // Re-ask the timescale so they can update it, then continue as normal.
    const resume = {
      answers: data.answers,
      screen: "q:timescale",
      history: [],
      researchingConfirmed: false,
      resumeToken: token,
    };
    try {
      sessionStorage.setItem(storageKey(data.serviceSlug), JSON.stringify(resume));
    } catch {
      setError("Your browser blocked us from loading your answers. Please allow site data and try again.");
      return;
    }
    router.push(`/find-a-specialist/${data.serviceSlug}`);
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12 sm:px-6">
      {state.status === "loading" && <p role="status">Loading your answers…</p>}

      {state.status === "missing" && (
        <>
          <h1 className="text-[28px] font-bold">We couldn&apos;t find those answers</h1>
          <p className="text-muted">They may have been deleted, or the link may have expired.</p>
          <Link href="/find-a-specialist" className={buttonClass("primary", "md", "justify-self-start")}>
            Start again
          </Link>
        </>
      )}

      {state.status === "deleted" && (
        <>
          <h1 className="text-[28px] font-bold">We&apos;ve deleted your answers</h1>
          <p className="text-muted">Nothing was shared with any company.</p>
          <Link href="/guides" className={buttonClass("secondary", "md", "justify-self-start")}>
            Read our guides
          </Link>
        </>
      )}

      {state.status === "ready" && (() => {
        const service = getService(state.data.serviceSlug);
        const funnel = getFunnel(state.data.serviceSlug);
        const rows = funnel ? summarise(funnel, state.data.answers) : [];
        return (
          <>
            <h1 className="text-[28px] font-bold">Your saved {service?.name ?? ""} answers</h1>
            <p className="text-muted">We haven&apos;t shared these with anyone. Carry on when you&apos;re ready, or delete them.</p>
            <dl className="grid divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
              {rows.map((r) => (
                <div key={r.questionId} className="grid gap-0.5 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
                  <dt className="text-sm text-muted">{r.label}</dt>
                  <dd className="text-[15px] font-semibold">{r.value}</dd>
                </div>
              ))}
            </dl>
            {error && <FormError>{error}</FormError>}
            <div className="flex flex-wrap gap-3">
              <button type="button" className={buttonClass("primary")} onClick={() => carryOn(state.data)}>
                Carry on
              </button>
              <button type="button" className={buttonClass("secondary")} onClick={remove}>
                Delete my answers
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
