// =================================================================
// SKILLS DATABASE - Comprehensive skill system
// Supports class skills (20 active + 40 passive per class) and universal learnable skills
// =================================================================

import { applyTalentModifiers } from "./TalentDefinitions.js";
import {
  resolveBypasses,
  applyCostOverride,
  applyCooldownOverride,
} from "./TalentManager.js";
import { shuffle } from "../../utils/DeterministicRandom.js";
import { nonCombatSkills } from "./NonCombatSkillRegistry.js";
import {
  getLocationById,
  getZoneById,
  resolveLocationId,
} from "../../world/WorldDataRegistry.js";
import {
  classes as canonicalClasses,
  getClassLineage,
} from "../../data/registries/ClassDataRegistry.js";
import { getAllClassAbilityIds, getClassAbilityById, getAbilityOwner } from "../class/ClassAbilityRegistry.js";
import { PROFESSIONS } from "../profession/ProfessionRegistry.js";
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
import {
  getAllRaceAbilityIds,
  getRaceAbilityById,
  getRaceAbilitiesFor,
} from "../race/RaceAbilityRegistry.js";

// Class Skill Imports
import knightActive from "../../data/skills/knight.active.json" with { type: "json" };
import knightPassive from "../../data/skills/knight.passive.json" with { type: "json" };
import mageActive from "../../data/skills/mage.active.json" with { type: "json" };
import magePassive from "../../data/skills/mage.passive.json" with { type: "json" };
import assassinActive from "../../data/skills/assassin.active.json" with { type: "json" };
import assassinPassive from "../../data/skills/assassin.passive.json" with { type: "json" };
import warriorActive from "../../data/skills/warrior.active.json" with { type: "json" };
import warriorPassive from "../../data/skills/warrior.passive.json" with { type: "json" };
import rogueActive from "../../data/skills/rogue.active.json" with { type: "json" };
import roguePassive from "../../data/skills/rogue.passive.json" with { type: "json" };
import priestActive from "../../data/skills/priest.active.json" with { type: "json" };
import priestPassive from "../../data/skills/priest.passive.json" with { type: "json" };
import paladinActive from "../../data/skills/paladin.active.json" with { type: "json" };
import paladinPassive from "../../data/skills/paladin.passive.json" with { type: "json" };
import rangerActive from "../../data/skills/ranger.active.json" with { type: "json" };
import rangerPassive from "../../data/skills/ranger.passive.json" with { type: "json" };
import monkActive from "../../data/skills/monk.active.json" with { type: "json" };
import monkPassive from "../../data/skills/monk.passive.json" with { type: "json" };
import bardActive from "../../data/skills/bard.active.json" with { type: "json" };
import bardPassive from "../../data/skills/bard.passive.json" with { type: "json" };
import necromancerActive from "../../data/skills/necromancer.active.json" with { type: "json" };
import necromancerPassive from "../../data/skills/necromancer.passive.json" with { type: "json" };
import druidActive from "../../data/skills/druid.active.json" with { type: "json" };
import druidPassive from "../../data/skills/druid.passive.json" with { type: "json" };
import warlockActive from "../../data/skills/warlock.active.json" with { type: "json" };
import warlockPassive from "../../data/skills/warlock.passive.json" with { type: "json" };
import shamanActive from "../../data/skills/shaman.active.json" with { type: "json" };
import shamanPassive from "../../data/skills/shaman.passive.json" with { type: "json" };
import battlemageActive from "../../data/skills/battlemage.active.json" with { type: "json" };
import battlemagePassive from "../../data/skills/battlemage.passive.json" with { type: "json" };
import archerActive from "../../data/skills/archer.active.json" with { type: "json" };
import archerPassive from "../../data/skills/archer.passive.json" with { type: "json" };
import berserkerActive from "../../data/skills/berserker.active.json" with { type: "json" };
import berserkerPassive from "../../data/skills/berserker.passive.json" with { type: "json" };
import summonerActive from "../../data/skills/summoner.active.json" with { type: "json" };
import summonerPassive from "../../data/skills/summoner.passive.json" with { type: "json" };
import templarActive from "../../data/skills/templar.active.json" with { type: "json" };
import templarPassive from "../../data/skills/templar.passive.json" with { type: "json" };
import shadowbladeActive from "../../data/skills/shadowblade.active.json" with { type: "json" };
import shadowbladePassive from "../../data/skills/shadowblade.passive.json" with { type: "json" };

// Universal Skill Imports
import universalSkills from "../../data/skills/universal.json" with { type: "json" };

/**
 * Helper function to shuffle array and select random items
 */
