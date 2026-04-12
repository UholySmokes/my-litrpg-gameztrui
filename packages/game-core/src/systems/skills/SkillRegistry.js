import { applyTalentModifiers } from "./TalentDefinitions.js";
import {
  resolveBypasses,
  applyCostOverride,
  applyCooldownOverride,
} from "./TalentManager.js";
import {
  attachLatticeMetadata,
  adaptToLatticeSkill,
  summarizeLatticeLoadout,
  computeLatticeBuildPressure,
  validateLatticeProgressEvent,
  dedupeLatticeProgressEvents,
  computeLatticeMasteryGain,
  validateExternalAuthorityContract,
  normalizeNativeMiracle,
  advanceNativeMiracleState,
} from "./LivingLatticeSystem.js";
import { getTalentMigrationLane } from "./TalentMigrationAudit.js";
import { validateEngineProfileShape } from "../abilities/engineProfile.js";
import { getRaceAbilitiesFor, getRaceAbilityById } from "../race/RaceAbilityRegistry.js";
import {
  getLivingLatticeCatalogSkills,
} from "./LivingLatticeCatalog.js";
import {
  getLocationById,
  getZoneById,
  resolveLocationId,
} from "../../world/WorldDataRegistry.js";

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

function normalizeId(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeLower(value, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim().toLowerCase()
    : fallback;
}

function copyStringArray(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string") : [];
}

function copyUnlockConditions(conditions) {
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) {
    return null;
  }
  return {
    ...conditions,
    skillPrerequisites: copyStringArray(conditions.skillPrerequisites),
  };
}

function normalizeCatalogSkill(skill) {
  if (!skill || typeof skill !== "object") return null;
  const normalized = {
    ...cloneValue(skill),
    ownerType: skill.ownerType || "system",
    ownerId: skill.ownerId || skill.class || "unbound",
    class:
      skill.ownerType === "race" ? null : skill.class || skill.ownerId || "unbound",
    source:
      skill.ownerType === "universal"
        ? "general"
        : skill.ownerType || "general",
  };
  const validation = validateEngineProfileShape(normalized.engineProfile);
  if (!validation.valid) {
    throw new Error(
      `Invalid engineProfile for skill ${normalized.id || "(unknown)"}: ${validation.errors.join(", ")}`,
    );
  }
  return attachLatticeMetadata(normalized, {
    family: normalized.family || normalized.latticeFamily,
    sourceType:
      normalized.ownerType === "race"
        ? "race"
        : normalized.ownerType === "universal"
          ? "universal"
          : normalized.ownerType,
    runtimeRole: normalized.runtimeRole,
  });
}

const ALL_SKILLS = getLivingLatticeCatalogSkills()
  .map((skill) => normalizeCatalogSkill(skill))
  .filter(Boolean);
const SKILL_INDEX = new Map(ALL_SKILLS.map((skill) => [skill.id, skill]));

function sortSkills(skills = []) {
  return [...skills].sort((left, right) => {
    const leftUnlock = Number(left?.unlockLevel || 0);
    const rightUnlock = Number(right?.unlockLevel || 0);
    if (leftUnlock !== rightUnlock) return leftUnlock - rightUnlock;
    const leftBand = left?.selectionBand === "starter" ? 0 : 1;
    const rightBand = right?.selectionBand === "starter" ? 0 : 1;
    if (leftBand !== rightBand) return leftBand - rightBand;
    const leftName = String(left?.name || left?.id || "");
    const rightName = String(right?.name || right?.id || "");
    if (leftName !== rightName) return leftName.localeCompare(rightName);
    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });
}

