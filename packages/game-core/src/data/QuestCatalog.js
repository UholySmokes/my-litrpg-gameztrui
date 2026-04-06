// ============================================================================
// QUEST CATALOG
// Curated quest data + deterministic selection helpers
// ============================================================================

import { SimBridge } from "../simulation/bridge/SimulationContext.js";

let BEGINNER_QUESTS = [
  {
    id: "bq_first_stride",
    name: "First Stride",
    description:
      "Take your first calm steps in the region and learn how movement and leveling feel.",
    objectives: [
      {
        id: "bq_first_stride_obj_1",
        description: "Make one successful travel move",
        completed: false,
        criteria: {
          actionType: "move",
          requiresLocationChange: true,
        },
      },
      {
        id: "bq_first_stride_obj_2",
        description: "Reach level 2",
        completed: false,
        criteria: {
          minLevel: 2,
        },
      },
    ],
    rewards: { xp: 35, items: [{ id: "ration_pack", quantity: 1 }] },
    tags: {
      starter: true,
      tones: ["serene"],
      favoredOrigins: ["freehold_scrapper", "deckhand_cadet", "sandstep_scout"],
    },
  },
  {
    id: "bq_system_basics",
    name: "System Basics",
    description:
      "Familiarize yourself with your interface and personal resources before taking bigger risks.",
    objectives: [
      {
        id: "bq_system_basics_obj_1",
        description: "Check your status once",
        completed: false,
        criteria: {
          actionType: "status",
        },
      },
      {
        id: "bq_system_basics_obj_2",
        description: "Open your inventory once",
        completed: false,
        criteria: {
          actionType: "inventory",
        },
      },
    ],
    rewards: { xp: 5, items: [{ id: "minor_health_potion", quantity: 1 }] },
    tags: {
      starter: true,
      tones: ["neutral"],
      favoredOrigins: ["ledger_apprentice", "archive_runner"],
    },
  },
  {
    id: "bq_first_conflict",
    name: "First Conflict",
    description:
      "Handle one small threat to prove you can survive a basic encounter.",
    objectives: [
      {
        id: "bq_first_conflict_obj_1",
        description: "Defeat one enemy",
        completed: false,
        criteria: {
          minTotalKills: 1,
        },
      },
    ],
    rewards: { xp: 25, items: [{ id: "bandage_roll", quantity: 2 }] },
    tags: {
      starter: true,
      tones: ["tense"],
      favoredOrigins: ["ashmarked_prospector", "grove_exile", "deckhand_cadet"],
    },
  },
];

