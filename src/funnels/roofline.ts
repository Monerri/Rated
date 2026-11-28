import type { FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

export const rooflineFunnel: FunnelConfig = {
  serviceSlug: "roofline",
  heading: "Fascias, Soffits & Guttering",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "work",
      type: "multi",
      title: "What do you need?",
      hint: "Choose all that apply.",
      summaryLabel: "Work",
      layout: "list",
      options: [
        { value: "fascias-soffits", label: "New fascias and soffits" },
        { value: "gutters", label: "New gutters and downpipes" },
        { value: "gutter-repair", label: "Gutter repairs or unblocking" },
        { value: "bargeboards", label: "Bargeboards" },
        { value: "cladding", label: "Cladding" },
      ],
    },
    postcodeQuestion,
    {
      id: "storeys",
      type: "single",
      title: "How many storeys is the home?",
      summaryLabel: "Storeys",
      layout: "list",
      options: [
        { value: "1", label: "One (a bungalow)" },
        { value: "2", label: "Two" },
        { value: "3+", label: "Three or more" },
      ],
      goodToKnow: {
        when: () => true,
        text: "Roofline work usually needs scaffolding or an access tower, so ask whether it's included in the quote. Nesting birds and bats are protected by law: if you've seen them in your roofline, mention it to your specialist.",
      },
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
