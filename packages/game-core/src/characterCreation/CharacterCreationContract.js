const BLUEPRINT_VERSION = 1;
export const CHARACTER_CREATION_V1_ACTIVE_SKILL_COUNT = 4;
export const CHARACTER_CREATION_V1_PASSIVE_SKILL_COUNT = 12;

function normalizeId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIdArray(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeId(value))
    .filter(Boolean);
}

function normalizeAttributes(attributes) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return {};
  }
  return { ...attributes };
}

export function migrateCharacterCreationBlueprint(legacy = {}) {
  const source = legacy && typeof legacy === "object" ? legacy : {};
  const classId =
    normalizeId(source.classId) ||
    normalizeId(source.class?.id) ||
    normalizeId(source.class);
  const raceId =
    normalizeId(source.raceId) ||
    normalizeId(source.race?.id) ||
    normalizeId(source.race);
  const originId =
    normalizeId(source.originId) ||
    normalizeId(source.origin?.id) ||
    normalizeId(source.origin);
  const professionId =
    normalizeId(source.professionId) ||
    normalizeId(source.profession?.id) ||
    normalizeId(source.profession);
  const archetypeSystemId =
    normalizeId(source.archetypeSystemId) ||
    normalizeId(source.archetypeSystem?.id) ||
    normalizeId(source.archetypeSystem);

  return {
    version: Number.isFinite(source.version) ? source.version : BLUEPRINT_VERSION,
    name: typeof source.name === "string" ? source.name.trim() : "",
    gender: normalizeId(source.gender),
    raceId,
    classId,
    secondaryClassId:
      normalizeId(source.secondaryClassId) ||
      normalizeId(source.secondaryClass?.id) ||
      normalizeId(source.secondaryClass),
    originId,
    professionId,
    archetypeSystemId,
    attributes: normalizeAttributes(source.attributes),
    skillLoadoutId: normalizeId(source.skillLoadoutId),
    activeSkillIds: normalizeIdArray(source.activeSkillIds || source.activeSkills?.map((entry) => entry?.id || entry)),
    passiveSkillIds: normalizeIdArray(source.passiveSkillIds || source.passiveSkills?.map((entry) => entry?.id || entry)),
    perkIds: normalizeIdArray(source.perkIds || source.perks),
    starterTreeIds: normalizeIdArray(source.starterTreeIds || source.starterTrees),
    alignmentId: normalizeId(source.alignmentId || source.alignment?.id || source.alignment),
  };
}

export function createCharacterCreationBlueprint(input = {}) {
  const migrated = migrateCharacterCreationBlueprint(input);
  return {
    ...migrated,
    version: BLUEPRINT_VERSION,
  };
}

export function validateCharacterCreationBlueprint(blueprint = {}, options = {}) {
  const errors = [];
  const source = createCharacterCreationBlueprint(blueprint);
  const {
    requiredActiveSkillCount,
    requiredPassiveSkillCount,
    minPerks,
    maxPerks,
    requiresStarterTree,
  } = options;
  const activeSkillCount = Number.isFinite(requiredActiveSkillCount)
    ? requiredActiveSkillCount
    : CHARACTER_CREATION_V1_ACTIVE_SKILL_COUNT;
  const passiveSkillCount = Number.isFinite(requiredPassiveSkillCount)
    ? requiredPassiveSkillCount
    : CHARACTER_CREATION_V1_PASSIVE_SKILL_COUNT;

  if (!source.name) errors.push("Name is required.");
  if (!source.raceId) errors.push("Race is required.");
  if (!source.classId) errors.push("Class is required.");
  if (!source.originId) errors.push("Origin is required.");
  if (!source.professionId) errors.push("Profession is required.");
  if (!source.archetypeSystemId) errors.push("Archetype system is required.");
  if (!source.attributes || Object.keys(source.attributes).length === 0) {
    errors.push("Attributes are required.");
  }

  if (source.activeSkillIds.length !== activeSkillCount) {
    errors.push(`Must select exactly ${activeSkillCount} active skills.`);
  }
  if (source.passiveSkillIds.length !== passiveSkillCount) {
    errors.push(`Must select exactly ${passiveSkillCount} passive skills.`);
  }

  if (Number.isFinite(minPerks) && source.perkIds.length < minPerks) {
    errors.push(`Must select at least ${minPerks} perks.`);
  }
  if (Number.isFinite(maxPerks) && source.perkIds.length > maxPerks) {
    errors.push(`Must select no more than ${maxPerks} perks.`);
  }

  if (requiresStarterTree && source.starterTreeIds.length < 1) {
    errors.push("A starter tree is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
    blueprint: source,
  };
}

export function createCharacterCreationOutcome({ blueprint, derivedState = {}, seedData = {} } = {}) {
  return {
    blueprint: createCharacterCreationBlueprint(blueprint),
    derivedState: {
      ...derivedState,
    },
    seedData: {
      ...seedData,
    },
  };
}

export { BLUEPRINT_VERSION as CHARACTER_CREATION_BLUEPRINT_VERSION };
