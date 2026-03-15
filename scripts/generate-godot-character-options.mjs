import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  createAttributeBaseline,
  ensureAttributeShape,
} from "@voidverse/game-core/constants/attributes.js";
import {
  getCharacterCreationArchetypeSystems,
  getCharacterCreationClassesByTier,
  getCharacterCreationOrigins,
  getCharacterCreationRaces,
} from "@voidverse/game-core/characterCreation/CharacterCreationContentPack.js";
import {
  buildCharacterCreationSkillPools,
  getCharacterCreationSkillSelectionLimits,
  listCharacterCreationSkillLoadouts,
} from "@voidverse/game-core/characterCreation/CharacterCreationSkillSelection.js";
import {
  getCharacterCreationPerkLimits,
  listCharacterCreationAlignments,
  listCharacterCreationPerks,
  listCharacterCreationStarterTrees,
} from "@voidverse/game-core/characterCreation/CharacterCreationOptionsRegistry.js";
import { resolveCharacterCreationOptionsBySystem } from "@voidverse/game-core/characterCreation/CharacterCreationSystemInfluence.js";
import { getProfessionSummaries } from "@voidverse/game-core/systems/profession/ProfessionContentPack.js";

const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "godot",
  "data",
  "character_options.json",
);
const GODOT_PLATFORM = "godot";
const BASE_ATTRIBUTE_VALUE = 10;
const FREE_POINTS = 15;

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function normalizeAttributeMap(value) {
  return ensureAttributeShape(value || {}, 0);
}

function simplifyRace(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    statBonuses: normalizeAttributeMap(
      entry.attributeBonuses || entry.statBonuses || entry.modifiers || {},
    ),
    passiveAbility: cloneValue(entry.passiveAbility || null),
    activeAbility: cloneValue(entry.activeAbility || null),
    favoredBiome: entry.favoredBiome || "",
  };
}

function simplifyClass(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    tier: Number(entry.tier || 1),
    resourceSystem: entry.resourceSystem || entry.resource || "",
    baseStats: normalizeAttributeMap(entry.baseStats || {}),
    coreMechanics: Array.isArray(entry.coreMechanics)
      ? [...entry.coreMechanics]
      : [],
  };
}

function simplifyOrigin(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    favoredBiome: entry.favoredBiome || "",
    attributeBonuses: normalizeAttributeMap(entry.attributeBonuses || {}),
    favoredQuestTags: Array.isArray(entry.favoredQuestTags)
      ? [...entry.favoredQuestTags]
      : [],
  };
}

function simplifyProfession(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    categoryId: entry.categoryId || "",
    tier1Skills: Array.isArray(entry.tier1Skills) ? [...entry.tier1Skills] : [],
    tierUnlocks:
      entry.tierUnlocks && typeof entry.tierUnlocks === "object"
        ? cloneValue(entry.tierUnlocks)
        : {},
  };
}

function simplifySystem(entry) {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    summary: entry.summary || "",
    description: entry.description || "",
    rarity: entry.rarity || "",
    stability: entry.stability || "",
    coreLoop: Array.isArray(entry.coreLoop) ? [...entry.coreLoop] : [],
    possibleUses: Array.isArray(entry.possibleUses) ? [...entry.possibleUses] : [],
    limits: Array.isArray(entry.limits) ? [...entry.limits] : [],
    costs: Array.isArray(entry.costs) ? [...entry.costs] : [],
    worldCompatibility: Array.isArray(entry.worldCompatibility)
      ? [...entry.worldCompatibility]
      : [],
    narrativeHooks: Array.isArray(entry.narrativeHooks)
      ? [...entry.narrativeHooks]
      : [],
    questHooks: Array.isArray(entry.questHooks) ? [...entry.questHooks] : [],
    characterCreation:
      entry.characterCreation && typeof entry.characterCreation === "object"
        ? cloneValue(entry.characterCreation)
        : {},
  };
}

function simplifySkill(entry) {
  return {
    id: entry.id,
    name: entry.name || entry.id,
    description: entry.description || "",
    type: entry.type || entry.slotType || "active",
    slotType: entry.slotType || entry.type || "active",
    source: entry.source || "",
    runtimeRole: entry.runtimeRole || "",
    latticeFamily: entry.latticeFamily || "",
    creationLabels:
      entry.creationLabels && typeof entry.creationLabels === "object"
        ? cloneValue(entry.creationLabels)
        : {},
  };
}

function simplifyLoadout(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    activeSkillIds: Array.isArray(entry.activeSkillIds)
      ? [...entry.activeSkillIds]
      : [],
    passiveSkillIds: Array.isArray(entry.passiveSkillIds)
      ? [...entry.passiveSkillIds]
      : [],
    activeSkillNames: Array.isArray(entry.activeSkills)
      ? entry.activeSkills.map((skill) => skill?.name || skill?.id).filter(Boolean)
      : [],
    passiveSkillNames: Array.isArray(entry.passiveSkills)
      ? entry.passiveSkills.map((skill) => skill?.name || skill?.id).filter(Boolean)
      : [],
  };
}

function systemSupportsGodot(system) {
  const platforms = Array.isArray(system?.characterCreation?.ordering?.platforms)
    ? system.characterCreation.ordering.platforms
    : [];
  return platforms.includes(GODOT_PLATFORM);
}

