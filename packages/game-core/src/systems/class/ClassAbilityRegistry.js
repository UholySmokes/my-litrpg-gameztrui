import { getClassLineage } from "../../data/registries/ClassDataRegistry.js";
import { attachLatticeMetadata } from "../skills/LivingLatticeSystem.js";
import {
  getLivingLatticeCatalogSkillById,
  getLivingLatticeCatalogSkills,
} from "../skills/LivingLatticeCatalog.js";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function copyStringArray(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string") : [];
}

const STARTER_CLASS_SKILLS = getLivingLatticeCatalogSkills().filter(
  (entry) =>
    entry?.ownerType === "class" &&
    entry?.selectionBand === "starter",
);
const STARTER_SKILL_INDEX = new Map(
  STARTER_CLASS_SKILLS
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);
const ALL_CLASS_ABILITY_IDS = STARTER_CLASS_SKILLS.map((entry) => entry.id);
const ABILITY_OWNER_INDEX = new Map(
  STARTER_CLASS_SKILLS.map((entry) => [entry.id, entry.ownerId]),
);

function normalizeAbilityTemplate(skill, ownerId) {
  if (!skill || typeof skill !== "object") return null;
  return attachLatticeMetadata(
    {
      ...cloneValue(skill),
      ownerType: "class",
      ownerId: ownerId || skill.ownerId || "unbound",
      class: ownerId || skill.ownerId || skill.class || "unbound",
    },
    {
      family: skill.family || skill.latticeFamily,
      sourceType: "class",
      runtimeRole: skill.runtimeRole,
    },
  );
}

function summarizeAbility(ability) {
  if (!ability || typeof ability !== "object" || typeof ability.id !== "string") {
    return null;
  }
  const template =
    ability.template && typeof ability.template === "object" ? ability.template : {};
  const slotType = ability.slotType || ability.type || "active";
  return {
    id: ability.id,
    name: ability.name || ability.id,
    description: ability.description || "No description available.",
    type: ability.type || slotType,
    slotType,
    selectionBand: ability.selectionBand || "starter",
    unlockLevel: Number.isFinite(ability.unlockLevel) ? ability.unlockLevel : 1,
    ownerType: "class",
    ownerId: ability.ownerId || ability.class || "unbound",
    family: ability.family || ability.latticeFamily || null,
    runtimeRole: ability.runtimeRole || "standard",
    combatRole: ability.combatRole || null,
    passiveHookType: ability.passiveHookType || null,
    costType: ability.costType || null,
    cost: Number.isFinite(ability.cost) ? ability.cost : 0,
    cooldown: Number.isFinite(ability.cooldown) ? ability.cooldown : 0,
    template: {
      category: template.category || "Class Skill",
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || null,
    },
  };
}

function resolveAbilityIds(classId) {
  if (!classId) return [];
  const lineage = getClassLineage(classId);
  if (!Array.isArray(lineage) || lineage.length === 0) return [];
  const ids = [];
  lineage.forEach((entry) => {
    const currentId = entry?.id;
    if (!currentId) return;
    STARTER_CLASS_SKILLS.forEach((skill) => {
      if (skill.ownerId === currentId) ids.push(skill.id);
    });
  });
  return Array.from(new Set(ids));
}

export function getClassAbilitiesFor(classId) {
  const ids = resolveAbilityIds(classId);
  return ids
    .map((abilityId) => normalizeAbilityTemplate(STARTER_SKILL_INDEX.get(abilityId), classId))
    .filter(Boolean);
}

export function getClassAbilityById(abilityId) {
  const catalogSkill = getLivingLatticeCatalogSkillById(abilityId);
  if (!catalogSkill || catalogSkill.ownerType !== "class" || catalogSkill.selectionBand !== "starter") {
    return null;
  }
  return normalizeAbilityTemplate(catalogSkill, catalogSkill.ownerId);
}

export function getClassAbilitySummariesFor(classId) {
  return getClassAbilitiesFor(classId).map((ability) => summarizeAbility(ability)).filter(Boolean);
}

export function getClassAbilitySummaryById(abilityId) {
  return summarizeAbility(getClassAbilityById(abilityId));
}

export function isClassAbilityAllowed(classId, abilityId) {
  return resolveAbilityIds(classId).includes(abilityId);
}

export function getAbilityOwner(abilityId) {
  return ABILITY_OWNER_INDEX.get(abilityId) || null;
}

export function getAllClassAbilityIds() {
  return [...ALL_CLASS_ABILITY_IDS];
}
