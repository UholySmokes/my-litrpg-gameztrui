const ACTIVE_SLOT_TYPES = new Set(["active", "buff", "debuff"]);
const KNOWN_SLOT_TYPES = new Set(["active", "passive", "buff", "debuff"]);
const KNOWN_RUNTIME_ROLES = new Set([
  "standard",
  "reaction",
  "stance",
  "channel",
  "ritual",
]);
const KNOWN_COLLISION_POLICIES = new Set(["reject", "replace", "queue"]);
const KNOWN_CONTEXT_GRADES = new Set(["practice", "field", "elite", "survival"]);
const KNOWN_NOVELTY_BUCKETS = new Set(["new_scene", "new_encounter_type", "repeat"]);
const KNOWN_OUTCOMES = new Set(["success", "partial", "failure_survived"]);
const KNOWN_COST_OWNERS = new Set(["directive-engine", "shared", "external"]);
const KNOWN_AFTERSHOCK_OWNERS = new Set(["directive-engine", "shared", "external"]);
const MAGIC_TAGS = new Set([
  "magic",
  "spell",
  "arcane",
  "mana",
  "rune",
  "ritual",
  "void",
  "voidspark",
  "temporal",
]);
const CULTIVATION_TAGS = new Set([
  "cultivation",
  "breathing",
  "manual",
  "core",
  "meridian",
  "tribulation",
  "refinement",
  "qi",
  "chi",
]);
const PROFESSION_TAGS = new Set([
  "craft",
  "crafting",
  "harvest",
  "harvesting",
  "repair",
  "smithing",
  "alchemy",
  "inscription",
  "engineering",
  "cooking",
  "production",
]);
const MARTIAL_TAGS = new Set([
  "martial",
  "weapon",
  "blade",
  "counter",
  "stance",
  "parry",
  "riposte",
  "strike",
  "melee",
  "ranged",
]);
const CHANNEL_TAGS = new Set(["channel", "sustain"]);
const REACTION_TAGS = new Set(["reaction", "counter", "riposte", "parry"]);
const RITUAL_TAGS = new Set(["ritual", "ceremony"]);
const NON_MAGIC_ELEMENTS = new Set(["physical", "none"]);
const EFFECT_MAGIC_IDS = new Set([
  "burn",
  "frostbite",
  "freeze",
  "shock",
  "wet",
  "radiant_mark",
  "curse",
]);
const EFFECT_PROFESSION_IDS = new Set(["repair", "harvest", "refine"]);
const GENERIC_TAGS = new Set([
  "active",
  "passive",
  "combat",
  "utility",
  "self",
  "enemy",
  "ally",
  "skill",
  "class",
  "race",
  "profession",
  "universal",
  "system",
]);

export const LATTICE_FAMILIES = Object.freeze([
  "martial",
  "bloodline",
  "universal",
  "magic",
  "cultivation",
  "profession",
]);
export const LATTICE_RUNTIME_ROLES = Object.freeze([
  "standard",
  "reaction",
  "stance",
  "channel",
  "ritual",
]);
export const LATTICE_SKILL_RANKS = Object.freeze([
  "seed",
  "thread",
  "knot",
  "weave",
  "mandate",
]);
export const TRUSTED_LATTICE_PROGRESS_EMITTERS = Object.freeze([
  "combat_resolution",
  "profession_resolution",
  "study_resolution",
  "cultivation_resolution",
  "quest_resolution",
  "system_sync",
]);
export const GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE =
  "cannot_target_or_influence_grandma_void = true";
