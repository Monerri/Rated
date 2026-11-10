import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const HEATING = ["boiler-new", "boiler-repair", "radiators", "central-heating"];
const isHeating = (a: Answers) => Array.isArray(a.work) && a.work.some((w) => HEATING.includes(w));

export const plumbingFunnel: FunnelConfig = {
  serviceSlug: "plumbing",
  heading: "Plumbing & Heating",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Some firms only do heating and boilers, some only general plumbing.
  leadTypes: {
    options: [
      { value: "heating", label: "Boilers and heating" },
      { value: "plumbing", label: "General plumbing" },
    ],
    of: (a) => (isHeating(a) ? "heating" : "plumbing"),
  },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What do you need?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "boiler-new", label: "A new boiler" },
        { value: "boiler-repair", label: "A boiler repair or service" },
        { value: "radiators", label: "New or moved radiators" },
        { value: "central-heating", label: "A new central heating system" },
        { value: "hot-water", label: "A hot water cylinder" },
        { value: "pipework", label: "New pipework, taps or toilets" },
        { value: "leak", label: "A leak or blockage" },
      ],
    },
    postcodeQuestion,
    {
      id: "fuel",
      type: "single",
      title: "How is the home heated now?",
      summaryLabel: "Heating fuel",
      layout: "list",
      showIf: isHeating,
      options: [
        { value: "gas", label: "Mains gas" },
        { value: "oil", label: "Oil" },
        { value: "lpg", label: "LPG", hint: "Bottled or tank gas" },
        { value: "electric", label: "Electric" },
        { value: "none", label: "No central heating" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "gas" || v === "lpg" || v === "oil",
        text: "By law, anyone working on gas appliances must be on the Gas Safe Register: ask to see their ID card. Oil boilers are best fitted by an OFTEC registered technician, who can certify the work.",
      },
    },
    {
      id: "boilerAge",
      type: "single",
      title: "Roughly how old is your current boiler?",
      summaryLabel: "Boiler age",
      layout: "list",
      showIf: (a) => Array.isArray(a.work) && (a.work.includes("boiler-new") || a.work.includes("boiler-repair")),
      options: [
        { value: "under-5", label: "Under 5 years" },
        { value: "5-10", label: "5 to 10 years" },
        { value: "over-10", label: "Over 10 years" },
        { value: "none", label: "There isn't one" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