function buildSkillSummary(skill) {
  if (!skill || typeof skill !== "object" || typeof skill.id !== "string") {
    return null;
  }
  const lattice = skill.lattice && typeof skill.lattice === "object" ? skill.lattice : {};
  const template = skill.template && typeof skill.template === "object" ? skill.template : {};
  const slotType = skill.slotType || lattice.slotType || skill.type || "active";
  const runtimeRole = skill.runtimeRole || lattice.runtimeRole || "standard";
  const affinityTags = Array.isArray(skill.affinityTags)
    ? skill.affinityTags
    : Array.isArray(lattice.affinityTags)
      ? lattice.affinityTags
      : [];
  return {
    id: skill.id,
    name: skill.name || skill.id,
    description: skill.description || "No description available.",
    type: skill.type || slotType,
    slotType,
    source: skill.source || skill.ownerType || "general",
    ownerType: skill.ownerType || "system",
    ownerId: skill.ownerId || skill.class || "unbound",
    class: skill.class || null,
    race: skill.race || null,
    family: skill.family || skill.latticeFamily || null,
    combatRole: skill.combatRole || null,
    passiveHookType: skill.passiveHookType || null,
    runtimeRole,
    selectionBand: skill.selectionBand || null,
    unlockLevel: Number.isFinite(skill.unlockLevel) ? skill.unlockLevel : 1,
    requiredClass: skill.requiredClass || null,
    requiredClasses: copyStringArray(skill.requiredClasses),
    allowedClasses: copyStringArray(skill.allowedClasses),
    requiredRace: skill.requiredRace || null,
    requiredRaces: copyStringArray(skill.requiredRaces),
    allowedRaces: copyStringArray(skill.allowedRaces),
    tags: copyStringArray(skill.tags),
    affinityTags: copyStringArray(affinityTags),
    unlockConditions: copyUnlockConditions(skill.unlockConditions),
    template: {
      category: template.category || null,
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || null,
    },
    engineProfile: cloneValue(skill.engineProfile),
    lattice: {
      slotType,
      runtimeRole,
      family: skill.family || skill.latticeFamily || null,
      sourceType: skill.latticeSourceType || lattice.sourceType || null,
      affinityTags: copyStringArray(affinityTags),
    },
  };
}

const SKILL_SUMMARIES = ALL_SKILLS.map((skill) => buildSkillSummary(skill)).filter(Boolean);
const SKILL_SUMMARY_INDEX = new Map(SKILL_SUMMARIES.map((summary) => [summary.id, summary]));

function resolveSkillReference(skillRef) {
  if (!skillRef) return null;
  if (typeof skillRef === "string") {
    return getSkillById(skillRef) || getRaceAbilityById(skillRef);
  }
  if (typeof skillRef === "object" && skillRef.id) {
    return skillRef.lattice ? skillRef : attachLatticeMetadata(skillRef);
  }
  return null;
}

function resolveSkillReferenceList(skillRefs = []) {
  return (Array.isArray(skillRefs) ? skillRefs : [])
    .map((skillRef) => resolveSkillReference(skillRef))
    .filter(Boolean);
}

function getActiveTalentMigrationLanes(activeTalentIds = []) {
  return (Array.isArray(activeTalentIds) ? activeTalentIds : [])
    .filter((talentId) => typeof talentId === "string" && talentId.trim().length > 0)
    .map((talentId) => ({
      id: talentId,
      lane: getTalentMigrationLane(talentId),
    }));
}

function checkSkillUnlockConditions(skill, gameState) {
  if (!skill?.unlockConditions) return true;
  const conditions = skill.unlockConditions;
  if (conditions.profession) {
    const playerProf = gameState?.player?.profession;
    const playerProfs = gameState?.player?.professions || [];
    const activeProf =
      playerProf?.id === conditions.profession
        ? playerProf
        : Array.isArray(playerProfs)
          ? playerProfs.find((entry) => entry?.id === conditions.profession)
          : gameState?.player?.professions?.[conditions.profession];
    if (!activeProf) return false;
    if (conditions.tier && Number(activeProf.tier || 1) < Number(conditions.tier)) return false;
  }
  if (conditions.level && Number(gameState?.player?.level || 0) < Number(conditions.level)) {
    return false;
  }
  if (conditions.location) {
    const currentRaw =
      gameState?.world?.location?.current ?? gameState?.world?.location ?? null;
    const currentId =
      resolveLocationId(currentRaw) ||
      (typeof currentRaw === "string" ? currentRaw.trim() : null);
    const conditionText =
      typeof conditions.location === "string" ? conditions.location.trim() : "";
    const requiredZone = getZoneById(conditionText.toLowerCase());
    if (requiredZone) {
      const currentLocation = currentId ? getLocationById(currentId) : null;
      if (!currentLocation || currentLocation.zoneId !== requiredZone.id) return false;
    } else {
      const requiredLocationId = resolveLocationId(conditionText);
      if (!requiredLocationId || currentId !== requiredLocationId) return false;
    }
  }
  if (conditions.quest) {
    const questCompleted = Array.isArray(gameState?.quests?.completed)
      ? gameState.quests.completed.some((entry) => entry?.id === conditions.quest)
      : false;
    if (!questCompleted) return false;
  }
  if (conditions.item) {
    const hasItem = Array.isArray(gameState?.player?.inventory)
      ? gameState.player.inventory.some((item) => item?.id === conditions.item)
      : false;
    if (!hasItem) return false;
  }
  if (
    Array.isArray(conditions.skillPrerequisites) &&
    conditions.skillPrerequisites.length > 0
  ) {
    const learnedSkillIds = Array.isArray(gameState?.player?.abilities)
      ? gameState.player.abilities.map((entry) => entry?.id)
      : [];
    const hasAll = conditions.skillPrerequisites.every((prereq) => learnedSkillIds.includes(prereq));
    if (!hasAll) return false;
  }
  return true;
}

