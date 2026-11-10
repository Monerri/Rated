import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

const NOT_SURE = "not-sure";

/** The floors specialists can choose to fit. */
const FLOOR_TYPES = [
  { value: "engineered-wood", label: "Engineered wood" },
  { value: "solid-wood", label: "Solid wood", hint: "Including parquet and herringbone" },
  { value: "laminate", label: "Laminate" },
  { value: "vinyl", label: "Vinyl or LVT", hint: "Luxury vinyl tiles or planks" },
  { value: "carpet", label: "Carpet" },
  { value: "tiles", label: "Stone or ceramic tiles" },
];

export const flooringFunnel: FunnelConfig = {
  serviceSlug: "flooring",
  heading: "Flooring",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Specialists choose the floors they fit. A homeowner asking for several
  // goes to specialists who fit at least one of them; "not sure" goes to anyone.
  leadTypes: {
    options: FLOOR_TYPES.map(({ value, label }) => ({ value, label })),
    of: (a) => (Array.isArray(a.floorType) ? a.floorType.filter((v) => v !== NOT_SURE) : []),
  },
  questions: [
    {
      id: "floorType",
      type: "multi",
      title: "What kind of flooring are you thinking of?",
      hint: "Choose all that apply.",
      summaryLabel: "Flooring",
      layout: "list",
      options: [...FLOOR_TYPES, { value: NOT_SURE, label: "Not sure, I'd like advice" }],
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