function getRandomSkills(skills, count) {
  const shuffled = shuffle(skills);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Database Construction
const classSkillsDatabase = {
  knight: { active: knightActive, passive: knightPassive },
  mage: { active: mageActive, passive: magePassive },
  assassin: { active: assassinActive, passive: assassinPassive },
  warrior: { active: warriorActive, passive: warriorPassive },
  rogue: { active: rogueActive, passive: roguePassive },
  priest: { active: priestActive, passive: priestPassive },
  paladin: { active: paladinActive, passive: paladinPassive },
  ranger: { active: rangerActive, passive: rangerPassive },
  monk: { active: monkActive, passive: monkPassive },
  bard: { active: bardActive, passive: bardPassive },
  necromancer: { active: necromancerActive, passive: necromancerPassive },
  druid: { active: druidActive, passive: druidPassive },
  warlock: { active: warlockActive, passive: warlockPassive },
  shaman: { active: shamanActive, passive: shamanPassive },
  battlemage: { active: battlemageActive, passive: battlemagePassive },
  archer: { active: archerActive, passive: archerPassive },
  berserker: { active: berserkerActive, passive: berserkerPassive },
  summoner: { active: summonerActive, passive: summonerPassive },
  templar: { active: templarActive, passive: templarPassive },
  shadowblade: { active: shadowbladeActive, passive: shadowbladePassive },
};

const CANONICAL_CLASS_ID_SET = new Set(
  (canonicalClasses || [])
    .map((entry) => entry?.id)
    .filter((id) => typeof id === "string" && id.length > 0),
);
const PROFESSION_ID_SET = new Set(
  Object.values(PROFESSIONS || {})
    .map((entry) => entry?.id)
    .filter((id) => typeof id === "string" && id.length > 0),
);
const SKILL_OWNER_TYPES = new Set(["class", "profession", "universal", "system"]);

// Legacy class ids used in the skill library are mapped onto canonical class ids.
const LEGACY_CLASS_TO_CANONICAL = {
  knight: "guardian",
  priest: "cleric",
  assassin: "shadow_assassin",
  bard: "trickster",
  necromancer: "oracle_hierophant",
  druid: "beastmaster",
  warlock: "spellbreaker",
  shaman: "tempest_reveler",
  archer: "sharpshooter",
  summoner: "astral_archon",
  templar: "paladin",
  shadowblade: "night_reaper",
};

// Canonical classes without direct skill packs can point at legacy or parent packs.
const CANONICAL_CLASS_SKILL_SOURCE_OVERRIDES = {
  cleric: "priest",
  guardian: "knight",
  shadow_assassin: "assassin",
  high_priest: "priest",
  sharpshooter: "archer",
  trickster: "bard",
  oracle_hierophant: "necromancer",
  beastmaster: "druid",
  spellbreaker: "warlock",
  tempest_reveler: "shaman",
  astral_archon: "summoner",
  night_reaper: "shadowblade",
  dawn_vindicator: "templar",
};

function toCanonicalSkillClassId(classId) {
  if (typeof classId !== "string" || classId.trim().length === 0) return classId;
  const normalized = classId.trim();
  if (CANONICAL_CLASS_ID_SET.has(normalized)) return normalized;
  return LEGACY_CLASS_TO_CANONICAL[normalized] || normalized;
}

function normalizeSkillOwner(skill) {
  if (!skill || typeof skill !== "object") {
    return { ownerType: "system", ownerId: "unbound" };
  }

  const declaredOwnerType =
    typeof skill.ownerType === "string" ? skill.ownerType.trim().toLowerCase() : "";
  const legacyClassOwner =
    typeof skill.class === "string" && skill.class.trim().length > 0 ? skill.class.trim() : "";
  const explicitOwnerId =
    typeof skill.ownerId === "string" && skill.ownerId.trim().length > 0
      ? skill.ownerId.trim()
      : "";
  const rawOwnerId = explicitOwnerId || legacyClassOwner;
  const canonicalClassOwnerId = toCanonicalSkillClassId(rawOwnerId);

  let ownerType = SKILL_OWNER_TYPES.has(declaredOwnerType) ? declaredOwnerType : "";
  if (!ownerType) {
    if (rawOwnerId === "universal" || rawOwnerId === "general") {
      ownerType = "universal";
    } else if (PROFESSION_ID_SET.has(rawOwnerId)) {
      ownerType = "profession";
    } else if (CANONICAL_CLASS_ID_SET.has(canonicalClassOwnerId)) {
      ownerType = "class";
    } else {
      ownerType = "system";
    }
  }

  let ownerId = rawOwnerId;
  if (ownerType === "class") {
    ownerId = canonicalClassOwnerId;
  } else if (ownerType === "universal") {
    ownerId = "universal";
  } else if (!ownerId) {
    ownerId = "unbound";
  }

  return { ownerType, ownerId };
}

function resolveSkillSourceClassId(classId) {
  if (typeof classId !== "string" || classId.trim().length === 0) return null;
  const normalized = classId.trim();
  if (classSkillsDatabase[normalized]) return normalized;

  const override = CANONICAL_CLASS_SKILL_SOURCE_OVERRIDES[normalized];
  if (override && classSkillsDatabase[override]) return override;

  const lineage = getClassLineage(normalized);
  for (let index = lineage.length - 1; index >= 0; index -= 1) {
    const candidate = lineage[index]?.id;
    if (!candidate) continue;
    if (classSkillsDatabase[candidate]) return candidate;
    const lineageOverride = CANONICAL_CLASS_SKILL_SOURCE_OVERRIDES[candidate];
    if (lineageOverride && classSkillsDatabase[lineageOverride]) {
      return lineageOverride;
    }
  }

  return null;
}

/**
 * Get skills for a class (returns 4 active and 12 passive randomly selected)
 */
export function getSkillsByClass(classId) {
  const requestedClassId =
    typeof classId === "string"
      ? classId
      : classId && typeof classId === "object"
        ? classId.id
        : null;
  const sourceClassId = resolveSkillSourceClassId(requestedClassId || "");
  const classSkills = sourceClassId ? classSkillsDatabase[sourceClassId] : null;
  if (!classSkills) {
    return { active: [], passive: [] };
  }

  const normalizedClassId =
    requestedClassId && CANONICAL_CLASS_ID_SET.has(requestedClassId)
      ? requestedClassId
      : toCanonicalSkillClassId(sourceClassId || requestedClassId);

  return {
    active: getRandomSkills(classSkills.active || [], 8).map((skill) =>
      normalizeSkillTemplate({
        ...skill,
        class: normalizedClassId || skill.class || sourceClassId,
        ownerType: "class",
        ownerId: normalizedClassId || toCanonicalSkillClassId(skill.class || sourceClassId),
      }),
    ),
    passive: getRandomSkills(classSkills.passive || [], 12).map((skill) =>
      normalizeSkillTemplate({
        ...skill,
        class: normalizedClassId || skill.class || sourceClassId,
        ownerType: "class",
        ownerId: normalizedClassId || toCanonicalSkillClassId(skill.class || sourceClassId),
      }),
    ),
  };
}

const UNIVERSAL_ELEMENTAL_PREFIXES = [
  {
    prefix: "universal_flame_",
    element: "fire",
    effect: { id: "burn", target: "enemy", duration: 2, magnitude: 6 },
  },
  {
    prefix: "universal_frost_",
    element: "ice",
    effect: { id: "frostbite", target: "enemy", duration: 2, magnitude: 6 },
  },
  {
    prefix: "universal_storm_",
    element: "lightning",
    effect: { id: "shock", target: "enemy", duration: 2, magnitude: 0.1 },
  },
  {
    prefix: "universal_venom_",
    element: "nature",
    effect: { id: "poison", target: "enemy", duration: 3, magnitude: 5 },
  },
  {
    prefix: "universal_shadow_",
    element: "dark",
    effect: { id: "curse", target: "enemy", duration: 3, magnitude: 0.12 },
  },
  {
    prefix: "universal_radiant_",
    element: "holy",
    effect: { id: "radiant_mark", target: "enemy", duration: 3, magnitude: 0.12 },
  },
];

const EFFECT_ELEMENT_INFERENCE = [
  { effectIds: ["burn"], element: "fire", isMagic: true },
  { effectIds: ["frostbite", "freeze"], element: "ice", isMagic: true },
  { effectIds: ["shock"], element: "lightning", isMagic: true },
  { effectIds: ["poison"], element: "nature", isMagic: false },
  { effectIds: ["wet"], element: "water", isMagic: true },
  { effectIds: ["radiant_mark"], element: "holy", isMagic: true },
  { effectIds: ["curse"], element: "dark", isMagic: true },
  { effectIds: ["bleed"], element: "physical", isMagic: false },
];

const UNIVERSAL_FORM_MULTIPLIERS = {
  strike: 1.15,
  burst: 1.2,
  lance: 1.25,
  wave: 1.1,
  pulse: 1.1,
  nova: 1.15,
  torrent: 1.18,
  step: 1.1,
  cleave: 1.12,
  spear: 1.22,
};

const normalizeSkillTemplate = (skill) => {
  if (!skill || typeof skill !== "object") return skill;

  const next = { ...skill };
  const { ownerType, ownerId } = normalizeSkillOwner(next);
  const compatibilityClassId =
    ownerType === "class" || ownerType === "profession" || ownerType === "universal"
      ? ownerId
      : (typeof next.class === "string" && next.class.trim().length > 0)
        ? next.class.trim()
        : ownerId;
  const tags = Array.isArray(next.tags) ? [...next.tags] : [];
  let effects = Array.isArray(next.effects) ? [...next.effects] : [];

  // Normalize effect target defaults for the combat effect system.
  if (effects.length > 0) {
    effects = effects.map((effect) =>
      effect && typeof effect === "object" && !Array.isArray(effect)
        ? { target: effect.target ?? "enemy", ...effect }
        : effect,
    );
  }

  // Infer element + magic typing for legacy skills that apply signature elemental statuses.
  if (next.type === "active" && !next.element && effects.length > 0) {
    const idSet = new Set(
      effects
        .map((effect) =>
          effect && typeof effect === "object" && !Array.isArray(effect)
            ? effect.id
            : null,
        )
        .filter((id) => typeof id === "string"),
    );
    for (const rule of EFFECT_ELEMENT_INFERENCE) {
      if (rule.effectIds.some((id) => idSet.has(id))) {
        next.element = rule.element;
        if (next.isMagic == null) next.isMagic = rule.isMagic;
        break;
      }
    }
  }

  // Infer element + magic typing for the generated universal elemental spell families.
  if (next.type === "active" && typeof next.id === "string") {
    for (const rule of UNIVERSAL_ELEMENTAL_PREFIXES) {
      if (!next.id.startsWith(rule.prefix)) continue;

      if (!next.element) next.element = rule.element;
      if (next.isMagic == null) next.isMagic = true;

      // Apply a modest default multiplier if the skill didn't define damage.
      if (next.damage == null) {
        const form = next.id.slice(rule.prefix.length).split("_").pop();
        const multiplier = UNIVERSAL_FORM_MULTIPLIERS[form] || 1.1;
        next.damage = { multiplier };
      }

      // Ensure elemental spells apply a signature status to enable synergies/reactions.
      if (effects.length === 0) {
        effects = [rule.effect];
      }
      break;
    }
  }

  const element = typeof next.element === "string" ? next.element : null;
  const template = next.template && typeof next.template === "object" ? next.template : {};

  return attachLatticeMetadata({
    ...next,
    ownerType,
    ownerId,
    class: compatibilityClassId,
    tags,
    effects,
    template: {
      category:
        template.category ||
        (ownerType === "universal"
          ? "Universal"
          : ownerType === "profession"
            ? "Profession Skill"
            : ownerType === "system"
              ? "System"
              : "Class"),
      function: template.function || (next.type === "passive" ? "passive" : "combat"),
      elements: Array.isArray(template.elements)
        ? template.elements
        : element
          ? [element]
          : [],
      synergies: Array.isArray(template.synergies) ? template.synergies : [],
      source: template.source || "SkillRegistry",
      ...(template.meta && typeof template.meta === "object" ? { meta: template.meta } : {}),
    },
  });
};

// =================================================================
// DYNAMIC SKILL GENERATION FROM EXTERNAL REGISTRIES
// =================================================================

// Profession Skills (Unlockable Traits/Actions)
const professionSkills = [];
try {
  for (const profId in PROFESSIONS) {
    const prof = PROFESSIONS[profId];
    if (prof.tierUnlocks) {
      for (const tierStr in prof.tierUnlocks) {
        const tier = parseInt(tierStr, 10);
        const unlock = prof.tierUnlocks[tier];
        if (unlock.skills) {
          unlock.skills.forEach((skillId) => {
            // Only add if not already defined in professionSkills to avoid duplicates
            if (!professionSkills.some(s => s.id === skillId)) {
                professionSkills.push({
                id: skillId,
                name: skillId
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" "),
                type: "passive", // Default to passive trait
                class: profId,
                ownerType: "profession",
                ownerId: profId,
                description: `Unlocked at ${prof.name} Tier ${tier}.`,
                level: 1,
                template: {
                    category: "Profession Skill",
                    function: "passive",
                    source: "ProfessionRegistry",
                    elements: [],
                    synergies: [],
                },
                unlockConditions: {
                    profession: profId,
                    tier: tier,
                    level: 1,
                    location: null,
                    quest: null,
                    item: null,
                    skillPrerequisites: [],
                },
                });
            }
          });
        }
      }
    }
  }
} catch (err) {
  console.warn("Failed to generate profession skills:", err);
}