function getSkillResourceAmount(skill) {
  if (Number.isFinite(skill?.engineProfile?.costProfile?.manaCost)) {
    return Number(skill.engineProfile.costProfile.manaCost);
  }
  if (Number.isFinite(skill?.manaCost)) return Number(skill.manaCost);
  if (Number.isFinite(skill?.cost)) return Number(skill.cost);
  return 0;
}

function getSkillCooldownAmount(skill) {
  if (Number.isFinite(skill?.engineProfile?.costProfile?.cooldown)) {
    return Number(skill.engineProfile.costProfile.cooldown);
  }
  if (Number.isFinite(skill?.cooldown)) return Number(skill.cooldown);
  return 0;
}

function getResourceCurrent(gameState, resourceModel) {
  const normalized = normalizeLower(resourceModel, "none");
  if (normalized === "none") return Number.POSITIVE_INFINITY;
  if (normalized === "mana") return Number(gameState?.player?.mana?.current || 0);
  const resourceState =
    gameState?.player?.resources?.[normalized] ??
    gameState?.player?.[normalized];
  if (resourceState && typeof resourceState === "object") {
    return Number(resourceState.current || resourceState.value || 0);
  }
  if (Number.isFinite(resourceState)) return Number(resourceState);
  return 0;
}

export function getSkillsByClass(classId) {
  const normalizedClassId =
    typeof classId === "string"
      ? classId
      : classId && typeof classId === "object"
        ? classId.id
        : null;
  if (!normalizedClassId) {
    return { active: [], passive: [] };
  }
  const classSkills = ALL_SKILLS.filter(
    (skill) => skill.ownerType === "class" && skill.ownerId === normalizedClassId,
  );
  return {
    active: sortSkills(classSkills.filter((skill) => skill.slotType === "active")).map(cloneValue),
    passive: sortSkills(classSkills.filter((skill) => skill.slotType === "passive")).map(cloneValue),
  };
}

export function getAllSkills() {
  return cloneList(ALL_SKILLS);
}

export function getAllSkillSummaries() {
  return cloneList(SKILL_SUMMARIES);
}

export function getSkillSummaryById(skillId) {
  const normalized = normalizeId(skillId);
  return normalized ? cloneValue(SKILL_SUMMARY_INDEX.get(normalized) || null) : null;
}

export function getSkillById(skillId) {
  const normalized = normalizeId(skillId);
  return normalized ? cloneValue(SKILL_INDEX.get(normalized) || null) : null;
}

export function getLatticeSkillById(skillId) {
  const skill = getSkillById(skillId) || getRaceAbilityById(skillId);
  if (!skill) return null;
  return skill.lattice && typeof skill.lattice === "object" ? skill.lattice : adaptToLatticeSkill(skill);
}

export function getAllLatticeSkills(options = {}) {
  const includeRaceAbilities = options.includeRaceAbilities !== false;
  return ALL_SKILLS
    .filter((skill) => includeRaceAbilities || skill.ownerType !== "race")
    .map((skill) => cloneValue(skill.lattice || adaptToLatticeSkill(skill)))
    .filter(Boolean);
}

export function getLatticeSkillsByClass(classId) {
  const pool = getSkillsByClass(classId);
  return {
    active: pool.active.map((skill) => skill.lattice || adaptToLatticeSkill(skill)).filter(Boolean),
    passive: pool.passive.map((skill) => skill.lattice || adaptToLatticeSkill(skill)).filter(Boolean),
  };
}

export function getLatticeSkillsForRace(raceId) {
  return getRaceAbilitiesFor(raceId)
    .map((ability) => ability.lattice || adaptToLatticeSkill(ability))
    .filter(Boolean);
}

