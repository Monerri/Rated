import type { FunnelConfig } from "@/funnels/types";
import {
  listedQuestion,
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const architecturePlanningFunnel: FunnelConfig = {
  serviceSlug: "architecture-planning",
  heading: "Architects & Planning",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "project",
      type: "single",
      title: "What's the project?",
      summaryLabel: "Project",
      layout: "list",
      options: [
        { value: "extension", label: "An extension" },
        { value: "loft", label: "A loft conversion" },
        { value: "garage", label: "A garage or outbuilding conversion" },
        { value: "alterations", label: "Internal alterations", hint: "For example, removing a wall" },
        { value: "new-build", label: "A new house" },
        { value: "other", label: "Something else" },
      ],
    },
    postcodeQuestion,
    {
      id: "help",
      type: "multi",
      title: "What do you need help with?",
      hint: "Choose all that apply.",
      summaryLabel: "Help needed",
      layout: "list",
      options: [
        { value: "design", label: "Design ideas and drawings" },
        { value: "planning", label: "A planning application" },
        { value: "building-regs", label: "Building Regulations drawings" },
        { value: "advice", label: "Not sure, I'd like advice on what I need" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && (v.includes("planning") || v.includes("advice")),
        text: "Some projects don't need planning permission because they fall under permitted development. Most building work still needs Building Regulations approval. A good architect or technologist will tell you which apply to you.",
      },
    },
    {
      id: "stage",
      type: "single",
      title: "Where are you with the project?",
      summaryLabel: "Stage",
      layout: "list",
      options: [
        { value: "idea", label: "Just an idea so far" },
        { value: "brief", label: "I know roughly what I want" },
        { value: "drawings", label: "I have some drawings already" },
        { value: "refused", label: "I've had a planning application refused" },
      ],
    },
    propertyTypeQuestion,
    listedQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
