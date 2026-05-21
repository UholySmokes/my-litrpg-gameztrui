import {
  buildCombatMagicSkill as legacyBuildCombatMagicSkill,
  castMagic as legacyCastMagic,
  castPhysicsMagic,
  castPreparedMagic as legacyCastPreparedMagic,
  normalizeUnifiedMagicState,
  prepareMagic as legacyPrepareMagic,
  resolveCombatSkillMagic as legacyResolveCombatSkillMagic,
  senseMagic as legacySenseMagic,
  stabilizeMagic as legacyStabilizeMagic,
  sustainMagic as legacySustainMagic,
  translateLegacyMagicAction,
} from "../magic/UnifiedMagicSystem.js";
import {
  magicAnchor as legacyMagicAnchor,
  magicCompress as legacyMagicCompress,
  magicDraw as legacyMagicDraw,
  magicPurge as legacyMagicPurge,
  magicRefine as legacyMagicRefine,
  processEssenceEcologyTurn as legacyProcessEssenceEcologyTurn,
} from "../magic/EssenceWeavingSystem.js";
import {appendSystemMessages} from "../../core/narrativeLog.js";

export const ABILITY_ENGINE_VERSION = 1;
export const ABILITY_FAMILIES = Object.freeze([
  "magic",
  "martial",
  "bloodline",
  "cultivation",
  "profession",
  "universal",
]);

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toFiniteNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function shouldPreferAbilityMagic(playerNode, familyMagic, playerMagic) {
  const playerManaCurrent = toFiniteNumber(playerNode?.mana?.current);
  const abilityManaCurrent = toFiniteNumber(familyMagic?.mana?.current);
  const playerMagicManaCurrent = toFiniteNumber(playerMagic?.mana?.current);

  if (playerManaCurrent != null) {
    const abilityMatches = abilityManaCurrent != null && abilityManaCurrent === playerManaCurrent;
    const playerMatches =
      playerMagicManaCurrent != null && playerMagicManaCurrent === playerManaCurrent;
    if (abilityMatches !== playerMatches) {
      return abilityMatches;
    }
  }

  return false;
}

function normalizeRecipeEntry(key, entry = {}) {
  const node = normalizeObject(entry);
  return {
    key,
    family: typeof node.family === "string" && node.family ? node.family : "magic",
    rank: Math.max(1, Math.floor(Number(node.rank) || 1)),
    mastery: Math.max(0, Number(node.mastery) || 0),
    unlockCount: Math.max(1, Math.floor(Number(node.unlockCount) || 1)),
    sourceSkillIds: Array.isArray(node.sourceSkillIds) ? node.sourceSkillIds.filter(Boolean) : [],
    unlockType: typeof node.unlockType === "string" && node.unlockType ? node.unlockType : "discovery",
  };
}

function normalizeRecipeBook(rawRecipeBook) {
  const recipeBook = normalizeObject(rawRecipeBook);
  const entries = normalizeObject(recipeBook.entries);
  const normalizedEntries = {};
  Object.entries(entries).forEach(([key, entry]) => {
    if (!key) return;
    normalizedEntries[key] = normalizeRecipeEntry(key, entry);
  });
  return {
    entries: normalizedEntries,
  };
}

function normalizeMastery(rawMastery) {
  const mastery = normalizeObject(rawMastery);
  return {
    skills: normalizeObject(mastery.skills),
    recipes: normalizeObject(mastery.recipes),
  };
}

function ensureMagicRecipeSync(magic, recipeBook) {
  const recipes = Array.isArray(magic?.grammar?.recipes) ? magic.grammar.recipes : [];
  const recipeKeys = new Set(recipes);
  Object.keys(recipeBook.entries).forEach((key) => {
    const entry = recipeBook.entries[key];
    if (entry.family !== "magic") return;
    recipeKeys.add(key);
  });
  return {
    ...magic,
    grammar: {
      ...(magic.grammar || {}),
      recipes: [...recipeKeys],
    },
  };
}