export const GRANDMA_VOID_PROHIBITED_ACTIONS = Object.freeze([
  "target",
  "compel",
  "manipulate",
  "siphon",
  "bind",
  "trick",
  "rewrite",
  "copy",
  "dominate",
]);
export const GRANDMA_VOID_ORIGIN = Object.freeze({
  entityId: "grandma_void",
  title: "The Oldest Thing",
  loreDocument: "docs/lore/VOIDVERSE_ORIGIN.md",
  firstRule: "magic_is_permission",
  voidsparkTruth: "voidspark_filters_raw_void_through_space_and_time",
  spaceTruth: "space_is_the_first_dilution",
  timeTruth: "time_makes_learning_survivable",
  mandatoryRejectionClause: GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE,
  prohibitedActions: GRANDMA_VOID_PROHIBITED_ACTIONS,
});
export const PERSISTENT_LATTICE_MODIFIER_BLACKLIST = Object.freeze([
  "mana_cost_zero",
  "cooldown_removal",
  "damage_immunity",
  "death_immunity",
  "critical_guarantee",
  "hundred_percent_drop",
  "override_drop_quality",
  "status_immunity",
  "remove_stat_cap",
  "control_rng",
]);

const TRUSTED_PROGRESS_EMITTER_SET = new Set(TRUSTED_LATTICE_PROGRESS_EMITTERS);
const PERSISTENT_BLACKLIST_SET = new Set(PERSISTENT_LATTICE_MODIFIER_BLACKLIST);

const BASE_PRACTICE = 6;
const CONTEXT_FIT = Object.freeze({
  practice: 0.5,
  field: 1.0,
  elite: 1.25,
  survival: 1.5,
});
const DANGER_WEIGHT = Object.freeze({
  practice: 0.8,
  field: 1.0,
  elite: 1.35,
  survival: 1.6,
});
const NOVELTY_WEIGHT = Object.freeze({
  new_scene: 1.15,
  new_encounter_type: 1.0,
  repeat: 0.7,
});

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function clampNumber(value, { min = 0, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeString(value))
        .filter(Boolean),
    ),
  );
}

function normalizeTemplate(skill) {
  if (!skill || typeof skill !== "object") return {};
  const template = skill.template;
  if (!template || typeof template !== "object" || Array.isArray(template)) return {};
  return template;
}

// eslint-disable-next-line no-unused-vars
function readTemplateMeta(skill) {
  const template = normalizeTemplate(skill);
  const meta = template.meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta;
}

function normalizeEffects(skill) {
  const effects = Array.isArray(skill?.effects) ? skill.effects : [];
  return effects.filter((effect) => effect && typeof effect === "object" && !Array.isArray(effect));
}

function normalizeTags(skill) {
  return uniqueStrings(skill?.tags || []);
}

function normalizeElements(skill) {
  const template = normalizeTemplate(skill);
  const templateElements = Array.isArray(template.elements) ? template.elements : [];
  const directElement = skill?.element;
  const damageElement = skill?.damage?.element;
  return uniqueStrings([...templateElements, directElement, damageElement]);
}

function extractEffectIds(skill) {
  return normalizeEffects(skill)
    .map((effect) => normalizeLower(effect.id))
    .filter(Boolean);
}

function hasAnyTag(skill, tagSet) {
  return normalizeTags(skill).some((tag) => tagSet.has(normalizeLower(tag)));
}

function hasAnyElement(skill, predicate) {
  return normalizeElements(skill).some((element) => predicate(normalizeLower(element)));
}

function includesToken(value, tokens) {
  const text = normalizeLower(value);
  if (!text) return false;
  return tokens.some((token) => text.includes(token));
}

function hasMagicSignature(skill) {
  const template = normalizeTemplate(skill);
  if (skill?.isMagic || skill?.damage?.isMagic) return true;
  if (normalizeLower(template.function) === "spell") return true;
  if (hasAnyTag(skill, MAGIC_TAGS)) return true;
  if (
    hasAnyElement(skill, (element) => element && !NON_MAGIC_ELEMENTS.has(element))
  ) {
    return true;
  }
  return extractEffectIds(skill).some((effectId) => EFFECT_MAGIC_IDS.has(effectId));
}

function hasCultivationSignature(skill) {
  const template = normalizeTemplate(skill);
  if (hasAnyTag(skill, CULTIVATION_TAGS)) return true;
  if (includesToken(template.category, ["cultivation"])) return true;
  if (includesToken(template.source, ["cultivation"])) return true;
  return includesToken(skill?.description, ["meridian", "tribulation", "core refinement", "breathing manual"]);
}

