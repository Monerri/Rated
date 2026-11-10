import type { FunnelConfig } from "@/funnels/types";
import {
  postcodeQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const bathroomsFunnel: FunnelConfig = {
  serviceSlug: "bathrooms",
  heading: "Bathrooms",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "room",
      type: "single",
      title: "Which room is it?",
      summaryLabel: "Room",
      layout: "list",
      options: [
        { value: "bathroom", label: "A main bathroom" },
        { value: "en-suite", label: "An en suite" },
        { value: "wet-room", label: "A wet room" },
        { value: "cloakroom", label: "A downstairs toilet or cloakroom" },
      ],
      goodToKnow: {
        when: (v) => v === "wet-room",
        text: "A wet room needs the whole floor and lower walls properly waterproofed, called tanking, and the floor laid to fall to the drain. Ask how your specialist does this and what guarantee they give.",
      },
    },
    postcodeQuestion,
    {
      id: "scope",
      type: "single",
      title: "What work is needed?",
      summaryLabel: "Work needed",
      layout: "list",
      options: [
        { value: "full", label: "A complete new bathroom" },
        { value: "new-room", label: "A new room where there isn't one now" },
        { value: "shower", label: "Replacing a bath or shower only" },
        { value: "accessible", label: "Making it easier to use", hint: "For example, a walk-in shower or grab rails" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    {
      id: "supply",
      type: "single",
      title: "Who will supply the bathroom suite and tiles?",
      summaryLabel: "Supply",
      layout: "list",
      options: [
        { value: "specialist", label: "The specialist" },
        { value: "me", label: "I will" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