export function getLatticeLoadoutSummary({
  activeSkillIds = [],
  passiveSkillIds = [],
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
} = {}) {
  const resolvedActiveSkills =
    Array.isArray(activeSkills) && activeSkills.length > 0
      ? resolveSkillReferenceList(activeSkills)
      : resolveSkillReferenceList(activeSkillIds);
  const resolvedPassiveSkills =
    Array.isArray(passiveSkills) && passiveSkills.length > 0
      ? resolveSkillReferenceList(passiveSkills)
      : resolveSkillReferenceList(passiveSkillIds);
  return summarizeLatticeLoadout({
    activeSkills: resolvedActiveSkills,
    passiveSkills: resolvedPassiveSkills,
    professionId,
  });
}

export function getLatticeBuildPressureForLoadout({
  activeSkillIds = [],
  passiveSkillIds = [],
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
  nativeMiracleUsedRecently = false,
} = {}) {
  const resolvedActiveSkills =
    Array.isArray(activeSkills) && activeSkills.length > 0
      ? resolveSkillReferenceList(activeSkills)
      : resolveSkillReferenceList(activeSkillIds);
  const resolvedPassiveSkills =
    Array.isArray(passiveSkills) && passiveSkills.length > 0
      ? resolveSkillReferenceList(passiveSkills)
      : resolveSkillReferenceList(passiveSkillIds);
  return {
    loadout: getLatticeLoadoutSummary({
      activeSkills: resolvedActiveSkills,
      passiveSkills: resolvedPassiveSkills,
      professionId,
    }),
    buildPressure: computeLatticeBuildPressure(
      [...resolvedActiveSkills, ...resolvedPassiveSkills],
      { nativeMiracleUsedRecently },
    ),
  };
}

export function validateSkillProgressEvent(event = {}, options = {}) {
  const normalizedEvent =
    event !== null && typeof event === "object" && !Array.isArray(event) ? event : {};
  const skill = resolveSkillReference(normalizedEvent.skillId);
  if (!skill) {
    return {
      valid: false,
      errors: [`Unknown skillId: ${JSON.stringify(normalizedEvent.skillId)}`],
      event: normalizedEvent,
      skill: null,
      masteryGain: 0,
    };
  }
  const validation = validateLatticeProgressEvent(normalizedEvent, options);
  if (!validation.valid) {
    return {
      ...validation,
      skill: skill.lattice || adaptToLatticeSkill(skill),
      masteryGain: 0,
    };
  }
  return {
    ...validation,
    skill: skill.lattice || adaptToLatticeSkill(skill),
    masteryGain: computeLatticeMasteryGain(validation.event, {
      familyModifier: options.familyModifier ?? 1,
      repetitionSaturation: options.repetitionSaturation ?? 0,
    }),
  };
}

export function processSkillProgressEvents(events = [], options = {}) {
  const normalizedEvents = Array.isArray(events) ? events : [];
  const deduped = dedupeLatticeProgressEvents(normalizedEvents, options);
  return {
    accepted: deduped.accepted.map((event) =>
      validateSkillProgressEvent(event, {
        ...options,
        seenFingerprints: new Set(),
      })),
    rejected: deduped.rejected,
    seenFingerprints: deduped.seenFingerprints,
  };
}

export function validateSkillContractMiracle(contract = {}, hostContext = {}) {
  return validateExternalAuthorityContract(contract, hostContext);
}

export function getNativeMiracleState(miracle = {}) {
  return normalizeNativeMiracle(miracle);
}

export function advanceSkillNativeMiracle(miracle = {}, options = {}) {
  return advanceNativeMiracleState(miracle, options);
}

export function getAvailableUniversalSkills(gameState) {
  const learnedSkillIds = Array.isArray(gameState?.player?.abilities)
    ? gameState.player.abilities.map((entry) => entry?.id)
    : [];
  return ALL_SKILLS
    .filter((skill) => skill.ownerType === "universal" && skill.ownerId === "universal")
    .filter((skill) => !learnedSkillIds.includes(skill.id))
    .filter((skill) => checkSkillUnlockConditions(skill, gameState))
    .map((skill) => cloneValue(skill));
}

export function getLockedUniversalSkills(gameState) {
  const learnedSkillIds = Array.isArray(gameState?.player?.abilities)
    ? gameState.player.abilities.map((entry) => entry?.id)
    : [];
  return ALL_SKILLS
    .filter((skill) => skill.ownerType === "universal" && skill.ownerId === "universal")
    .filter((skill) => !learnedSkillIds.includes(skill.id))
    .filter((skill) => !checkSkillUnlockConditions(skill, gameState))
    .map((skill) => cloneValue(skill));
}

