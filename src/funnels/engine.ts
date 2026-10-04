import { regions } from "@/config/regions";
import { normalisePostcode, regionForPostcode } from "@/lib/postcode";
import { ELSEWHERE, type Answers, type FunnelConfig, type Question } from "@/funnels/types";

/** Questions that apply given the answers so far. */
export function visibleQuestions(config: FunnelConfig, answers: Answers): Question[] {
  return config.questions.filter((q) => !q.showIf || q.showIf(answers));
}

/** Allowed values for questions with a fixed set of answers. */
function allowedValues(q: Question): string[] | null {
  if (q.type === "single" || q.type === "multi") return q.options.map((o) => o.value);
  if (q.type === "postcode-area") return [...regions.flatMap((r) => r.postcodeAreas.map((a) => a.code)), ELSEWHERE];
  return null;
}

export function isAnswered(q: Question, value: Answers[string] | undefined): boolean {
  if (value === undefined) return false;
  if (q.type === "multi") return Array.isArray(value) && value.length > 0 && (!q.max || value.length <= q.max);
  return typeof value === "string" && value.length > 0;
}

/**
 * Server-side check that every visible question has a permitted answer.
 * Returns only the answers to visible questions, so hidden or unexpected
 * fields are never stored.
 */
export function validateAnswers(
  config: FunnelConfig,
  input: unknown,
): { ok: true; answers: Answers } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Missing answers." };
  const raw = input as Record<string, unknown>;
  const clean: Answers = {};

  // Visibility depends on earlier answers, so build up the clean set in order.
  for (const q of config.questions) {
    if (q.showIf && !q.showIf(clean)) continue;
    const value = raw[q.id];
    const allowed = allowedValues(q);

    if (q.type === "multi") {
      if (!Array.isArray(value) || value.length === 0) return { ok: false, error: `Please answer: ${q.title}` };
      const values = [...new Set(value.map(String))];
      if (q.max && values.length > q.max) return { ok: false, error: `Too many answers for: ${q.title}` };
      if (allowed && values.some((v) => !allowed.includes(v))) return { ok: false, error: `Invalid answer for: ${q.title}` };
      clean[q.id] = values;
    } else if (q.type === "postcode") {
      const pc = typeof value === "string" ? normalisePostcode(value) : null;
      if (!pc) return { ok: false, error: "Please enter a valid UK postcode." };
      clean[q.id] = pc;
    } else {
      if (typeof value !== "string" || (allowed && !allowed.includes(value))) {
        return { ok: false, error: `Please answer: ${q.title}` };
      }
      clean[q.id] = value;
    }
  }
  return { ok: true, answers: clean };
}

export interface SummaryRow {
  questionId: string;
  label: string;
  value: string;
}

/** Human-readable answers, in question order. Stored with the enquiry as a snapshot. */
export function summarise(config: FunnelConfig, answers: Answers): SummaryRow[] {
  return visibleQuestions(config, answers)
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => {
      const v = answers[q.id];
      let value: string;
      if (q.type === "single" || q.type === "multi") {
        const labels = (Array.isArray(v) ? v : [v]).map((x) => q.options.find((o) => o.value === x)?.label ?? x);
        value = labels.join(", ");
      } else if (q.type === "postcode-area") {
        value = v === ELSEWHERE ? "Elsewhere" : String(v);
      } else {
        value = String(v);
      }
      return { questionId: q.id, label: q.summaryLabel, value };
    });
}

export function isResearching(config: FunnelConfig, answers: Answers): boolean {
  return answers[config.researching.questionId] === config.researching.value;
}

/** Whether the early postcode (asked when "Elsewhere" was chosen) is inside a region we cover. */
export function earlyPostcodeCovered(answers: Answers): boolean | null {
  const pc = typeof answers.postcodeEarly === "string" ? normalisePostcode(answers.postcodeEarly) : null;
  if (!pc) return null;
  return regionForPostcode(pc) !== null;
}
