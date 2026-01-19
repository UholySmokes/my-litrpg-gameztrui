// ============================================================================
// QUEST CATALOG
// Provides placeholder quest data + deterministic selection helpers
// ============================================================================

const MAIN_QUESTS = [
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
      favoredClasses: ["battlemage", "sorcerer"],
      favoredRaces: ["void_walker", "celestial_descendant"],
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
      favoredClasses: ["rogue", "shadow_dancer"],
      favoredRaces: ["shadow_walker", "neo_human"],
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
      favoredClasses: ["druid", "ranger"],
      favoredRaces: ["nature_spirit", "beast_kin"],
    },
  },
];

const SIDE_QUESTS = [
  {
    id: "sq_cryptic_cache",
    name: "Cryptic Cache",
    description:
      "A courier dropped a stasis cube. Decode its rotating runes before it self-destructs.",
    objectives: [
      {
        id: "sq_cryptic_cache_obj",
        description: "Solve the rune-lock sequence",
        completed: false,
      },
    ],
    rewards: { xp: 45, items: [{ id: "encrypted_cube", quantity: 1 }] },
    autoComplete: {
      requiresItem: "encrypted_cube",
    },
    tags: {
      biome: "city",
      tones: ["mysterious"],
      favoredClasses: ["scholar", "battlemage"],
      favoredRaces: ["mechanical_construct", "ancient_bloodline"],
    },
  },
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
      favoredClasses: ["artificer", "bard"],
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
      favoredClasses: ["cleric", "psion"],
      favoredRaces: ["void_walker", "phoenix_reborn"],
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
    return Date.now() >>> 0;
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
  const { classId, raceId, professionId } = character;
  const tags = quest.tags || {};
  if (classId && tags.favoredClasses?.includes(classId)) weight += 2;
  if (raceId && tags.favoredRaces?.includes(raceId)) weight += 2;
  if (professionId && tags.favoredProfessions?.includes(professionId))
    weight += 1;
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

function generateInitialQuestPackage({
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

export { MAIN_QUESTS, SIDE_QUESTS };

const __internal = {
  MAIN_QUESTS,
  SIDE_QUESTS,
  hashSeed,
  mulberry32,
};

export { __internal };
