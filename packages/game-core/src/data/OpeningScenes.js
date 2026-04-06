// ============================================================================
// OPENING SCENE LIBRARY
// Opening scenes with helper to select based on quest/character
// ============================================================================

import { hashSeed, mulberry32 } from "./QuestCatalog.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { VOIDVERSE_START_SCENE_PACK } from "./OpeningScenePack.VoidverseStartScenes.js";

const STARTER_TAG_TO_BIOME = {
  xianxia: "wilds",
  mystic: "wilds",
  fantasy: "city",
  action: "city",
  lightnovel: "city",
  mystery: "ruins",
  "magic-research": "ruins",
  puzzle: "ruins",
  atmosphere: "ruins",
  hub: "city",
  quests: "city",
  crafting: "city",
  alchemy: "city",
  systems: "city",
  economy: "city",
  factions: "city",
  weird: "ruins",
  "high-hook": "ruins",
  combat: "wilds",
  skills: "city",
  tutorial: "city",
};

const STARTER_TAG_TO_TONE = {
  combat: "tense",
  mystic: "mysterious",
  action: "heroic",
  tutorial: "urgent",
  mystery: "mysterious",
  "magic-research": "mysterious",
  puzzle: "stoic",
  atmosphere: "ethereal",
  hub: "serene",
  quests: "heroic",
  crafting: "stoic",
  economy: "tense",
  factions: "tense",
  weird: "ethereal",
  "high-hook": "urgent",
  lightnovel: "heroic",
};

const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

const normalizeTagList = (rawTags) =>
  Array.isArray(rawTags)
    ? rawTags
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter(Boolean)
    : [];

const resolveStarterSceneBiome = (tags = []) => {
  for (const tag of tags) {
    if (STARTER_TAG_TO_BIOME[tag]) {
      return STARTER_TAG_TO_BIOME[tag];
    }
  }
  return "city";
};

const resolveStarterSceneTone = (tags = []) => {
  for (const tag of tags) {
    if (STARTER_TAG_TO_TONE[tag]) {
      return STARTER_TAG_TO_TONE[tag];
    }
  }
  return "mysterious";
};

const normalizeStarterSceneChoice = (choice, index) => ({
  id: choice?.id || `choice_${index + 1}`,
  label: String(choice?.label || `Choice ${index + 1}`),
  next: choice?.next || null,
  outcomeText:
    typeof choice?.outcomeText === "string" ? choice.outcomeText : "",
  effects:
    choice?.effects && typeof choice.effects === "object"
      ? cloneDeep(choice.effects)
      : {},
  aiHints: Array.isArray(choice?.aiHints)
    ? choice.aiHints
        .map((hint) => String(hint || "").trim())
        .filter(Boolean)
    : [],
});

const normalizeStarterScene = (scene) => {
  const tags = normalizeTagList(scene?.tags);
  const text = typeof scene?.text === "string" ? scene.text : "";
  const choices = Array.isArray(scene?.choices)
    ? scene.choices.map(normalizeStarterSceneChoice)
    : [];

  return {
    id: scene?.id || `starter_scene_${SimBridge.now()}`,
    title:
      typeof scene?.title === "string" && scene.title.trim()
        ? scene.title.trim()
        : "Untitled Starter Scene",
    tags,
    text,
    choices,
    sourcePackId: VOIDVERSE_START_SCENE_PACK?.meta?.packId || null,
    biome: resolveStarterSceneBiome(tags),
    tone: resolveStarterSceneTone(tags),
    descriptionTemplate: () => text,
    compatibleQuests: [],
  };
};

