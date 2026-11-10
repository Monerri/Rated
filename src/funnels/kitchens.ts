import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const kitchensFunnel: FunnelConfig = {
  serviceSlug: "kitchens",
  heading: "Kitchens",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "scope",
      type: "single",
      title: "What are you looking for?",
      summaryLabel: "Looking for",
      layout: "list",
      options: [
        { value: "supply-fit", label: "A new kitchen, designed, supplied and fitted" },
        { value: "fit-only", label: "Fitting only", hint: "I've bought, or will buy, the kitchen myself" },
        { value: "refresh", label: "A refresh", hint: "New doors, worktops or appliances" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    postcodeQuestion,
    {
      id: "layout",
      type: "single",
      title: "Will the layout change?",
      hint: "For example, moving the sink, cooker or a wall.",
      summaryLabel: "Layout",
      layout: "list",
      options: [
        { value: "same", label: "No, the same layout" },
        { value: "change", label: "Yes, a new layout" },
        { value: "knock-through", label: "Yes, including knocking through a wall" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "change" || v === "knock-through",
        text: "Moving a gas cooker or hob must be done by a Gas Safe registered engineer, and new electrical circuits by a registered electrician. Removing a wall usually needs Building Regulations approval. Ask your specialist how they handle these.",
      },
    },
    {
      id: "size",
      type: "single",
      title: "Roughly how big is the kitchen?",
      summaryLabel: "Size",
      layout: "list",
      options: [
        { value: "small", label: "Small", hint: "A galley or compact kitchen" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large or open-plan" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
