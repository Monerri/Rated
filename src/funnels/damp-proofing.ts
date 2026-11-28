import type { FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

export const dampProofingFunnel: FunnelConfig = {
  serviceSlug: "damp-proofing",
  heading: "Damp Proofing",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "problem",
      type: "multi",
      title: "What have you noticed?",
      hint: "Choose all that apply.",
      summaryLabel: "Problem",
      layout: "list",
      options: [
        { value: "low-damp", label: "Damp patches low down on walls" },
        { value: "high-damp", label: "Damp patches higher up, or after rain" },
        { value: "condensation", label: "Condensation or black mould" },
        { value: "rot", label: "Rot or woodworm in timber" },
        { value: "cellar", label: "A damp cellar or basement" },
        { value: "not-sure", label: "Not sure, I'd like a survey" },
      ],
      goodToKnow: {
        when: () => true,
        text: "Damp has several possible causes, and the right fix depends on finding the cause. Condensation, leaking gutters and worn pointing are common causes that don't need a damp-proof course. A specialist should explain what's causing it before recommending treatment.",
      },
    },
    postcodeQuestion,
    {
      id: "survey",
      type: "single",
      title: "Has anyone surveyed it?",
      summaryLabel: "Survey",
      layout: "list",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes, I have a report" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
