import {
  createCharacterCreationBlueprint,
  validateCharacterCreationBlueprint,
} from "@voidverse/game-core/characterCreation/CharacterCreationContract.js";

const INVALID_SELECTION_LABELS = new Set([
  "",
  "none",
  "unknown",
  "pending",
  "unselected",
  "null",
]);

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function normalizeId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return INVALID_SELECTION_LABELS.has(trimmed.toLowerCase()) ? null : trimmed;
}

function extractEntityId(value) {
  if (isRecord(value)) {
    return normalizeId(value.id) || normalizeId(value.name);
  }
  return normalizeId(value);
}

function extractProfessionId(player) {
  return (
    extractEntityId(player?.profession) ||
    normalizeId(player?.characterCreationBlueprint?.professionId) ||
    Object.keys(isRecord(player?.professions) ? player.professions : {})[0] ||
    null
  );
}

function extractSystemId(player) {
  return (
    extractEntityId(player?.archetypeSystem) ||
    normalizeId(player?.archetypeSystemId) ||
    normalizeId(player?.characterCreationBlueprint?.archetypeSystemId) ||
    null
  );
}

function toIdArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => extractEntityId(value)).filter(Boolean);
}

function buildPlayerBlueprint(player) {
  return createCharacterCreationBlueprint({
    name: typeof player?.name === "string" ? player.name.trim() : "",
    gender: normalizeId(player?.gender),
    raceId:
      extractEntityId(player?.race) ||
      normalizeId(player?.characterCreationBlueprint?.raceId),
    classId:
      extractEntityId(player?.class) ||
      normalizeId(player?.characterCreationBlueprint?.classId),
    secondaryClassId:
      extractEntityId(player?.secondaryClass) ||
      normalizeId(player?.characterCreationBlueprint?.secondaryClassId),
    professionId: extractProfessionId(player),
    archetypeSystemId: extractSystemId(player),
    attributes: isRecord(player?.attributes) ? player.attributes : {},
    startingPrompt:
      typeof player?.startingPrompt === "string"
        ? player.startingPrompt.trim()
        : normalizeId(player?.characterCreationBlueprint?.startingPrompt) || "",
    startingLocationId:
      normalizeId(player?.startingLocationId) ||
      normalizeId(player?.characterCreationBlueprint?.startingLocationId),
    startingZoneId:
      normalizeId(player?.startingZoneId) ||
      normalizeId(player?.characterCreationBlueprint?.startingZoneId),
    skillLoadoutId:
      normalizeId(player?.skillLoadoutId) ||
      normalizeId(player?.characterCreationBlueprint?.skillLoadoutId),
    activeSkillIds:
      toIdArray(player?.activeSkills) ||
      toIdArray(player?.characterCreationBlueprint?.activeSkillIds),
    passiveSkillIds:
      toIdArray(player?.passiveSkills) ||
      toIdArray(player?.characterCreationBlueprint?.passiveSkillIds),
    perkIds:
      toIdArray(player?.perks) ||
      toIdArray(player?.characterCreationBlueprint?.perkIds),
    starterTreeIds:
      toIdArray(player?.starterTrees) ||
      toIdArray(player?.characterCreationBlueprint?.starterTreeIds),
    alignmentId:
      normalizeId(player?.alignment) ||
      normalizeId(player?.characterCreationBlueprint?.alignmentId),
  });
}

function buildMissingSelectionLabels(blueprint) {
  const missing = [];

  if (!blueprint.name) missing.push("Name");
  if (!blueprint.raceId) missing.push("Race");
  if (!blueprint.classId) missing.push("Class");
  if (!blueprint.professionId) missing.push("Profession");
  if (!blueprint.archetypeSystemId) missing.push("System");
  if (!blueprint.startingPrompt) missing.push("Starting prompt");
  if (!blueprint.skillLoadoutId) missing.push("Skill loadout");
  if (!blueprint.alignmentId) missing.push("Alignment");
  if (!blueprint.activeSkillIds.length) missing.push("Active skills");
  if (!blueprint.passiveSkillIds.length) missing.push("Passive skills");

  return missing;
}

export function hasCharacterIdentitySnapshot(snapshotState) {
  if (!isRecord(snapshotState)) return false;
  const player = snapshotState.player;
  if (!isRecord(player)) return false;

  return Boolean(
    player.origin ||
      player.race ||
      player.class ||
      player.profession ||
      player.archetypeSystem ||
      player.characterCreationBlueprint ||
      (Array.isArray(player.activeSkills) && player.activeSkills.length > 0) ||
      (Array.isArray(player.passiveSkills) && player.passiveSkills.length > 0),
  );
}

export function evaluateCharacterReadiness(snapshotState) {
  if (!isRecord(snapshotState) || !isRecord(snapshotState.player)) {
    return {
      valid: false,
      blocking: false,
      blueprint: createCharacterCreationBlueprint({}),
      errors: [],
      missingSelections: [],
    };
  }

  const player = snapshotState.player;
  const blueprint = isRecord(player.characterCreationBlueprint)
    ? createCharacterCreationBlueprint(player.characterCreationBlueprint)
    : buildPlayerBlueprint(player);
  const validation = validateCharacterCreationBlueprint(blueprint);
  const missingSelections = buildMissingSelectionLabels(blueprint);

  return {
    valid: validation.valid,
    blocking: hasCharacterIdentitySnapshot(snapshotState) && !validation.valid,
    blueprint,
    errors: validation.errors,
    missingSelections,
  };
}

export function hasReadyCharacterSnapshot(snapshotState) {
  return evaluateCharacterReadiness(snapshotState).valid;
}