// Class Abilities (Active/Passive Class Skills)
const classAbilitySkills = [];
try {
  const abilityIds = getAllClassAbilityIds();
  abilityIds.forEach((id) => {
    const ability = getClassAbilityById(id);
    if (ability) {
      // Map to SkillRegistry format
      const isPassive = !ability.cost && !ability.cooldown && !ability.damage;
      const metaOwner = ability.template?.meta?.ownerId;
      const resolvedClassRaw =
        (metaOwner && metaOwner !== "unbound")
          ? metaOwner
          : (getAbilityOwner(ability.id) || "universal");
      const resolvedClass = toCanonicalSkillClassId(resolvedClassRaw);
      const ownerType = resolvedClass === "universal" ? "universal" : "class";
      const ownerId = ownerType === "universal" ? "universal" : resolvedClass;
      
      classAbilitySkills.push({
        ...ability,
        id: ability.id, // Ensure ID is preserved
        name: ability.name,
        type: isPassive ? "passive" : "active",
        class: ownerId,
        ownerType,
        ownerId,
        description: ability.description || "Class Ability",
        level: 1,
        manaCost: ability.costType === "mana" ? ability.cost : 0,
        cooldown: ability.cooldown || 0,
        template: {
          category: "Class Ability",
          function: isPassive ? "passive" : "combat",
          source: "ClassAbilityRegistry",
          elements: ability.template?.elements || [],
          synergies: ability.template?.synergies || [],
        },
      });
    }
  });
} catch (err) {
  console.warn("Failed to generate class ability skills:", err);
}

