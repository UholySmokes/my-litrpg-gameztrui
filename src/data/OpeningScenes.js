// ============================================================================
// OPENING SCENE LIBRARY
// Opening scenes with helper to select based on quest/character
// ============================================================================

import { hashSeed, mulberry32 } from "./QuestCatalog";
import { SimBridge } from "../simulation/bridge/SimulationBridge.js";

const OPENING_SCENES = [
  {
    id: "scene_leyline_plaza",
    biome: "ruins",
    tone: "mysterious",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "cracked plaza",
      factionHint = "arcane wardens",
    }) =>
      `Static storms crackle above the ${locationHint} while ${factionHint} argue over ${mainQuestName}. Background murmurs hint at ${sideHookNames.join(" and ") || "other odd jobs"} awaiting anyone brave enough.`,
    compatibleQuests: ["mq_fallen_spire", "sq_cryptic_cache"],
  },
  {
    id: "scene_neon_market",
    biome: "city",
    tone: "tense",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "Neon Bazaar",
      factionHint = "market enforcers",
    }) =>
      `The ${locationHint} hums with synth drums as the ${factionHint} sweep stalls in search of clues tied to ${mainQuestName}. Whispers of ${sideHookNames.join(" & ") || "other side hustles"} tug at your sleeve.`,
    compatibleQuests: ["mq_whisper_market", "sq_cryptic_cache", "sq_skyfisher"],
  },
  {
    id: "scene_ember_ridge",
    biome: "wilds",
    tone: "triumphant",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "ember ridge",
      factionHint = "druid envoys",
    }) =>
      `Ash petals fall around the ${locationHint} as ${factionHint} chant for balance. The fate of ${mainQuestName} rests on your arrival while rumours of ${sideHookNames.join(" and ") || "unclaimed favors"} circulate among the camps.`,
    compatibleQuests: ["mq_ember_bloom", "sq_mnemonic_dust"],
  },
  {
    id: "scene_skydock_siege",
    biome: "skydocks",
    tone: "heroic",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "skyforge platforms",
      factionHint = "dock sentinels",
    }) =>
      `Engines roar across the ${locationHint} as ${factionHint} rally for ${mainQuestName}. Rumors of ${sideHookNames.join(" and ") || "urgent contracts"} drift across the catwalks.`,
    compatibleQuests: ["mq_starforge_siege", "sq_storm_capacitor"],
    favoredClasses: ["archer", "templar"],
    favoredRaces: ["skybound", "stormforged"],
  },
  {
    id: "scene_undercity_veil",
    biome: "undercity",
    tone: "grim",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "vaulted tunnels",
      factionHint = "veil wardens",
    }) =>
      `Damp air curls through the ${locationHint} as ${factionHint} whisper about ${mainQuestName}. The scent of ${sideHookNames.join(" and ") || "side deals"} draws you deeper.`,
    compatibleQuests: [
      "mq_veil_archive",
      "sq_venom_exchange",
      "sq_quake_relief",
    ],
    favoredClasses: ["rogue", "assassin", "shadowblade"],
    favoredRaces: ["gloomshade", "duskborne"],
  },
  {
    id: "scene_crystal_forge",
    biome: "mountain",
    tone: "stoic",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "crystal ridgeline",
      factionHint = "forge caretakers",
    }) =>
      `A low hum reverberates along the ${locationHint} while ${factionHint} prepare for ${mainQuestName}. ${sideHookNames.join(" and ") || "Auxiliary tasks"} remain unclaimed among the scaffolds.`,
    compatibleQuests: ["mq_crystal_forge", "sq_rune_cache"],
    favoredClasses: ["shaman", "battlemage"],
    favoredRaces: ["crystal_being", "rune_sentinel"],
  },
  {
    id: "scene_tideward",
    biome: "coast",
    tone: "urgent",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "tideward breakers",
      factionHint = "coastal wardens",
    }) =>
      `Spray lashes the ${locationHint} as ${factionHint} brace for ${mainQuestName}. The call of ${sideHookNames.join(" and ") || "floating bounties"} rises with every surge.`,
    compatibleQuests: ["mq_tide_breach", "sq_astral_waypoint"],
    favoredClasses: ["shaman", "ranger"],
    favoredRaces: ["tidecaller", "frostborne"],
  },
  {
    id: "scene_sundial_mirage",
    biome: "desert",
    tone: "ethereal",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "sunlit dunes",
      factionHint = "mirage guides",
    }) =>
      `Heat haze ripples across the ${locationHint} as ${factionHint} await ${mainQuestName}. Hushed offers of ${sideHookNames.join(" and ") || "lost routes"} linger in the wind.`,
    compatibleQuests: ["mq_oracle_sundial", "sq_mirage_map"],
    favoredClasses: ["bard", "mage"],
    favoredRaces: ["mirageborn", "sandstrider"],
  },
  {
    id: "scene_ashen_caldera",
    biome: "volcanic",
    tone: "grim",
    descriptionTemplate: ({
      mainQuestName,
      sideHookNames = [],
      locationHint = "ashen caldera",
      factionHint = "smoke wardens",
    }) =>
      `Embers drift over the ${locationHint} while ${factionHint} plan for ${mainQuestName}. Calls for ${sideHookNames.join(" and ") || "hazard support"} echo through the smoke.`,
    compatibleQuests: ["mq_ashen_caldera", "sq_bloomed_spores"],
    favoredClasses: ["berserker", "warlock"],
    favoredRaces: ["emberkin", "phoenix_reborn"],
  },
];