function hasProfessionSignature(skill) {
  const template = normalizeTemplate(skill);
  const templateFunction = normalizeLower(template.function);
  if (skill?.ownerType === "profession") return true;
  if (templateFunction === "crafting") return true;
  if (hasAnyTag(skill, PROFESSION_TAGS)) return true;
  if (includesToken(template.category, ["profession", "crafting"])) return true;
  if (includesToken(skill?.description, ["craft", "repair", "harvest", "forge", "brew", "cook"])) {
    return true;
  }
  return extractEffectIds(skill).some((effectId) => EFFECT_PROFESSION_IDS.has(effectId));
}

function hasRaceSignature(skill, options = {}) {
  if (normalizeLower(options.sourceType) === "race") return true;
  if (skill?.ownerType === "race") return true;
  const template = normalizeTemplate(skill);
  return includesToken(template.category, ["race ability", "bloodline"]);
}

function hasMartialSignature(skill) {
  const template = normalizeTemplate(skill);
  if (skill?.setStance) return true;
  if (hasAnyTag(skill, MARTIAL_TAGS)) return true;
  if (normalizeLower(skill?.damage?.element) === "physical") return true;
  if (normalizeLower(template.function) === "attack" && !hasMagicSignature(skill)) return true;
  if (skill?.ownerType === "class" && !hasMagicSignature(skill)) return true;
  return false;
}

function deriveSlotType(skill) {
  const type = normalizeLower(skill?.type);
  if (KNOWN_SLOT_TYPES.has(type)) {
    return ACTIVE_SLOT_TYPES.has(type) ? "active" : "passive";
  }
  if (skill?.damage || skill?.heal || skill?.resourceGain || skill?.cost || skill?.manaCost) {
    return "active";
  }
  const template = normalizeTemplate(skill);
  return normalizeLower(template.function) === "passive" ? "passive" : "active";
}

export function deriveLatticeRuntimeRole(skill, options = {}) {
  const explicit = normalizeLower(options.runtimeRole || skill?.runtimeRole);
  if (KNOWN_RUNTIME_ROLES.has(explicit)) return explicit;
  const template = normalizeTemplate(skill);
  const templateFunction = normalizeLower(template.function);
  if (skill?.setStance || hasAnyTag(skill, new Set(["stance"]))) return "stance";
  if (templateFunction === "ritual" || hasAnyTag(skill, RITUAL_TAGS)) return "ritual";
  if (templateFunction === "channel" || hasAnyTag(skill, CHANNEL_TAGS)) return "channel";
  if (
    templateFunction === "reaction" ||
    skill?.reactionTrigger ||
    hasAnyTag(skill, REACTION_TAGS)
  ) {
    return "reaction";
  }
  return "standard";
}

export function deriveLatticeFamily(skill, options = {}) {
  const explicit = normalizeLower(options.family || skill?.latticeFamily);
  if (LATTICE_FAMILIES.includes(explicit)) return explicit;
  if (hasRaceSignature(skill, options)) return "bloodline";
  if (hasProfessionSignature(skill)) return "profession";
  if (hasCultivationSignature(skill)) return "cultivation";
  if (hasMagicSignature(skill)) return "magic";
  if (hasMartialSignature(skill)) return "martial";
  return "universal";
}

export function deriveLatticeSourceType(skill, options = {}) {
  const explicit = normalizeLower(options.sourceType || skill?.latticeSourceType);
  if (explicit) return explicit;
  const template = normalizeTemplate(skill);
  if (hasRaceSignature(skill, options)) return "race";
  if (skill?.ownerType === "profession") return "profession";
  if (skill?.ownerType === "class") return "class";
  if (skill?.ownerType === "universal") return "universal";
  if (
    normalizeLower(skill?.class) === "study" ||
    includesToken(template.source, ["spellstudy"]) ||
    hasAnyTag(skill, new Set(["study"]))
  ) {
    return "study";
  }
  if (hasCultivationSignature(skill)) return "cultivation";
  return "story";
}

