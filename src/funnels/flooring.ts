import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const flooringFunnel: FunnelConfig = {
  serviceSlug: "flooring",
  heading: "Flooring",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "floorType",
      type: "multi",
      title: "What kind of flooring are you thinking of?",
      hint: "Choose all that apply.",
      summaryLabel: "Flooring",
      layout: "list",
      options: [
        { value: "wood", label: "Solid or engineered wood" },
        { value: "laminate", label: "Laminate" },
        { value: "vinyl", label: "Vinyl or LVT", hint: "Luxury vinyl tiles or planks" },
        { value: "carpet", label: "Carpet" },
        { value: "tiles", label: "Stone or ceramic tiles" },
        { value: "not-sure", label: "Not sure, I'd like advice" },
      ],
    },
    postcodeQuestion,
    {
      id: "rooms",
      type: "single",
      title: "How many rooms?",
      summaryLabel: "Rooms",
      layout: "list",
      options: [
        { value: "1", label: "One room" },
        { value: "2-3", label: "Two or three rooms" },
        { value: "4+", label: "Four or more, or the whole home" },
      ],
    },
    {
      id: "supply",
      type: "single",
      title: "Who will supply the flooring?",
      summaryLabel: "Supply",
      layout: "list",
      options: [
        { value: "specialist", label: "The specialist" },
        { value: "me", label: "I will, I need it fitted" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    {
      id: "existing",
      type: "single",
      title: "What's on the floor now?",
      summaryLabel: "Existing floor",
      layout: "list",
      options: [
        { value: "carpet", label: "Carpet" },
        { value: "hard", label: "Wood, laminate or tiles" },
        { value: "old-tiles", label: "Old vinyl or thermoplastic tiles" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "old-tiles",
        text: "Some older vinyl and thermoplastic floor tiles, usually laid before 2000, contain asbestos. Please don't lift or sand them. Mention them to your specialist, who can arrange for them to be checked first.",
      },
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
