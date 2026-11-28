import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const work = (a: Answers) => (Array.isArray(a.work) ? a.work : []);
const FITTED = ["wardrobes", "built-in"];

function kinds(a: Answers): string[] {
  const w = work(a);
  const out: string[] = [];
  if (w.some((x) => !FITTED.includes(x))) out.push("joinery");
  if (w.some((x) => FITTED.includes(x))) out.push("fitted-furniture");
  return out;
}

export const carpentryJoineryFunnel: FunnelConfig = {
  serviceSlug: "carpentry-joinery",
  heading: "Carpentry & Joinery",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Fitted furniture makers and general joiners are often different firms.
  leadTypes: {
    options: [
      { value: "joinery", label: "Doors, stairs and general joinery" },
      { value: "fitted-furniture", label: "Fitted wardrobes and built-in furniture" },
    ],
    of: kinds,
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
        { value: "internal-doors", label: "Internal doors" },
        { value: "fire-doors", label: "Fire doors" },
        { value: "staircase", label: "A new or renovated staircase" },
        { value: "trims", label: "Skirting, architraves or panelling" },
        { value: "wardrobes", label: "Fitted wardrobes" },
        { value: "built-in", label: "Built-in storage or units", hint: "Alcoves, media walls, window seats" },
        { value: "other", label: "Other joinery", hint: "Something made to measure" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("fire-doors"),
        text: "A fire door only works if it's fitted with the right frame, seals, hinges and closer. In homes with three or more storeys, and in flats, Building Regulations can require them. Ask your specialist how they'll certify the fitting.",
      },
    },
    postcodeQuestion,
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