export function deriveLatticeResourceType(skill) {
  const explicit = normalizeLower(skill?.resourceType);
  if (explicit) return explicit;
  const costType = normalizeLower(skill?.costType);
  if (costType) return costType;
  if (Number.isFinite(skill?.manaCost) && skill.manaCost > 0) return "mana";
  if (Number.isFinite(skill?.cost) && skill.cost > 0) return "mana";
  return "none";
}

function deriveAffinityTags(skill, family) {
  const tags = normalizeTags(skill).map((tag) => normalizeLower(tag));
  const elements = normalizeElements(skill).map((element) => normalizeLower(element));
  const effects = extractEffectIds(skill);
  return uniqueStrings([family, ...tags, ...elements, ...effects]).filter(
    (tag) => !GENERIC_TAGS.has(normalizeLower(tag)),
  );
}

function deriveOriginTruths(skill, family) {
  const tags = new Set(deriveAffinityTags(skill, family).map((tag) => normalizeLower(tag)));
  const truths = [];
  if (family === "magic") truths.push(GRANDMA_VOID_ORIGIN.firstRule);
  if (tags.has("voidspark")) truths.push(GRANDMA_VOID_ORIGIN.voidsparkTruth);
  if (tags.has("void") || tags.has("space")) truths.push(GRANDMA_VOID_ORIGIN.spaceTruth);
  if (tags.has("time") || tags.has("temporal")) truths.push(GRANDMA_VOID_ORIGIN.timeTruth);
  return uniqueStrings(truths);
}

export function deriveLatticeGrowthTriggers(skill, options = {}) {
  const family = deriveLatticeFamily(skill, options);
  const runtimeRole = deriveLatticeRuntimeRole(skill, options);
  const triggers = [];

  if (family === "martial") {
    triggers.push("live_use", "combat_resolution");
    if (runtimeRole === "reaction") triggers.push("timing_success");
    if (runtimeRole === "stance") triggers.push("stance_maintenance");
  } else if (family === "bloodline") {
    triggers.push("lineage_stress", "awakening_survival");
  } else if (family === "magic") {
    triggers.push("permission_granted", "cast_resolution");
    if (normalizeLower(skill?.class) === "study" || hasAnyTag(skill, new Set(["study"]))) {
      triggers.push("study_resolution");
    }
    if (deriveOriginTruths(skill, family).includes(GRANDMA_VOID_ORIGIN.voidsparkTruth)) {
      triggers.push("voidspark_attuned");
    }
  } else if (family === "cultivation") {
    triggers.push("meditation_cycle", "bottleneck_check");
  } else if (family === "profession") {
    triggers.push("craft_resolution", "contract_completion");
  } else {
    triggers.push("travel_use", "utility_resolution");
  }

  if (runtimeRole === "ritual") triggers.push("ritual_completion");
  if (runtimeRole === "channel") triggers.push("channel_maintenance");

  return uniqueStrings(triggers);
}

export function adaptToLatticeSkill(skill, options = {}) {
  if (!skill || typeof skill !== "object") return null;

  const family = deriveLatticeFamily(skill, options);
  const sourceType = deriveLatticeSourceType(skill, options);
  const slotType = deriveSlotType(skill);
  const runtimeRole = deriveLatticeRuntimeRole(skill, options);
  const affinityTags = deriveAffinityTags(skill, family);
  const growthTriggers = deriveLatticeGrowthTriggers(skill, {
    ...options,
    family,
    runtimeRole,
  });
  const milestoneGate = Array.isArray(skill?.unlockConditions?.skillPrerequisites) &&
    skill.unlockConditions.skillPrerequisites.length > 0
    ? skill.unlockConditions.skillPrerequisites.join("|")
    : null;

  return {
    id: normalizeString(skill.id),
    name: normalizeString(skill.name),
    family,
    sourceType,
    slotType,
    runtimeRole,
    rank: LATTICE_SKILL_RANKS.includes(normalizeLower(options.rank || skill.rank))
      ? normalizeLower(options.rank || skill.rank)
      : "seed",
    mastery: clampNumber(options.mastery ?? skill.mastery, {
      min: 0,
      max: 999,
      fallback: 0,
    }),
    stability: clampNumber(options.stability ?? skill.stability, {
      min: 0,
      max: 1.2,
      fallback: 1,
    }),
    affinityTags,
    resourceType: deriveLatticeResourceType(skill),
    growthTriggers,
    milestoneGate,
    saturationClass: normalizeString(options.saturationClass || family, null),
    nativeMiracleLink: normalizeString(options.nativeMiracleLink || skill?.nativeMiracleLink, null),
  };
}

