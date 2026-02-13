/**
 * starting_zone is a location id, not a zone id. Zone ids are biome keys (city, ruins, ...).
 */

// =============================================================================
// WORLD META (BIBLE)
// =============================================================================

export const WORLD_META = {
  id: "shardfall_meridian",
  name: "Shardfall Meridian",
  era: "After the Spirefall",
  tagline: "A neon arcology stitched to broken leylines and living myth.",
  pillars: [
    "Neon sanctuaries over ancient bones",
    "Leylines as infrastructure and addiction",
    "Factions barter in contracts, not virtue",
    "The System records, tempts, and mislabels",
    "Hope survives as a practice, not a prophecy",
  ],
  cosmology: {
    void:
      "The Void is not evil; it is absence that erodes meaning. Thin places form where reality has been scraped down to raw silence, and memory becomes unreliable the longer you stare into the gap.",
    leylines:
      "Leylines are mana-transport rails: power made route, schedule, and tariff. Storms are overload events, and stabilizers are political leverage disguised as public safety.",
    spirefall:
      "The Fallen Spire was a regulator that kept districts synchronized. When it fractured, zones desynced, factions hardened into infrastructure, and system echoes became common enough to feel like weather.",
  },
  timeline: [
    {
      year: "Year -40",
      event:
        "The Spire is raised as a regulator, marketed as a \"civilization patch.\"",
    },
    {
      year: "Year -18",
      event: "First leyline black markets form beneath the bazaar underwalks.",
    },
    {
      year: "Year -12",
      event:
        "Skyforge platforms are completed; skydocks become a second capital.",
    },
    {
      year: "Year -8",
      event: "The Veil Archive seals its first ledger with living ink.",
    },
    {
      year: "Year -3",
      event:
        "A coastal ward fails briefly; the Tideward Order forms as a permanent watch.",
    },
    {
      year: "Year 0",
      event: "The Spirefall. Stormglass rains across the ruins; zones fracture.",
    },
    {
      year: "Year 2",
      event:
        "Arcane Wardens establish quarantine boundaries and salvage rights.",
    },
    {
      year: "Year 5",
      event:
        "The Aurum Exchange standardizes soulcoin contracts across the city.",
    },
    {
      year: "Year 7",
      event: "The Ember Bloom ignites for the first time in recorded memory.",
    },
    {
      year: "Year 9",
      event: "Mirage Guides publish route-glyphs that only read true at dusk.",
    },
    {
      year: "Year 11",
      event:
        "Smoke Wardens begin vent-sealing campaigns; volcanic ridges stabilize temporarily.",
    },
    {
      year: "Year 13",
      event: "Dream-wisps surge; mnemonic dust becomes a civic commodity.",
    },
  ],
  regionStubs: [
    {
      id: "auric_crown",
      name: "Auric Crown",
      summary: "Cathedral-states that export blessings like tariffs.",
      hooks: ["Reliquary embargo", "Choir-war diplomacy"],
    },
    {
      id: "glassstep_expanse",
      name: "Glassstep Expanse",
      summary: "Stormglass deserts where reflections lie.",
      hooks: ["Mirror caravans", "False oases"],
    },
    {
      id: "emberline_archipelago",
      name: "Emberline Archipelago",
      summary: "Volcanic island chain with living vents.",
      hooks: ["Vent treaties", "Ash-sail pirates"],
    },
    {
      id: "veilward_depths",
      name: "Veilward Depths",
      summary: "Underworld cities that trade secrets as fuel.",
      hooks: ["Ledger assassins", "Memory auctions"],
    },
    {
      id: "skybound_marches",
      name: "Skybound Marches",
      summary: "High-altitude frontier controlled by engine law.",
      hooks: ["Dock-feud courts", "Airship conscription"],
    },
    {
      id: "wildroot_basin",
      name: "Wildroot Basin",
      summary: "Grove networks where diplomacy is grown, not spoken.",
      hooks: ["Seed oaths", "Bloom sabotage"],
    },
  ],
};

// =============================================================================
// FACTIONS / ZONES / LOCATIONS
// =============================================================================

