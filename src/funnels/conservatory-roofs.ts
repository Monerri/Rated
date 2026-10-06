import type { FunnelConfig } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  listedQuestion,
  postcodeAreaQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  timescaleQuestion,
} from "@/funnels/shared";

export const conservatoryRoofsFunnel: FunnelConfig = {
  serviceSlug: "conservatory-roofs",
  heading: "Conservatory Roofs",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "roofType",
      type: "single",
      title: "What type of roof does your conservatory have now?",
      summaryLabel: "Current roof",
      layout: "list",
      options: [
        { value: "polycarbonate", label: "Polycarbonate", hint: "Plastic sheets, often ribbed or cloudy" },
        { value: "glass", label: "Glass" },
        { value: "solid", label: "Already solid or tiled" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    {
      id: "size",
      type: "single",
      title: "Roughly how big is the conservatory?",
      hint: "A rough idea is fine. Your specialist will measure up.",
      summaryLabel: "Approximate size",
      layout: "list",
      options: [
        { value: "small", label: "Small", hint: "Up to about 3m × 3m" },
        { value: "medium", label: "Medium", hint: "Up to about 4m × 4m" },
        { value: "large", label: "Large", hint: "Bigger than 4m × 4m" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "mainProblem",
      type: "multi",
      title: "What's the main problem with it now?",
      hint: "Choose up to three.",
      summaryLabel: "Main problems",
      max: 3,
      layout: "list",
      options: [
        { value: "too-hot", label: "Too hot in summer" },
        { value: "too-cold", label: "Too cold in winter" },
        { value: "leaks", label: "Leaks" },
        { value: "rain-noise", label: "Noisy when it rains" },
        { value: "condensation", label: "Condensation" },
        { value: "tired", label: "Looks tired or dated" },
      ],
    },
    {
      id: "desiredOutcome",
      type: "single",
      title: "What would you like to replace it with?",
      summaryLabel: "Desired outcome",
      layout: "list",
      options: [
        { value: "solid-tiled", label: "A solid, tiled roof", hint: "Looks and feels more like part of the house" },
        { value: "glass", label: "A new glass roof", hint: "Keeps the light, with modern glazing" },
        { value: "lightweight-panel", label: "A lightweight insulated panel roof" },
        { value: "advice", label: "Not sure, I'd like advice" },
      ],
      goodToKnow: {
        when: (v) => v === "solid-tiled" || v === "lightweight-panel" || v === "advice",
        text: "Some solid conservatory roof replacements require Building Regulations approval. We only work with specialists who understand the relevant requirements.",
      },
    },
    propertyTypeQuestion,
    listedQuestion,
    timescaleQuestion,
  ],
};