export function attachLatticeMetadata(skill, options = {}) {
  if (!skill || typeof skill !== "object") return skill;
  const lattice = adaptToLatticeSkill(skill, options);
  if (!lattice) return skill;
  const originTruths = deriveOriginTruths(skill, lattice.family);

  return {
    ...skill,
    lattice,
    latticeFamily: lattice.family,
    latticeSourceType: lattice.sourceType,
    runtimeRole: lattice.runtimeRole,
    originTruths,
    grandmaVoidBoundaryId: GRANDMA_VOID_ORIGIN.entityId,
  };
}

function defaultProgressFingerprint(event, chapterBucket) {
  return [
    normalizeString(event.skillId),
    normalizeString(event.encounterTemplateId),
    normalizeString(chapterBucket, "global"),
    normalizeString(event.emitterId),
  ].join("::");
}

export function isTrustedLatticeProgressEmitter(emitterId) {
  return TRUSTED_PROGRESS_EMITTER_SET.has(normalizeLower(emitterId));
}

export function normalizeLatticeProgressEvent(event = {}, options = {}) {
  const chapterBucket = normalizeString(options.chapterBucket || event.chapterBucket, "global");
  const normalized = {
    eventId: normalizeString(event.eventId),
    skillId: normalizeString(event.skillId),
    emitterId: normalizeLower(event.emitterId),
    encounterTemplateId: normalizeString(event.encounterTemplateId),
    chapterBucket,
    progressFingerprint: normalizeString(event.progressFingerprint),
    contextGrade: normalizeLower(event.contextGrade),
    noveltyBucket: normalizeLower(event.noveltyBucket),
    challengeTier: clampNumber(event.challengeTier, { min: 0, max: 3, fallback: 0 }),
    threatRating: clampNumber(event.threatRating, { min: 0, fallback: 0 }),
    threatRatio: clampNumber(event.threatRatio, { min: 0, fallback: 0 }),
    outcome: normalizeLower(event.outcome),
    milestoneFlags: uniqueStrings(event.milestoneFlags),
    nativeMiracleResidue: event.nativeMiracleResidue === true,
    sameEncounterResidue: event.sameEncounterResidue !== false,
  };

  if (!normalized.progressFingerprint) {
    normalized.progressFingerprint = defaultProgressFingerprint(normalized, chapterBucket);
  }

  if (!KNOWN_CONTEXT_GRADES.has(normalized.contextGrade)) {
    normalized.contextGrade = "practice";
  }
  if (!KNOWN_NOVELTY_BUCKETS.has(normalized.noveltyBucket)) {
    normalized.noveltyBucket = "repeat";
  }
  if (!KNOWN_OUTCOMES.has(normalized.outcome)) {
    normalized.outcome = "success";
  }

  return normalized;
}

export function validateLatticeProgressEvent(event = {}, options = {}) {
  const normalized = normalizeLatticeProgressEvent(event, options);
  const errors = [];
  const seenFingerprints = options.seenFingerprints instanceof Set ? options.seenFingerprints : new Set();

  if (!normalized.eventId) errors.push("eventId is required.");
  if (!normalized.skillId) errors.push("skillId is required.");
  if (!normalized.encounterTemplateId) errors.push("encounterTemplateId is required.");
  if (!isTrustedLatticeProgressEmitter(normalized.emitterId)) {
    errors.push(`Emitter ${JSON.stringify(normalized.emitterId)} is not trusted.`);
  }
  if (seenFingerprints.has(normalized.progressFingerprint)) {
    errors.push("progressFingerprint has already been consumed in this chapter bucket.");
  }
  if (normalized.contextGrade === "elite" && normalized.threatRatio < 1.15) {
    errors.push("Elite context requires threatRatio >= 1.15.");
  }
  if (
    normalized.contextGrade === "survival" &&
    (normalized.threatRatio < 1.35 || normalized.outcome !== "failure_survived")
  ) {
    errors.push("Survival context requires threatRatio >= 1.35 and failure_survived outcome.");
  }
  if (normalized.nativeMiracleResidue && normalized.sameEncounterResidue) {
    errors.push("Native miracle residue may not emit progress for the same encounter.");
  }

  return {
    valid: errors.length === 0,
    errors,
    event: normalized,
  };
}

