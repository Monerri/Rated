/**
 * Everyday words people type when looking for each service, so the search on
 * Find a specialist finds "Plumbing & Heating" from "boiler" or "radiator".
 * The service's name and summary are searched too, so only add words that
 * aren't already in them. Add a list when a new service is added.
 */
export const serviceKeywords: Record<string, string[]> = {
  "windows-doors": [
    "window", "door", "double glazing", "triple glazing", "glazing", "upvc", "composite door", "front door", "back door",
    "patio door", "bifold", "bi fold", "french doors", "sliding door", "casement", "sash", "frames", "glass",
  ],
  "conservatory-roofs": ["conservatory", "orangery", "sunroom", "lean to", "polycarbonate roof", "solid roof", "glass roof", "warm roof"],
  extensions: [
    "extension", "extend", "single storey", "double storey", "two storey", "side return", "wrap around", "kitchen extension",
    "rear extension", "new build", "new house", "self build", "builder", "building work", "garage conversion",
  ],
  roofing: [
    "roof", "roofer", "re roof", "reroof", "tiles", "slates", "flat roof", "felt", "rubber roof", "epdm", "fascia", "soffit",
    "guttering", "gutters", "chimney", "leaking roof", "roof repair",
  ],
  "solar-battery": ["solar", "solar panels", "pv", "photovoltaic", "battery", "home battery", "battery storage", "renewable", "inverter"],
  "heat-pumps": [
    "heat pump", "air source", "ground source", "ashp", "air con", "aircon", "air conditioning", "cooling", "boiler upgrade scheme",
  ],
  "ev-charging": ["ev", "charger", "car charger", "charge point", "electric car", "electric vehicle", "wallbox", "tesla"],
  insulation: [
    "insulation", "insulate", "loft insulation", "cavity wall", "external wall insulation", "internal wall insulation",
    "underfloor insulation", "draught", "draughty", "warm home", "energy efficiency",
  ],
  "loft-conversions": ["loft", "attic", "dormer", "velux", "roof window", "loft room", "mansard", "hip to gable"],
  "architecture-planning": [
    "architect", "planning", "planning permission", "plans", "drawings", "building regulations", "building regs",
    "technologist", "surveyor", "design",
  ],
  kitchens: ["kitchen", "worktop", "units", "cabinets", "kitchen fitter", "island", "fitted kitchen"],
  bathrooms: ["bathroom", "shower", "wet room", "en suite", "ensuite", "toilet", "bath", "tiling", "tiler", "cloakroom"],
  "gardens-driveways": [
    "garden", "driveway", "drive", "block paving", "resin", "tarmac", "patio", "fencing", "fence", "decking", "landscaper",
    "landscaping", "turf", "lawn", "paving",
  ],
  flooring: ["floor", "flooring", "laminate", "carpet", "vinyl", "lvt", "karndean", "wood floor", "engineered wood", "parquet", "tiles"],
  plumbing: [
    "plumber", "plumbing", "boiler", "combi", "radiator", "central heating", "heating", "gas engineer", "gas safe", "leak",
    "hot water", "cylinder", "power flush", "underfloor heating", "oil boiler",
  ],
  electrical: [
    "electrician", "electrics", "rewire", "rewiring", "fuse box", "consumer unit", "sockets", "lighting", "lights", "eicr",
    "electrical safety", "wiring",
  ],
  "security-systems": ["security", "alarm", "burglar alarm", "cctv", "camera", "doorbell", "ring doorbell", "smart doorbell", "security lights"],
};
