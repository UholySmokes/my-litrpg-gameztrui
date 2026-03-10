const ORIGIN_DEFINITIONS = [
  {
    id: "freehold_scrapper",
    name: "Freehold Scrapper",
    description:
      "Raised in salvage lanes and black-market alleys, you know how to turn scraps into leverage.",
    attributeBonuses: {
      dexterity: 1,
      luck: 1,
      charisma: -1,
    },
    favoredBiome: "city",
    favoredFactionId: "aurum_exchange",
    favoredQuestTags: ["economy", "crafting", "quests"],
  },
  {
    id: "ledger_apprentice",
    name: "Ledger Apprentice",
    description:
      "You learned the city through invoices, audits, and the quiet violence of contracts.",
    attributeBonuses: {
      intelligence: 1,
      charisma: 1,
      strength: -1,
    },
    favoredBiome: "city",
    favoredFactionId: "aurum_exchange",
    favoredQuestTags: ["systems", "factions", "economy"],
  },
  {
    id: "salvage_adept",
    name: "Salvage Adept",
    description:
      "Collapsed districts and dead towers taught you to read danger, residue, and forgotten machinery.",
    attributeBonuses: {
      dexterity: 1,
      willpower: 1,
      charisma: -1,
    },
    favoredBiome: "ruins",
    favoredFactionId: "arcane_wardens",
    favoredQuestTags: ["magic-research", "mystery", "puzzle"],
  },
  {
    id: "grove_exile",
    name: "Grove Exile",
    description:
      "You came from the wild edges where roots, spores, and old pacts mattered more than coin.",
    attributeBonuses: {
      agility: 1,
      wisdom: 1,
      charisma: -1,
    },
    favoredBiome: "wilds",
    favoredFactionId: "verdant_envoys",
    favoredQuestTags: ["mystic", "combat", "atmosphere"],
  },
  {
    id: "deckhand_cadet",
    name: "Deckhand Cadet",
    description:
      "You grew up on catwalks and engine decks, trusting timing, grit, and altitude over comfort.",
    attributeBonuses: {
      agility: 1,
      vitality: 1,
      intelligence: -1,
    },
    favoredBiome: "skydocks",
    favoredFactionId: "skyforge_sentinels",
    favoredQuestTags: ["action", "tutorial", "skills"],
  },
  {
    id: "archive_runner",
    name: "Archive Runner",
    description:
      "Courier, thief, and witness in the undercity, you survived by moving faster than secrets spread.",
    attributeBonuses: {
      intelligence: 1,
      willpower: 1,
      strength: -1,
    },
    favoredBiome: "undercity",
    favoredFactionId: "veil_wardens",
    favoredQuestTags: ["mystery", "magic-research", "factions"],
  },
  {
    id: "tidebound_votary",
    name: "Tidebound Votary",
    description:
      "Stormglass shrines and oath-heavy harbors trained you to endure pressure and listen for omens.",
    attributeBonuses: {
      wisdom: 1,
      soul: 1,
      dexterity: -1,
    },
    favoredBiome: "coast",
    favoredFactionId: "tideward_order",
    favoredQuestTags: ["atmosphere", "factions", "mystic"],
  },
  {
    id: "sandstep_scout",
    name: "Sandstep Scout",
    description:
      "Caravan routes and mirage storms taught you to read false horizons and keep moving anyway.",
    attributeBonuses: {
      agility: 1,
      luck: 1,
      vitality: -1,
    },
    favoredBiome: "desert",
    favoredFactionId: "mirage_guides",
    favoredQuestTags: ["mystery", "puzzle", "atmosphere"],
  },
  {
    id: "ashmarked_prospector",
    name: "Ashmarked Prospector",
    description:
      "You worked the caldera margins where every haul cost blood, breath, and a little patience.",
    attributeBonuses: {
      strength: 1,
      vitality: 1,
      charisma: -1,
    },
    favoredBiome: "volcanic",
    favoredFactionId: "smoke_wardens",
    favoredQuestTags: ["combat", "crafting", "high-hook"],
  },
  {
    id: "dreamwake_survivor",
    name: "Dreamwake Survivor",
    description:
      "You returned from a place that edits memory. The world feels real enough, but never simple.",
    attributeBonuses: {
      willpower: 1,
      soul: 1,
      strength: -1,
    },
    favoredBiome: "dreamscape",
    favoredFactionId: null,
    favoredQuestTags: ["weird", "high-hook", "mystery"],
  },
];

export let origins = ORIGIN_DEFINITIONS.map((origin) => ({ ...origin }));

function cloneOrigin(origin) {
  if (!origin || typeof origin !== "object") return null;
  return {
    ...origin,
    attributeBonuses:
      origin.attributeBonuses && typeof origin.attributeBonuses === "object"
        ? { ...origin.attributeBonuses }
        : {},
    favoredQuestTags: Array.isArray(origin.favoredQuestTags)
      ? [...origin.favoredQuestTags]
      : [],
  };
}

function getOriginById(originId) {
  return origins.find((entry) => entry.id === originId) || null;
}

export function setOrigins(nextOrigins) {
  if (Array.isArray(nextOrigins) && nextOrigins.length > 0) {
    origins = nextOrigins.map((origin) => cloneOrigin(origin)).filter(Boolean);
  }
}

export { cloneOrigin, getOriginById };
