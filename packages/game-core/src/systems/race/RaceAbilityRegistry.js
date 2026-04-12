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

const RACE_SKILLS = getLivingLatticeCatalogSkills().filter(
  (entry) => entry?.ownerType === "race",
);
const RACE_ABILITY_INDEX = new Map(
  RACE_SKILLS
    .filter((entry) => typeof entry?.id === "string")
    .map((entry) => [entry.id, entry]),
);
const ALL_RACE_ABILITY_IDS = RACE_SKILLS.map((entry) => entry.id);

function normalizeAbilityTemplate(skill, ownerId) {
  if (!skill || typeof skill !== "object") return null;
  return attachLatticeMetadata(
    {
      ...cloneValue(skill),
      ownerType: "race",
      ownerId: ownerId || skill.ownerId || "unbound",
    },
    {
      family: "bloodline",
      sourceType: "race",
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
    ownerType: "race",
    ownerId: ability.ownerId || "unbound",
    family: "bloodline",
    runtimeRole: ability.runtimeRole || "standard",
    combatRole: ability.combatRole || null,
    passiveHookType: ability.passiveHookType || null,
    costType: ability.costType || null,
    cost: Number.isFinite(ability.cost) ? ability.cost : 0,
    cooldown: Number.isFinite(ability.cooldown) ? ability.cooldown : 0,
    template: {
      category: template.category || "Race Skill",
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || null,
    },
  };
}

export function getRaceAbilitiesFor(raceId) {
  if (!raceId) return [];
  return RACE_SKILLS
    .filter((entry) => entry.ownerId === raceId)
    .map((entry) => normalizeAbilityTemplate(entry, raceId))
    .filter(Boolean);
}

export function getRaceAbilityById(abilityId) {
  const catalogSkill = getLivingLatticeCatalogSkillById(abilityId);
  if (!catalogSkill || catalogSkill.ownerType !== "race") {
    return null;
  }
  return normalizeAbilityTemplate(catalogSkill, catalogSkill.ownerId);
}

export function getRaceAbilitySummariesFor(raceId) {
  return getRaceAbilitiesFor(raceId).map((ability) => summarizeAbility(ability)).filter(Boolean);
}

export function getRaceAbilitySummaryById(abilityId) {
  return summarizeAbility(getRaceAbilityById(abilityId));
}

export function isRaceAbilityAllowed(raceId, abilityId) {
  return getRaceAbilitiesFor(raceId).some((entry) => entry.id === abilityId);
}

export function getAllRaceAbilityIds() {
  return [...ALL_RACE_ABILITY_IDS];
}
