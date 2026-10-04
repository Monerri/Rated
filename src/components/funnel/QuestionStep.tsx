"use client";

import { useState } from "react";
import { primaryRegion } from "@/config/regions";
import { ELSEWHERE, type Answers, type Option, type Question } from "@/funnels/types";
import { isAnswered } from "@/funnels/engine";
import { normalisePostcode } from "@/lib/postcode";
import { Icon } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import { GoodToKnow, TextField } from "@/components/ui/Form";

const cardBase =
  "flex w-full rounded-[var(--radius-card)] border-[1.5px] bg-surface text-left text-ink transition-colors hover:border-blue motion-reduce:transition-none aria-pressed:border-blue aria-pressed:bg-blue-tint aria-pressed:shadow-[inset_0_0_0_1px_var(--blue)]";

/**
 * One question per screen. Single-choice answers move on automatically,
 * unless the answer brings up a "Good to know" note.
 */
export function QuestionStep({
  question,
  value,
  onAnswer,
  onContinue,
}: {
  question: Question;
  value: Answers[string] | undefined;
  /** Records the answer; `advance` moves straight on to the next screen. */
  onAnswer: (value: string | string[], advance: boolean) => void;
  onContinue: () => void;
}) {
  const note = question.goodToKnow && value !== undefined && question.goodToKnow.when(value) ? question.goodToKnow.text : null;

  if (question.type === "postcode") {
    return <PostcodeInput initial={typeof value === "string" ? value : ""} onSubmit={(pc) => onAnswer(pc, true)} />;
  }

  if (question.type === "postcode-area") {
    const choose = (code: string) => onAnswer(code, true);
    return (
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {primaryRegion.postcodeAreas.map((a) => (
          <li key={a.code}>
            <button type="button" aria-pressed={value === a.code} onClick={() => choose(a.code)} className={`${cardBase} min-h-[76px] flex-col gap-1 border-line p-3.5`}>
              <span className="font-display text-2xl font-bold tracking-wide">{a.code}</span>
              <span className="text-[13px] leading-snug text-muted">{a.places}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" aria-pressed={value === ELSEWHERE} onClick={() => choose(ELSEWHERE)} className={`${cardBase} min-h-[76px] flex-col gap-1 border-dashed border-line p-3.5`}>
            <span className="font-display text-lg font-semibold">Elsewhere</span>
            <span className="text-[13px] leading-snug text-muted">We&apos;ll check your area</span>
          </button>
        </li>
      </ul>
    );
  }

  const multi = question.type === "multi";
  const selected = multi ? (Array.isArray(value) ? value : []) : [];
  const max = multi ? question.max : undefined;
  const hasIcons = question.options.some((o) => o.icon);
  const layout = question.layout ?? (hasIcons ? "grid" : "list");

  function select(o: Option) {
    if (multi) {
      const next = selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value];
      if (max && next.length > max) return;
      onAnswer(next, false);
      return;
    }
    onAnswer(o.value, !question.goodToKnow?.when(o.value));
  }

  return (
    <div className="grid gap-5">
      <ul className={layout === "grid" ? "grid grid-cols-2 gap-2.5" : "grid gap-2.5"}>
        {question.options.map((o) => {
          const pressed = multi ? selected.includes(o.value) : value === o.value;
          const atLimit = multi && !!max && selected.length >= max && !pressed;
          return (
            <li key={o.value}>
              <button
                type="button"
                aria-pressed={pressed}
                aria-disabled={atLimit || undefined}
                onClick={() => select(o)}
                className={`${cardBase} border-line ${
                  layout === "grid" ? "min-h-[104px] flex-col items-start gap-2.5 p-4" : "min-h-14 items-center gap-3 px-4 py-3"
                } ${atLimit ? "opacity-55" : ""}`}
              >
                {o.icon && <Icon name={o.icon} className="size-8 flex-none text-blue" />}
                {multi && layout === "list" && (
                  <span
                    aria-hidden="true"
                    className={`grid size-[22px] flex-none place-items-center rounded-[5px] border-[1.5px] ${pressed ? "border-blue bg-blue text-on-blue" : "border-line"}`}
                  >
                    {pressed && "✓"}
                  </span>
                )}
                <span className="font-display text-base font-semibold leading-snug">{o.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {multi && max && (
        <p className="text-sm text-muted" aria-live="polite">
          {selected.length} of {max} chosen
        </p>
      )}

      {note && <GoodToKnow>{note}</GoodToKnow>}

      {(multi || note) && (
        <button
          type="button"
          className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}
          disabled={!isAnswered(question, value)}
          onClick={onContinue}
        >
          Continue
        </button>
      )}
    </div>
  );
}

function PostcodeInput({ initial, onSubmit }: { initial: string; onSubmit: (postcode: string) => void }) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const pc = normalisePostcode(text);
        if (!pc) return setError("Please enter a full UK postcode, for example NE1 4ST.");
        onSubmit(pc);
      }}
    >
      <TextField
        label="Postcode"
        name="postcode"
        autoComplete="postal-code"
        autoCapitalize="characters"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
      />
      <button type="submit" className={buttonClass("primary", "md", "w-full sm:w-auto sm:justify-self-start")}>
        Continue
      </button>
    </form>
  );
}