export let locations = [
  // CITY (4)
  {
    id: "starting_zone",
    zoneId: "city",
    name: "Arrival Terminal",
    summary:
      "A humming arrivals concourse where the arcology pretends nothing is broken.",
    aliases: ["starting zone", "arrival terminal", "terminal", "gate"],
    travelPolicy: "public",
  },
  {
    id: "city_neon_bazaar",
    zoneId: "city",
    name: "Neon Bazaar",
    summary:
      "Stalls of synthcloth and spiritwire under pulsing signage, where contracts change hands faster than coins.",
    aliases: ["neon bazaar", "bazaar", "market", "exchange floor"],
    travelPolicy: "public",
  },
  {
    id: "city_sunspire_temple",
    zoneId: "city",
    name: "Sunspire Temple",
    summary:
      "A sanctuary of glass and hymn-light, tuned to leylines like a prayer you can meter.",
    aliases: ["sunspire temple", "sunspire", "temple"],
    travelPolicy: "public",
  },
  {
    id: "city_holo_bazaar_underwalk",
    zoneId: "city",
    name: "Holo-Bazaar Underwalk",
    summary:
      "Service tunnels beneath the market where whispers become invoices and exits change places.",
    aliases: ["underwalk", "holo bazaar underwalk", "holo-bazaar", "broker"],
    travelPolicy: "restricted",
  },

  // RUINS (3)
  {
    id: "ruins_leyline_plaza",
    zoneId: "ruins",
    name: "Leyline Plaza",
    summary:
      "Cracked stone and stormlight: a plaza where leylines surface like exposed nerves.",
    aliases: ["leyline plaza", "plaza", "fallen spire plaza"],
    travelPolicy: "public",
  },
  {
    id: "ruins_stormglass_crater",
    zoneId: "ruins",
    name: "Stormglass Crater",
    summary:
      "A bowl of fused glass where lightning remembers the shape of the Spirefall.",
    aliases: ["stormglass crater", "crater", "stormglass"],
    travelPolicy: "restricted",
  },
  {
    id: "ruins_quarantine_barricade",
    zoneId: "ruins",
    name: "Quarantine Barricade",
    summary:
      "Runed pylons and razorwire wards marking salvage rights and quarantine lines.",
    aliases: ["quarantine barricade", "barricade", "quarantine line"],
    travelPolicy: "restricted",
  },

  // WILDS (3)
  {
    id: "wilds_rootbound_camp",
    zoneId: "wilds",
    name: "Rootbound Camp",
    summary:
      "Canvas, charm-braids, and cooking smoke: a temporary city of people who refuse to be displaced.",
    aliases: ["rootbound camp", "camp", "rootbound"],
    travelPolicy: "public",
  },
  {
    id: "wilds_ember_bloom_ridge",
    zoneId: "wilds",
    name: "Ember Bloom Ridge",
    summary:
      "A ridgeline where ash petals fall upward and the Bloom burns without consuming.",
    aliases: ["ember bloom ridge", "ember bloom", "bloom ridge", "bloom"],
    travelPolicy: "restricted",
  },
  {
    id: "wilds_mosslit_clearing",
    zoneId: "wilds",
    name: "Mosslit Clearing",
    summary:
      "Soft green light under old branches; the air tastes like decisions you have not made yet.",
    aliases: ["mosslit clearing", "clearing", "mosslit"],
    travelPolicy: "restricted",
  },

  // SKYDOCKS (3)
  {
    id: "skydocks_skyforge_platforms",
    zoneId: "skydocks",
    name: "Skyforge Platforms",
    summary:
      "High gantries and engine-chains above open air, where metalwork is done with altitude as a threat.",
    aliases: ["skyforge platforms", "skydocks", "platforms", "skyforge"],
    travelPolicy: "public",
  },
  {
    id: "skydocks_gantry_row",
    zoneId: "skydocks",
    name: "Gantry Row",
    summary:
      "A maze of catwalks, cargo nets, and patrol drones that never quite fly in straight lines.",
    aliases: ["gantry row", "gantries", "catwalks"],
    travelPolicy: "restricted",
  },
  {
    id: "skydocks_engine_quay",
    zoneId: "skydocks",
    name: "Engine Quay",
    summary:
      "Docked turbines and humming stabilizers, where leylines are bolted into compliance.",
    aliases: ["engine quay", "quay", "engine bay"],
    travelPolicy: "restricted",
  },

  // UNDERCITY (3)
  {
    id: "undercity_wet_gate",
    zoneId: "undercity",
    name: "Wet Gate",
    summary:
      "A dripping access vault where the city exhales heat and secrets into the dark.",
    aliases: ["wet gate", "gate", "access vault"],
    travelPolicy: "public",
  },
  {
    id: "undercity_veil_archive",
    zoneId: "undercity",
    name: "Veil Archive",
    summary:
      "Ledger-stacks sealed in living ink; every whisper here has a receipt.",
    aliases: ["veil archive", "archive", "ledger vault"],
    travelPolicy: "restricted",
  },
  {
    id: "undercity_memory_auction",
    zoneId: "undercity",
    name: "Memory Auction",
    summary:
      "A candlelit pit where recollections are bid on, bottled, and resold as alibis.",
    aliases: ["memory auction", "auction", "memory market"],
    travelPolicy: "restricted",
  },

  // MOUNTAIN (3)
  {
    id: "mountain_starforge_foundry",
    zoneId: "mountain",
    name: "Starforge Foundry",
    summary:
      "A resonant workshop carved into the ridge, where ore sings and mistakes shatter.",
    aliases: ["starforge foundry", "starforge", "foundry", "forge"],
    travelPolicy: "public",
  },
  {
    id: "mountain_crystal_ridgeline",
    zoneId: "mountain",
    name: "Crystal Ridgeline",
    summary:
      "A knife-edge path studded with tuning crystals that amplify thoughts into noise.",
    aliases: ["crystal ridgeline", "ridgeline", "crystal ridge"],
    travelPolicy: "restricted",
  },
  {
    id: "mountain_rune_sentinel_watch",
    zoneId: "mountain",
    name: "Rune Sentinel Watch",
    summary:
      "A watchpost where stone guardians blink awake when the leylines stutter.",
    aliases: ["rune sentinel watch", "watchpost", "sentinel watch"],
    travelPolicy: "restricted",
  },

  // COAST (3)
  {
    id: "coast_tideward_pier",
    zoneId: "coast",
    name: "Tideward Pier",
    summary:
      "Salt-stained pylons and ward-stones, a public line between the arcology and the hungry sea.",
    aliases: ["tideward pier", "pier", "tideward", "breakwater"],
    travelPolicy: "public",
  },
  {
    id: "coast_breaker_shrine",
    zoneId: "coast",
    name: "Breaker Shrine",
    summary:
      "A shrine hammered together from shipbone and stormglass, where vows are made against tides.",
    aliases: ["breaker shrine", "shrine", "breaker"],
    travelPolicy: "restricted",
  },
  {
    id: "coast_astral_waypoint",
    zoneId: "coast",
    name: "Astral Waypoint",
    summary:
      "A floating marker of light that keeps ships honest, until it flickers and lies.",
    aliases: ["astral waypoint", "waypoint", "navigation node"],
    travelPolicy: "restricted",
  },

  // DESERT (3)
  {
    id: "desert_mirage_caravanserai",
    zoneId: "desert",
    name: "Mirage Caravanserai",
    summary:
      "Canvas towers and dusk-coded glyphs; routes are traded here like weather predictions.",
    aliases: ["mirage caravanserai", "caravanserai", "caravan", "mirage camp"],
    travelPolicy: "public",
  },
  {
    id: "desert_oracle_sundial",
    zoneId: "desert",
    name: "Oracle Sundial",
    summary:
      "A monumental dial half-buried in glass sand, its shadow moving wrong at noon.",
    aliases: ["oracle sundial", "sundial", "oracle"],
    travelPolicy: "restricted",
  },
  {
    id: "desert_glassstep_dunes",
    zoneId: "desert",
    name: "Glassstep Dunes",
    summary:
      "Stormglass grit underfoot; the horizon repeats itself like a stuttered spell.",
    aliases: ["glassstep dunes", "dunes", "glassstep"],
    travelPolicy: "restricted",
  },

  // VOLCANIC (3)
  {
    id: "volcanic_smoke_warden_redoubt",
    zoneId: "volcanic",
    name: "Smoke Warden Redoubt",
    summary:
      "A soot-black fort with vent gauges and treaty seals, built to argue with a mountain.",
    aliases: ["smoke warden redoubt", "redoubt", "smoke wardens"],
    travelPolicy: "public",
  },
  {
    id: "volcanic_ashen_caldera",
    zoneId: "volcanic",
    name: "Ashen Caldera",
    summary:
      "A ring of heat and collapsing ledges where the ground keeps trying to become a river.",
    aliases: ["ashen caldera", "caldera", "ash ring"],
    travelPolicy: "restricted",
  },
  {
    id: "volcanic_vent_seal_chamber",
    zoneId: "volcanic",
    name: "Vent-Seal Chamber",
    summary:
      "A hollow of pressure doors and rune clamps designed to silence the earth mid-scream.",
    aliases: ["vent-seal chamber", "vent chamber", "seal chamber", "vents"],
    travelPolicy: "restricted",
  },

  // DREAMSCAPE (3)
  {
    id: "dreamscape_wisp_meadow",
    zoneId: "dreamscape",
    name: "Wisp Meadow",
    summary:
      "A field of soft light where thoughts drift loose and return wearing different names.",
    aliases: ["wisp meadow", "meadow", "wisps"],
    travelPolicy: "public",
  },
  {
    id: "dreamscape_mnemonic_siltbank",
    zoneId: "dreamscape",
    name: "Mnemonic Siltbank",
    summary:
      "Powdered recollection gathers here like sediment; step wrong and you remember someone else's childhood.",
    aliases: ["mnemonic siltbank", "siltbank", "mnemonic dust", "dust"],
    travelPolicy: "restricted",
  },
  {
    id: "dreamscape_mirrorpool_thin_place",
    zoneId: "dreamscape",
    name: "Mirrorpool Thin Place",
    summary:
      "A still pool that reflects possible versions of you, each one insisting it's the original.",
    aliases: ["mirrorpool thin place", "mirrorpool", "thin place", "mirror pool"],
    travelPolicy: "restricted",
  },
];

