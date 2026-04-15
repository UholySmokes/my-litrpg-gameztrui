import { resolveZoneId } from "../../world/WorldDataRegistry.js";

const ORIGIN_DEFINITIONS = [
  {
    id: "freehold_scrapper",
    name: "Freehold Scrapper",
    description:
      "Raised in the tariff shadows of Auric Crown, you learned how to turn salvage and gossip into leverage.",
    attributeBonuses: {
      dexterity: 1,
      luck: 1,
      charisma: -1,
    },
    favoredBiome: "auric_crown",
    favoredFactionId: "aurum_exchange",
    favoredQuestTags: ["economy", "crafting", "quests"],
  },
  {
    id: "ledger_apprentice",
    name: "Ledger Apprentice",
    description:
      "You learned Auric Crown through invoices, audits, and the quiet violence of ceremonial contracts.",
    attributeBonuses: {
      intelligence: 1,
      charisma: 1,
      strength: -1,
    },
    favoredBiome: "auric_crown",
    favoredFactionId: "aurum_exchange",
    favoredQuestTags: ["systems", "factions", "economy"],
  },
  {
    id: "salvage_adept",
    name: "Salvage Adept",
    description:
      "Riftscar fault lines and dead relay towers taught you to read danger, residue, and broken machinery.",
    attributeBonuses: {
      dexterity: 1,
      willpower: 1,
      charisma: -1,
    },
    favoredBiome: "riftscar_barrens",
    favoredFactionId: "arcane_wardens",
    favoredQuestTags: ["magic-research", "mystery", "puzzle"],
  },
  {
    id: "grove_exile",
    name: "Grove Exile",
    description:
      "You came from the Wildroot vote-edges where roots, spores, and old pacts mattered more than coin.",
    attributeBonuses: {
      agility: 1,
      wisdom: 1,
      charisma: -1,
    },
    favoredBiome: "wildroot_basin",
    favoredFactionId: "verdant_envoys",
    favoredQuestTags: ["mystic", "combat", "atmosphere"],
  },
  {
    id: "deckhand_cadet",
    name: "Deckhand Cadet",
    description:
      "You grew up on Marchward catwalks and engine decks, trusting timing, grit, and altitude over comfort.",
    attributeBonuses: {
      agility: 1,
      vitality: 1,
      intelligence: -1,
    },
    favoredBiome: "skybound_marches",
    favoredFactionId: "skyforge_sentinels",
    favoredQuestTags: ["action", "tutorial", "skills"],
  },
  {
    id: "archive_runner",
    name: "Archive Runner",
    description:
      "Courier, thief, and witness in the Veilward markets, you survived by moving faster than secrets spread.",
    attributeBonuses: {
      intelligence: 1,
      willpower: 1,
      strength: -1,
    },
    favoredBiome: "veilward_depths",
    favoredFactionId: "veil_wardens",
    favoredQuestTags: ["mystery", "magic-research", "factions"],
  },
  {
    id: "tidebound_votary",
    name: "Tidebound Votary",
    description:
      "Reef shrines and oath-heavy harbors trained you to endure pressure and listen for storm omens.",
    attributeBonuses: {
      wisdom: 1,
      soul: 1,
      dexterity: -1,
    },
    favoredBiome: "dawnreef_tangle",
    favoredFactionId: "tideward_order",
    favoredQuestTags: ["atmosphere", "factions", "mystic"],
  },
  {
    id: "sandstep_scout",
    name: "Sandstep Scout",
    description:
      "Glassstep caravan routes and mirage storms taught you to read false horizons and keep moving anyway.",
    attributeBonuses: {
      agility: 1,
      luck: 1,
      vitality: -1,
    },
    favoredBiome: "glassstep_expanse",
    favoredFactionId: "mirage_guides",
    favoredQuestTags: ["mystery", "puzzle", "atmosphere"],
  },
  {
    id: "ashmarked_prospector",
    name: "Ashmarked Prospector",
    description:
      "You worked Emberline vent margins where every haul cost blood, breath, and a little patience.",
    attributeBonuses: {
      strength: 1,
      vitality: 1,
      charisma: -1,
    },
    favoredBiome: "emberline_archipelago",
    favoredFactionId: "smoke_wardens",
    favoredQuestTags: ["combat", "crafting", "high-hook"],
  },
  {
    id: "dreamwake_survivor",
    name: "Dreamwake Survivor",
    description:
      "You returned from a clarity break in Lucent Verge. The world feels real enough, but never simple.",
    attributeBonuses: {
      willpower: 1,
      soul: 1,
      strength: -1,
    },
    favoredBiome: "lucent_verge",
    favoredFactionId: null,
    favoredQuestTags: ["weird", "high-hook", "mystery"],
  },
];

export let origins = ORIGIN_DEFINITIONS.map((origin) => ({ ...origin }));

function cloneOrigin(origin) {
  if (!origin || typeof origin !== "object") return null;
  return {
    ...origin,
    favoredBiome: resolveZoneId(origin.favoredBiome) || origin.favoredBiome || "neutral",
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
