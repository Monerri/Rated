import type { FunnelConfig } from "@/funnels/types";
import {
  fullPostcodeQuestion,
  postcodeAreaQuestion,
  propertyTypeQuestion,
  RESEARCHING,
  specialistCountQuestion,
  timescaleQuestion,
} from "@/funnels/shared";

export const evChargingFunnel: FunnelConfig = {
  serviceSlug: "ev-charging",
  heading: "EV Charging",
  researching: { questionId: "timescale", value: RESEARCHING },
  questions: [
    {
      id: "vehicle",
      type: "single",
      title: "Do you have an electric vehicle?",
      summaryLabel: "Electric vehicle",
      layout: "list",
      options: [
        { value: "yes", label: "Yes" },
        { value: "soon", label: "I'm getting one soon" },
        { value: "not-yet", label: "Not yet" },
      ],
    },
    postcodeAreaQuestion,
    fullPostcodeQuestion,
    {
      id: "parking",
      type: "single",
      title: "Where do you park?",
      summaryLabel: "Parking",
      layout: "list",
      options: [
        { value: "driveway", label: "On a driveway" },
        { value: "garage", label: "In a garage" },
        { value: "street", label: "On the street" },
      ],
      goodToKnow: {
        when: (v) => v === "street",
        text: "Home charge points usually need off-street parking, because a cable can't trail across a pavement. Some councils allow approved cable channels or have on-street charging, so it's worth checking with yours.",
      },
    },
    {
      id: "distance",
      type: "single",
      title: "Roughly how far is the parking space from your fuse box?",
      hint: "The fuse box is also called the consumer unit. A rough idea is fine.",
      summaryLabel: "Distance from fuse box",
      layout: "list",
      showIf: (a) => a.parking !== "street",
      options: [
        { value: "under-10m", label: "Under 10 metres" },
        { value: "10-25m", label: "10 to 25 metres" },
        { value: "over-25m", label: "More than 25 metres" },
        { value: "not-sure", label: "Not sure" },
      ],
    },
    propertyTypeQuestion,
    specialistCountQuestion,
    timescaleQuestion,
  ],
};