function buildMirroredAbilityState(player, rawAbilityState) {
  const playerNode = normalizeObject(player);
  const abilityState = normalizeObject(rawAbilityState);
  const families = normalizeObject(abilityState.families);
  const playerMagic = normalizeObject(playerNode.magic);
  const playerMana = normalizeObject(playerNode.mana);
  const familyMagic = normalizeObject(families.magic);
  const preferAbilityMagic = shouldPreferAbilityMagic(
    playerNode,
    familyMagic,
    playerMagic,
  );
  const primaryMagic = preferAbilityMagic ? familyMagic : playerMagic;
  const secondaryMagic = preferAbilityMagic ? playerMagic : familyMagic;
  const normalizedMagic = normalizeUnifiedMagicState(
    {
      ...secondaryMagic,
      ...primaryMagic,
      mana: {
        ...(secondaryMagic.mana || {}),
        ...(primaryMagic.mana || {}),
        ...(playerMana || {}),
      },
      strain: {
        ...(secondaryMagic.strain || {}),
        ...(primaryMagic.strain || {}),
      },
      stability: {
        ...(secondaryMagic.stability || {}),
        ...(primaryMagic.stability || {}),
      },
      attunement: {
        ...(secondaryMagic.attunement || {}),
        ...(primaryMagic.attunement || {}),
      },
      grammar: {
        ...(secondaryMagic.grammar || {}),
        ...(primaryMagic.grammar || {}),
      },
    },
    { player: playerNode },
  );
  const recipeBook = normalizeRecipeBook(abilityState.recipeBook);
  const mastery = normalizeMastery(abilityState.mastery);
  const magicWithRecipes = ensureMagicRecipeSync(normalizedMagic, recipeBook);
  const preparedDirective = Object.prototype.hasOwnProperty.call(magicWithRecipes, "prepared")
    ? magicWithRecipes.prepared
    : abilityState.preparedDirective ?? null;
  const activeDirectives = Array.isArray(magicWithRecipes.activeWorkings)
    ? magicWithRecipes.activeWorkings
    : Array.isArray(abilityState.activeDirectives)
      ? abilityState.activeDirectives
      : [];

  return {
    version: ABILITY_ENGINE_VERSION,
    families: {
      magic: magicWithRecipes,
      martial: normalizeObject(families.martial),
      bloodline: normalizeObject(families.bloodline),
      cultivation: normalizeObject(families.cultivation),
      profession: normalizeObject(families.profession),
      universal: normalizeObject(families.universal),
    },
    preparedDirective,
    activeDirectives,
    recipeBook,
    mastery,
  };
}

export function normalizeAbilityState(rawAbilityState, { player } = {}) {
  return buildMirroredAbilityState(player, rawAbilityState);
}

export function syncPlayerAbilityState(player, rawAbilityState) {
  const currentPlayer = normalizeObject(player);
  const abilityState = normalizeAbilityState(rawAbilityState || currentPlayer.abilityState, {
    player: currentPlayer,
  });
  const magic = abilityState.families.magic;
  return {
    ...currentPlayer,
    abilityState,
    magic,
    mana: {
      ...(currentPlayer.mana || {}),
      current: magic.mana.current,
      max: magic.mana.max,
    },
  };
}

export function syncStateAbilityMirror(state) {
  const currentState = normalizeObject(state);
  const player = syncPlayerAbilityState(currentState.player, currentState.player?.abilityState);
  return {
    ...currentState,
    player,
  };
}

function syncLegacyMagicResult(result, fallbackState) {
  if (!result || typeof result !== "object") {
    return { ok: false, reason: "Ability engine returned no result.", state: fallbackState };
  }
  const nextState = syncStateAbilityMirror(result.state || fallbackState);
  return {
    ...result,
    state: nextState,
  };
}

function getSkillRecipeKey(skill) {
  if (!skill || typeof skill !== "object") return null;
  return skill.engineProfile?.recipeKey || skill.template?.meta?.engineProfile?.recipeKey || skill.id || null;
}

function getSkillFamily(skill) {
  if (!skill || typeof skill !== "object") return "universal";
  return skill.engineProfile?.family || skill.latticeFamily || "universal";
}

function getPlayerSkillPools(player) {
  const node = normalizeObject(player);
  const abilities = Array.isArray(node.abilities) ? node.abilities : [];
  const activeSkills = Array.isArray(node.activeSkills) ? node.activeSkills : [];
  const passiveSkills = Array.isArray(node.passiveSkills) ? node.passiveSkills : [];
  return { abilities, activeSkills, passiveSkills, allSkills: [...abilities, ...activeSkills, ...passiveSkills] };
}

