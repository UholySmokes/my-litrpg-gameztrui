import {
  attachLatticeMetadata,
  summarizeLatticeLoadout,
} from "../systems/skills/LivingLatticeSystem.js";
import { getCharacterCreationSkillReferenceById } from "./CharacterCreationContentPack.js";

export function resolveCharacterCreationSkillReference(skillRef) {
  if (!skillRef) return null;
  if (typeof skillRef === "string") {
    return getCharacterCreationSkillReferenceById(skillRef);
  }
  if (typeof skillRef === "object") {
    if (!skillRef.id) return null;
    return skillRef.lattice ? skillRef : attachLatticeMetadata(skillRef);
  }
  return null;
}

function resolveCharacterCreationSkillReferenceList(skillRefs = []) {
  return (Array.isArray(skillRefs) ? skillRefs : [])
    .map((skillRef) => resolveCharacterCreationSkillReference(skillRef))
    .filter(Boolean);
}

export function getCharacterCreationLatticeLoadoutSummary({
  activeSkillIds = [],
  passiveSkillIds = [],
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
} = {}) {
  const safeActiveSkills = Array.isArray(activeSkills) ? activeSkills : [];
  const safePassiveSkills = Array.isArray(passiveSkills) ? passiveSkills : [];
  const safeActiveSkillIds = Array.isArray(activeSkillIds) ? activeSkillIds : [];
  const safePassiveSkillIds = Array.isArray(passiveSkillIds)
    ? passiveSkillIds
    : [];
  const resolvedActiveSkills =
    safeActiveSkills.length > 0
      ? resolveCharacterCreationSkillReferenceList(safeActiveSkills)
      : resolveCharacterCreationSkillReferenceList(safeActiveSkillIds);
  const resolvedPassiveSkills =
    safePassiveSkills.length > 0
      ? resolveCharacterCreationSkillReferenceList(safePassiveSkills)
      : resolveCharacterCreationSkillReferenceList(safePassiveSkillIds);

  return summarizeLatticeLoadout({
    activeSkills: resolvedActiveSkills,
    passiveSkills: resolvedPassiveSkills,
    professionId,
  });
}
