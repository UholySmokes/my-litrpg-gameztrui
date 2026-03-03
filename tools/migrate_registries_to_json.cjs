const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = process.cwd();
const GAME_CORE_SRC = path.join(ROOT, "packages", "game-core", "src");
const SKILLS_DIR = path.join(GAME_CORE_SRC, "data", "skills");

const CLASS_REGISTRY_PATH = path.join(
  GAME_CORE_SRC,
  "systems",
  "class",
  "ClassAbilityRegistry.js",
);
const RACE_REGISTRY_PATH = path.join(
  GAME_CORE_SRC,
  "systems",
  "race",
  "RaceAbilityRegistry.js",
);
const RACE_DATA_REGISTRY_PATH = path.join(
  GAME_CORE_SRC,
  "data",
  "registries",
  "RaceDataRegistry.js",
);

const SPECIAL_SUFFIX = "_special";

async function loadModule(filePath) {
  return import(pathToFileURL(filePath).href);
}

function normalizeAbilityForJson(ability) {
  const clone = JSON.parse(JSON.stringify(ability || {}));
  if (clone?.template?.meta && typeof clone.template.meta === "object") {
    delete clone.template.meta.ownerId;
    if (Object.keys(clone.template.meta).length === 0) {
      delete clone.template.meta;
    }
  }
  return clone;
}

function sortObjectKeys(input) {
  return Object.fromEntries(
    Object.entries(input).sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureExported(fn, exportName, moduleLabel) {
  if (typeof fn !== "function") {
    throw new Error(`Missing export ${moduleLabel}.${exportName}`);
  }
}

function deriveRaceIdFromAbilityId(abilityId) {
  if (typeof abilityId !== "string" || !abilityId.endsWith(SPECIAL_SUFFIX)) {
    return null;
  }
  return abilityId.slice(0, -SPECIAL_SUFFIX.length);
}

async function migrateClassAbilities(classRegistry) {
  ensureExported(classRegistry.getAllClassAbilityIds, "getAllClassAbilityIds", "ClassAbilityRegistry");
  ensureExported(classRegistry.getClassAbilityById, "getClassAbilityById", "ClassAbilityRegistry");
  ensureExported(classRegistry.getAbilityOwner, "getAbilityOwner", "ClassAbilityRegistry");

  const classAbilityIds = classRegistry.getAllClassAbilityIds();
  const classAbilityById = new Map();
  const classAbilitySets = {};

  classAbilityIds.forEach((abilityId) => {
    const ability = normalizeAbilityForJson(classRegistry.getClassAbilityById(abilityId));
    classAbilityById.set(abilityId, ability);

    const ownerId = classRegistry.getAbilityOwner(abilityId);
    if (ownerId) {
      classAbilitySets[ownerId] = classAbilitySets[ownerId] || [];
      classAbilitySets[ownerId].push(abilityId);
    }
  });

  const sortedClassAbilitySets = sortObjectKeys(classAbilitySets);
  for (const classId of Object.keys(sortedClassAbilitySets)) {
    const filePath = path.join(SKILLS_DIR, `class_${classId}.json`);
    const abilities = sortedClassAbilitySets[classId]
      .map((abilityId) => classAbilityById.get(abilityId))
      .filter(Boolean);
    await writeJson(filePath, abilities);
  }

  const allClassAbilities = classAbilityIds
    .map((abilityId) => classAbilityById.get(abilityId))
    .filter(Boolean);

  await writeJson(path.join(SKILLS_DIR, "class_abilities.json"), allClassAbilities);
  await writeJson(path.join(SKILLS_DIR, "class_ability_sets.json"), sortedClassAbilitySets);

  return {
    totalAbilities: allClassAbilities.length,
    owningClasses: Object.keys(sortedClassAbilitySets).length,
  };
}

async function migrateRaceAbilities(raceRegistry, raceDataRegistry) {
  ensureExported(raceRegistry.getAllRaceAbilityIds, "getAllRaceAbilityIds", "RaceAbilityRegistry");
  ensureExported(raceRegistry.getRaceAbilityById, "getRaceAbilityById", "RaceAbilityRegistry");
  ensureExported(raceRegistry.getRaceAbilitiesFor, "getRaceAbilitiesFor", "RaceAbilityRegistry");

  const raceAbilityIds = raceRegistry.getAllRaceAbilityIds();
  const raceAbilityById = new Map();
  const raceAbilitySets = {};
  const ownerByAbilityId = new Map();
  const races = Array.isArray(raceDataRegistry.races) ? raceDataRegistry.races : [];

  races.forEach((race) => {
    if (!race?.id) return;
    const abilitiesForRace = raceRegistry.getRaceAbilitiesFor(race.id) || [];
    const ids = abilitiesForRace
      .map((ability) => ability?.id)
      .filter((abilityId) => typeof abilityId === "string");
    if (ids.length === 0) return;

    raceAbilitySets[race.id] = ids;
    ids.forEach((abilityId) => ownerByAbilityId.set(abilityId, race.id));
  });

  raceAbilityIds.forEach((abilityId) => {
    const normalized = normalizeAbilityForJson(raceRegistry.getRaceAbilityById(abilityId));
    raceAbilityById.set(abilityId, normalized);
    if (!ownerByAbilityId.has(abilityId)) {
      const derivedRaceId = deriveRaceIdFromAbilityId(abilityId);
      if (derivedRaceId) {
        ownerByAbilityId.set(abilityId, derivedRaceId);
        raceAbilitySets[derivedRaceId] = raceAbilitySets[derivedRaceId] || [];
        raceAbilitySets[derivedRaceId].push(abilityId);
      }
    }
  });

  const sortedRaceAbilitySets = sortObjectKeys(raceAbilitySets);
  for (const raceId of Object.keys(sortedRaceAbilitySets)) {
    const filePath = path.join(SKILLS_DIR, `race_${raceId}.json`);
    const abilities = sortedRaceAbilitySets[raceId]
      .map((abilityId) => raceAbilityById.get(abilityId))
      .filter(Boolean);
    await writeJson(filePath, abilities);
  }

  const allRaceAbilities = raceAbilityIds
    .map((abilityId) => raceAbilityById.get(abilityId))
    .filter(Boolean);

  await writeJson(path.join(SKILLS_DIR, "race_abilities.json"), allRaceAbilities);
  await writeJson(path.join(SKILLS_DIR, "race_ability_sets.json"), sortedRaceAbilitySets);

  return {
    totalAbilities: allRaceAbilities.length,
    owningRaces: Object.keys(sortedRaceAbilitySets).length,
  };
}

async function migrate() {
  await fs.mkdir(SKILLS_DIR, { recursive: true });

  const [classRegistry, raceRegistry, raceDataRegistry] = await Promise.all([
    loadModule(CLASS_REGISTRY_PATH),
    loadModule(RACE_REGISTRY_PATH),
    loadModule(RACE_DATA_REGISTRY_PATH),
  ]);

  const classSummary = await migrateClassAbilities(classRegistry);
  const raceSummary = await migrateRaceAbilities(raceRegistry, raceDataRegistry);

  console.log(
    `[migrate_registries_to_json] classAbilities=${classSummary.totalAbilities} classOwners=${classSummary.owningClasses}`,
  );
  console.log(
    `[migrate_registries_to_json] raceAbilities=${raceSummary.totalAbilities} raceOwners=${raceSummary.owningRaces}`,
  );
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