function recordRecipeUnlock(player, recipeEntry) {
  const abilityState = normalizeAbilityState(player.abilityState, { player });
  const existing = abilityState.recipeBook.entries[recipeEntry.key];
  const merged = normalizeRecipeEntry(recipeEntry.key, {
    ...existing,
    ...recipeEntry,
    unlockCount: (existing?.unlockCount || 0) + 1,
    mastery: Math.max(existing?.mastery || 0, recipeEntry.mastery || 0),
    sourceSkillIds: [
      ...new Set([
        ...(existing?.sourceSkillIds || []),
        ...(recipeEntry.sourceSkillIds || []),
      ]),
    ],
  });

  const nextAbilityState = {
    ...abilityState,
    recipeBook: {
      entries: {
        ...abilityState.recipeBook.entries,
        [merged.key]: merged,
      },
    },
  };

  if (merged.family === "magic") {
    nextAbilityState.families.magic = ensureMagicRecipeSync(
      nextAbilityState.families.magic,
      nextAbilityState.recipeBook,
    );
  }

  return syncPlayerAbilityState(player, nextAbilityState);
}

function createFusionRecipeEntry(skillA, skillB) {
  const keyA = getSkillRecipeKey(skillA);
  const keyB = getSkillRecipeKey(skillB);
  const family = getSkillFamily(skillA);
  const parts = [keyA, keyB].filter(Boolean).sort();
  return {
    key: `fusion:${family}:${parts.join("::")}`,
    family,
    rank: 1,
    mastery: 5,
    sourceSkillIds: [skillA.id, skillB.id],
    unlockType: "fusion",
  };
}

function applyFusionAction(state, action) {
  const nextState = syncStateAbilityMirror(state);
  const player = nextState.player;
  const { allSkills } = getPlayerSkillPools(player);
  const skillAId = action.payload?.skillAId;
  const skillBId = action.payload?.skillBId;
  if (!skillAId || !skillBId || skillAId === skillBId) return nextState;

  const skillA = allSkills.find((skill) => skill?.id === skillAId);
  const skillB = allSkills.find((skill) => skill?.id === skillBId);
  if (!skillA || !skillB) return nextState;

  const familyA = getSkillFamily(skillA);
  const familyB = getSkillFamily(skillB);
  if (familyA !== familyB) {
    return appendSystemMessages(nextState, [
      "Fusion failed: cross-family fusion is authored-only in the unified engine.",
    ]);
  }

  const updatedPlayer = recordRecipeUnlock(player, createFusionRecipeEntry(skillA, skillB));
  return appendSystemMessages(
    {
      ...nextState,
      player: updatedPlayer,
    },
    [`Fusion complete: unlocked ${getSkillRecipeKey(skillA)} + ${getSkillRecipeKey(skillB)} doctrine.`],
  );
}

function applyEvolutionAction(state, action) {
  const nextState = syncStateAbilityMirror(state);
  const player = nextState.player;
  const skillId = action.payload?.skillId;
  if (!skillId) return nextState;
  const { allSkills } = getPlayerSkillPools(player);
  const skill = allSkills.find((entry) => entry?.id === skillId);

  const abilityState = normalizeAbilityState(player.abilityState, { player });
  const current = normalizeObject(abilityState.mastery.skills[skillId]);
  const nextAbilityState = {
    ...abilityState,
    mastery: {
      ...abilityState.mastery,
      skills: {
        ...abilityState.mastery.skills,
        [skillId]: {
          level: Math.max(
            1,
            Math.floor(Number(current.level) || Number(skill?.level) || 1),
          ) + 1,
          evolutionStage: Math.max(0, Math.floor(Number(current.evolutionStage) || 0)) + 1,
          xp: Math.max(0, Number(current.xp) || 0) + 10,
        },
      },
    },
  };

  const updatedPlayer = syncPlayerAbilityState(player, nextAbilityState);
  return appendSystemMessages(
    {
      ...nextState,
      player: updatedPlayer,
    },
    [`Evolution complete: ${skillId} advanced within the unified engine.`],
  );
}