function scoreScene(scene, { mainQuest, character } = {}) {
  let score = 1;
  if (mainQuest) {
    const questTags = mainQuest.tags || {};
    if (scene.compatibleQuests?.includes(mainQuest.id)) {
      score += 3;
    }
    if (questTags.biome && questTags.biome === scene.biome) {
      score += 2;
    }
    if (
      Array.isArray(questTags.tones) &&
      questTags.tones.includes(scene.tone)
    ) {
      score += 1;
    }
    if (
      character?.classId &&
      Array.isArray(questTags.favoredClasses) &&
      questTags.favoredClasses.includes(character.classId)
    ) {
      score += 1;
    }
    if (
      character?.raceId &&
      Array.isArray(questTags.favoredRaces) &&
      questTags.favoredRaces.includes(character.raceId)
    ) {
      score += 1;
    }
    if (
      character?.professionId &&
      Array.isArray(questTags.favoredProfessions) &&
      questTags.favoredProfessions.includes(character.professionId)
    ) {
      score += 1;
    }
  }
  if (
    character?.classId &&
    Array.isArray(scene.favoredClasses) &&
    scene.favoredClasses.includes(character.classId)
  ) {
    score += 1;
  }
  if (
    character?.raceId &&
    Array.isArray(scene.favoredRaces) &&
    scene.favoredRaces.includes(character.raceId)
  ) {
    score += 1;
  }
  return score;
}

export function pickOpeningScene({ seed, mainQuest, character } = {}) {
  const baseSeed = hashSeed(seed ?? mainQuest?.id ?? SimBridge.now());

  const rng = mulberry32(baseSeed + 99);
  const weights = OPENING_SCENES.map((scene) =>
    scoreScene(scene, { mainQuest, character }),
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * totalWeight;
  for (let i = 0; i < OPENING_SCENES.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      return { scene: OPENING_SCENES[i], seedUsed: baseSeed };
    }
  }
  return { scene: OPENING_SCENES[0], seedUsed: baseSeed };
}

export function describeOpeningScene(scene, context) {
  if (!scene) return "The world stirs as your journey begins.";
  try {
    return scene.descriptionTemplate(context);
  } catch {
    return "The world stirs as your journey begins.";
  }
}

export function getOpeningSceneById(id) {
  if (!id) return null;
  return OPENING_SCENES.find((scene) => scene.id === id) || null;
}

const __internalScenes = OPENING_SCENES;
