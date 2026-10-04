import type { IconName } from "@/lib/types";

/**
 * A questionnaire is configuration: an ordered list of questions with
 * options and visibility rules. The funnel UI, the server-side validation
 * and the enquiry summary all read the same config.
 */

export type Answers = Record<string, string | string[]>;

export interface Option {
  value: string;
  label: string;
  /** Short helper line under the label. */
  hint?: string;
  icon?: IconName;
}

interface BaseQuestion {
  id: string;
  /** The question as asked on screen. */
  title: string;
  /** Helper text under the title. */
  hint?: string;
  /** Short label used in the enquiry summary, for example "Property type". */
  summaryLabel: string;
  /** Hide the question unless this returns true. */
  showIf?: (answers: Answers) => boolean;
  /** Calm, factual note shown after certain answers. Never alarmist. */
  goodToKnow?: { when: (answer: string | string[]) => boolean; text: string };
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single";
  options: Option[];
  /** Layout of the answer cards. */
  layout?: "grid" | "list";
}

export interface MultiChoiceQuestion extends BaseQuestion {
  type: "multi";
  options: Option[];
  /** Maximum number of selections, if limited. */
  max?: number;
  layout?: "grid" | "list";
}

/** Postcode area chips for the region, plus "Elsewhere". */
export interface PostcodeAreaQuestion extends BaseQuestion {
  type: "postcode-area";
}

/** Full postcode, asked only when the person chose "Elsewhere". */
export interface PostcodeQuestion extends BaseQuestion {
  type: "postcode";
}

export type Question = SingleChoiceQuestion | MultiChoiceQuestion | PostcodeAreaQuestion | PostcodeQuestion;

export interface FunnelConfig {
  serviceSlug: string;
  /** Shown at the top of the funnel, for example "Windows & Doors". */
  heading: string;
  questions: Question[];
  /** Question id and answer value that mean "just researching". */
  researching: { questionId: string; value: string };
}

/** Value used by the postcode-area question when the area isn't listed. */
export const ELSEWHERE = "elsewhere";
