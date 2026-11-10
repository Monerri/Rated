import type { FunnelConfig } from "@/funnels/types";
import {
  listedQuestion,
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const loftConversionsFunnel: FunnelConfig = {
  serviceSlug: "loft-conversions",
  heading: "Loft Conversions",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "loftUse",
      type: "single",
      title: "What would you like to use the loft for?",
      summaryLabel: "Loft to become",
      layout: "list",
      options: [
        { value: "bedroom", label: "A bedroom", hint: "With or without an en suite" },
        { value: "office", label: "A home office or study" },
        { value: "living", label: "Extra living space" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    postcodeQuestion,
    {
      id: "conversionType",
      type: "single",
      title: "What kind of conversion are you thinking of?",
      summaryLabel: "Conversion type",
      layout: "list",
      options: [
        { value: "rooflights", label: "Roof windows only", hint: "Keeping the roof shape as it is" },
        { value: "dormer", label: "A dormer", hint: "Building out from the roof slope for more headroom" },
        { value: "hip-to-gable", label: "Hip to gable", hint: "Straightening a sloping side of the roof" },
        { value: "mansard", label: "Mansard" },
        { value: "not-sure", label: "Not sure, I'd like advice" },
      ],
    },
    {
      id: "headroom",
      type: "single",
      title: "Can you stand up comfortably in the middle of the loft?",
      hint: "A rough idea is fine. Measure from the top of the joists to the underside of the ridge if you can.",
      summaryLabel: "Headroom",
      layout: "list",
      options: [
        { value: "yes", label: "Yes, easily" },
        { value: "just", label: "Only just" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "just" || v === "no" || v === "not-sure",
        text: "Headroom is often the deciding factor for a loft conversion. A specialist can measure it and explain options such as a dormer or lowering the ceiling below.",
      },
    },
    propertyTypeQuestion,
    {
      ...listedQuestion,
      goodToKnow: {
        when: (v) => v === "yes" || v === "not-sure",
        text: "Many loft conversions don't need planning permission, but listed buildings, conservation areas and flats have extra rules. Every loft conversion into a room needs Building Regulations approval. Your specialist can advise.",
      },
    },
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
