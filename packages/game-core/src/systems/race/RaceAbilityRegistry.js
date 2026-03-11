// =================================================================
// RACE ABILITY REGISTRY
// Loads race ability content from JSON data sources.
// =================================================================

import raceAbilitiesData from "../../data/skills/race_abilities.json" with { type: "json" };
import raceAbilitySetsData from "../../data/skills/race_ability_sets.json" with { type: "json" };
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
    Object.entries(sets).map(([raceId, ids]) => [
      raceId,
      Array.isArray(ids)
        ? ids.filter((abilityId) => typeof abilityId === "string" && abilityId.length > 0)
        : [],
    ]),
  );
};

const ABILITIES = toAbilityMap(raceAbilitiesData);
const RACE_ABILITY_SETS = normalizeAbilitySetMap(raceAbilitySetsData);
const ALL_RACE_ABILITY_IDS = Object.keys(ABILITIES);

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
    type: next.type || "active",
    ownerType: "race",
    ownerId: ownerId || next.ownerId || "unbound",
    effects,
    template: {
      category: template.category || category || "Race Ability",
      function: template.function || defaultFunction,
      elements: Array.isArray(template.elements) ? template.elements : element ? [element] : [],
      synergies: Array.isArray(template.synergies) ? template.synergies : [],
      source: template.source || source || "RaceAbilityRegistry",
      ...(Object.keys(templateMeta).length > 0 ? { meta: templateMeta } : {}),
    },
  }, {
    family: "bloodline",
    sourceType: "race",
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
    ownerType: ability.ownerType || "race",
    ownerId: ability.ownerId || "unbound",
    costType: ability.costType || null,
    cost: Number.isFinite(ability.cost) ? ability.cost : 0,
    cooldown: Number.isFinite(ability.cooldown) ? ability.cooldown : 0,
    resource: ability.costType || null,
    template: {
      category: template.category || "Race Ability",
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || "RaceAbilityRegistry",
    },
  };
};

export function getRaceAbilitiesFor(raceId) {
  if (!raceId) return null;
  const ids = RACE_ABILITY_SETS[raceId];
  if (!ids) return null;
  return ids
    .map((abilityId) =>
      normalizeAbilityTemplate(ABILITIES[abilityId], {
        category: "Race Ability",
        ownerId: raceId,
      }),
    )
    .filter(Boolean);
}

export function getRaceAbilityById(abilityId) {
  if (!abilityId) return null;
  return normalizeAbilityTemplate(ABILITIES[abilityId], {
    category: "Race Ability",
    ownerId: "unbound",
  });
}

export function getRaceAbilitySummariesFor(raceId) {
  return (getRaceAbilitiesFor(raceId) || [])
    .map((ability) => summarizeAbility(ability))
    .filter(Boolean);
}

export function getRaceAbilitySummaryById(abilityId) {
  return summarizeAbility(getRaceAbilityById(abilityId));
}

export function isRaceAbilityAllowed(raceId, abilityId) {
  const ids = RACE_ABILITY_SETS[raceId] || [];
  return ids.includes(abilityId);
}

export function getAllRaceAbilityIds() {
  return ALL_RACE_ABILITY_IDS;
}