export function getModifiedSkill(skillId, activeTalentIds = [], playerLevel = 1) {
  const baseSkill = getSkillById(skillId);
  if (!baseSkill) return null;
  const modifiedSkill = applyTalentModifiers(baseSkill, activeTalentIds, playerLevel);
  const bypasses = resolveBypasses(activeTalentIds);
  const baseCost = getSkillResourceAmount(modifiedSkill);
  const baseCooldown = getSkillCooldownAmount(modifiedSkill);
  modifiedSkill.manaCost = applyCostOverride(baseCost, bypasses);
  modifiedSkill.cost = modifiedSkill.manaCost;
  modifiedSkill.cooldown = applyCooldownOverride(baseCooldown, bypasses);
  modifiedSkill.bypasses = { ...(modifiedSkill.bypasses || {}), ...bypasses };
  modifiedSkill.activeTalentMigrationLanes = getActiveTalentMigrationLanes(activeTalentIds);
  return attachLatticeMetadata(modifiedSkill, {
    family: baseSkill.family || baseSkill.latticeFamily,
    sourceType: baseSkill.ownerType === "race" ? "race" : baseSkill.ownerType,
    rank: baseSkill.lattice?.rank,
    mastery: baseSkill.lattice?.mastery,
    stability: baseSkill.lattice?.stability,
  });
}

export function getEffectiveSkillCost(skill, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);
  return applyCostOverride(getSkillResourceAmount(skill), bypasses);
}

export function getEffectiveSkillCooldown(skill, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);
  return applyCooldownOverride(getSkillCooldownAmount(skill), bypasses);
}

export function canUseSkill(skill, gameState, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);
  const effectiveCost = applyCostOverride(getSkillResourceAmount(skill), bypasses);
  const effectiveCooldown = applyCooldownOverride(getSkillCooldownAmount(skill), bypasses);
  const resourceModel =
    skill?.engineProfile?.resourceModel || skill?.costType || "none";
  const currentResource = getResourceCurrent(gameState, resourceModel);
  if (currentResource < effectiveCost) {
    return {
      canUse: false,
      reason: `Not enough ${resourceModel} (need ${effectiveCost}, have ${currentResource})`,
    };
  }
  if (Number(gameState?.combat?.skillCooldowns?.[skill.id] || 0) > 0 && !bypasses.bypassCooldown) {
    return {
      canUse: false,
      reason: `Skill on cooldown (${gameState.combat.skillCooldowns[skill.id]}s remaining)`,
    };
  }
  return {
    canUse: true,
    reason: effectiveCooldown > 0 ? `Ready (${resourceModel})` : "Ready",
  };
}

export function getSkillDisplayInfo(skill, activeTalentIds = [], playerLevel = 1) {
  const modifiedSkill = getModifiedSkill(skill.id, activeTalentIds, playerLevel);
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    type: skill.type,
    class: skill.class,
    ownerType: skill.ownerType || (skill.class === "universal" ? "universal" : "class"),
    ownerId: skill.ownerId || skill.class,
    level: skill.level,
    selectionBand: skill.selectionBand || null,
    combatRole: skill.combatRole || null,
    passiveHookType: skill.passiveHookType || null,
    base: {
      manaCost: getSkillResourceAmount(skill),
      cooldown: getSkillCooldownAmount(skill),
    },
    modified: {
      manaCost: modifiedSkill ? getSkillResourceAmount(modifiedSkill) : getSkillResourceAmount(skill),
      cooldown: modifiedSkill ? getSkillCooldownAmount(modifiedSkill) : getSkillCooldownAmount(skill),
      damageMultiplier: modifiedSkill?.damageMultiplier ?? 1,
      durationMultiplier: modifiedSkill?.durationMultiplier ?? 1,
      aoeMultiplier: modifiedSkill?.aoeMultiplier ?? 1,
    },
    bypasses: modifiedSkill?.bypasses || {},
    activeTalentMigrationLanes:
      modifiedSkill?.activeTalentMigrationLanes || getActiveTalentMigrationLanes(activeTalentIds),
    effects: skill.effects || [],
    lattice: skill.lattice || null,
    latticeFamily: skill.family || skill.latticeFamily || null,
    runtimeRole: skill.runtimeRole || "standard",
    originTruths: Array.isArray(skill.originTruths) ? skill.originTruths : [],
    grandmaVoidBoundaryId: skill.grandmaVoidBoundaryId || null,
  };
}