/**
 * Get all skills from all classes (for character creation)
 */
export function getAllSkills() {
  const allSkills = [];

  // Add class-specific skills using canonical class ids with lineage fallback.
  for (const classDef of canonicalClasses || []) {
    const canonicalClassId = classDef?.id;
    if (!canonicalClassId) continue;

    const sourceClassId = resolveSkillSourceClassId(canonicalClassId);
    if (!sourceClassId) continue;

    const skills = classSkillsDatabase[sourceClassId];
    if (!skills) continue;

    if (skills.active) {
      allSkills.push(
        ...skills.active.map((s) =>
          normalizeSkillTemplate({
            ...s,
            class: canonicalClassId,
            ownerType: "class",
            ownerId: canonicalClassId,
          }),
        ),
      );
    }
    if (skills.passive) {
      allSkills.push(
        ...skills.passive.map((s) =>
          normalizeSkillTemplate({
            ...s,
            class: canonicalClassId,
            ownerType: "class",
            ownerId: canonicalClassId,
          }),
        ),
      );
    }
  }

  // Add universal skills
  if (universalSkills) {
    allSkills.push(
      ...universalSkills.map((s) =>
        normalizeSkillTemplate({
          ...s,
          class: "universal",
          ownerType: "universal",
          ownerId: "universal",
        }),
      ),
      ...nonCombatSkills.map((s) =>
        normalizeSkillTemplate({
          ...s,
          class: "universal",
          ownerType: "universal",
          ownerId: "universal",
        }),
      ),
    );
  }

  // Add dynamically generated skills
  allSkills.push(
    ...professionSkills.map((s) => normalizeSkillTemplate(s)),
    ...classAbilitySkills.map((s) => normalizeSkillTemplate(s))
  );

  return allSkills;
}