export let zones = [
  {
    id: "ruins",
    name: "Stormglass Ruins",
    type: "exploration",
    tags: [],
    summary:
      "The Spirefall's scar: broken plazas, exposed leylines, and salvage law written in lightning.",
    connections: ["city", "undercity", "mountain", "coast", "dreamscape"],
    startLocationIds: ["ruins_leyline_plaza", "ruins_quarantine_barricade"],
    dominantFactionIds: ["arcane_wardens"],
  },
  {
    id: "city",
    name: "Meridian Arcology",
    type: "social",
    tags: [],
    summary:
      "A neon sanctuary built atop ancient bones, where commerce is a spell and safety is a clause.",
    connections: ["ruins", "wilds", "skydocks", "undercity", "coast"],
    startLocationIds: ["starting_zone", "city_neon_bazaar"],
    dominantFactionIds: ["aurum_exchange", "arcane_wardens"],
  },
  {
    id: "wilds",
    name: "Wildroot Fringe",
    type: "exploration",
    tags: [],
    summary:
      "Grove networks and ash-fed growth where diplomacy is grown, not spoken, and monsters have titles.",
    connections: ["city", "mountain", "coast", "volcanic"],
    startLocationIds: ["wilds_rootbound_camp", "wilds_ember_bloom_ridge"],
    dominantFactionIds: ["verdant_envoys"],
  },
  {
    id: "skydocks",
    name: "Skyforge Skydocks",
    type: "combat",
    tags: [],
    summary:
      "Platforms over open air, engine-law courts, and patrol drones that enforce altitude like a border.",
    connections: ["city", "mountain", "coast", "dreamscape"],
    startLocationIds: ["skydocks_skyforge_platforms"],
    dominantFactionIds: ["skyforge_sentinels", "aurum_exchange"],
  },
  {
    id: "undercity",
    name: "Veilward Undercity",
    type: "combat",
    tags: [],
    summary:
      "Tunnels and ledger vaults where secrets burn like fuel and the dark remembers your voice.",
    connections: ["city", "ruins", "coast", "dreamscape"],
    startLocationIds: ["undercity_wet_gate"],
    dominantFactionIds: ["veil_wardens"],
  },
  {
    id: "mountain",
    name: "Crystal Ridgeworks",
    type: "exploration",
    tags: [],
    summary:
      "High paths and resonant forges where crystal matrices turn ambition into fracture lines.",
    connections: ["ruins", "wilds", "skydocks", "desert", "volcanic"],
    startLocationIds: ["mountain_starforge_foundry"],
    dominantFactionIds: ["skyforge_sentinels"],
  },
  {
    id: "coast",
    name: "Tideward Coast",
    type: "exploration",
    tags: [],
    summary:
      "Breakwaters and ward-stones holding back abyssal pressure and the paperwork of the sea.",
    connections: ["city", "wilds", "skydocks", "undercity", "desert", "ruins"],
    startLocationIds: ["coast_tideward_pier"],
    dominantFactionIds: ["tideward_order"],
  },
  {
    id: "desert",
    name: "Glassstep Sands",
    type: "exploration",
    tags: [],
    summary:
      "Stormglass dunes and route-glyphs that only read true at dusk; mirages here are contractual.",
    connections: ["coast", "mountain", "dreamscape"],
    startLocationIds: ["desert_mirage_caravanserai", "desert_oracle_sundial"],
    dominantFactionIds: ["mirage_guides"],
  },
  {
    id: "volcanic",
    name: "Emberline Caldera",
    type: "combat",
    tags: [],
    summary:
      "Living vents and ash treaties where the ground negotiates with fire every hour.",
    connections: ["mountain", "wilds", "dreamscape"],
    startLocationIds: ["volcanic_smoke_warden_redoubt", "volcanic_ashen_caldera"],
    dominantFactionIds: ["smoke_wardens"],
  },
  {
    id: "dreamscape",
    name: "Mnemonic Dreamscape",
    type: "exploration",
    tags: [],
    summary:
      "Thin places and drifting recollections where the System's labels peel off and float away.",
    connections: ["ruins", "undercity", "skydocks", "desert", "volcanic"],
    startLocationIds: ["dreamscape_wisp_meadow", "dreamscape_mnemonic_siltbank"],
    dominantFactionIds: ["veil_wardens", "mirage_guides"],
  },
];

