/**
 * The search directory: everyday words people type when looking for each
 * service. It's never shown on the cards; it only decides which cards a
 * search finds. A word can appear under more than one service, so
 * "pipework" finds both Plumbing & Heating and Gardens, Driveways &
 * Landscaping (drains).
 *
 * The service's name and summary are searched too. Add a list when a new
 * service is added, and add words here when people search for something
 * and get no match.
 */
export const serviceKeywords: Record<string, string[]> = {
  "windows-doors": [
    "window", "door", "double glazing", "triple glazing", "glazing", "glazier", "upvc", "pvc", "aluminium", "timber windows",
    "composite door", "front door", "back door", "patio door", "bifold", "bi fold", "french doors", "sliding door", "casement",
    "sash", "sash windows", "tilt and turn", "frames", "glass", "misted", "blown", "condensation between panes", "draughty windows",
    "secondary glazing", "letterbox", "door lock", "handles", "porch", "stable door", "garage door", "roller door", "lantern",
    "skylight", "fensa", "window fitter",
  ],
  "conservatory-roofs": [
    "conservatory", "orangery", "sunroom", "sun room", "garden room", "lean to", "lean-to", "polycarbonate", "polycarbonate roof",
    "solid roof", "tiled roof", "glass roof", "warm roof", "guardian", "too hot", "too cold", "leaking conservatory",
  ],
  extensions: [
    "extension", "extend", "single storey", "double storey", "two storey", "three storey", "side return", "wrap around",
    "kitchen extension", "rear extension", "side extension", "orangery", "new build", "new house", "self build", "custom build",
    "builder", "builders", "building work", "construction", "garage conversion", "convert garage", "knock through", "open plan",
    "steel beam", "rsj", "load bearing", "foundations", "groundworks", "ground works", "footings", "brickwork", "bricklayer",
    "block work", "annexe", "granny flat", "porch", "outbuilding", "replacement dwelling", "house builder",
  ],
  roofing: [
    "roof", "roofer", "roofing", "re roof", "reroof", "tiles", "roof tiles", "slates", "slate", "slipped tiles", "flat roof", "felt",
    "rubber roof", "epdm", "grp", "fibreglass roof", "fascia", "fascias", "soffit", "soffits", "bargeboards", "roofline",
    "guttering", "gutters", "gutter", "downpipe", "downpipes", "chimney", "chimney stack", "flashing", "lead work", "leadwork",
    "valley", "ridge", "ridge tiles", "pointing", "leak", "leaking roof", "roof repair", "storm damage", "moss", "dormer roof",
    "garage roof", "porch roof",
  ],
  "solar-battery": [
    "solar", "solar panels", "solar pv", "pv", "photovoltaic", "panels", "battery", "home battery", "battery storage", "storage",
    "powerwall", "renewable", "renewables", "inverter", "free electricity", "export", "seg", "smart export guarantee",
    "bird proofing", "pigeon", "mcs", "microgeneration", "energy bills",
  ],
  "heat-pumps": [
    "heat pump", "heat pumps", "air source", "ground source", "ashp", "gshp", "air to water", "air con", "aircon",
    "air conditioning", "ac", "cooling", "split system", "air to air", "boiler upgrade scheme", "bus grant", "low carbon heating",
    "renewable heating", "mcs",
  ],
  "ev-charging": [
    "ev", "charger", "car charger", "charge point", "chargepoint", "charging point", "electric car", "electric vehicle",
    "wallbox", "tesla", "zappi", "ohme", "pod point", "hypervolt", "plug in hybrid", "hybrid car", "7kw", "home charger",
  ],
  insulation: [
    "insulation", "insulate", "loft insulation", "cavity wall", "cavity", "external wall insulation", "ewi",
    "internal wall insulation", "iwi", "solid wall", "underfloor insulation", "floor insulation", "draught", "draughty",
    "draught proofing", "cold house", "warm home", "energy efficiency", "epc", "energy rating", "eco4", "spray foam",
    "removal of spray foam", "cold walls",
  ],
  "loft-conversions": [
    "loft", "attic", "loft conversion", "attic conversion", "dormer", "velux", "roof window", "rooflight", "loft room",
    "mansard", "hip to gable", "extra bedroom", "loft stairs", "loft ladder", "boarding", "loft boarding", "converting loft",
  ],
  "architecture-planning": [
    "architect", "architects", "planning", "planning permission", "planning application", "plans", "drawings", "draughtsman",
    "building regulations", "building regs", "building control", "technologist", "architectural technician", "surveyor",
    "structural engineer", "structural calculations", "design", "permitted development", "lawful development certificate",
    "listed building consent", "party wall", "measured survey", "floor plans",
  ],
  kitchens: [
    "kitchen", "kitchens", "worktop", "worktops", "quartz", "granite", "units", "cabinets", "cupboards", "kitchen fitter",
    "kitchen island", "island", "fitted kitchen", "kitchen doors", "replacement doors", "splashback", "sink", "hob", "oven",
    "appliances", "extractor", "breakfast bar", "utility", "utility room", "pantry", "kitchen diner",
  ],
  bathrooms: [
    "bathroom", "bathrooms", "shower", "showers", "wet room", "wetroom", "en suite", "ensuite", "toilet", "wc", "loo",
    "bath", "bathtub", "basin", "sink", "vanity", "tiling", "tiler", "tiles", "cloakroom", "downstairs toilet", "walk in shower",
    "walk-in shower", "shower enclosure", "shower tray", "mixer shower", "electric shower", "disabled bathroom",
    "accessible bathroom", "mobility", "grab rails", "bath to shower", "extractor fan", "bathroom fitter",
  ],
  "gardens-driveways": [
    "garden", "gardens", "driveway", "driveways", "drive", "block paving", "paving", "resin", "resin bound", "tarmac", "asphalt",
    "gravel", "imprinted concrete", "patio", "patios", "paths", "path", "slabs", "porcelain paving", "indian stone", "fencing",
    "fence", "fence panels", "gates", "garden wall", "retaining wall", "decking", "deck", "landscaper", "landscaping",
    "landscape gardener", "turf", "lawn", "artificial grass", "astro", "pergola", "raised beds", "groundworks", "ground works",
    "drainage", "drains", "drain", "soakaway", "pipework", "dropped kerb", "dropped curb", "edging", "steps", "garden design",
    "outdoor lighting", "sleepers",
  ],
  flooring: [
    "floor", "floors", "flooring", "floorer", "floor fitter", "laminate", "carpet", "carpets", "carpet fitter", "vinyl", "lvt",
    "luxury vinyl", "karndean", "amtico", "wood floor", "wooden floor", "hardwood", "engineered wood", "solid wood", "oak floor",
    "parquet", "herringbone", "chevron", "floor tiles", "tiles", "tiling", "stairs carpet", "stair runner", "underlay",
    "floor sanding", "sanding", "levelling", "screed", "subfloor", "skirting",
  ],
  plumbing: [
    "plumber", "plumbers", "plumbing", "boiler", "boilers", "new boiler", "boiler repair", "boiler service", "boiler servicing",
    "combi", "combi boiler", "system boiler", "regular boiler", "oil boiler", "lpg", "gas boiler", "radiator", "radiators",
    "towel rail", "central heating", "heating", "heating engineer", "gas engineer", "gas safe", "gas safety", "oftec", "leak",
    "leaking", "burst pipe", "pipe", "pipes", "pipework", "taps", "tap", "toilet", "cistern", "hot water", "no hot water",
    "cylinder", "immersion", "unvented", "megaflo", "power flush", "powerflush", "thermostat", "smart thermostat", "trv",
    "underfloor heating", "ufh", "water pressure", "stopcock", "blocked", "blockage", "outside tap", "washing machine",
    "dishwasher", "water softener",
  ],
  electrical: [
    "electrician", "electricians", "electric", "electrics", "electrical", "rewire", "rewiring", "fuse box", "fusebox",
    "consumer unit", "trip switch", "tripping", "rcd", "sockets", "socket", "plug sockets", "usb sockets", "switches", "lighting",
    "lights", "downlights", "spotlights", "led", "light fitting", "outdoor lights", "garden lighting", "outside socket", "eicr",
    "electrical safety", "safety certificate", "wiring", "cables", "fault finding", "power cut", "extractor fan", "shower circuit",
    "cooker circuit", "smoke alarm", "smoke alarms", "fire alarm", "niceic", "napit", "part p",
  ],
  "security-systems": [
    "security", "alarm", "alarms", "burglar alarm", "intruder alarm", "house alarm", "cctv", "camera", "cameras",
    "security camera", "doorbell", "ring", "ring doorbell", "video doorbell", "smart doorbell", "security lights", "pir",
    "floodlight", "motion sensor", "monitored alarm", "monitoring", "smart lock", "smart locks", "keypad", "access control",
    "intercom", "nsi", "ssaib", "safe", "hikvision", "burglary",
  ],
};