const copyStringArray = (values) =>
  Array.isArray(values) ? values.filter((value) => typeof value === "string") : [];

const copyUnlockConditions = (conditions) => {
  if (!conditions || typeof conditions !== "object" || Array.isArray(conditions)) {
    return null;
  }
  return {
    ...conditions,
    skillPrerequisites: copyStringArray(conditions.skillPrerequisites),
  };
};

const buildSkillSummary = (skill) => {
  if (!skill || typeof skill !== "object" || typeof skill.id !== "string") {
    return null;
  }

  const lattice =
    skill.lattice && typeof skill.lattice === "object" ? skill.lattice : {};
  const template =
    skill.template && typeof skill.template === "object" ? skill.template : {};
  const slotType = skill.slotType || lattice.slotType || skill.type || "active";
  const runtimeRole = skill.runtimeRole || lattice.runtimeRole || "standard";
  const affinityTags = Array.isArray(skill.affinityTags)
    ? skill.affinityTags
    : Array.isArray(lattice.affinityTags)
      ? lattice.affinityTags
      : [];
  const latticeFamily = skill.latticeFamily || lattice.family || null;
  const latticeSourceType = skill.latticeSourceType || lattice.sourceType || null;

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
    requiredClass: skill.requiredClass || null,
    requiredClasses: copyStringArray(skill.requiredClasses),
    allowedClasses: copyStringArray(skill.allowedClasses),
    requiredRace: skill.requiredRace || null,
    requiredRaces: copyStringArray(skill.requiredRaces),
    allowedRaces: copyStringArray(skill.allowedRaces),
    tags: copyStringArray(skill.tags),
    affinityTags: copyStringArray(affinityTags),
    runtimeRole,
    latticeFamily,
    latticeSourceType,
    unlockConditions: copyUnlockConditions(skill.unlockConditions),
    template: {
      category: template.category || null,
      function: template.function || null,
      elements: copyStringArray(template.elements),
      source: template.source || null,
    },
    lattice: {
      slotType,
      runtimeRole,
      family: latticeFamily,
      sourceType: latticeSourceType,
      affinityTags: copyStringArray(affinityTags),
    },
  };
};

const cloneSkillSummary = (summary) => {
  if (!summary) return null;
  return {
    ...summary,
    requiredClasses: [...summary.requiredClasses],
    allowedClasses: [...summary.allowedClasses],
    requiredRaces: [...summary.requiredRaces],
    allowedRaces: [...summary.allowedRaces],
    tags: [...summary.tags],
    affinityTags: [...summary.affinityTags],
    unlockConditions: summary.unlockConditions
      ? {
          ...summary.unlockConditions,
          skillPrerequisites: [
            ...(summary.unlockConditions.skillPrerequisites || []),
          ],
        }
      : null,
    template: summary.template
      ? {
          ...summary.template,
          elements: [...summary.template.elements],
        }
      : null,
    lattice: summary.lattice
      ? {
          ...summary.lattice,
          affinityTags: [...summary.lattice.affinityTags],
        }
      : null,
  };
};

let _skillSummaries = null;
let _skillSummaryIndex = null;

function ensureSkillSummaryIndex() {
  if (_skillSummaries && _skillSummaryIndex) return;
  _skillSummaries = getAllSkills().map((skill) => buildSkillSummary(skill)).filter(Boolean);
  _skillSummaryIndex = new Map(
    _skillSummaries.map((summary) => [summary.id, summary]),
  );
}

export function getAllSkillSummaries() {
  ensureSkillSummaryIndex();
  return _skillSummaries.map((summary) => cloneSkillSummary(summary));
}