export function dedupeLatticeProgressEvents(events = [], options = {}) {
  const chapterBucket = normalizeString(options.chapterBucket, "global");
  const seenFingerprints = new Set();
  const accepted = [];
  const rejected = [];

  for (const event of Array.isArray(events) ? events : []) {
    const result = validateLatticeProgressEvent(event, {
      ...options,
      chapterBucket,
      seenFingerprints,
    });
    if (result.valid) {
      seenFingerprints.add(result.event.progressFingerprint);
      accepted.push(result.event);
    } else {
      rejected.push(result);
    }
  }

  return { accepted, rejected, seenFingerprints };
}

export function computeLatticeMasteryGain(event = {}, options = {}) {
  const normalized = normalizeLatticeProgressEvent(event, options);
  const familyModifier = clampNumber(options.familyModifier, {
    min: 0,
    fallback: 1,
  });
  const repetitionSaturation = clampNumber(options.repetitionSaturation, {
    min: 0,
    max: 0.65,
    fallback: 0,
  });
  const contextFit = CONTEXT_FIT[normalized.contextGrade] ?? CONTEXT_FIT.practice;
  const dangerWeight = DANGER_WEIGHT[normalized.contextGrade] ?? DANGER_WEIGHT.practice;
  const noveltyWeight = NOVELTY_WEIGHT[normalized.noveltyBucket] ?? NOVELTY_WEIGHT.repeat;
  const fatiguePenalty = Math.max(0.35, 1 - repetitionSaturation);
  const total =
    BASE_PRACTICE *
    contextFit *
    dangerWeight *
    noveltyWeight *
    familyModifier *
    fatiguePenalty;

  return Number(total.toFixed(2));
}

function toLatticeSkillView(skill) {
  if (!skill || typeof skill !== "object") return null;
  return skill.lattice && typeof skill.lattice === "object"
    ? skill.lattice
    : adaptToLatticeSkill(skill);
}

function extractMajorTagsFromSkill(skill) {
  const lattice = toLatticeSkillView(skill);
  if (!lattice) return [];
  return lattice.affinityTags.filter((tag) => !GENERIC_TAGS.has(normalizeLower(tag)));
}