export let factions = [
  // Major factions (8)
  {
    id: "arcane_wardens",
    name: "Arcane Wardens",
    kind: "major",
    summary:
      "Quarantine engineers and salvage-law enforcers who treat stability as a monopoly.",
    hqLocationId: "ruins_quarantine_barricade",
    goals: ["Contain leyline storms", "Monetize stabilization tech"],
    rivals: ["veil_wardens"],
  },
  {
    id: "aurum_exchange",
    name: "Aurum Exchange",
    kind: "major",
    summary:
      "Contract lords who standardize soulcoin and turn favors into interest-bearing debt.",
    hqLocationId: "city_neon_bazaar",
    goals: ["Control currency flows", "Broker faction accords for profit"],
    rivals: ["arcane_wardens"],
  },
  {
    id: "verdant_envoys",
    name: "Verdant Envoys",
    kind: "major",
    summary:
      "Diplomats of living groves who negotiate with roots, spores, and the people who fear them.",
    hqLocationId: "wilds_rootbound_camp",
    goals: ["Prevent ecological collapse", "Secure the Ember Bloom"],
    rivals: ["smoke_wardens"],
  },
  {
    id: "skyforge_sentinels",
    name: "Skyforge Sentinels",
    kind: "major",
    summary:
      "Engine-law marshals who patrol the skydocks and treat altitude as sovereign territory.",
    hqLocationId: "skydocks_skyforge_platforms",
    goals: ["Maintain skydock security", "Protect forge throughput"],
    rivals: ["aurum_exchange"],
  },
  {
    id: "veil_wardens",
    name: "Veil Wardens",
    kind: "major",
    summary:
      "Ledger-keepers and silence-cultists who police secrets like a civic resource.",
    hqLocationId: "undercity_veil_archive",
    goals: ["Own the city's hidden history", "Control memory markets"],
    rivals: ["arcane_wardens"],
  },
  {
    id: "tideward_order",
    name: "Tideward Order",
    kind: "major",
    summary:
      "Coastal wardens sworn to keep the abyssal surge out, even when the paperwork is drowning.",
    hqLocationId: "coast_tideward_pier",
    goals: ["Reinforce ward-stones", "Purge abyssal incursions"],
    rivals: ["mirage_guides"],
  },
  {
    id: "mirage_guides",
    name: "Mirage Guides",
    kind: "major",
    summary:
      "Route-scribes who sell paths that only exist at the right angle of light.",
    hqLocationId: "desert_mirage_caravanserai",
    goals: ["Monopolize safe passage", "Exploit mirage storms"],
    rivals: ["tideward_order"],
  },
  {
    id: "smoke_wardens",
    name: "Smoke Wardens",
    kind: "major",
    summary:
      "Vent-sealers and ash treaty brokers who keep the caldera from rewriting the map.",
    hqLocationId: "volcanic_smoke_warden_redoubt",
    goals: ["Stabilize vents", "Enforce vent treaties"],
    rivals: ["verdant_envoys"],
  },

  // Minor factions (3)
  {
    id: "stormglass_nomads",
    name: "Stormglass Nomads",
    kind: "minor",
    summary:
      "Caravan scavengers who read lightning patterns like a language and live between quarantines.",
    hqLocationId: "ruins_stormglass_crater",
  },
  {
    id: "mnemonic_alchemists",
    name: "Mnemonic Alchemists",
    kind: "minor",
    summary:
      "Vial-brewers who refine dream-wisp dust into civic commodity and personal catastrophe.",
    hqLocationId: "dreamscape_mnemonic_siltbank",
  },
  {
    id: "skyfisher_guild",
    name: "Skyfisher Guild",
    kind: "minor",
    summary:
      "Net-casters and anti-grav wranglers who harvest the upper air for things that should not be caught.",
    hqLocationId: "skydocks_engine_quay",
  },
];