export function getSkillSummaryById(skillId) {
  if (!skillId) return null;
  ensureSkillSummaryIndex();
  const summary = _skillSummaryIndex.get(skillId);
  return cloneSkillSummary(summary);
}

/**
 * --- O(1) skill lookup index ---
 */
const _skillIndex = new Map();
function _buildSkillIndex() {
  for (const classId in classSkillsDatabase) {
    const skills = classSkillsDatabase[classId];
    if (skills.active) skills.active.forEach((s) => _skillIndex.set(s.id, s));
    if (skills.passive)
      skills.passive.forEach((s) => _skillIndex.set(s.id, s));
  }
  if (Array.isArray(universalSkills))
    universalSkills.forEach((s) => _skillIndex.set(s.id, s));
  if (Array.isArray(nonCombatSkills))
    nonCombatSkills.forEach((s) => _skillIndex.set(s.id, s));
  if (Array.isArray(professionSkills))
    professionSkills.forEach((s) => _skillIndex.set(s.id, s));
  if (Array.isArray(classAbilitySkills))
    classAbilitySkills.forEach((s) => _skillIndex.set(s.id, s));
}
_buildSkillIndex();

/**
 * Get skill by ID
 */
export function getSkillById(skillId) {
  const skill = _skillIndex.get(skillId);
  return skill ? normalizeSkillTemplate(skill) : null;
}

export function getLatticeSkillById(skillId) {
  const skill = getSkillById(skillId) || getRaceAbilityById(skillId);
  if (!skill) return null;
  return skill.lattice && typeof skill.lattice === "object"
    ? skill.lattice
    : adaptToLatticeSkill(skill);
}

export function getAllLatticeSkills(options = {}) {
  const includeRaceAbilities = options.includeRaceAbilities !== false;
  const latticeSkills = getAllSkills()
    .map((skill) => skill?.lattice || adaptToLatticeSkill(skill))
    .filter(Boolean);

  if (!includeRaceAbilities) {
    return latticeSkills;
  }

  const raceLatticeSkills = getAllRaceAbilityIds()
    .map((abilityId) => getRaceAbilityById(abilityId))
    .filter(Boolean)
    .map((ability) => ability.lattice || adaptToLatticeSkill(ability))
    .filter(Boolean);

  return [...latticeSkills, ...raceLatticeSkills];
}

export function getLatticeSkillsByClass(classId) {
  const pool = getSkillsByClass(classId);
  return {
    active: pool.active
      .map((skill) => skill?.lattice || adaptToLatticeSkill(skill))
      .filter(Boolean),
    passive: pool.passive
      .map((skill) => skill?.lattice || adaptToLatticeSkill(skill))
      .filter(Boolean),
  };
}

export function getLatticeSkillsForRace(raceId) {
  const abilities = getRaceAbilitiesFor(raceId) || [];
  return abilities
    .map((ability) => ability?.lattice || adaptToLatticeSkill(ability))
    .filter(Boolean);
}

function resolveSkillReference(skillRef) {
  if (!skillRef) return null;
  if (typeof skillRef === "string") {
    return getSkillById(skillRef) || getRaceAbilityById(skillRef) || getClassAbilityById(skillRef);
  }
  if (typeof skillRef === "object") {
    if (skillRef.id) {
      return skillRef.lattice
        ? skillRef
        : attachLatticeMetadata(skillRef);
    }
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

export function getLatticeLoadoutSummary({
  activeSkillIds = [],
  passiveSkillIds = [],
  activeSkills = [],
  passiveSkills = [],
  professionId = null,
} = {}) {
  const safeActiveSkills = Array.isArray(activeSkills) ? activeSkills : [];
  const safePassiveSkills = Array.isArray(passiveSkills) ? passiveSkills : [];
  const safeActiveSkillIds = Array.isArray(activeSkillIds) ? activeSkillIds : [];
  const safePassiveSkillIds = Array.isArray(passiveSkillIds) ? passiveSkillIds : [];
  const resolvedActiveSkills =
    safeActiveSkills.length > 0 ? resolveSkillReferenceList(safeActiveSkills) : resolveSkillReferenceList(safeActiveSkillIds);
  const resolvedPassiveSkills =
    safePassiveSkills.length > 0 ? resolveSkillReferenceList(safePassiveSkills) : resolveSkillReferenceList(safePassiveSkillIds);

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
  const safeActiveSkills = Array.isArray(activeSkills) ? activeSkills : [];
  const safePassiveSkills = Array.isArray(passiveSkills) ? passiveSkills : [];
  const safeActiveSkillIds = Array.isArray(activeSkillIds) ? activeSkillIds : [];
  const safePassiveSkillIds = Array.isArray(passiveSkillIds) ? passiveSkillIds : [];
  const resolvedActiveSkills =
    safeActiveSkills.length > 0 ? resolveSkillReferenceList(safeActiveSkills) : resolveSkillReferenceList(safeActiveSkillIds);
  const resolvedPassiveSkills =
    safePassiveSkills.length > 0 ? resolveSkillReferenceList(safePassiveSkills) : resolveSkillReferenceList(safePassiveSkillIds);
  const resolvedSkills = [...resolvedActiveSkills, ...resolvedPassiveSkills];

  return {
    loadout: getLatticeLoadoutSummary({
      activeSkills: resolvedActiveSkills,
      passiveSkills: resolvedPassiveSkills,
      professionId,
    }),
    buildPressure: computeLatticeBuildPressure(resolvedSkills, {
      nativeMiracleUsedRecently,
    }),
  };
}

export function validateSkillProgressEvent(event = {}, options = {}) {
  const normalizedEvent = (event !== null && typeof event === 'object' && !Array.isArray(event)) ? event : {};
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
      }),
    ),
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

