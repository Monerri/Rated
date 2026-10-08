"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Service } from "@/lib/types";
import type { Answers } from "@/funnels/types";
import { getFunnel } from "@/funnels";
import { ELSEWHERE } from "@/funnels/types";
import { knownPostcodeArea } from "@/config/regions";
import { earlyPostcodeCovered, isResearching, visibleQuestions } from "@/funnels/engine";
import { getSourceInfo } from "@/lib/source";
import { QuestionStep } from "@/components/funnel/QuestionStep";
import { ContactStep, type EnquiryResult } from "@/components/funnel/ContactStep";
import { Confirmation } from "@/components/funnel/Confirmation";
import { ResearchingStep, SaveProgressStep, SavedStep, DeletedStep } from "@/components/funnel/ResearchingSteps";
import { NotifyMe } from "@/components/funnel/NotifyMe";

/** Screens are either a question (by id) or one of the fixed steps. */
type Screen =
  | `q:${string}`
  | "out-of-area"
  | "no-coverage"
  | "researching"
  | "save"
  | "saved"
  | "deleted"
  | "contact"
  | "confirmation";

interface FunnelState {
  answers: Answers;
  screen: Screen;
  history: Screen[];
  /** True once someone who was "just researching" chose to be put in touch. */
  researchingConfirmed: boolean;
  /** Set when the answers were loaded from saved progress, so they can be deleted after submitting. */
  resumeToken: string | null;
}

export function storageKey(serviceSlug: string) {
  return `vn_funnel_${serviceSlug}`;
}

function load(key: string): FunnelState | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FunnelState) : null;
  } catch {
    return null;
  }
}

function save(key: string, state: FunnelState | null) {
  try {
    if (state) sessionStorage.setItem(key, JSON.stringify(state));
    else sessionStorage.removeItem(key);
  } catch {
    // Storage unavailable: progress just won't survive a refresh.
  }
}

async function checkAvailability(serviceSlug: string, answers: Answers): Promise<boolean> {
  const params = new URLSearchParams({ service: serviceSlug });
  if (answers.postcodeArea === ELSEWHERE) params.set("postcode", String(answers.postcodeEarly ?? ""));
  else params.set("area", String(answers.postcodeArea ?? ""));
  try {
    const res = await fetch(`/api/availability?${params}`);
    if (!res.ok) return false;
    return ((await res.json()) as { available: boolean }).available;
  } catch {
    // If the check fails, let them continue; the server checks again on submit.
    return true;
  }
}

/**
 * The questionnaire. Takes the service (plain data) and looks up its config
 * here, because configs contain functions that can't be sent from the server.
 */
