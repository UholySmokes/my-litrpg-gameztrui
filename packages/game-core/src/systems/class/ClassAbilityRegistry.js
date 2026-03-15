// =================================================================
// CLASS ABILITY REGISTRY
// Loads class ability content from JSON data sources.
// =================================================================

import classAbilitiesData from "../../data/skills/class_abilities.json" with { type: "json" };
import classAbilitySetsData from "../../data/skills/class_ability_sets.json" with { type: "json" };
import { getClassLineage } from "../../data/registries/ClassDataRegistry.js";
import { attachLatticeMetadata } from "../skills/LivingLatticeSystem.js";

const toAbilityMap = (entries) => {
  const map = {};
  if (!Array.isArray(entries)) return map;
  entries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    if (typeof entry.id !== "string" || !entry.id) return;
    map[entry.id] = entry;
  });
  return map;
};

const normalizeAbilitySetMap = (sets) => {
  if (!sets || typeof sets !== "object" || Array.isArray(sets)) return {};
  return Object.fromEntries(
    Object.entries(sets).map(([classId, ids]) => [
      classId,
      Array.isArray(ids)
        ? ids.filter((abilityId) => typeof abilityId === "string" && abilityId.length > 0)
        : [],
    ]),
  );
};

const ABILITIES = toAbilityMap(classAbilitiesData);
const CLASS_ABILITY_SETS = normalizeAbilitySetMap(classAbilitySetsData);
const ALL_CLASS_ABILITY_IDS = Object.keys(ABILITIES);
const ABILITY_OWNERS = (() => {
  const owners = new Map();
  Object.entries(CLASS_ABILITY_SETS).forEach(([classId, abilityIds]) => {
    abilityIds.forEach((abilityId) => {
      if (!owners.has(abilityId)) {
        owners.set(abilityId, classId);
      }
    });
  });
  return owners;
})();

const copyStringArray = (values) =>
  Array.isArray(values) ? values.filter((value) => typeof value === "string") : [];

const normalizeAbilityTemplate = (ability, { category, source, ownerId } = {}) => {
  if (!ability || typeof ability !== "object") return ability;

  const next = { ...ability };
  const template = next.template && typeof next.template === "object" ? { ...next.template } : {};
  const templateMeta =
    template.meta && typeof template.meta === "object" && !Array.isArray(template.meta)
      ? { ...template.meta }
      : {};
  const effects = Array.isArray(next.effects)
    ? next.effects.map((effect) =>
        effect && typeof effect === "object" && !Array.isArray(effect)
          ? { target: effect.target ?? (next.target === "self" ? "self" : "enemy"), ...effect }
          : effect,
      )
    : [];

  const element = next.damage?.element || next.element || null;
  const defaultFunction = next.damage
    ? next.damage.isMagic
      ? "spell"
      : "attack"
    : next.heal
      ? "heal"
      : next.resourceGain
        ? "resource"
        : "utility";

  if (ownerId) {
    templateMeta.ownerId = ownerId;
  }

  return attachLatticeMetadata({
    ...next,
    type: next.type || (template.function === "passive" ? "passive" : "active"),
    class: ownerId || next.class || "unbound",
    ownerType: "class",
    ownerId: ownerId || next.ownerId || "unbound",
    effects,
    template: {
      category: template.category || category || "Class Ability",
      function: template.function || defaultFunction,
      elements: Array.isArray(template.elements) ? template.elements : element ? [element] : [],
      synergies: Array.isArray(template.synergies) ? template.synergies : [],
      source: template.source || source || "ClassAbilityRegistry",
      ...(Object.keys(templateMeta).length > 0 ? { meta: templateMeta } : {}),
    },
  });
};

const summarizeAbility = (ability) => {
  if (!ability || typeof ability !== "object" || typeof ability.id !== "string") {
    return null;
  }

  const template =
    ability.template && typeof ability.template === "object"
      ? ability.template
      : {};
  const slotType = ability.slotType || ability.type || "active";

  return {
    id: ability.id,
    name: ability.name || ability.id,
    description: ability.description || "No description available.",
    type: ability.type || slotType,
    slotType,
    ownerType: ability.ownerType || "class",
    ownerId: ability.ownerId || ability.class || "unbound",
    costType: ability.costType || null,
    cost: Number.isFinite(ability.cost) ? ability.cost : 0,
    cooldown: Number.isFinite(ability.cooldown) ? ability.cooldown : 0,
    resource: ability.costType || null,
    template: {
      category: template.category || "Class Ability",
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || "ClassAbilityRegistry",
    },
  };
};

function resolveAbilityIds(classId) {
  if (!classId) return null;
  const lineage = getClassLineage(classId);
  if (!Array.isArray(lineage) || lineage.length === 0) return null;

  const ids = [];
  lineage.forEach((classData) => {
    if (!classData?.id) return;
    const abilityIds = CLASS_ABILITY_SETS[classData.id];
    if (Array.isArray(abilityIds)) {
      ids.push(...abilityIds);
    }
  });

  const uniqueIds = Array.from(new Set(ids));
  return uniqueIds.length > 0 ? uniqueIds : null;
}

export function getClassAbilitiesFor(classId) {
  const ids = resolveAbilityIds(classId);
  if (!ids) return null;
  return ids
    .map((abilityId) =>
      normalizeAbilityTemplate(ABILITIES[abilityId], {
        category: "Class Ability",
        ownerId: classId,
      }),
    )
    .filter(Boolean);
}

export function getClassAbilityById(abilityId) {
  if (!abilityId) return null;
  return normalizeAbilityTemplate(ABILITIES[abilityId], {
    category: "Class Ability",
    ownerId: "unbound",
  });
}

export function getClassAbilitySummariesFor(classId) {
  return (getClassAbilitiesFor(classId) || [])
    .map((ability) => summarizeAbility(ability))
    .filter(Boolean);
}

export function getClassAbilitySummaryById(abilityId) {
  return summarizeAbility(getClassAbilityById(abilityId));
}

export function isClassAbilityAllowed(classId, abilityId) {
  const ids = resolveAbilityIds(classId) || [];
  return ids.includes(abilityId);
}

export function getAbilityOwner(abilityId) {
  return ABILITY_OWNERS.get(abilityId) || null;
}

export function getAllClassAbilityIds() {
  return ALL_CLASS_ABILITY_IDS;
}