function buildSystemOptionState({
  system,
  origins,
  races,
  classes,
  professions,
  perks,
  starterTrees,
}) {
  const resolved = resolveCharacterCreationOptionsBySystem({
    systemId: system.id,
    origins,
    races,
    classes,
    professions,
    perks,
    starterTrees,
  });

  return {
    origins: cloneValue(resolved.origins?.options || []),
    races: cloneValue(resolved.races?.options || []),
    classes: cloneValue(resolved.classes?.options || []),
    secondaryClasses: cloneValue(resolved.secondaryClasses?.options || []),
    professions: cloneValue(resolved.professions?.options || []),
    perks: cloneValue(resolved.perks?.options || []),
    starterTrees: cloneValue(resolved.starterTrees?.options || []),
    recommendedOriginIds: [...(resolved.origins?.recommendedIds || [])],
    recommendedRaceIds: [...(resolved.races?.recommendedIds || [])],
    recommendedClassIds: [...(resolved.classes?.recommendedIds || [])],
    recommendedProfessionIds: [...(resolved.professions?.recommendedIds || [])],
    attributeBias: cloneValue(resolved.attributeBias || { primary: [], secondary: [] }),
  };
}

function buildSkillPoolEntry(system, race, cls, profession) {
  const pools = buildCharacterCreationSkillPools(cls, race, {
    professionId: profession.id,
    systemId: system.id,
  });
  const loadouts = listCharacterCreationSkillLoadouts({
    cls,
    race,
    professionId: profession.id,
    systemId: system.id,
    pools,
  });
  const limits = getCharacterCreationSkillSelectionLimits();
  const activeBonus = Number(pools.slotBonuses?.active || 0);
  const passiveBonus = Number(pools.slotBonuses?.passive || 0);

  return {
    activeSkills: (pools.active || []).map(simplifySkill),
    passiveSkills: (pools.passive || []).map(simplifySkill),
    grantedActiveSkills: (pools.grantedActive || []).map(simplifySkill),
    grantedPassiveSkills: (pools.grantedPassive || []).map(simplifySkill),
    blockedSkillIds: [...(pools.blockedSkillIds || [])],
    boostedSkillIds: [...(pools.boostedSkillIds || [])],
    loadouts: loadouts.map(simplifyLoadout),
    slotBonuses: {
      active: activeBonus,
      passive: passiveBonus,
    },
    requiredActiveSkills: limits.requiredActiveSkillCount + activeBonus,
    requiredPassiveSkills: limits.requiredPassiveSkillCount + passiveBonus,
    minActiveSkills: limits.requiredActiveSkillCount + activeBonus,
    minPassiveSkills: limits.requiredPassiveSkillCount + passiveBonus,
  };
}

function buildSignature(systemId, raceId, classId, professionId) {
  return [systemId, raceId, classId, professionId].join("|");
}

async function main() {
  const origins = getCharacterCreationOrigins().map(simplifyOrigin);
  const races = getCharacterCreationRaces().map(simplifyRace);
  const classes = getCharacterCreationClassesByTier(1).map(simplifyClass);
  const professions = getProfessionSummaries().map(simplifyProfession);
  const selectableSystems = getCharacterCreationArchetypeSystems()
    .filter(systemSupportsGodot)
    .sort((left, right) => {
      const leftPriority = Number(left?.characterCreation?.ordering?.priority || 999);
      const rightPriority = Number(right?.characterCreation?.ordering?.priority || 999);
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return String(left?.name || left?.id).localeCompare(String(right?.name || right?.id));
    })
    .map(simplifySystem);
  const perkLimits = getCharacterCreationPerkLimits();
  const perks = listCharacterCreationPerks().map((entry) => ({ ...entry }));
  const starterTrees = listCharacterCreationStarterTrees().map((entry) => ({ ...entry }));
  const alignments = listCharacterCreationAlignments().map((entry) => ({ ...entry }));

  const systemOptionsById = {};
  const skillPoolsBySignature = {};

  for (const system of selectableSystems) {
    const optionState = buildSystemOptionState({
      system,
      origins,
      races,
      classes,
      professions,
      perks,
      starterTrees,
    });
    systemOptionsById[system.id] = optionState;

    for (const race of optionState.races) {
      for (const cls of optionState.classes) {
        for (const profession of optionState.professions) {
          const signature = buildSignature(system.id, race.id, cls.id, profession.id);
          skillPoolsBySignature[signature] = buildSkillPoolEntry(
            system,
            race,
            cls,
            profession,
          );
        }
      }
    }
  }

  const payload = {
    meta: {
      version: "2.0.0",
      generatedAt: new Date().toISOString(),
      generatedFrom: [
        "game-core/characterCreation",
        "game-core/systems/archetype",
        "game-core/systems/profession",
      ],
      note: "Generated canonical Godot character-creation bundle for web/Godot parity.",
    },
    steps: [
      "mode",
      "name",
      "system",
      "origin",
      "race",
      "class",
      "multiclass",
      "profession",
      "attributes",
      "skills",
      "perks",
      "trees",
      "alignment",
      "review",
    ],
    races,
    classes,
    professions,
    origins,
    systems: selectableSystems,
    systemOptionsById,
    skillPoolsBySignature,
    attributes: {
      base: createAttributeBaseline(BASE_ATTRIBUTE_VALUE),
      freePoints: FREE_POINTS,
      minValue: 1,
      maxValue: 30,
    },
    perks: {
      minPicks: perkLimits.minPicks,
      maxPicks: perkLimits.maxPicks,
      options: perks,
    },
    trees: {
      minPicks: 1,
      maxPicks: 1,
      options: starterTrees,
    },
    alignments,
    characterCreation: {
      required: true,
      startMapAfterCreation: "map_village_square",
    },
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `[godot-character-options] wrote ${path.relative(process.cwd(), OUTPUT_PATH)} with ${selectableSystems.length} systems`,
  );
}

main().catch((error) => {
  console.error("[godot-character-options] FAIL:", error);
  process.exitCode = 1;
});