let MAIN_QUESTS = [
  {
    id: "mq_fallen_spire",
    name: "Echoes of the Fallen Spire",
    description:
      "A shattered leyline tower bleeds mana storms into the nearby district. Someone must reach the core and stabilize it.",
    objectives: [
      {
        id: "mq_fallen_spire_obj_1",
        description: "Reach the Fallen Spire plaza",
        completed: false,
      },
      {
        id: "mq_fallen_spire_obj_2",
        description: "Stabilize the exposed leyline core",
        completed: false,
      },
    ],
    rewards: { xp: 120, items: [{ id: "leyline_shard", quantity: 1 }] },
    tags: {
      biome: "ruins",
      tones: ["mysterious", "urgent"],
      favoredClasses: ["battlemage", "archmage"],
      favoredRaces: ["void_walker", "celestial_descendant"],
      favoredOrigins: ["salvage_adept", "ledger_apprentice"],
    },
  },
  {
    id: "mq_whisper_market",
    name: "Whispers in the Neon Market",
    description:
      "Merchants vanish from the bazaar each dawn. A hidden broker is buying souls; expose the conspiracy before the market riots.",
    objectives: [
      {
        id: "mq_whisper_market_obj_1",
        description: "Gather intel from three market factions",
        completed: false,
      },
      {
        id: "mq_whisper_market_obj_2",
        description: "Confront the broker beneath the holo-bazaar",
        completed: false,
      },
    ],
    rewards: { xp: 110, items: [{ id: "soulseal_token", quantity: 2 }] },
    tags: {
      biome: "city",
      tones: ["tense"],
      favoredClasses: ["rogue", "shadow_assassin"],
      favoredRaces: ["shadow_walker", "neo_human"],
      favoredOrigins: ["freehold_scrapper", "ledger_apprentice"],
    },
  },
  {
    id: "mq_ember_bloom",
    name: "The Ember Bloom Accord",
    description:
      "An ancient world-tree bud ignites atop a volcanic ridge. Factions race to claim it; forge an accord or let the forest burn.",
    objectives: [
      {
        id: "mq_ember_bloom_obj_1",
        description: "Reach the Ember Bloom before rival envoys",
        completed: false,
      },
      {
        id: "mq_ember_bloom_obj_2",
        description: "Negotiate, steal, or protect the Bloom",
        completed: false,
      },
    ],
    rewards: { xp: 130, items: [{ id: "ember_bloom_petal", quantity: 1 }] },
    tags: {
      biome: "wilds",
      tones: ["triumphant", "mystical"],
      favoredClasses: ["beastmaster", "ranger"],
      favoredRaces: ["nature_spirit", "beast_kin"],
      favoredOrigins: ["grove_exile"],
    },
  },
  {
    id: "mq_starforge_siege",
    name: "Starforge Siege",
    description:
      "Sky raiders have seized the skydocks forge. Shut down their engines before the city core is breached.",
    objectives: [
      {
        id: "mq_starforge_siege_obj_1",
        description: "Secure the outer skydocks gantries",
        completed: false,
      },
      {
        id: "mq_starforge_siege_obj_2",
        description: "Disable the starforge core",
        completed: false,
      },
    ],
    rewards: { xp: 140, items: [{ id: "skyforge_core", quantity: 1 }] },
    tags: {
      biome: "skydocks",
      tones: ["urgent", "heroic"],
      favoredClasses: ["paladin", "sharpshooter", "battlemage"],
      favoredRaces: ["skybound", "starseer", "stormforged"],
      favoredOrigins: ["deckhand_cadet"],
    },
  },
  {
    id: "mq_ashen_caldera",
    name: "Ashen Caldera Descent",
    description:
      "Seismic vents destabilize a volcanic ring. Descend into the caldera and seal the ruptures before magma floods the wilds.",
    objectives: [
      {
        id: "mq_ashen_caldera_obj_1",
        description: "Navigate the ash tunnels",
        completed: false,
      },
      {
        id: "mq_ashen_caldera_obj_2",
        description: "Seal the caldera vents",
        completed: false,
      },
    ],
    rewards: { xp: 155, items: [{ id: "caldera_seal", quantity: 2 }] },
    tags: {
      biome: "volcanic",
      tones: ["grim", "mystical"],
      favoredClasses: ["berserker", "spellbreaker", "beastmaster"],
      favoredRaces: ["emberkin", "phoenix_reborn", "demon_kin"],
      favoredOrigins: ["ashmarked_prospector"],
    },
  },
  {
    id: "mq_veil_archive",
    name: "Veil Archive Heist",
    description:
      "An undercity archive hides the ledger of a forgotten guild. Slip inside and extract the ledger before the veil wardens arrive.",
    objectives: [
      {
        id: "mq_veil_archive_obj_1",
        description: "Bypass the veil ward sigils",
        completed: false,
      },
      {
        id: "mq_veil_archive_obj_2",
        description: "Retrieve the shadow ledger",
        completed: false,
      },
    ],
    rewards: { xp: 135, items: [{ id: "veil_ledger", quantity: 1 }] },
    tags: {
      biome: "undercity",
      tones: ["tense", "mysterious"],
      favoredClasses: ["rogue", "night_reaper", "oracle_hierophant"],
      favoredRaces: ["gloomshade", "duskborne", "undead_awakened"],
      favoredOrigins: ["archive_runner", "dreamwake_survivor"],
    },
  },
  {
    id: "mq_crystal_forge",
    name: "Crystal Forge Resonance",
    description:
      "A mountain forge hums out of tune. Align the crystal matrices before the resonance shatters the ridge.",
    objectives: [
      {
        id: "mq_crystal_forge_obj_1",
        description: "Collect the fractured resonance shards",
        completed: false,
      },
      {
        id: "mq_crystal_forge_obj_2",
        description: "Stabilize the crystal lattice",
        completed: false,
      },
    ],
    rewards: { xp: 145, items: [{ id: "resonance_shard", quantity: 3 }] },
    tags: {
      biome: "mountain",
      tones: ["stoic", "mysterious"],
      favoredClasses: ["mage", "tempest_reveler", "battlemage"],
      favoredRaces: ["crystal_being", "rune_sentinel", "ironroot"],
      favoredOrigins: ["salvage_adept", "ledger_apprentice"],
    },
  },
  {
    id: "mq_tide_breach",
    name: "Tide Breach",
    description:
      "A coastal ward has collapsed and the tide surges inland. Restore the ward and drive back the abyssal swarm.",
    objectives: [
      {
        id: "mq_tide_breach_obj_1",
        description: "Reclaim the flooded ward stones",
        completed: false,
      },
      {
        id: "mq_tide_breach_obj_2",
        description: "Reignite the tidal barrier",
        completed: false,
      },
    ],
    rewards: { xp: 150, items: [{ id: "tide_ward_charm", quantity: 1 }] },
    tags: {
      biome: "coast",
      tones: ["urgent"],
      favoredClasses: ["tempest_reveler", "ranger", "monk"],
      favoredRaces: ["tidecaller", "frostborne", "astral_nomad"],
      favoredOrigins: ["tidebound_votary"],
    },
  },
  {
    id: "mq_oracle_sundial",
    name: "Oracle of the Sundial",
    description:
      "A desert sundial predicts a solar blackout. Track the oracle and decode the warning before the mirage storm descends.",
    objectives: [
      {
        id: "mq_oracle_sundial_obj_1",
        description: "Locate the wandering oracle",
        completed: false,
        criteria: {
          actionType: "move",
          requiresLocationChange: true,
        },
      },
      {
        id: "mq_oracle_sundial_obj_2",
        description: "Interpret the sundial glyphs",
        completed: false,
        criteria: {
          actionType: ["look", "magic_sense"],
        },
      },
    ],
    rewards: { xp: 135, items: [{ id: "sundial_glyph", quantity: 1 }] },
    tags: {
      biome: "desert",
      tones: ["ethereal", "mysterious"],
      favoredClasses: ["mage", "trickster", "night_reaper"],
      favoredRaces: ["umbral_oracle", "mirageborn", "sandstrider"],
      favoredOrigins: ["sandstep_scout", "dreamwake_survivor"],
    },
  },
];

