import classesData from "../data/generated/character-creation/classes.json" with { type: "json" };
import originsData from "../data/generated/character-creation/origins.json" with { type: "json" };
import racesData from "../data/generated/character-creation/races.json" with { type: "json" };
import skillSummariesData from "../data/generated/character-creation/skill-summaries.json" with { type: "json" };
import classAbilitySummariesData from "../data/generated/character-creation/class-ability-summaries.json" with { type: "json" };
import raceAbilitySummariesData from "../data/generated/character-creation/race-ability-summaries.json" with { type: "json" };
import archetypeSystemsData from "../data/generated/character-creation/archetype-systems.json" with { type: "json" };
import { getArchetypeSystemById } from "../systems/archetype/ArchetypeSystemRegistry.js";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function cloneList(values) {
  return Array.isArray(values) ? values.map((entry) => cloneValue(entry)) : [];
}

const CLASS_INDEX = new Map(
  (Array.isArray(classesData) ? classesData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const ORIGIN_INDEX = new Map(
  (Array.isArray(originsData) ? originsData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const RACE_INDEX = new Map(
  (Array.isArray(racesData) ? racesData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const SKILL_SUMMARY_INDEX = new Map(
  (Array.isArray(skillSummariesData) ? skillSummariesData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

const CLASS_ABILITY_SUMMARIES_BY_CLASS =
  classAbilitySummariesData &&
  typeof classAbilitySummariesData === "object" &&
  !Array.isArray(classAbilitySummariesData)
    ? classAbilitySummariesData.byClass || {}
    : {};

const CLASS_ABILITY_SUMMARY_INDEX = new Map(
  Object.entries(
    classAbilitySummariesData &&
      typeof classAbilitySummariesData === "object" &&
      !Array.isArray(classAbilitySummariesData)
      ? classAbilitySummariesData.byId || {}
      : {},
  ),
);

const RACE_ABILITY_SUMMARIES_BY_RACE =
  raceAbilitySummariesData &&
  typeof raceAbilitySummariesData === "object" &&
  !Array.isArray(raceAbilitySummariesData)
    ? raceAbilitySummariesData.byRace || {}
    : {};

const RACE_ABILITY_SUMMARY_INDEX = new Map(
  Object.entries(
    raceAbilitySummariesData &&
      typeof raceAbilitySummariesData === "object" &&
      !Array.isArray(raceAbilitySummariesData)
      ? raceAbilitySummariesData.byId || {}
      : {},
  ),
);

const ARCHETYPE_SYSTEM_INDEX = new Map(
  (Array.isArray(archetypeSystemsData) ? archetypeSystemsData : [])
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);

function mergePreferredList(primary, fallback) {
  if (Array.isArray(primary)) return cloneList(primary);
  if (Array.isArray(fallback)) return cloneList(fallback);
  return [];
}

function hydrateArchetypeSystem(entry) {
  if (!entry || typeof entry !== "object" || typeof entry.id !== "string") {
    return null;
  }

  const generated = cloneValue(entry);
  const live = getArchetypeSystemById(entry.id);
  if (!live || typeof live !== "object") {
    return generated;
  }

  const liveValue = cloneValue({
    ...live,
  });

  return {
    ...liveValue,
    ...generated,
    coreLoop: mergePreferredList(generated.coreLoop, liveValue.coreLoop),
    progression: mergePreferredList(generated.progression, liveValue.progression),
    narrativeHooks: mergePreferredList(generated.narrativeHooks, liveValue.narrativeHooks),
    questHooks: mergePreferredList(generated.questHooks, liveValue.questHooks),
    tags: mergePreferredList(generated.tags, liveValue.tags),
    possibleUses: mergePreferredList(generated.possibleUses, liveValue.possibleUses),
    limits: mergePreferredList(generated.limits, liveValue.limits),
    costs: mergePreferredList(generated.costs, liveValue.costs),
    worldCompatibility: mergePreferredList(
      generated.worldCompatibility,
      liveValue.worldCompatibility,
    ),
    factionReactions: mergePreferredList(
      generated.factionReactions,
      liveValue.factionReactions,
    ),
    rarity: generated.rarity ?? liveValue.rarity ?? null,
    stability: generated.stability ?? liveValue.stability ?? null,
    selectionWeight: generated.selectionWeight ?? liveValue.selectionWeight ?? null,
    archetypeResource: generated.archetypeResource || liveValue.archetypeResource || null,
    narrativeTone: generated.narrativeTone || liveValue.narrativeTone || null,
    progressionImpact: generated.progressionImpact || liveValue.progressionImpact || null,
    characterCreation: generated.characterCreation || liveValue.characterCreation || null,
    quality: generated.quality || liveValue.quality || null,
    implementationProfile:
      generated.implementationProfile || liveValue.implementationProfile || null,
  };
}

function isSelectableCreationSystem(entry, platform = "") {
  const ordering =
    entry?.characterCreation && typeof entry.characterCreation === "object"
      ? entry.characterCreation.ordering || {}
      : {};
  if (!ordering || ordering.selectable !== true) return false;
  if (!platform) return true;
  const platforms = Array.isArray(ordering.platforms) ? ordering.platforms : [];
  return platforms.includes(platform);
}

export function getCharacterCreationClasses() {
  return cloneList(classesData);
}

export function getCharacterCreationClassesByTier(tier = 1) {
  const numericTier = Number.isFinite(tier) ? tier : Number(tier);
  return getCharacterCreationClasses().filter(
    (entry) => Number(entry?.tier || 1) === numericTier,
  );
}

export function getCharacterCreationClassById(classId) {
  if (!classId) return null;
  return cloneValue(CLASS_INDEX.get(classId) || null);
}

export function getCharacterCreationOrigins() {
  return cloneList(originsData);
}

export function getCharacterCreationOriginById(originId) {
  if (!originId) return null;
  return cloneValue(ORIGIN_INDEX.get(originId) || null);
}

export function getCharacterCreationRaces() {
  return cloneList(racesData);
}

export function getCharacterCreationRaceById(raceId) {
  if (!raceId) return null;
  return cloneValue(RACE_INDEX.get(raceId) || null);
}

export function getCharacterCreationSkillSummaries() {
  return cloneList(skillSummariesData);
}

export function getCharacterCreationSkillSummaryById(skillId) {
  if (!skillId) return null;
  return cloneValue(SKILL_SUMMARY_INDEX.get(skillId) || null);
}

export function getCharacterCreationClassAbilitySummaries(classId) {
  if (!classId) return [];
  return cloneList(CLASS_ABILITY_SUMMARIES_BY_CLASS[classId] || []);
}

export function getCharacterCreationClassAbilitySummaryById(abilityId) {
  if (!abilityId) return null;
  return cloneValue(CLASS_ABILITY_SUMMARY_INDEX.get(abilityId) || null);
}

export function getCharacterCreationRaceAbilitySummaries(raceId) {
  if (!raceId) return [];
  return cloneList(RACE_ABILITY_SUMMARIES_BY_RACE[raceId] || []);
}

export function getCharacterCreationRaceAbilitySummaryById(abilityId) {
  if (!abilityId) return null;
  return cloneValue(RACE_ABILITY_SUMMARY_INDEX.get(abilityId) || null);
}

export function getCharacterCreationSkillReferenceById(skillId) {
  if (!skillId) return null;
  return (
    getCharacterCreationSkillSummaryById(skillId) ||
    getCharacterCreationClassAbilitySummaryById(skillId) ||
    getCharacterCreationRaceAbilitySummaryById(skillId) ||
    null
  );
}

export function getCharacterCreationArchetypeSystems() {
  return (Array.isArray(archetypeSystemsData) ? archetypeSystemsData : [])
    .filter((entry) => isSelectableCreationSystem(entry))
    .map((entry) => hydrateArchetypeSystem(entry))
    .filter(Boolean);
}

export function getCharacterCreationArchetypeSystemsByCategory(category) {
  if (!category) return [];
  return getCharacterCreationArchetypeSystems().filter(
    (entry) => entry?.category === category,
  );
}

export function getCharacterCreationArchetypeSystemById(systemId) {
  if (!systemId) return null;
  const entry = ARCHETYPE_SYSTEM_INDEX.get(systemId) || null;
  return isSelectableCreationSystem(entry) ? hydrateArchetypeSystem(entry) : null;
}