/**
 * Check if skill unlock conditions are met
 */
function checkSkillUnlockConditions(skill, gameState) {
  if (!skill.unlockConditions) return true; // No conditions = always available

  const conditions = skill.unlockConditions;

  // Check profession requirement
  if (conditions.profession) {
    const playerProf = gameState.player.profession; 
    
    // Handle if player has no profession or mismatch
    if (!playerProf || playerProf.id !== conditions.profession) {
      // Also check if it's in a list of professions (if player can have multiple)
      const profs = gameState.player.professions || [];
      const match = profs.find(p => p.id === conditions.profession);
      if (!match) return false;
      
      if (conditions.tier && (match.tier || 1) < conditions.tier) {
        return false;
      }
    } else {
       if (conditions.tier && (playerProf.tier || 1) < conditions.tier) {
         return false;
       }
    }
  }

  // Check level requirement
  if (conditions.level && gameState.player.level < conditions.level) {
    return false;
  }

  // Check location requirement
  if (conditions.location) {
    const rawCondition = conditions.location;
    const conditionText =
      typeof rawCondition === "string" ? rawCondition.trim() : "";
    if (!conditionText) {
      return false;
    }

    const currentRaw =
      gameState?.world?.location?.current ?? gameState?.world?.location ?? null;
    const currentId =
      resolveLocationId(currentRaw) ||
      (typeof currentRaw === "string" ? currentRaw.trim() : null);

    const conditionLower = conditionText.toLowerCase();
    const requiredZone = getZoneById(conditionLower);
    if (requiredZone) {
      const currentLocation = currentId ? getLocationById(currentId) : null;
      if (!currentLocation || currentLocation.zoneId !== requiredZone.id) {
        return false;
      }
    } else {
      const requiredLocationId = resolveLocationId(conditionText);
      if (!requiredLocationId) {
        return false;
      }
      if (!currentId || currentId !== requiredLocationId) {
        return false;
      }
    }
  }

  // Check quest requirement
  if (conditions.quest) {
    const questCompleted = gameState.quests.completed.some(
      (q) => q.id === conditions.quest,
    );
    if (!questCompleted) {
      return false;
    }
  }

  // Check item requirement
  if (conditions.item) {
    const hasItem = gameState.player.inventory.some(
      (item) => item.id === conditions.item,
    );
    if (!hasItem) {
      return false;
    }
  }

  // Check skill prerequisites
  if (
    conditions.skillPrerequisites &&
    conditions.skillPrerequisites.length > 0
  ) {
    const learnedSkills = gameState.player.abilities.map((a) => a.id);
    const hasAllPrereqs = conditions.skillPrerequisites.every((prereq) =>
      learnedSkills.includes(prereq),
    );
    if (!hasAllPrereqs) {
      return false;
    }
  }

  return true;
}

/**
 * Get available universal skills (conditions met but not learned)
 */
export function getAvailableUniversalSkills(gameState) {
  const learnedSkillIds = gameState.player.abilities.map((a) => a.id);
  return universalSkills
    .filter((skill) => {
      if (learnedSkillIds.includes(skill.id)) return false; // Already learned
      return checkSkillUnlockConditions(skill, gameState);
    })
    .map((skill) =>
      normalizeSkillTemplate({
        ...skill,
        class: "universal",
        ownerType: "universal",
        ownerId: "universal",
      }),
    );
}

/**
 * Get locked universal skills (conditions not met)
 */
export function getLockedUniversalSkills(gameState) {
  const learnedSkillIds = gameState.player.abilities.map((a) => a.id);
  return universalSkills
    .filter((skill) => {
      if (learnedSkillIds.includes(skill.id)) return false; // Already learned
      return !checkSkillUnlockConditions(skill, gameState);
    })
    .map((skill) =>
      normalizeSkillTemplate({
        ...skill,
        class: "universal",
        ownerType: "universal",
        ownerId: "universal",
      }),
    );
}

// =================================================================
// TALENT-MODIFIED SKILL EXECUTION
// =================================================================

/**
 * Get a skill with all talent modifiers applied
 * @param {string} skillId - The skill ID to retrieve
 * @param {string[]} activeTalentIds - Array of active talent IDs
 * @param {number} playerLevel - Current player level
 * @returns {Object} Modified skill with talent effects applied
 */
