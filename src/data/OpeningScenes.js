// ============================================================================
// OPENING SCENE LIBRARY
// Placeholder scenes with helper to select based on quest/character
// ============================================================================

import { hashSeed, mulberry32 } from "./QuestCatalog";

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
];

function scoreScene(scene, { mainQuest, character } = {}) {
  let score = 1;
  if (mainQuest && scene.compatibleQuests?.includes(mainQuest.id)) {
    score += 3;
  }
  if (
    character?.classId &&
    scene.biome === "city" &&
    character.classId === "rogue"
  )
    score += 1;
  // simple placeholder weight adjustments
  return score;
}

export function pickOpeningScene({ seed, mainQuest, character } = {}) {
  const baseSeed = hashSeed(seed ?? mainQuest?.id ?? Date.now());
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