let SIDE_QUESTS = [
  {
    id: "sq_ghoul_pit",
    name: "Ghoul Pit Cleanup",
    description:
      "A maintenance shaft collapsed into a ghoul den. Clear the nest before it spreads to the upper wards.",
    objectives: [
      {
        id: "sq_ghoul_pit_obj",
        description: "Purge the ghoul nest",
        completed: false,
      },
    ],
    rewards: { xp: 60, items: [{ id: "cleansed_toxin", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "undercity",
      tones: ["grim"],
      favoredClasses: ["paladin", "berserker"],
      favoredRaces: ["pure_human", "demon_kin"],
    },
  },
  {
    id: "sq_skyfisher",
    name: "Skyfisher Net",
    description:
      "Anti-grav nets snagged a stray skyfisher. Free it or harvest it for rare reagents before patrol drones arrive.",
    objectives: [
      {
        id: "sq_skyfisher_obj",
        description: "Decide the fate of the trapped skyfisher",
        completed: false,
      },
    ],
    rewards: { xp: 35, items: [{ id: "skyfisher_filament", quantity: 3 }] },
    autoComplete: null,
    tags: {
      biome: "skydocks",
      tones: ["whimsical"],
      favoredClasses: ["spellbreaker", "trickster"],
      favoredRaces: ["fae_touched", "phoenix_reborn"],
    },
  },
  {
    id: "sq_mnemonic_dust",
    name: "Mnemonic Dust",
    description:
      "A local healer needs memory dust distilled from dream-wisps. Gather samples without falling asleep yourself.",
    objectives: [
      {
        id: "sq_mnemonic_dust_obj",
        description: "Collect three dream-wisp samples",
        completed: false,
      },
    ],
    rewards: { xp: 55, items: [{ id: "mnemonic_vial", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "dreamscape",
      tones: ["ethereal"],
      favoredClasses: ["cleric", "oracle_hierophant"],
      favoredRaces: ["void_walker", "phoenix_reborn"],
    },
  },
  {
    id: "sq_storm_capacitor",
    name: "Storm Capacitor",
    description:
      "A skydock capacitor is overloaded. Discharge it safely before it detonates.",
    objectives: [
      {
        id: "sq_storm_capacitor_obj",
        description: "Stabilize the storm capacitor coils",
        completed: false,
      },
    ],
    rewards: { xp: 40, items: [{ id: "storm_capacitor", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "skydocks",
      tones: ["urgent"],
      favoredClasses: ["paladin", "sharpshooter"],
      favoredRaces: ["stormforged", "skybound"],
    },
  },
  {
    id: "sq_frost_lattice",
    name: "Frost Lattice",
    description:
      "A frost lattice was stolen from the lab. Recover it before it melts in the sun.",
    objectives: [
      {
        id: "sq_frost_lattice_obj",
        description: "Recover the lattice shard",
        completed: false,
      },
    ],
    rewards: { xp: 50, items: [{ id: "frost_lattice", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "ruins",
      tones: ["mysterious"],
      favoredClasses: ["mage", "battlemage"],
      favoredRaces: ["frostborne", "crystal_being"],
    },
  },
  {
    id: "sq_rune_cache",
    name: "Rune Cache",
    description:
      "A collapsed tunnel hides an ancient rune cache. Retrieve it before tremors erase the path.",
    objectives: [
      {
        id: "sq_rune_cache_obj",
        description: "Secure the rune cache",
        completed: false,
      },
    ],
    rewards: { xp: 55, items: [{ id: "rune_cache", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "mountain",
      tones: ["stoic"],
      favoredClasses: ["tempest_reveler", "paladin"],
      favoredRaces: ["rune_sentinel", "ironroot"],
    },
  },
  {
    id: "sq_bloomed_spores",
    name: "Bloomed Spores",
    description:
      "The grove is overrun with aggressive spores. Gather samples for antidote research.",
    objectives: [
      {
        id: "sq_bloomed_spores_obj",
        description: "Collect five spore sacs",
        completed: false,
      },
    ],
    rewards: { xp: 45, items: [{ id: "spore_sac", quantity: 2 }] },
    autoComplete: null,
    tags: {
      biome: "wilds",
      tones: ["mystical"],
      favoredClasses: ["beastmaster", "ranger"],
      favoredRaces: ["verdant_shaper", "nature_spirit"],
    },
  },
  {
    id: "sq_venom_exchange",
    name: "Venom Exchange",
    description:
      "A healer needs fresh venom to craft antidotes. Negotiate with the venom traders in the undercity.",
    objectives: [
      {
        id: "sq_venom_exchange_obj",
        description: "Secure a vial of prime venom",
        completed: false,
      },
    ],
    rewards: { xp: 50, items: [{ id: "prime_venom", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "undercity",
      tones: ["tense"],
      favoredClasses: ["rogue", "shadow_assassin"],
      favoredRaces: ["venomtail", "gloomshade"],
    },
  },
  {
    id: "sq_auric_harmony",
    name: "Auric Harmony",
    description:
      "A cathedral choir is beset by a dissonant relic. Guard the ritual until the harmony is restored.",
    objectives: [
      {
        id: "sq_auric_harmony_obj",
        description: "Protect the auric ritual",
        completed: false,
      },
    ],
    rewards: { xp: 45, items: [{ id: "auric_chime", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "city",
      tones: ["triumphant"],
      favoredClasses: ["cleric", "paladin"],
      favoredRaces: ["auric_seraph", "celestial_descendant"],
    },
  },
  {
    id: "sq_quake_relief",
    name: "Quake Relief",
    description:
      "Aftershocks threaten a refugee tunnel. Reinforce the supports before the next quake.",
    objectives: [
      {
        id: "sq_quake_relief_obj",
        description: "Reinforce the tunnel supports",
        completed: false,
      },
    ],
    rewards: { xp: 60, items: [{ id: "support_brace", quantity: 2 }] },
    autoComplete: null,
    tags: {
      biome: "undercity",
      tones: ["grim"],
      favoredClasses: ["warrior", "berserker"],
      favoredRaces: ["quakeborn", "ironroot"],
    },
  },
  {
    id: "sq_astral_waypoint",
    name: "Astral Waypoint",
    description:
      "An astral waypoint flickers out at sea. Recalibrate it before navigation fails.",
    objectives: [
      {
        id: "sq_astral_waypoint_obj",
        description: "Recalibrate the astral waypoint",
        completed: false,
      },
    ],
    rewards: { xp: 50, items: [{ id: "waypoint_fragment", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "coast",
      tones: ["mysterious"],
      favoredClasses: ["battlemage", "astral_archon"],
      favoredRaces: ["astral_nomad", "starseer"],
    },
  },
  {
    id: "sq_mirage_map",
    name: "Mirage Map",
    description:
      "A shifting map reveals a lost caravan trail. Decode it before the sands move again.",
    objectives: [
      {
        id: "sq_mirage_map_obj",
        description: "Decode the mirage map",
        completed: false,
      },
    ],
    rewards: { xp: 40, items: [{ id: "mirage_map", quantity: 1 }] },
    autoComplete: null,
    tags: {
      biome: "desert",
      tones: ["ethereal"],
      favoredClasses: ["trickster", "ranger"],
      favoredRaces: ["mirageborn", "sandstrider"],
    },
  },
  {
    id: "sq_pattern_spiral",
    name: "Spiral Weave Trial",
    description:
      "A mentor challenges you to stabilize an unfamiliar spiral weave. Prove you can hold the pattern without it collapsing.",
    objectives: [
      {
        id: "sq_pattern_spiral_obj",
        description: "Successfully unlock the Spiral weave pattern",
        completed: false,
      },
    ],
    rewards: {
      xp: 80,
      magic: {
        perks: [{ id: "stable_weaves", rank: 1 }],
        patterns: { weave: ["spiral"] },
      },
      items: [],
    },
    autoComplete: {
      requiresMagicPattern: { kind: "weave", id: "spiral" },
    },
    levelRequirement: 4,
    tags: {
      tones: ["mysterious"],
      favoredClasses: ["mage", "battlemage"],
    },
  },
  {
    id: "sq_source_stormwater",
    name: "Stormwater Capture",
    description:
      "A conduit engineer needs proof that living stormwater can be stabilized without detonating the relay grid.",
    objectives: [
      {
        id: "sq_source_stormwater_obj",
        description: "Discover and stabilize a storm_water essence source",
        completed: false,
      },
    ],
    rewards: {
      xp: 70,
      magic: {
        perks: [{ id: "clean_refining", rank: 1 }],
      },
      items: [{ id: "storm_capacitor", quantity: 1 }],
    },
    autoComplete: {
      requiresEssenceSource: "storm_water",
    },
    levelRequirement: 3,
    tags: {
      biome: "skydocks",
      tones: ["urgent", "mysterious"],
      favoredClasses: ["mage", "battlemage", "tempest_reveler"],
      favoredRaces: ["stormforged", "skybound"],
    },
  },
  {
    id: "sq_source_ashfire",
    name: "Ashfire Taming",
    description:
      "Smoke Wardens report runaway ashfire vents. Bind one safely and chart its signature for future weave trials.",
    objectives: [
      {
        id: "sq_source_ashfire_obj",
        description: "Discover an ash_fire essence source in the caldera routes",
        completed: false,
      },
    ],
    rewards: {
      xp: 75,
      magic: {
        perks: [{ id: "safer_compression", rank: 1 }],
        patterns: { weave: ["lattice"] },
      },
      items: [{ id: "caldera_seal", quantity: 1 }],
    },
    autoComplete: {
      requiresEssenceSource: "ash_fire",
    },
    levelRequirement: 4,
    tags: {
      biome: "volcanic",
      tones: ["grim", "mystical"],
      favoredClasses: ["spellbreaker", "battlemage", "beastmaster"],
      favoredRaces: ["emberkin", "phoenix_reborn"],
    },
  },
];

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(seedInput) {
  if (seedInput === undefined || seedInput === null) {
    return SimBridge.now() >>> 0;
  }
  if (typeof seedInput === "number") {
    return seedInput >>> 0;
  }
  const str = String(seedInput);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function computeQuestWeight(quest, character = {}) {
  let weight = 1;
  const { classId, raceId, professionId, originId } = character;
  const tags = quest.tags || {};
  if (classId && tags.favoredClasses?.includes(classId)) weight += 2;
  if (raceId && tags.favoredRaces?.includes(raceId)) weight += 2;
  if (professionId && tags.favoredProfessions?.includes(professionId))
    weight += 1;
  if (originId && tags.favoredOrigins?.includes(originId)) weight += 2;
  return weight;
}

function pickWeighted(quests, rng, character) {
  const totalWeight = quests.reduce(
    (sum, quest) => sum + computeQuestWeight(quest, character),
    0,
  );
  let roll = rng() * totalWeight;
  for (const quest of quests) {
    roll -= computeQuestWeight(quest, character);
    if (roll <= 0) {
      return quest;
    }
  }
  return quests[quests.length - 1];
}

function cloneQuest(quest) {
  return JSON.parse(JSON.stringify(quest));
}

export function getQuestById(questId) {
  if (!questId) return null;
  return (
    BEGINNER_QUESTS.find((quest) => quest.id === questId) ||
    MAIN_QUESTS.find((quest) => quest.id === questId) ||
    SIDE_QUESTS.find((quest) => quest.id === questId) ||
    null
  );
}

function getRandomMainQuest(seedInput, character) {
  const seed = hashSeed(seedInput);
  const rng = mulberry32(seed);
  return { quest: cloneQuest(pickWeighted(MAIN_QUESTS, rng, character)), seed };
}

function getRandomSideQuests(count, seedInput, character) {
  const seed = hashSeed(seedInput);
  const rng = mulberry32(seed);
  const pool = [...SIDE_QUESTS];
  const selections = [];
  while (pool.length > 0 && selections.length < count) {
    const pick = pickWeighted(pool, rng, character);
    selections.push(cloneQuest(pick));
    const idx = pool.findIndex((q) => q.id === pick.id);
    if (idx >= 0) {
      pool.splice(idx, 1);
    }
  }
  return { quests: selections, seed };
}

export function generateInitialQuestPackage({
  seed,
  character,
  sideQuestCount = 2,
} = {}) {
  const baseSeed = hashSeed(seed);
  const { quest: mainQuest } = getRandomMainQuest(baseSeed, character);
  const { quests: sideQuests } = getRandomSideQuests(
    sideQuestCount,
    baseSeed + 1,
    character,
  );
  return {
    seedUsed: baseSeed,
    mainQuest,
    sideQuests,
  };
}

export function setQuestCatalog({ beginner, main, side } = {}) {
  if (Array.isArray(beginner)) {
    BEGINNER_QUESTS = beginner;
  }
  if (Array.isArray(main)) {
    MAIN_QUESTS = main;
  }
  if (Array.isArray(side)) {
    SIDE_QUESTS = side;
  }
}

export { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS };

const __internal = {
  BEGINNER_QUESTS,
  MAIN_QUESTS,
  SIDE_QUESTS,
  hashSeed,
  mulberry32,
};

export { __internal };
