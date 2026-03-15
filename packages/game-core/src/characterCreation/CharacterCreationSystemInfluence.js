import {
  getCharacterCreationArchetypeSystemById,
  getCharacterCreationSkillReferenceById,
} from "./CharacterCreationContentPack.js";

function normalizeId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIdList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizeId(value))
    .filter(Boolean);
}

function cloneValue(value) {
  if (value == null) return value;
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function toIdMap(list = []) {
  return new Map(
    (Array.isArray(list) ? list : [])
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => [normalizeId(entry.id), entry])
      .filter(([id]) => Boolean(id)),
  );
}

function normalizeOptionRule(rule = {}) {
  return {
    allowIds: normalizeIdList(rule.allowIds),
    denyIds: normalizeIdList(rule.denyIds),
    boostIds: normalizeIdList(rule.boostIds),
  };
}

function normalizeSkillRule(rule = {}) {
  return {
    grantActiveIds: normalizeIdList(rule.grantActiveIds),
    grantPassiveIds: normalizeIdList(rule.grantPassiveIds),
    allowSkillIds: normalizeIdList(rule.allowSkillIds),
    denySkillIds: normalizeIdList(rule.denySkillIds),
    boostSkillIds: normalizeIdList(rule.boostSkillIds),
    allowLoadoutIds: normalizeIdList(rule.allowLoadoutIds),
    denyLoadoutIds: normalizeIdList(rule.denyLoadoutIds),
    activeSlotBonus: Number.isFinite(rule.activeSlotBonus)
      ? Number(rule.activeSlotBonus)
      : 0,
    passiveSlotBonus: Number.isFinite(rule.passiveSlotBonus)
      ? Number(rule.passiveSlotBonus)
      : 0,
  };
}

function normalizeAttributeBias(bias = {}) {
  return {
    primary: normalizeIdList(bias.primary),
    secondary: normalizeIdList(bias.secondary),
  };
}

function normalizeCreationProfile(profile = {}) {
  const ordering = profile?.ordering && typeof profile.ordering === "object"
    ? profile.ordering
    : {};
  const optionRules = profile?.optionRules && typeof profile.optionRules === "object"
    ? profile.optionRules
    : {};
  return {
    ordering: {
      selectable: Boolean(ordering.selectable),
      platforms: normalizeIdList(ordering.platforms),
      priority: Number.isFinite(ordering.priority) ? Number(ordering.priority) : 999,
    },
    optionRules: {
      origin: normalizeOptionRule(optionRules.origin),
      race: normalizeOptionRule(optionRules.race),
      class: normalizeOptionRule(optionRules.class),
      secondaryClass: normalizeOptionRule(optionRules.secondaryClass),
      profession: normalizeOptionRule(optionRules.profession),
      perks: normalizeOptionRule(optionRules.perks),
      starterTrees: normalizeOptionRule(optionRules.starterTrees),
    },
    attributeBias: normalizeAttributeBias(profile.attributeBias),
    skillRules: normalizeSkillRule(profile.skillRules),
  };
}

function sortByBoost(list = [], boostIds = []) {
  const boostOrder = new Map(boostIds.map((id, index) => [id, index]));
  return [...list].sort((left, right) => {
    const leftBoost = boostOrder.has(left.id) ? boostOrder.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightBoost = boostOrder.has(right.id) ? boostOrder.get(right.id) : Number.MAX_SAFE_INTEGER;
    if (leftBoost !== rightBoost) return leftBoost - rightBoost;
    return String(left.name || left.id).localeCompare(String(right.name || right.id));
  });
}

export function resolveCharacterCreationSystemProfile(systemOrId) {
  const rawSystem =
    typeof systemOrId === "string"
      ? getCharacterCreationArchetypeSystemById(systemOrId)
      : systemOrId && typeof systemOrId === "object"
        ? systemOrId
        : null;
  if (!rawSystem || typeof rawSystem !== "object") return null;

  return {
    ...cloneValue(rawSystem),
    characterCreation: normalizeCreationProfile(rawSystem.characterCreation),
  };
}

export function isCharacterCreationSystemSelectable(systemOrId, platform = "") {
  const resolved = resolveCharacterCreationSystemProfile(systemOrId);
  if (!resolved?.characterCreation?.ordering?.selectable) return false;
  const platforms = resolved.characterCreation.ordering.platforms || [];
  if (!platform) return true;
  return platforms.includes(platform);
}

export function applyCharacterCreationOptionRule(options = [], ruleInput = {}) {
  const rule = normalizeOptionRule(ruleInput);
  const allowSet = new Set(rule.allowIds);
  const denySet = new Set(rule.denyIds);

  const filtered = (Array.isArray(options) ? options : []).filter((entry) => {
    const id = normalizeId(entry?.id);
    if (!id || denySet.has(id)) return false;
    if (allowSet.size > 0 && !allowSet.has(id)) return false;
    return true;
  });

  return {
    options: sortByBoost(filtered, rule.boostIds).map((entry) => cloneValue(entry)),
    recommendedIds: rule.boostIds.filter((id) => filtered.some((entry) => entry.id === id)),
    blockedIds: rule.denyIds,
  };
}

