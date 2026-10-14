import type { FunnelConfig, Question } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  listedQuestion,
  postcodeAreaQuestion,
  PROPERTY_USE,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

const NEW_BUILD = "new-build";
const isNewBuild = (a: Record<string, unknown>) => a.extensionType === NEW_BUILD;

/** Kinds of job builders can choose to take. "Not sure" goes to builders who do both sizes of extension. */
const leadTypeOf = (a: Record<string, unknown>) =>
  a.extensionType === "single-storey" ? "single-storey" : isNewBuild(a) ? NEW_BUILD : "multi-storey";

const homeTypeQuestion: Question = {
  ...propertyTypeQuestion,
  showIf: (a) => a[PROPERTY_USE] !== "business" && !isNewBuild(a),
};

export const extensionsFunnel: FunnelConfig = {
  serviceSlug: "extensions",
  heading: "Extensions & New Builds",
  researching: { questionId: "timescale", value: RESEARCHING },
  leadTypes: {
    options: [
      { value: "single-storey", label: "Single-storey extensions" },
      { value: "multi-storey", label: "Two and three-storey extensions" },
      { value: NEW_BUILD, label: "New-build houses" },
    ],
    of: leadTypeOf,
  },
  questions: [
    {
      id: "extensionType",
      type: "single",
      title: "What are you looking to build?",
      summaryLabel: "Project",
      options: [
        { value: "single-storey", label: "Single-storey extension", icon: "single-storey" },
        { value: "multi-storey", label: "Two or three-storey extension", icon: "two-storey" },
        { value: NEW_BUILD, label: "A new house", hint: "For example, on a plot of land", icon: "new-build" },
        { value: "not-sure", label: "Not sure yet", icon: "unsure" },
      ],
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    {
      id: "position",
      type: "single",
      title: "Where would it go?",
      summaryLabel: "Position",
      layout: "list",
      showIf: (a) => !isNewBuild(a),
      options: [
        { value: "rear", label: "At the back" },
        { value: "side", label: "At the side" },
        { value: "wrap-around", label: "Side and back (wrap-around)" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    {
      id: "purpose",
      type: "multi",
      title: "What would you use the space for?",
      hint: "Choose up to three.",
      summaryLabel: "Use of space",
      max: 3,
      layout: "list",
      showIf: (a) => !isNewBuild(a),
      options: [
        { value: "kitchen", label: "A bigger kitchen" },
        { value: "open-plan", label: "Open-plan living or dining" },
        { value: "bedroom", label: "An extra bedroom" },
        { value: "bathroom-utility", label: "A bathroom or utility room" },
        { value: "office", label: "A home office" },
        { value: "other", label: "Something else" },
      ],
    },
    {
      id: "size",
      type: "single",
      title: "Roughly how big?",
      hint: "A rough idea is fine. A small kitchen extension might be around 3m × 4m.",
      summaryLabel: "Approximate size",
      layout: "list",
      showIf: (a) => !isNewBuild(a),
      options: [
        { value: "small", label: "Small", hint: "Under about 15 m²" },
        { value: "medium", label: "Medium", hint: "About 15 to 30 m²" },
        { value: "large", label: "Large", hint: "Over about 30 m²" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "newBuildSize",
      type: "single",
      title: "How big a house are you thinking of?",
      summaryLabel: "House size",
      layout: "list",
      showIf: isNewBuild,
      options: [
        { value: "1-2-bed", label: "1 or 2 bedrooms" },
        { value: "3-bed", label: "3 bedrooms" },
        { value: "4-plus-bed", label: "4 or more bedrooms" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    {
      id: "plot",
      type: "single",
      title: "Do you have the plot?",
      summaryLabel: "Plot",
      layout: "list",
      showIf: isNewBuild,
      options: [
        { value: "own-it", label: "Yes, I own it" },
        { value: "buying", label: "I'm in the process of buying it" },
        { value: "replacing", label: "I'd replace an existing house I own" },
      ],
    },
    {
      id: "stage",
      type: "single",
      title: "Where are you up to?",
      summaryLabel: "Plans",
      layout: "list",
      options: [
        { value: "idea", label: "It's just an idea so far" },
        { value: "drawings", label: "I have drawings or plans" },
        { value: "approved", label: "Planning is approved, or I've been told it isn't needed" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "idea" || v === "not-sure",
        text: "Many single-storey extensions can be built without a planning application, but two and three-storey extensions often need one, and a new house always does. Almost all extensions and every new house also need Building Regulations approval. Your specialist can explain what applies.",
      },
    },
    homeTypeQuestion,
    listedQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