export const MAJOR_FACTION_IDS = [
  "arcane_wardens",
  "aurum_exchange",
  "verdant_envoys",
  "skyforge_sentinels",
  "veil_wardens",
  "tideward_order",
  "mirage_guides",
  "smoke_wardens",
];

export const BIOME_ESSENCE_PROFILES = {
  ruins: {
    dominantTriad: ["lightning", "earth", "air"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.1, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.02,
  },
  city: {
    dominantTriad: ["air", "light", "creation"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.08, off: 0.99 },
    stabilityCapDelta: 0,
    taintBaseline: 0.01,
  },
  wilds: {
    dominantTriad: ["life", "earth", "water"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.12, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.0,
  },
  skydocks: {
    dominantTriad: ["air", "lightning", "light"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.1, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.0,
  },
  undercity: {
    dominantTriad: ["shadow", "water", "earth"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.08, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.05,
  },
  mountain: {
    dominantTriad: ["earth", "air", "lightning"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.1, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.0,
  },
  coast: {
    dominantTriad: ["water", "air", "life"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.12, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.0,
  },
  desert: {
    dominantTriad: ["air", "fire", "time"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.08, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.01,
  },
  volcanic: {
    dominantTriad: ["fire", "earth", "destruction"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.1, off: 0.98 },
    stabilityCapDelta: 0,
    taintBaseline: 0.03,
  },
  dreamscape: {
    dominantTriad: ["space", "time", "shadow"],
    draw: { dominant: 1.2, off: 0.95 },
    refine: { dominant: 1.08, off: 0.99 },
    stabilityCapDelta: 0,
    taintBaseline: 0.04,
  },
};

export const ESSENCE_ANOMALY_DEFS = {
  leyline_storm: {
    id: "leyline_storm",
    name: "Leyline Storm",
    allowedBiomes: ["ruins", "skydocks"],
    densityDeltaByEssence: { lightning: 0.12, air: 0.06, earth: 0.02 },
    drawMultByEssence: { lightning: 1.08, air: 1.03 },
    refineYieldMultByEssence: { lightning: 1.03 },
    compressRiskMultByEssence: { lightning: 1.10, air: 1.05 },
    potencyMultByEssence: { lightning: 1.04 },
    taintNudge: 0.02,
    driftIntervalTurns: 12,
  },
  bloom_sporeveil: {
    id: "bloom_sporeveil",
    name: "Sporeveil Bloom",
    allowedBiomes: ["wilds"],
    densityDeltaByEssence: { life: 0.10, earth: 0.04, water: 0.04, shadow: 0.02 },
    drawMultByEssence: { life: 1.06, earth: 1.02 },
    refineYieldMultByEssence: { life: 1.04, water: 1.02 },
    compressRiskMultByEssence: { life: 1.03 },
    potencyMultByEssence: { life: 1.03 },
    taintNudge: 0,
    driftIntervalTurns: 16,
  },
  veil_sink: {
    id: "veil_sink",
    name: "Veil Sink",
    allowedBiomes: ["undercity"],
    densityDeltaByEssence: { shadow: 0.10, water: 0.04, earth: 0.03, light: -0.04 },
    drawMultByEssence: { shadow: 1.06, light: 0.96 },
    refineYieldMultByEssence: { shadow: 1.03, light: 0.98 },
    compressRiskMultByEssence: { light: 1.08, shadow: 1.03 },
    potencyMultByEssence: { shadow: 1.02 },
    taintNudge: 0.05,
    driftIntervalTurns: 14,
  },
  tide_rift: {
    id: "tide_rift",
    name: "Tide Rift",
    allowedBiomes: ["coast"],
    densityDeltaByEssence: { water: 0.11, air: 0.05, space: 0.02 },
    drawMultByEssence: { water: 1.05, air: 1.02 },
    refineYieldMultByEssence: { water: 1.04 },
    compressRiskMultByEssence: { water: 1.03 },
    potencyMultByEssence: { water: 1.02, space: 1.02 },
    taintNudge: 0,
    driftIntervalTurns: 18,
  },
  mirage_knot: {
    id: "mirage_knot",
    name: "Mirage Knot",
    allowedBiomes: ["desert"],
    densityDeltaByEssence: { air: 0.08, light: 0.04, time: 0.04, water: -0.05 },
    drawMultByEssence: { air: 1.04, time: 1.04 },
    refineYieldMultByEssence: { time: 1.02 },
    compressRiskMultByEssence: { time: 1.07, light: 1.05 },
    potencyMultByEssence: { time: 1.03 },
    taintNudge: 0.01,
    driftIntervalTurns: 15,
  },
  ash_vent: {
    id: "ash_vent",
    name: "Ash Vent",
    allowedBiomes: ["volcanic", "mountain"],
    densityDeltaByEssence: { fire: 0.10, earth: 0.05, destruction: 0.03, air: -0.02 },
    drawMultByEssence: { fire: 1.06, destruction: 1.04 },
    refineYieldMultByEssence: { fire: 1.03, earth: 1.01 },
    compressRiskMultByEssence: { fire: 1.06, destruction: 1.08 },
    potencyMultByEssence: { fire: 1.03, destruction: 1.03 },
    taintNudge: 0.03,
    driftIntervalTurns: 13,
  },
  mnemonic_breach: {
    id: "mnemonic_breach",
    name: "Mnemonic Breach",
    allowedBiomes: ["dreamscape"],
    densityDeltaByEssence: { time: 0.07, space: 0.07, shadow: 0.03, light: 0.02 },
    drawMultByEssence: { time: 1.05, space: 1.05 },
    refineYieldMultByEssence: { time: 1.02, space: 1.02 },
    compressRiskMultByEssence: { time: 1.06, space: 1.06 },
    potencyMultByEssence: { time: 1.03, space: 1.03 },
    taintNudge: 0.02,
    driftIntervalTurns: 11,
  },
};

export const RARE_ESSENCE_SOURCE_DEFS = {
  storm_water: {
    id: "storm_water",
    name: "Storm-Water Confluence",
    allowedBiomes: ["coast", "wilds"],
    requiresWeather: "storm",
    potencyMultByEssence: { water: 1.06, lightning: 1.02 },
    refineYieldMultByEssence: { water: 1.03 },
    taintNudge: 0.0,
  },
  ash_fire: {
    id: "ash_fire",
    name: "Ash-Fire Strata",
    allowedBiomes: ["volcanic", "mountain"],
    requiresWeather: "drought",
    potencyMultByEssence: { fire: 1.06, destruction: 1.03 },
    compressRiskMultByEssence: { fire: 1.04 },
    taintNudge: 0.01,
  },
};

export function getRareEssenceSourceById(id) {
  if (!id) return null;
  const key = typeof id === "string" ? id.trim().toLowerCase() : "";
  return RARE_ESSENCE_SOURCE_DEFS[key] || null;
}

export function getEssenceAnomalyById(id) {
  if (!id) return null;
  const key = typeof id === "string" ? id.trim().toLowerCase() : "";
  return ESSENCE_ANOMALY_DEFS[key] || null;
}

export function getEssenceAnomalyIdsForBiome(biomeId) {
  const key = typeof biomeId === "string" ? biomeId.trim().toLowerCase() : "";
  return Object.values(ESSENCE_ANOMALY_DEFS)
    .filter((def) => Array.isArray(def.allowedBiomes) && def.allowedBiomes.includes(key))
    .map((def) => def.id);
}

export function getBiomeEssenceProfile(biomeId) {
  const key = typeof biomeId === "string" ? biomeId.trim().toLowerCase() : "";
  return BIOME_ESSENCE_PROFILES[key] || null;
}

// =============================================================================
// MUTATORS / LOOKUPS
// =============================================================================

export function setWorldRegistry({
  factions: nextFactions,
  zones: nextZones,
  locations: nextLocations,
} = {}) {
  if (Array.isArray(nextFactions)) {
    factions = nextFactions;
  }
  if (Array.isArray(nextZones)) {
    zones = nextZones;
  }
  if (Array.isArray(nextLocations)) {
    locations = nextLocations;
  }
}

export function getFactionById(id) {
  if (!id) return null;
  return factions.find((f) => f.id === id) || null;
}

export function getZoneById(id) {
  if (!id) return null;
  return zones.find((z) => z.id === id) || null;
}

export function getLocationById(id) {
  if (!id) return null;
  return locations.find((loc) => loc.id === id) || null;
}

export function findLocationsByZone(zoneId) {
  if (!zoneId) return [];
  return locations.filter((loc) => loc.zoneId === zoneId);
}

function normalizeSearchText(value) {
  if (typeof value !== "string") return "";
  const lowered = value.toLowerCase().trim();
  if (!lowered) return "";
  const asSpaces = lowered.replace(/[_-]+/g, " ");
  const alnumSpace = asSpaces.replace(/[^a-z0-9 ]+/g, " ");
  return alnumSpace.replace(/\s{2,}/g, " ").trim();
}

function normalizeAllowedIds(allowedLocationIds) {
  if (!allowedLocationIds) return null;
  if (allowedLocationIds instanceof Set) {
    return new Set(
      Array.from(allowedLocationIds).filter((id) => typeof id === "string"),
    );
  }
  if (Array.isArray(allowedLocationIds)) {
    return new Set(allowedLocationIds.filter((id) => typeof id === "string"));
  }
  return null;
}

function pickLexicographicallySmallestId(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const ids = matches.map((loc) => loc.id).filter(Boolean);
  ids.sort((a, b) => String(a).localeCompare(String(b)));
  return ids[0] || null;
}

/**
 * Resolve a raw user/location string to a canonical location id.
 * Deterministic tie-break: prefer exact id, then exact alias, then exact name,
 * then unique contains-match; otherwise pick lexicographically smallest id.
 */
export function resolveLocationId(raw, { allowedLocationIds } = {}) {
  const allowedSet = normalizeAllowedIds(allowedLocationIds);
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  const rawLower = trimmed.toLowerCase();
  const normalized = normalizeSearchText(trimmed);
  if (!normalized) return null;

  const pool = allowedSet
    ? locations.filter((loc) => allowedSet.has(loc.id))
    : locations;

  // 1) Exact id match
  const idMatch = pool.find((loc) => loc.id === rawLower);
  if (idMatch) return idMatch.id;

  // 2) Exact alias match
  const aliasMatches = pool.filter((loc) =>
    Array.isArray(loc.aliases)
      ? loc.aliases.some((alias) => normalizeSearchText(alias) === normalized)
      : false,
  );
  if (aliasMatches.length === 1) return aliasMatches[0].id;
  if (aliasMatches.length > 1)
    return pickLexicographicallySmallestId(aliasMatches);

  // 3) Exact name match
  const nameMatches = pool.filter(
    (loc) => normalizeSearchText(loc.name) === normalized,
  );
  if (nameMatches.length === 1) return nameMatches[0].id;
  if (nameMatches.length > 1) return pickLexicographicallySmallestId(nameMatches);

  // 4) Contains-match if unique
  const containsMatches = pool.filter((loc) => {
    const name = normalizeSearchText(loc.name);
    if (name.includes(normalized)) return true;
    const aliases = Array.isArray(loc.aliases) ? loc.aliases : [];
    return aliases.some((alias) =>
      normalizeSearchText(alias).includes(normalized),
    );
  });
  if (containsMatches.length === 1) return containsMatches[0].id;

  // 5) Deterministic fallback (rare/ambiguous)
  return pickLexicographicallySmallestId(containsMatches);
}

/**
 * Runtime helper: compute location ids a player can travel to right now.
 * Includes visited/unlocked/current, plus "public" hubs in the current zone.
 */
export function getAccessibleLocationIds(gameState) {
  const world = gameState?.world || {};
  const rawLocation = world.location;
  const currentRaw =
    typeof rawLocation === "string" ? rawLocation : rawLocation?.current;
  const currentId = resolveLocationId(currentRaw) || currentRaw || null;

  const visited = Array.isArray(rawLocation?.visited) ? rawLocation.visited : [];
  const unlocked = Array.isArray(rawLocation?.unlockedAreas)
    ? rawLocation.unlockedAreas
    : [];

  const result = new Set(
    [currentId, ...visited, ...unlocked].filter(
      (id) => typeof id === "string" && id.trim(),
    ),
  );

  const resolvedCurrent =
    typeof currentId === "string" ? getLocationById(currentId) : null;
  const zoneId = resolvedCurrent?.zoneId || null;
  if (zoneId) {
    findLocationsByZone(zoneId)
      .filter((loc) => loc.travelPolicy === "public")
      .forEach((loc) => result.add(loc.id));
  }

  return result;
}
