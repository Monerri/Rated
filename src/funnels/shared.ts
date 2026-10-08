import type { Question } from "@/funnels/types";
import { ELSEWHERE } from "@/funnels/types";

/** Questions reused across services, so wording stays consistent. */

export const postcodeAreaQuestion: Question = {
  id: "postcodeArea",
  type: "postcode-area",
  title: "Where is the property?",
  hint: "Choose the start of your postcode. We'll ask for the full postcode later.",
  summaryLabel: "Area",
};

export const fullPostcodeQuestion: Question = {
  id: "postcodeEarly",
  type: "postcode",
  title: "What's the postcode of the property?",
  hint: "We'll check whether we have vetted specialists in your area.",
  summaryLabel: "Postcode",
  showIf: (a) => a.postcodeArea === ELSEWHERE,
};

export const propertyTypeQuestion: Question = {
  id: "propertyType",
  type: "single",
  title: "What type of property do you live in?",
  summaryLabel: "Property type",
  options: [
    { value: "detached", label: "Detached" },
    { value: "semi-detached", label: "Semi-detached" },
    { value: "terraced", label: "Terraced" },
    { value: "bungalow", label: "Bungalow" },
    { value: "other", label: "Other" },
  ],
};

export const listedQuestion: Question = {
  id: "listed",
  type: "single",
  title: "Is the property listed or in a conservation area?",
  summaryLabel: "Listed or conservation area",
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "not-sure", label: "Not sure" },
  ],
  goodToKnow: {
    when: (v) => v === "yes" || v === "not-sure",
    text: "Listed buildings and conservation areas can have extra rules about what can be changed. Your specialist can advise and, where needed, help you check with your local council.",
  },
};

export const RESEARCHING = "researching";

export const timescaleQuestion: Question = {
  id: "timescale",
  type: "single",
  title: "When are you looking to do the work?",
  summaryLabel: "Timescale",
  layout: "list",
  options: [
    { value: "asap", label: "As soon as possible" },
    { value: "1-3-months", label: "In 1 to 3 months" },
    { value: "3-6-months", label: "In 3 to 6 months" },
    { value: RESEARCHING, label: "Just researching" },
  ],
};