export function getModifiedSkill(
  skillId,
  activeTalentIds = [],
  playerLevel = 1,
) {
  const baseSkill = getSkillById(skillId);
  if (!baseSkill) return null;

  // Apply talent modifiers to the skill
  const modifiedSkill = applyTalentModifiers(
    baseSkill,
    activeTalentIds,
    playerLevel,
  );

  // Resolve bypasses for cost/cooldown overrides
  const bypasses = resolveBypasses(activeTalentIds);

  // Apply cost override
  if (modifiedSkill.manaCost !== undefined) {
    modifiedSkill.manaCost = applyCostOverride(
      modifiedSkill.manaCost,
      bypasses,
    );
  }

  // Apply cooldown override
  if (modifiedSkill.cooldown !== undefined) {
    modifiedSkill.cooldown = applyCooldownOverride(
      modifiedSkill.cooldown,
      bypasses,
    );
  }

  // Store bypasses on skill for combat system reference
  modifiedSkill.bypasses = { ...(modifiedSkill.bypasses || {}), ...bypasses };
  modifiedSkill.activeTalentMigrationLanes = getActiveTalentMigrationLanes(activeTalentIds);

  return attachLatticeMetadata(modifiedSkill, {
    family: baseSkill.latticeFamily,
    sourceType: baseSkill.latticeSourceType,
    rank: baseSkill.lattice?.rank,
    mastery: baseSkill.lattice?.mastery,
    stability: baseSkill.lattice?.stability,
  });
}

/**
 * Calculate effective skill cost after talent modifiers
 * @param {Object} skill - The skill object
 * @param {string[]} activeTalentIds - Array of active talent IDs
 * @returns {number} Effective mana cost
 */
export function getEffectiveSkillCost(skill, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);
  return applyCostOverride(skill.manaCost || 0, bypasses);
}

/**
 * Calculate effective skill cooldown after talent modifiers
 * @param {Object} skill - The skill object
 * @param {string[]} activeTalentIds - Array of active talent IDs
 * @returns {number} Effective cooldown in seconds
 */
export function getEffectiveSkillCooldown(skill, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);
  return applyCooldownOverride(skill.cooldown || 0, bypasses);
}

/**
 * Check if a skill can be used (has enough resources, not on cooldown)
 * @param {Object} skill - The skill object
 * @param {Object} gameState - Current game state
 * @param {string[]} activeTalentIds - Array of active talent IDs
 * @returns {Object} { canUse: boolean, reason: string }
 */
export function canUseSkill(skill, gameState, activeTalentIds = []) {
  const bypasses = resolveBypasses(activeTalentIds);

  // Check mana cost
  const effectiveCost = applyCostOverride(skill.manaCost || 0, bypasses);
  if (gameState.player.mana.current < effectiveCost) {
    return {
      canUse: false,
      reason: `Not enough mana (need ${effectiveCost}, have ${gameState.player.mana.current})`,
    };
  }

  // Check cooldown (would need cooldown tracking in gameState)
  if (gameState.combat?.skillCooldowns?.[skill.id] > 0) {
    if (!bypasses.bypassCooldown) {
      return {
        canUse: false,
        reason: `Skill on cooldown (${gameState.combat.skillCooldowns[skill.id]}s remaining)`,
      };
    }
  }

  return { canUse: true, reason: "Ready" };
}

/**
 * Get skill display info with talent modifications shown
 * @param {Object} skill - The skill object
 * @param {string[]} activeTalentIds - Array of active talent IDs
 * @param {number} playerLevel - Current player level
 * @returns {Object} Display info with base and modified values
 */
export function getSkillDisplayInfo(
  skill,
  activeTalentIds = [],
  playerLevel = 1,
) {
  const modifiedSkill = getModifiedSkill(
    skill.id,
    activeTalentIds,
    playerLevel,
  );

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    type: skill.type,
    class: skill.class,
    ownerType: skill.ownerType || (skill.class === "universal" ? "universal" : "class"),
    ownerId: skill.ownerId || skill.class,
    level: skill.level,
    base: {
      manaCost: skill.manaCost,
      cooldown: skill.cooldown,
    },
    modified: {
      manaCost: modifiedSkill?.manaCost ?? skill.manaCost,
      cooldown: modifiedSkill?.cooldown ?? skill.cooldown,
      damageMultiplier: modifiedSkill?.damageMultiplier ?? 1,
      durationMultiplier: modifiedSkill?.durationMultiplier ?? 1,
      aoeMultiplier: modifiedSkill?.aoeMultiplier ?? 1,
    },
    bypasses: modifiedSkill?.bypasses || {},
    activeTalentMigrationLanes:
      modifiedSkill?.activeTalentMigrationLanes || getActiveTalentMigrationLanes(activeTalentIds),
    effects: skill.effects || [],
    lattice: skill.lattice || null,
    latticeFamily: skill.latticeFamily || null,
    runtimeRole: skill.runtimeRole || "standard",
    originTruths: Array.isArray(skill.originTruths) ? skill.originTruths : [],
    grandmaVoidBoundaryId: skill.grandmaVoidBoundaryId || null,
  };
}