export function computeLatticeResonance(skills = []) {
  const normalized = (Array.isArray(skills) ? skills : [])
    .map((skill) => toLatticeSkillView(skill))
    .filter(Boolean);
  let resonance = 1.0;

  for (let index = 0; index < normalized.length; index += 1) {
    const currentTags = new Set(extractMajorTagsFromSkill(normalized[index]));
    for (let compareIndex = index + 1; compareIndex < normalized.length; compareIndex += 1) {
      const compareTags = extractMajorTagsFromSkill(normalized[compareIndex]);
      if (compareTags.some((tag) => currentTags.has(tag))) {
        resonance += 0.03;
      }
    }
  }

  const tagCounts = new Map();
  normalized.forEach((skill) => {
    extractMajorTagsFromSkill(skill).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (Array.from(tagCounts.values()).some((count) => count >= 3)) {
    resonance += 0.05;
  }

  const families = new Set(normalized.map((skill) => skill.family));
  if (families.has("profession") && families.has("cultivation")) {
    const hasCombat = normalized.some((skill) => skill.family === "martial" || skill.family === "magic");
    if (hasCombat) resonance += 0.05;
  }

  return Number(Math.min(1.25, resonance).toFixed(2));
}

export function computeLatticeSaturation(skills = [], options = {}) {
  const normalized = (Array.isArray(skills) ? skills : [])
    .map((skill) => toLatticeSkillView(skill))
    .filter(Boolean);
  let saturation = 0;

  const tagCounts = new Map();
  normalized.forEach((skill) => {
    extractMajorTagsFromSkill(skill).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  tagCounts.forEach((count) => {
    if (count > 2) saturation += (count - 2) * 0.08;
  });

  const activeByFamily = new Map();
  normalized
    .filter((skill) => skill.slotType === "active")
    .forEach((skill) => {
      activeByFamily.set(skill.family, (activeByFamily.get(skill.family) || 0) + 1);
    });
  activeByFamily.forEach((count) => {
    if (count > 3) saturation += (count - 3) * 0.06;
  });

  if (options.nativeMiracleUsedRecently) {
    saturation += 0.1;
  }

  return Number(Math.min(0.45, saturation).toFixed(2));
}

export function computeLatticeBuildPressure(skills = [], options = {}) {
  const saturation = computeLatticeSaturation(skills, options);
  const resonance = computeLatticeResonance(skills);
  return {
    saturation,
    resonance,
    resolutionOrder: ["saturation", "resonance"],
    finalMultiplier: Number((Math.max(0.1, 1 - saturation) * resonance).toFixed(2)),
  };
}

export function summarizeLatticeLoadout({
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
} = {}) {
  const normalizedActive = activeSkills.map((skill) => toLatticeSkillView(skill)).filter(Boolean);
  const normalizedPassive = passiveSkills.map((skill) => toLatticeSkillView(skill)).filter(Boolean);
  const concentrationSkill =
    [...normalizedActive, ...normalizedPassive].find(
      (skill) => skill.runtimeRole === "stance" || skill.runtimeRole === "channel",
    ) || null;

  return {
    activeSkillIds: normalizedActive.map((skill) => skill.id),
    passiveSkillIds: normalizedPassive.map((skill) => skill.id),
    reactionSkillIds: normalizedActive
      .filter((skill) => skill.runtimeRole === "reaction")
      .slice(0, 2)
      .map((skill) => skill.id),
    concentrationSkillId: concentrationSkill?.id || null,
    ritualSkillIds: [...normalizedActive, ...normalizedPassive]
      .filter((skill) => skill.runtimeRole === "ritual")
      .map((skill) => skill.id),
    cultivationSkillIds: normalizedPassive
      .filter((skill) => skill.family === "cultivation")
      .map((skill) => skill.id),
    professionFocusId: normalizeString(professionId, null),
  };
}

function normalizeArrayField(values) {
  return uniqueStrings(Array.isArray(values) ? values : []);
}

export function validateExternalAuthorityContract(contract = {}, hostContext = {}) {
  const normalized = {
    contractId: normalizeString(contract.contractId),
    authorityId: normalizeString(contract.authorityId),
    miraclePayloadId: normalizeString(contract.miraclePayloadId),
    payloadTier: clampNumber(contract.payloadTier, { min: 0, fallback: 0 }),
    grantType: normalizeString(contract.grantType),
    scope: normalizeString(contract.scope),
    duration: normalizeString(contract.duration),
    maxConcurrentContracts: clampNumber(contract.maxConcurrentContracts, {
      min: 0,
      fallback: 1,
    }),
    overrideFlags: normalizeArrayField(contract.overrideFlags),
    exclusiveOverrideTags: normalizeArrayField(contract.exclusiveOverrideTags),
    collisionPolicy: normalizeLower(contract.collisionPolicy),
    hostLockout: normalizeArrayField(contract.hostLockout),
    costOwner: normalizeLower(contract.costOwner),
    aftershockOwner: normalizeLower(contract.aftershockOwner),
    rejectionClauses: normalizeArrayField(contract.rejectionClauses),
  };
  const errors = [];

  if (!normalized.contractId) errors.push("contractId is required.");
  if (!normalized.authorityId) errors.push("authorityId is required.");
  if (!normalized.miraclePayloadId) errors.push("miraclePayloadId is required.");
  if (!normalized.grantType) errors.push("grantType is required.");
  if (!normalized.scope) errors.push("scope is required.");
  if (!normalized.duration) errors.push("duration is required.");
  if (!KNOWN_COLLISION_POLICIES.has(normalized.collisionPolicy)) {
    errors.push("collisionPolicy must be reject, replace, or queue.");
  }
  if (!KNOWN_COST_OWNERS.has(normalized.costOwner)) {
    errors.push("costOwner must be directive-engine, shared, or external.");
  }
  if (!KNOWN_AFTERSHOCK_OWNERS.has(normalized.aftershockOwner)) {
    errors.push("aftershockOwner must be directive-engine, shared, or external.");
  }
  if (
    !normalized.rejectionClauses.includes(GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE)
  ) {
    errors.push("Grandma Void rejection clause is mandatory.");
  }

  const hostTolerance = clampNumber(hostContext.hostTolerance, {
    min: 0,
    fallback: Number.POSITIVE_INFINITY,
  });
  if (normalized.payloadTier > hostTolerance) {
    errors.push("payloadTier exceeds current host tolerance.");
  }

  const activeContracts = Array.isArray(hostContext.activeContracts) ? hostContext.activeContracts : [];
  const activeLockouts = new Set(normalizeArrayField(hostContext.activeHostLockouts));
  const activeExclusiveTags = new Set(
    activeContracts.flatMap((entry) => normalizeArrayField(entry?.exclusiveOverrideTags)),
  );

  if (
    activeContracts.length >= normalized.maxConcurrentContracts &&
    normalized.collisionPolicy === "reject"
  ) {
    errors.push("maxConcurrentContracts would be exceeded.");
  }
  if (normalized.exclusiveOverrideTags.some((tag) => activeExclusiveTags.has(tag))) {
    errors.push("exclusiveOverrideTags collide with an active contract.");
  }
  if (normalized.hostLockout.some((lockout) => activeLockouts.has(lockout))) {
    errors.push("hostLockout collides with an active host lockout.");
  }

  let resolution = "apply";
  if (
    activeContracts.length >= normalized.maxConcurrentContracts &&
    normalized.collisionPolicy === "replace"
  ) {
    resolution = "replace";
  } else if (
    activeContracts.length >= normalized.maxConcurrentContracts &&
    normalized.collisionPolicy === "queue"
  ) {
    resolution = "queue";
  }

  return {
    valid: errors.length === 0,
    errors,
    contract: normalized,
    resolution,
  };
}

export function normalizeNativeMiracle(miracle = {}) {
  return {
    id: normalizeString(miracle.id),
    trigger: normalizeString(miracle.trigger),
    eligibility: normalizeArrayField(miracle.eligibility),
    effectWindow: normalizeString(miracle.effectWindow),
    strain: clampNumber(miracle.strain, { min: 0, fallback: 0 }),
    aftershock: normalizeArrayField(miracle.aftershock),
    scar: normalizeArrayField(miracle.scar),
    survivedActivations: clampNumber(miracle.survivedActivations, { min: 0, fallback: 0 }),
    aftershockAcceptedCount: clampNumber(miracle.aftershockAcceptedCount, {
      min: 0,
      fallback: 0,
    }),
    crisisTagMatchCount: clampNumber(miracle.crisisTagMatchCount, {
      min: 0,
      fallback: 0,
    }),
  };
}

export function advanceNativeMiracleState(miracle = {}, options = {}) {
  const normalized = normalizeNativeMiracle(miracle);
  const crisisTags = normalizeArrayField(options.crisisTags);
  return {
    ...normalized,
    survivedActivations: normalized.survivedActivations + (options.survivedActivation ? 1 : 0),
    aftershockAcceptedCount:
      normalized.aftershockAcceptedCount + (options.acceptedAftershock ? 1 : 0),
    crisisTagMatchCount: normalized.crisisTagMatchCount + crisisTags.length,
  };
}

export function canPersistentLatticeModifierContainTalent(talentId) {
  return !PERSISTENT_BLACKLIST_SET.has(normalizeString(talentId));
}

export function isGrandmaVoidInteractionAllowed(action) {
  return !GRANDMA_VOID_PROHIBITED_ACTIONS.includes(normalizeLower(action));
}
