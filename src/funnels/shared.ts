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

/**
 * We only introduce property owners: specialists need the owner's agreement
 * to quote and carry out work. Every questionnaire asks this (see
 * withStandardQuestions in funnels/index.ts), and "not-owner" ends it kindly.
 */
export const OWNERSHIP = "ownership";
export const NOT_OWNER = "not-owner";

export const ownershipQuestion: Question = {
  id: OWNERSHIP,
  type: "single",
  title: "Do you own the property?",
  hint: "We can only put property owners in touch with specialists.",
  summaryLabel: "Ownership",
  layout: "list",
  options: [
    { value: "sole", label: "Yes, I'm the sole owner" },
    { value: "joint", label: "Yes, I own it jointly", hint: "For example, with a partner or spouse" },
    { value: NOT_OWNER, label: "No, I don't own it", hint: "For example, I rent or live with family" },
  ],
  goodToKnow: {
    when: (v) => v === "joint",
    text: "It's a good idea to check the other owner is happy for you to get quotes, as they'll usually need to agree to the work too.",
  },
};

export const PROPERTY_USE = "propertyUse";

export const propertyUseQuestion: Question = {
  id: PROPERTY_USE,
  type: "single",
  title: "Is the property a home or a business?",
  summaryLabel: "Property use",
  options: [
    { value: "residential", label: "A home", hint: "Residential" },
    { value: "business", label: "A business", hint: "Commercial premises" },
  ],
};

/** Asked in every questionnaire, straight after the first question. */
export const standardQuestions: Question[] = [ownershipQuestion, propertyUseQuestion];

export const propertyTypeQuestion: Question = {
  id: "propertyType",
  type: "single",
  title: "What type of property is it?",
  summaryLabel: "Property type",
  // House types don't describe business premises.
  showIf: (a) => a[PROPERTY_USE] !== "business",
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

/**
 * The homeowner decides how many specialists contact them. The questionnaire
 * hides choices above the number who cover their area, and skips the
 * question when only one does.
 */
export const SPECIALIST_COUNT = "specialistCount";

export const specialistCountQuestion: Question = {
  id: SPECIALIST_COUNT,
  type: "single",
  title: "How many specialists would you like to hear from?",
  hint: "You're in control. We'll only share your details with the number you choose.",
  summaryLabel: "Specialists requested",
  layout: "list",
  options: [
    { value: "1", label: "One", hint: "The fewest calls" },
    { value: "2", label: "Two", hint: "Compare two quotes" },
    { value: "3", label: "Three", hint: "Compare three quotes" },
  ],
};
