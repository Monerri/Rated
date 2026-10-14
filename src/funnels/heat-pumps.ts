import type { FunnelConfig } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  listedQuestion,
  postcodeAreaQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const heatPumpsFunnel: FunnelConfig = {
  serviceSlug: "heat-pumps",
  heading: "Heat Pumps & Air Conditioning",
  researching: { questionId: "timescale", value: RESEARCHING },
  // Some installers only fit air conditioning, some only heating heat pumps.
  leadTypes: {
    options: [
      { value: "heat-pump", label: "Heat pumps for heating and hot water" },
      { value: "air-con", label: "Air conditioning" },
    ],
    of: (a) => (a.system === "air-con" ? "air-con" : "heat-pump"),
  },
  questions: [
    {
      id: "system",
      type: "single",
      title: "What are you looking for?",
      summaryLabel: "Looking for",
      options: [
        { value: "heat-pump", label: "Heating and hot water", hint: "An air source heat pump", icon: "heat-pump" },
        { value: "air-con", label: "Air conditioning", hint: "Cooling, and often heating too", icon: "air-con" },
        { value: "not-sure", label: "Not sure yet", icon: "unsure" },
      ],
      goodToKnow: {
        when: (v) => v !== "air-con",
        text: "In England and Wales, the government's Boiler Upgrade Scheme can help with the cost of a heat pump. Your installer must be MCS certified and applies on your behalf. Check the current amounts and rules on GOV.UK before you commit.",
      },
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    {
      id: "currentHeating",
      type: "single",
      title: "How is the property heated now?",
      summaryLabel: "Current heating",
      layout: "list",
      options: [
        { value: "gas", label: "Gas boiler" },
        { value: "oil-lpg", label: "Oil or LPG boiler" },
        { value: "electric", label: "Electric heaters or storage heaters" },
        { value: "other", label: "Something else" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    {
      id: "insulation",
      type: "single",
      showIf: (a) => a.system !== "air-con",
      title: "How well insulated is the property?",
      summaryLabel: "Insulation",
      layout: "list",
      options: [
        { value: "good", label: "Well insulated", hint: "Loft and walls insulated, double glazing" },
        { value: "some", label: "Partly insulated" },
        { value: "poor", label: "Not very well" },
        { value: "not-sure", label: "Not sure" },
      ],
      goodToKnow: {
        when: (v) => v === "some" || v === "poor" || v === "not-sure",
        text: "Heat pumps work best in well-insulated homes. Your installer should do a heat loss survey and may suggest insulation improvements first.",
      },
    },
    {
      id: "outdoorSpace",
      type: "single",
      title: "Is there outside space for a unit about the size of a large suitcase?",
      hint: "Usually against an outside wall, at the side or back.",
      summaryLabel: "Outdoor space",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    propertyTypeQuestion,
    listedQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
