import type { FunnelConfig } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  listedQuestion,
  postcodeAreaQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const insulationFunnel: FunnelConfig = {
  serviceSlug: "insulation",
  heading: "Insulation",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "insulationType",
      type: "multi",
      title: "What would you like insulated?",
      hint: "Choose all that apply.",
      summaryLabel: "Looking to insulate",
      layout: "list",
      options: [
        { value: "loft", label: "Loft" },
        { value: "cavity", label: "Cavity walls" },
        { value: "solid-wall", label: "Solid walls", hint: "Internal or external wall insulation" },
        { value: "floor", label: "Floor" },
        { value: "not-sure", label: "Not sure, I'd like advice" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("cavity"),
        text: "Cavity wall insulation isn't suitable for every home, for example walls exposed to driving rain. A good installer will survey the walls first and explain the guarantee they offer.",
      },
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    {
      id: "age",
      type: "single",
      title: "Roughly when was the property built?",
      hint: "Older homes often have solid walls rather than cavity walls.",
      summaryLabel: "Built",
      layout: "list",
      options: [
        { value: "before-1920", label: "Before about 1920" },
        { value: "1920-1990", label: "Between 1920 and 1990" },
        { value: "after-1990", label: "After 1990" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "damp",
      type: "single",
      title: "Are there any signs of damp or mould?",
      summaryLabel: "Damp or mould",
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "yes",
        text: "It's important to deal with the cause of damp before insulating, and to keep good ventilation afterwards. Mention it to your specialist so they can check.",
      },
    },
    propertyTypeQuestion,
    listedQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
