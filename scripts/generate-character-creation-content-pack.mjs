import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classes } from "../packages/game-core/src/data/registries/ClassDataRegistry.js";
import { origins } from "../packages/game-core/src/data/registries/OriginDataRegistry.js";
import { races } from "../packages/game-core/src/data/registries/RaceDataRegistry.js";
import { getAllSkillSummaries } from "../packages/game-core/src/systems/skills/SkillRegistry.js";
import {
  getClassAbilitySummariesFor,
  getClassAbilitySummaryById,
} from "../packages/game-core/src/systems/class/ClassAbilityRegistry.js";
import {
  getRaceAbilitySummariesFor,
  getRaceAbilitySummaryById,
} from "../packages/game-core/src/systems/race/RaceAbilityRegistry.js";
import { getAllArchetypeSystems } from "../packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(
  __dirname,
  "../packages/game-core/src/data/generated/character-creation",
);

function clonePlain(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function sortRecordKeys(record) {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function projectClass(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    tier: Number.isFinite(entry.tier) ? entry.tier : 1,
    parentId: entry.parentId || null,
    upgradePath: entry.upgradePath || null,
    resourceSystem: entry.resourceSystem || entry.resource || null,
    resource: entry.resource || entry.resourceSystem || null,
    archetype: entry.archetype || null,
    skills: Array.isArray(entry.skills) ? [...entry.skills] : [],
    coreMechanics: Array.isArray(entry.coreMechanics) ? [...entry.coreMechanics] : [],
    baseStats:
      entry.baseStats && typeof entry.baseStats === "object"
        ? { ...entry.baseStats }
        : {},
    progression:
      entry.progression && typeof entry.progression === "object"
        ? { ...entry.progression }
        : null,
    evolutionOptions: Array.isArray(entry.evolutionOptions)
      ? clonePlain(entry.evolutionOptions)
      : [],
  };
}

function projectOrigin(entry) {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    favoredBiome: entry.favoredBiome || null,
    favoredFactionId: entry.favoredFactionId || null,
    favoredQuestTags: Array.isArray(entry.favoredQuestTags)
      ? [...entry.favoredQuestTags]
      : [],
    attributeBonuses:
      entry.attributeBonuses && typeof entry.attributeBonuses === "object"
        ? { ...entry.attributeBonuses }
        : {},
  };
}

function projectRace(entry) {
  const statBonuses =
    entry.statBonuses && typeof entry.statBonuses === "object"
      ? { ...entry.statBonuses }
      : entry.modifiers && typeof entry.modifiers === "object"
        ? { ...entry.modifiers }
        : entry.baseStats && typeof entry.baseStats === "object"
          ? { ...entry.baseStats }
          : {};

  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    evolutionStage: entry.evolutionStage || null,
    evolutionStageIndex: Number.isFinite(entry.evolutionStageIndex)
      ? entry.evolutionStageIndex
      : 0,
    statBonuses,
    modifiers: { ...statBonuses },
    passiveAbility:
      entry.passiveAbility && typeof entry.passiveAbility === "object"
        ? clonePlain(entry.passiveAbility)
        : null,
    hiddenTrait:
      entry.hiddenTrait && typeof entry.hiddenTrait === "object"
        ? clonePlain(entry.hiddenTrait)
        : null,
  };
}

function projectArchetypeSystem(entry) {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category || "Unknown",
    summary: entry.summary || "",
    description: entry.description || "",
    coreLoop: Array.isArray(entry.coreLoop) ? [...entry.coreLoop] : [],
    progression: Array.isArray(entry.progression) ? [...entry.progression] : [],
    narrativeHooks: Array.isArray(entry.narrativeHooks)
      ? [...entry.narrativeHooks]
      : [],
    questHooks: Array.isArray(entry.questHooks) ? [...entry.questHooks] : [],
    tags: Array.isArray(entry.tags) ? [...entry.tags] : [],
    archetypeResource:
      entry.archetypeResource && typeof entry.archetypeResource === "object"
        ? clonePlain(entry.archetypeResource)
        : null,
    narrativeTone:
      entry.narrativeTone && typeof entry.narrativeTone === "object"
        ? clonePlain(entry.narrativeTone)
        : null,
    progressionImpact:
      entry.progressionImpact && typeof entry.progressionImpact === "object"
        ? clonePlain(entry.progressionImpact)
        : null,
    characterCreation:
      entry.characterCreation && typeof entry.characterCreation === "object"
        ? clonePlain(entry.characterCreation)
        : null,
    quality:
      entry.quality && typeof entry.quality === "object"
        ? clonePlain(entry.quality)
        : null,
    implementationProfile:
      entry.implementationProfile && typeof entry.implementationProfile === "object"
        ? clonePlain(entry.implementationProfile)
        : null,
  };
}

function buildClassAbilitySummaryMap() {
  const ids = new Set();
  const byClass = {};

  classes.forEach((entry) => {
    const classId = entry?.id;
    if (!classId) return;
    const summaries = getClassAbilitySummariesFor(classId) || [];
    byClass[classId] = summaries.map((summary) => clonePlain(summary));
    summaries.forEach((summary) => {
      if (summary?.id) ids.add(summary.id);
    });
  });

  const byId = {};
  [...ids]
    .sort((left, right) => left.localeCompare(right))
    .forEach((abilityId) => {
      const summary = getClassAbilitySummaryById(abilityId);
      if (summary?.id) {
        byId[abilityId] = clonePlain(summary);
      }
    });

  return {
    byClass: sortRecordKeys(byClass),
    byId,
  };
}

function buildRaceAbilitySummaryMap() {
  const ids = new Set();
  const byRace = {};

  races.forEach((entry) => {
    const raceId = entry?.id;
    if (!raceId) return;
    const summaries = getRaceAbilitySummariesFor(raceId) || [];
    byRace[raceId] = summaries.map((summary) => clonePlain(summary));
    summaries.forEach((summary) => {
      if (summary?.id) ids.add(summary.id);
    });
  });

  const byId = {};
  [...ids]
    .sort((left, right) => left.localeCompare(right))
    .forEach((abilityId) => {
      const summary = getRaceAbilitySummaryById(abilityId);
      if (summary?.id) {
        byId[abilityId] = clonePlain(summary);
      }
    });

  return {
    byRace: sortRecordKeys(byRace),
    byId,
  };
}

async function writeJsonFile(filename, data) {
  const targetPath = path.join(outputDir, filename);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(targetPath, payload, "utf8");
  return targetPath;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const classAbilitySummaries = buildClassAbilitySummaryMap();
  const raceAbilitySummaries = buildRaceAbilitySummaryMap();

  const outputs = await Promise.all([
    writeJsonFile("classes.json", classes.map((entry) => projectClass(entry))),
    writeJsonFile("origins.json", origins.map((entry) => projectOrigin(entry))),
    writeJsonFile("races.json", races.map((entry) => projectRace(entry))),
    writeJsonFile("skill-summaries.json", getAllSkillSummaries().map((entry) => clonePlain(entry))),
    writeJsonFile("class-ability-summaries.json", classAbilitySummaries),
    writeJsonFile("race-ability-summaries.json", raceAbilitySummaries),
    writeJsonFile(
      "archetype-systems.json",
      getAllArchetypeSystems().map((entry) => projectArchetypeSystem(entry)),
    ),
  ]);

  outputs.forEach((targetPath) => {
    console.log(`generated ${path.relative(path.resolve(__dirname, ".."), targetPath)}`);
  });
}

await main();
