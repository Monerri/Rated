import type { Answers, FunnelConfig } from "@/funnels/types";
import { postcodeQuestion, propertyTypeQuestion, RESEARCHING, specialistCountQuestion, timescaleQuestion } from "@/funnels/shared";

const work = (a: Answers) => (Array.isArray(a.work) ? a.work : []);

export const stovesFunnel: FunnelConfig = {
  serviceSlug: "stoves",
  heading: "Wood Burners & Stoves",
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
        { value: "new-stove", label: "A new wood burner or multi-fuel stove" },
        { value: "replace-stove", label: "Replacing an existing stove" },
        { value: "gas-stove", label: "A gas stove or gas fire" },
        { value: "flue", label: "A flue liner or chimney repairs" },
        { value: "fireplace", label: "A fireplace, hearth or surround" },
      ],
      goodToKnow: {
        when: (v) => Array.isArray(v) && v.includes("gas-stove"),
        text: "By law, anyone fitting a gas stove or gas fire must be on the Gas Safe Register. Ask to see their ID card.",
      },
    },
    postcodeQuestion,
    {
      id: "chimney",
      type: "single",
      title: "Do you have a chimney?",
      summaryLabel: "Chimney",
      layout: "list",
      showIf: (a) => work(a).some((x) => x !== "fireplace"),
      options: [
        { value: "in-use", label: "Yes, and it's in use" },
        { value: "unused", label: "Yes, but it isn't used" },
        { value: "none", label: "No chimney", hint: "A stove would need a new flue" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: () => true,
        text: "Fitting a stove has to meet Building Regulations. A HETAS registered installer can certify the work themselves; otherwise it needs approval from your council. Many towns are smoke control areas, where you can only burn approved fuels or use an exempt stove, so ask your specialist what applies.",
      },
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
