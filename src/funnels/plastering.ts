import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const work = (a: Answers) => (Array.isArray(a.work) ? a.work : []);
const INSIDE = ["replaster", "ceiling", "coving", "patch", "plasterboard"];

function kinds(a: Answers): string[] {
  const w = work(a);
  const out: string[] = [];
  if (w.some((x) => INSIDE.includes(x))) out.push("plastering");
  if (w.includes("render")) out.push("rendering");
  return out;
}

export const plasteringFunnel: FunnelConfig = {
  serviceSlug: "plastering",
  heading: "Plastering & Rendering",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Some plasterers don't render, and some renderers only work outside.
  leadTypes: {
    options: [
      { value: "plastering", label: "Plastering inside" },
      { value: "rendering", label: "Rendering outside" },
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
        { value: "replaster", label: "Re-plastering or skimming walls" },
        { value: "ceiling", label: "Plastering or replacing a ceiling" },
        { value: "patch", label: "Patch repairs or cracks" },
        { value: "plasterboard", label: "Plasterboard or dry lining", hint: "For example a new stud wall" },
        { value: "coving", label: "Coving or decorative mouldings" },
        { value: "render", label: "Rendering outside walls", hint: "New render or repairs" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("render"),
        text: "Renewing the render on more than a quarter of an outside wall usually means it must also meet insulation standards under Building Regulations, and in a conservation area new render can need planning permission. Your specialist can explain what applies.",
      },
    },
    postcodeQuestion,
    {
      id: "rooms",
      type: "single",
      title: "How much plastering inside?",
      summaryLabel: "Rooms",
      layout: "list",
      showIf: (a) => work(a).some((x) => INSIDE.includes(x)),
      options: [
        { value: "small", label: "A small area or one wall" },
        { value: "1-2", label: "One or two rooms" },
        { value: "3+", label: "Three rooms or more" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