function buildStudyRecipeKey(player, action) {
  const requestedEssence = typeof action?.payload?.essence === "string"
    ? action.payload.essence.trim().toLowerCase()
    : null;
  const requestedForm = typeof action?.payload?.form === "string"
    ? action.payload.form.trim().toLowerCase()
    : null;
  const magic = normalizeUnifiedMagicState(player?.abilityState?.families?.magic || player?.magic, {
    player,
  });
  const essence = requestedEssence || magic.grammar.essences[0] || "fire";
  const form = requestedForm || magic.grammar.forms[0] || "bolt";
  return {
    key: `study:magic:${essence}:${form}`,
    family: "magic",
    rank: 1,
    mastery: 5,
    sourceSkillIds: [],
    unlockType: "study",
  };
}

function applyStudyAction(state, action) {
  const nextState = syncStateAbilityMirror(state);
  const player = nextState.player;
  const recipeEntry = buildStudyRecipeKey(player, action);
  const updatedPlayer = recordRecipeUnlock(player, recipeEntry);
  return appendSystemMessages(
    {
      ...nextState,
      player: updatedPlayer,
    },
    [`Study complete: discovered ${recipeEntry.key}.`],
  );
}

export function applySkillProgressionAction(state, action) {
  switch (action.type) {
    case "FUSE_SKILLS":
      return applyFusionAction(state, action);
    case "EVOLVE_SKILL":
      return applyEvolutionAction(state, action);
    case "STUDY_SPELL":
      return applyStudyAction(state, action);
    default:
      return null;
  }
}

export function executeAbilityAction(state, action) {
  const preparedState = syncStateAbilityMirror(state);
  switch (action.type) {
    case "magic_prepare":
      return syncLegacyMagicResult(legacyPrepareMagic(preparedState, action), preparedState);
    case "magic_cast":
      return syncLegacyMagicResult(legacyCastMagic(preparedState, action), preparedState);
    case "magic_sustain":
      return syncLegacyMagicResult(legacySustainMagic(preparedState, action), preparedState);
    case "magic_stabilize":
      return syncLegacyMagicResult(legacyStabilizeMagic(preparedState, action), preparedState);
    case "magic_sense":
      return syncLegacyMagicResult(legacySenseMagic(preparedState, action), preparedState);
    case "magic_attune":
      return syncLegacyMagicResult(
        legacyStabilizeMagic(preparedState, translateLegacyMagicAction(action)),
        preparedState,
      );
    case "magic_draw":
      return syncLegacyMagicResult(legacyMagicDraw(preparedState, action), preparedState);
    case "magic_refine":
      return syncLegacyMagicResult(legacyMagicRefine(preparedState, action), preparedState);
    case "magic_compress":
      return syncLegacyMagicResult(legacyMagicCompress(preparedState, action), preparedState);
    case "magic_anchor":
      return syncLegacyMagicResult(legacyMagicAnchor(preparedState, action), preparedState);
    case "magic_purge":
      return syncLegacyMagicResult(legacyMagicPurge(preparedState, action), preparedState);
    case "magic_shape":
      return syncLegacyMagicResult(
        legacyPrepareMagic(preparedState, translateLegacyMagicAction(action)),
        preparedState,
      );
    case "magic_weave":
      return syncLegacyMagicResult(
        legacyPrepareMagic(preparedState, translateLegacyMagicAction(action)),
        preparedState,
      );
    case "magic_release":
      return syncLegacyMagicResult(
        legacyCastPreparedMagic(preparedState, translateLegacyMagicAction(action)),
        preparedState,
      );
    case "magic_physics_cast":
      return castPhysicsMagic(preparedState, action);
    default:
      return { ok: false, reason: `Unhandled ability action: ${action?.type}`, state: preparedState };
  }
}

export function processAbilityEcologyTurn(state) {
  const baselineState = normalizeObject(state);
  const baselinePlayerMana = Number(baselineState.player?.mana?.current);
  const mirroredState = syncStateAbilityMirror(baselineState);
  const processedState = syncStateAbilityMirror(legacyProcessEssenceEcologyTurn(mirroredState));
  const freeManaMax =
    Number(processedState.player?.magic?.mana?.max) ||
    Number(processedState.player?.mana?.max) ||
    0;
  const preservedMana = Number.isFinite(baselinePlayerMana)
    ? Math.max(0, Math.min(freeManaMax, baselinePlayerMana))
    : Number(processedState.player?.magic?.mana?.current) || 0;
  const nextMagic = {
    ...(processedState.player?.magic || {}),
    mana: {
      ...(processedState.player?.magic?.mana || {}),
      current: preservedMana,
      max: freeManaMax,
    },
  };

  return {
    ...processedState,
    player: syncPlayerAbilityState(
      {
        ...processedState.player,
        mana: {
          ...(processedState.player?.mana || {}),
          current: preservedMana,
          max: processedState.player?.mana?.max ?? freeManaMax,
        },
        magic: nextMagic,
      },
      {
        ...(processedState.player?.abilityState || {}),
        families: {
          ...(processedState.player?.abilityState?.families || {}),
          magic: nextMagic,
        },
      },
    ),
  };
}

