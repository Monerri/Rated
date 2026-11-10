import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const hasDriveway = (a: Answers) => Array.isArray(a.work) && a.work.includes("driveway");

export const gardensDrivewaysFunnel: FunnelConfig = {
  serviceSlug: "gardens-driveways",
  heading: "Gardens, Driveways & Landscaping",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Some firms only lay driveways, others only do gardens.
  leadTypes: {
    options: [
      { value: "driveways", label: "Driveways" },
      { value: "gardens", label: "Patios, fencing and landscaping" },
    ],
    of: (a) => (hasDriveway(a) ? "driveways" : "gardens"),
  },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What would you like done?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "driveway", label: "A driveway" },
        { value: "patio", label: "A patio or paths" },
        { value: "fencing", label: "Fencing, walls or gates" },
        { value: "decking", label: "Decking" },
        { value: "lawn", label: "A lawn or artificial grass" },
        { value: "landscaping", label: "A full garden redesign" },
      ],
    },
    postcodeQuestion,
    {
      id: "surface",
      type: "single",
      title: "What surface would you like for the driveway?",
      summaryLabel: "Driveway surface",
      layout: "list",
      showIf: hasDriveway,
      options: [
        { value: "block-paving", label: "Block paving" },
        { value: "resin", label: "Resin bound" },
        { value: "tarmac", label: "Tarmac" },
        { value: "gravel", label: "Gravel" },
        { value: "not-sure", label: "Not sure, I'd like advice" },
      ],
      goodToKnow: {
        when: () => true,
        text: "In England, paving more than 5 square metres of a front garden needs planning permission unless the surface lets water drain through, or water runs to a lawn or border. A new dropped kerb needs your council's permission.",
      },
    },
    {
      id: "size",
      type: "single",
      title: "Roughly how big is the area?",
      summaryLabel: "Size",
      layout: "list",
      options: [
        { value: "small", label: "Small", hint: "Up to about one car's space" },
        { value: "medium", label: "Medium", hint: "About two cars' space" },
        { value: "large", label: "Large" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