export function Funnel({
  service,
  comingSoon,
}: {
  service: Service;
  /** Services offered as optional "tell me when" sign-ups on the confirmation screen. */
  comingSoon: Service[];
}) {
  const config = getFunnel(service.slug)!;
  const key = storageKey(service.slug);
  const firstQuestion = config.questions[0].id;
  // A postcode area chosen earlier (?area=NE) skips that question. Read in the browser so the page can be pre-built.
  const [initialArea, setInitialArea] = useState<string | null>(null);
  const prefilled: Answers = initialArea ? { postcodeArea: initialArea } : {};

  const [state, setState] = useState<FunnelState>({
    answers: prefilled,
    screen: `q:${firstQuestion}`,
    history: [],
    researchingConfirmed: false,
    resumeToken: null,
  });
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore progress after a refresh, or answers loaded from a saved-progress link.
  useEffect(() => {
    getSourceInfo();
    const area = knownPostcodeArea(new URLSearchParams(window.location.search).get("area") ?? undefined);
    const saved = load(key);
    // Browser-only state (session storage, the address bar) can only be read after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setInitialArea(area);
    if (saved) setState(saved);
    else if (area) setState((s) => ({ ...s, answers: { ...s.answers, postcodeArea: area } }));
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key]);

  useEffect(() => {
    if (restored) save(key, state.screen === "deleted" || state.screen === "confirmation" ? null : state);
  }, [key, state, restored]);

  // Move focus to the new heading so screen readers announce each step.
  useEffect(() => {
    if (restored) headingRef.current?.focus();
  }, [state.screen, restored]);

  const go = useCallback((screen: Screen, answers?: Answers, extra?: Partial<FunnelState>) => {
    setState((s) => ({
      ...s,
      ...extra,
      answers: answers ?? s.answers,
      screen,
      history: extra?.history ?? [...s.history, s.screen],
    }));
    window.scrollTo({ top: 0 });
  }, []);

  function back() {
    setState((s) => {
      const history = [...s.history];
      const prev = history.pop();
      return prev ? { ...s, screen: prev, history } : s;
    });
  }

  /** Work out the next screen after answering question `fromId`. */
  async function advance(answers: Answers, fromId: string) {
    if (fromId === "postcodeEarly" && !earlyPostcodeCovered(answers)) return go("out-of-area", answers);

    const isAreaStep = (fromId === "postcodeArea" && answers.postcodeArea !== ELSEWHERE) || fromId === "postcodeEarly";
    const questions = visibleQuestions(config, answers);
    const idx = questions.findIndex((q) => q.id === fromId);
    const next = questions.slice(idx + 1).find((q) => !(initialArea && q.id === "postcodeArea"));
    const atEnd = !next;

    if (isAreaStep || atEnd) {
      setBusy(true);
      const available = await checkAvailability(service.slug, answers);
      setBusy(false);
      if (!available) return go("no-coverage", answers);
    }
    if (next) return go(`q:${next.id}`, answers);
    return go(isResearching(config, answers) ? "researching" : "contact", answers);
  }

  function answer(questionId: string, value: string | string[], advanceNow: boolean) {
    const answers = { ...state.answers, [questionId]: value };
    if (advanceNow) {
      // Let the selected card show briefly before moving on.
      setState((s) => ({ ...s, answers }));
      setTimeout(() => void advance(answers, questionId), 160);
    } else {
      setState((s) => ({ ...s, answers }));
    }
  }

  function startAgain() {
    save(key, null);
    setResult(null);
    setState({ answers: prefilled, screen: `q:${firstQuestion}`, history: [], researchingConfirmed: false, resumeToken: null });
  }

  // Progress counts the questions that apply, plus the contact step.
  const questions = visibleQuestions(config, state.answers).filter((q) => !(initialArea && q.id === "postcodeArea"));
  const total = questions.length + 1;
  const position =
    state.screen === "contact"
      ? total
      : state.screen.startsWith("q:")
        ? questions.findIndex((q) => `q:${q.id}` === state.screen) + 1
        : null;

  const current = state.screen.startsWith("q:") ? config.questions.find((q) => `q:${q.id}` === state.screen) : undefined;
  const finished = ["confirmation", "deleted", "saved"].includes(state.screen);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 pb-16 pt-6 sm:px-6 md:pt-10">
      {!finished && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-sm text-muted">
            {state.history.length > 0 ? (
              <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-1 font-display text-[15px] font-semibold text-blue">
                <span aria-hidden="true">←</span> Back
              </button>
            ) : (
              <Link href="/find-a-specialist" className="inline-flex min-h-11 items-center gap-1 font-display text-[15px] font-semibold text-blue no-underline">
                <span aria-hidden="true">←</span> All services
              </Link>
            )}
            <span>
              {service.name}
              {position ? ` · Step ${position} of ${total}` : ""}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={position ?? total}
          >
            <div
              className="h-full rounded-full bg-green transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${((position ?? total - 0.5) / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div key={state.screen} className="funnel-screen grid gap-6" aria-busy={busy}>
        {current && (
          <>
            <header className="grid gap-2">
              <h1 ref={headingRef} tabIndex={-1} className="text-[26px] font-bold leading-tight outline-none sm:text-[30px]">
                {current.title}
              </h1>
              {current.hint && <p className="text-muted">{current.hint}</p>}
            </header>
            <fieldset disabled={busy} className="contents">
              <QuestionStep
                question={current}
                value={state.answers[current.id]}
                onAnswer={(v, adv) => answer(current.id, v, adv)}
                onContinue={() => void advance(state.answers, current.id)}
              />
            </fieldset>
            {busy && <p className="text-sm text-muted" role="status">Checking your area…</p>}
          </>
        )}

        {state.screen === "out-of-area" && (
          <NotifyMe
            headingRef={headingRef}
            service={service}
            postcode={String(state.answers.postcodeEarly ?? "")}
            title={`We don't cover ${state.answers.postcodeEarly} yet`}
            body={`We're starting in North East England and will expand. Leave your details and we'll email you when ${service.name} is available in your area.`}
          />
        )}

        {state.screen === "no-coverage" && (
          <NotifyMe
            headingRef={headingRef}
            service={service}
            postcode={state.answers.postcodeArea === ELSEWHERE ? String(state.answers.postcodeEarly ?? "") : null}
            postcodeArea={state.answers.postcodeArea === ELSEWHERE ? null : String(state.answers.postcodeArea ?? "")}
            title="We don't have a specialist for your area yet"
            body={`We haven't yet vetted a ${service.name} specialist covering your area. Leave your details and we'll email you when we have.`}
          />
        )}

        {state.screen === "researching" && (
          <ResearchingStep
            headingRef={headingRef}
            onReady={() => go("contact", undefined, { researchingConfirmed: true })}
            onSave={() => go("save")}
            onDelete={() => go("deleted", {}, { history: [] })}
          />
        )}

        {state.screen === "save" && (
          <SaveProgressStep
            headingRef={headingRef}
            service={service}
            answers={state.answers}
            onSaved={() => go("saved", {}, { history: [] })}
          />
        )}

        {state.screen === "saved" && <SavedStep headingRef={headingRef} />}
        {state.screen === "deleted" && <DeletedStep headingRef={headingRef} onStartAgain={startAgain} />}

        {state.screen === "contact" && (
          <ContactStep
            headingRef={headingRef}
            service={service}
            answers={state.answers}
            researchingConfirmed={state.researchingConfirmed}
            onSubmitted={(r) => {
              if (state.resumeToken) void fetch(`/api/saved-progress/${state.resumeToken}`, { method: "DELETE" });
              setResult(r);
              go("confirmation", undefined, { history: [] });
            }}
          />
        )}

        {state.screen === "confirmation" && result && <Confirmation headingRef={headingRef} result={result} comingSoon={comingSoon} />}
        {state.screen === "confirmation" && !result && (
          <div className="grid gap-4">
            <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-bold outline-none">
              We&apos;ve got your details
            </h1>
            <p className="text-muted">We&apos;ve emailed you the name of your specialist and what happens next.</p>
          </div>
        )}
      </div>
    </div>
  );
}