export function buildCombatAbilitySkill(state, action) {
  return legacyBuildCombatMagicSkill(syncStateAbilityMirror(state), action);
}

export function resolveCombatAbilityMagic(state, skill) {
  return legacyResolveCombatSkillMagic(syncStateAbilityMirror(state), skill);
}

export function getAbilityCostBreakdown(skill, actor, state = null) {
  const resourceModel =
    skill?.engineProfile?.resourceModel ||
    skill?.template?.meta?.engineProfile?.resourceModel ||
    (Number.isFinite(skill?.manaCost) && skill.manaCost > 0 ? "mana" : "none");
  const resolvedMagic = skill?.unifiedMagic
    ? skill.unifiedMagic
    : state && resourceModel === "mana" && getSkillFamily(skill) === "magic"
      ? resolveCombatAbilityMagic(state, skill)
      : null;
  const manaCost = Number.isFinite(resolvedMagic?.manaCost)
    ? resolvedMagic.manaCost
    : Number.isFinite(skill?.engineProfile?.costProfile?.manaCost)
      ? skill.engineProfile.costProfile.manaCost
      : Number.isFinite(skill?.manaCost)
        ? skill.manaCost
        : 0;
  const cooldown = Number.isFinite(resolvedMagic?.cooldown)
    ? resolvedMagic.cooldown
    : Number.isFinite(skill?.engineProfile?.costProfile?.cooldown)
      ? skill.engineProfile.costProfile.cooldown
      : Number.isFinite(skill?.cooldown)
        ? skill.cooldown
        : 0;
  const currentMana = Number(actor?.mana?.current) || 0;
  return {
    resourceModel,
    manaCost,
    cooldown,
    currentMana,
    canAfford: resourceModel !== "mana" || currentMana >= manaCost,
    resolvedMagic,
  };
}

export function consumeAbilityCostForActor(skill, actor, state = null) {
  const breakdown = getAbilityCostBreakdown(skill, actor, state);
  if (breakdown.resourceModel !== "mana") {
    return {
      success: true,
      cost: 0,
      cooldown: breakdown.cooldown,
      remainingResource: null,
      updatedActor: actor,
      resolvedMagic: breakdown.resolvedMagic,
    };
  }

  if (!breakdown.canAfford) {
    return {
      success: false,
      error: `Insufficient mana. Need ${breakdown.manaCost}, have ${breakdown.currentMana}`,
      cost: 0,
      cooldown: 0,
      insufficientMana: true,
      updatedActor: actor,
      resolvedMagic: breakdown.resolvedMagic,
    };
  }

  const remainingMana = Math.max(0, breakdown.currentMana - breakdown.manaCost);
  let updatedActor = {
    ...actor,
    mana: {
      ...(actor?.mana || {}),
      current: remainingMana,
    },
  };

  if (breakdown.resolvedMagic?.attackerMagic) {
    updatedActor = syncPlayerAbilityState(updatedActor, {
      ...updatedActor.abilityState,
      families: {
        ...(updatedActor.abilityState?.families || {}),
        magic: {
          ...breakdown.resolvedMagic.attackerMagic,
          mana: {
            ...(breakdown.resolvedMagic.attackerMagic.mana || {}),
            current: remainingMana,
            max:
              breakdown.resolvedMagic.attackerMagic.mana?.max ??
              updatedActor.mana?.max ??
              actor?.mana?.max ??
              remainingMana,
          },
        },
      },
    });
  } else if (updatedActor.abilityState) {
    updatedActor = syncPlayerAbilityState(updatedActor, updatedActor.abilityState);
  }

  return {
    success: true,
    cost: breakdown.manaCost,
    cooldown: breakdown.cooldown,
    remainingResource: remainingMana,
    updatedActor,
    resolvedMagic: breakdown.resolvedMagic,
  };
}