function mergeUniqueById(list = []) {
  const seen = new Set();
  return list.filter((entry) => {
    const id = normalizeId(entry?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function resolveSkillsByIds(ids = [], existingMap = new Map()) {
  return mergeUniqueById(
    ids
      .map((id) => existingMap.get(id) || getCharacterCreationSkillReferenceById(id))
      .filter(Boolean)
      .map((entry) => cloneValue(entry)),
  );
}

export function resolveCharacterCreationSkillInfluence({
  systemId = null,
  activeSkills = [],
  passiveSkills = [],
  loadouts = [],
} = {}) {
  const profile = resolveCharacterCreationSystemProfile(systemId);
  const skillRules = profile?.characterCreation?.skillRules || normalizeSkillRule();
  const activeMap = toIdMap(activeSkills);
  const passiveMap = toIdMap(passiveSkills);

  const denied = new Set(skillRules.denySkillIds);
  const grantedActiveSkills = resolveSkillsByIds(skillRules.grantActiveIds, activeMap);
  const grantedPassiveSkills = resolveSkillsByIds(skillRules.grantPassiveIds, passiveMap);
  const grantedSkillIds = new Set([
    ...grantedActiveSkills.map((entry) => entry.id),
    ...grantedPassiveSkills.map((entry) => entry.id),
  ]);

  const allowSkillRefs = resolveSkillsByIds(skillRules.allowSkillIds);
  allowSkillRefs.forEach((entry) => {
    const slotType = String(entry.slotType || entry.type || "").toLowerCase();
    if (slotType === "passive") {
      passiveMap.set(entry.id, entry);
    } else {
      activeMap.set(entry.id, entry);
    }
  });

  const filteredActive = mergeUniqueById(
    [...activeMap.values()].filter((entry) => {
      const id = normalizeId(entry?.id);
      return Boolean(id) && !denied.has(id) && !grantedSkillIds.has(id);
    }),
  );
  const filteredPassive = mergeUniqueById(
    [...passiveMap.values()].filter((entry) => {
      const id = normalizeId(entry?.id);
      return Boolean(id) && !denied.has(id) && !grantedSkillIds.has(id);
    }),
  );

  const activeSkillsSorted = sortByBoost(filteredActive, skillRules.boostSkillIds).map(cloneValue);
  const passiveSkillsSorted = sortByBoost(filteredPassive, skillRules.boostSkillIds).map(cloneValue);

  const allowLoadoutIds = new Set(skillRules.allowLoadoutIds);
  const denyLoadoutIds = new Set(skillRules.denyLoadoutIds);
  const filteredLoadouts = (Array.isArray(loadouts) ? loadouts : [])
    .filter((entry) => {
      const id = normalizeId(entry?.id);
      if (!id || denyLoadoutIds.has(id)) return false;
      if (allowLoadoutIds.size > 0 && !allowLoadoutIds.has(id)) return false;
      return true;
    })
    .map((entry) => cloneValue(entry));

  return {
    profile,
    activeSkills: activeSkillsSorted,
    passiveSkills: passiveSkillsSorted,
    grantedActiveSkills,
    grantedPassiveSkills,
    blockedSkillIds: [...denied],
    boostedSkillIds: [...skillRules.boostSkillIds],
    loadouts: filteredLoadouts,
    slotBonuses: {
      active: skillRules.activeSlotBonus || 0,
      passive: skillRules.passiveSlotBonus || 0,
    },
  };
}

export function resolveCharacterCreationOptionsBySystem({
  systemId = null,
  origins = [],
  races = [],
  classes = [],
  professions = [],
  perks = [],
  starterTrees = [],
} = {}) {
  const profile = resolveCharacterCreationSystemProfile(systemId);
  const rules = profile?.characterCreation?.optionRules || {};

  return {
    profile,
    origins: applyCharacterCreationOptionRule(origins, rules.origin),
    races: applyCharacterCreationOptionRule(races, rules.race),
    classes: applyCharacterCreationOptionRule(classes, rules.class),
    secondaryClasses: applyCharacterCreationOptionRule(classes, rules.secondaryClass),
    professions: applyCharacterCreationOptionRule(professions, rules.profession),
    perks: applyCharacterCreationOptionRule(perks, rules.perks),
    starterTrees: applyCharacterCreationOptionRule(starterTrees, rules.starterTrees),
    attributeBias: normalizeAttributeBias(profile?.characterCreation?.attributeBias),
  };
}