const LEGACY_OPENING_SCENES = [
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
      `Your eyes open to static storms crackling above a ${locationHint}. The body beneath you responds wrong—too light, too sharp, wired with senses you never had. Pale text burns across your vision: [System Initialized.] While you struggle to stand on borrowed legs, ${factionHint} argue over ${mainQuestName} as if your arrival is beneath notice. Background murmurs hint at ${sideHookNames.join(" and ") || "other odd jobs"} awaiting anyone still breathing.`,
    compatibleQuests: ["mq_fallen_spire"],
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
      `Consciousness slams in like a door kicked open. You're on your knees in the ${locationHint}, synth drums pounding through a skull that doesn't feel like yours, neon reflections burning across vision still calibrating to this world. [System Notice: Host anchored.] The ${factionHint} sweep stalls nearby in search of clues tied to ${mainQuestName}, paying no mind to another dazed soul. Whispers of ${sideHookNames.join(" & ") || "other side hustles"} tug at your borrowed ears.`,
    compatibleQuests: ["mq_whisper_market", "sq_skyfisher"],
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
      `Ash petals land on skin you don't recognize. You wake face-down on the ${locationHint}, lungs full of smoke-sweet air, limbs answering in a rhythm that isn't yours. [System Notice: Host integration complete.] As you rise, ${factionHint} chant for balance nearby, unbothered by another lost soul. The fate of ${mainQuestName} hangs in their words while rumours of ${sideHookNames.join(" and ") || "unclaimed favors"} circulate among the camps.`,
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
      `Wind tears across your face—a face you've never worn. You gasp awake on the ${locationHint}, altitude lurching in a stomach that isn't yours, engines screaming overhead. [System Notice: Spatial anchor locked.] The ${factionHint} rally below for ${mainQuestName} while rumors of ${sideHookNames.join(" and ") || "urgent contracts"} drift across the catwalks. No one stops to help the newly reborn.`,
    compatibleQuests: ["mq_starforge_siege", "sq_storm_capacitor"],
    favoredClasses: ["sharpshooter", "paladin"],
    favoredRaces: ["skybound", "stormforged"],
    favoredOrigins: ["deckhand_cadet"],
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
      `Darkness. Then sound: dripping, echoes, something breathing that might be you. Sensation floods in wrong—damp stone under palms, weight in limbs you don't remember having. You wake in the ${locationHint} with no past and a body that flinches at its own shadow. [System Notice: Host consciousness restored. Visibility: minimal.] The ${factionHint} whisper nearby about ${mainQuestName}. The scent of ${sideHookNames.join(" and ") || "side deals"} draws your new senses deeper.`,
    compatibleQuests: [
      "mq_veil_archive",
      "sq_venom_exchange",
      "sq_quake_relief",
    ],
    favoredClasses: ["rogue", "shadow_assassin", "night_reaper"],
    favoredRaces: ["gloomshade", "duskborne"],
    favoredOrigins: ["archive_runner", "dreamwake_survivor"],
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
      `Cold hits first—bone-cold, the kind that makes a new body clench before the mind catches up. You open eyes that aren't yours on the ${locationHint}, crystal veins humming a frequency your borrowed nerves already recognize. [System Notice: Environmental calibration in progress.] The ${factionHint} prepare nearby for ${mainQuestName} without a second glance at the shivering newcomer. ${sideHookNames.join(" and ") || "Auxiliary tasks"} remain unclaimed among the scaffolds.`,
    compatibleQuests: ["mq_crystal_forge", "sq_rune_cache"],
    favoredClasses: ["tempest_reveler", "battlemage"],
    favoredRaces: ["crystal_being", "rune_sentinel"],
    favoredOrigins: ["salvage_adept", "ledger_apprentice"],
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
      `Salt water fills a mouth you don't recognize. You cough, roll, and drag yourself up on the ${locationHint}—soaked, shaking, alive in a body the sea just spat out. [System Notice: Host stabilized. Warning: exposure risk elevated.] The ${factionHint} brace for ${mainQuestName} along the strand, too pressed to notice one more drowned stranger. The call of ${sideHookNames.join(" and ") || "floating bounties"} rises with every surge.`,
    compatibleQuests: ["mq_tide_breach", "sq_astral_waypoint"],
    favoredClasses: ["tempest_reveler", "ranger"],
    favoredRaces: ["tidecaller", "frostborne"],
    favoredOrigins: ["tidebound_votary"],
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
      `Light before anything else—blinding, total, the kind that bleaches thought. You surface into a body baking on the ${locationHint}, sand fused to skin you've never touched. [System Notice: Thermal warning. Host advised to seek shade.] The ${factionHint} shimmer at the edge of vision, waiting on ${mainQuestName} as if the desert births strangers every day. Hushed offers of ${sideHookNames.join(" and ") || "lost routes"} linger in the wind.`,
    compatibleQuests: ["mq_oracle_sundial", "sq_mirage_map"],
    favoredClasses: ["trickster", "mage"],
    favoredRaces: ["mirageborn", "sandstrider"],
    favoredOrigins: ["sandstep_scout", "dreamwake_survivor"],
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
      `Heat wakes you before consciousness does. You're on scorched rock in the ${locationHint}, embers drifting past a face that flinches with reflexes you haven't earned. The air tastes like iron and sulfur through lungs still learning to be yours. [System Notice: Host integrity holding. Ambient threat: high.] The ${factionHint} plan nearby for ${mainQuestName}. Calls for ${sideHookNames.join(" and ") || "hazard support"} echo through the smoke.`,
    compatibleQuests: ["mq_ashen_caldera", "sq_bloomed_spores"],
    favoredClasses: ["berserker", "spellbreaker"],
    favoredRaces: ["emberkin", "phoenix_reborn"],
    favoredOrigins: ["ashmarked_prospector"],
  },
];

const PACK_OPENING_SCENES = Array.isArray(VOIDVERSE_START_SCENE_PACK?.scenes)
  ? VOIDVERSE_START_SCENE_PACK.scenes.map(normalizeStarterScene)
  : [];

const OPENING_SCENES = [...LEGACY_OPENING_SCENES, ...PACK_OPENING_SCENES];

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
    if (
      character?.originId &&
      Array.isArray(questTags.favoredOrigins) &&
      questTags.favoredOrigins.includes(character.originId)
    ) {
      score += 1;
    }
    if (questTags.starter && Array.isArray(scene.tags)) {
      if (scene.tags.includes("tutorial")) score += 2;
      if (scene.tags.includes("hub")) score += 1;
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
  if (
    character?.originId &&
    Array.isArray(scene.favoredOrigins) &&
    scene.favoredOrigins.includes(character.originId)
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
  if (!scene) return "Consciousness floods in before memory does. You open eyes that are not yours, and the world sharpens around a body you have never worn.";
  if (typeof scene.text === "string" && scene.text.trim()) {
    return scene.text.trim();
  }
  try {
    return scene.descriptionTemplate(context);
  } catch {
    return "Consciousness floods in before memory does. You open eyes that are not yours, and the world sharpens around a body you have never worn.";
  }
}

export function getOpeningSceneById(id) {
  if (!id) return null;
  return OPENING_SCENES.find((scene) => scene.id === id) || null;
}

export { OPENING_SCENES };

export function listOpeningSceneChoices(sceneRef) {
  const scene =
    typeof sceneRef === "string" ? getOpeningSceneById(sceneRef) : sceneRef;
  if (!scene || !Array.isArray(scene.choices)) return [];
  return scene.choices.map((choice) => ({
    id: choice.id || null,
    label: choice.label || "",
    next: choice.next || null,
  }));
}

export function getOpeningSceneChoice(sceneRef, choiceRef = null) {
  const scene =
    typeof sceneRef === "string" ? getOpeningSceneById(sceneRef) : sceneRef;
  if (!scene || !Array.isArray(scene.choices) || scene.choices.length === 0) {
    return null;
  }

  if (choiceRef === null || choiceRef === undefined) {
    return scene.choices[0];
  }

  if (typeof choiceRef === "number" && Number.isFinite(choiceRef)) {
    const idx = Math.floor(choiceRef);
    if (idx >= 0 && idx < scene.choices.length) {
      return scene.choices[idx];
    }
    return null;
  }

  const normalizedRef = String(choiceRef).trim().toLowerCase();
  if (!normalizedRef) return scene.choices[0];

  return (
    scene.choices.find((choice) => {
      const id = String(choice.id || "").trim().toLowerCase();
      const label = String(choice.label || "").trim().toLowerCase();
      return normalizedRef === id || normalizedRef === label;
    }) || null
  );
}

const normalizeChoiceEffectsToIntents = (effects = {}) => {
  if (!effects || typeof effects !== "object" || Array.isArray(effects)) {
    return [];
  }

  const intents = [];

  if (Number.isFinite(effects.healthDelta)) {
    intents.push({
      type: "player.health.delta",
      value: Number(effects.healthDelta),
    });
  }

  if (Number.isFinite(effects.reputationDelta)) {
    intents.push({
      type: "player.reputation.delta",
      value: Number(effects.reputationDelta),
    });
  }

  if (Number.isFinite(effects.currencyDelta)) {
    intents.push({
      type: "player.currency.delta",
      currency: "goldCoins",
      value: Number(effects.currencyDelta),
    });
  }

  if (typeof effects.addQuest === "string" && effects.addQuest.trim()) {
    intents.push({
      type: "quest.add",
      questId: effects.addQuest.trim(),
    });
  }

  if (typeof effects.unlockSkill === "string" && effects.unlockSkill.trim()) {
    intents.push({
      type: "skill.unlock",
      skillId: effects.unlockSkill.trim(),
    });
  }

  if (typeof effects.unlockRecipe === "string" && effects.unlockRecipe.trim()) {
    intents.push({
      type: "recipe.unlock",
      recipeId: effects.unlockRecipe.trim(),
    });
  }

  if (typeof effects.unlockLaw === "string" && effects.unlockLaw.trim()) {
    intents.push({
      type: "law.unlock",
      lawId: effects.unlockLaw.trim(),
    });
  }

  if (typeof effects.addItem === "string" && effects.addItem.trim()) {
    intents.push({
      type: "inventory.add",
      itemId: effects.addItem.trim(),
      quantity: 1,
    });
  }

  if (typeof effects.addClue === "string" && effects.addClue.trim()) {
    intents.push({
      type: "clue.add",
      clueId: effects.addClue.trim(),
    });
  }

  if (Array.isArray(effects.setFlag)) {
    effects.setFlag
      .map((flag) => String(flag || "").trim())
      .filter(Boolean)
      .forEach((flag) => {
        intents.push({
          type: "world.flag.set",
          flag,
          value: true,
        });
      });
  }

  if (effects.statDelta && typeof effects.statDelta === "object") {
    Object.entries(effects.statDelta).forEach(([stat, value]) => {
      if (!Number.isFinite(value)) return;
      intents.push({
        type: "player.stat.delta",
        stat: String(stat),
        value: Number(value),
      });
    });
  }

  return intents;
};

export function getOpeningSceneEffectIntents(sceneRef, choiceRef = null) {
  const choice = getOpeningSceneChoice(sceneRef, choiceRef);
  if (!choice) return [];
  return normalizeChoiceEffectsToIntents(choice.effects);
}

export function buildOpeningSceneNarrativeSeed(sceneRef, choiceRef = null) {
  const scene =
    typeof sceneRef === "string" ? getOpeningSceneById(sceneRef) : sceneRef;
  if (!scene) return "Consciousness floods in before memory does. You open eyes that are not yours, and the world sharpens around a body you have never worn.";

  const baseText = describeOpeningScene(scene, {
    mainQuestName: "the looming mystery",
    sideHookNames: [],
    locationHint: scene.biome || "district",
    factionHint: scene.tone || "locals",
  });

  const choice = getOpeningSceneChoice(scene, choiceRef);
  const outcome =
    typeof choice?.outcomeText === "string" ? choice.outcomeText.trim() : "";
  if (!outcome) return baseText;
  return `${baseText}\n\nOutcome seed: ${outcome}`;
}

export function getOpeningScenePackMeta(packId = null) {
  if (
    packId &&
    String(packId).trim() &&
    String(packId).trim() !== VOIDVERSE_START_SCENE_PACK?.meta?.packId
  ) {
    return null;
  }
  return {
    ...(VOIDVERSE_START_SCENE_PACK?.meta || {}),
    sceneCount: PACK_OPENING_SCENES.length,
  };
}

const __internalScenes = OPENING_SCENES;
void __internalScenes;
