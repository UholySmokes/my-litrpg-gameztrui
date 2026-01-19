const PRIORITY = {
  ABSOLUTE: "ABSOLUTE",
  HIGH: "HIGH",
  NORMAL: "NORMAL",
};

import talentRegistry from "../../data/talent.registry.json" with { type: "json" };
import {
  getTalentClassById,
  getAllTalentClasses as _getAllTalentClasses,
} from "./TalentRegistry.js";
import {
  getTalentComponent,
  getTalentMagnitude,
  collectBypassFlags,
} from "./TalentDefinitions.js";

// Build rules from JSON registry (administrative layer)
const REGISTRY_MAP = new Map(
  (talentRegistry?.talents || []).map((t) => [t.id, t]),
);

const TALENT_RULES = {
  infinite_mana_regen: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { bypassCost: true, infiniteManaRegen: true },
    phrase: "Zero-Depletion",
  },
  mana_cost_zero: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { bypassCost: true },
    phrase: "Zero-Depletion",
  },
  cooldown_removal: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { bypassCooldown: true },
    phrase: "Cooldown-Nullification",
  },
  damage_immunity: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { damageImmune: true },
    phrase: "Total-Damage-Null",
  },
  death_immunity: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { deathImmune: true },
    phrase: "Termination-Block",
  },
  critical_guarantee: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { overrideCrit: "guaranteed" },
    phrase: "Critical-Assertion",
  },
  hundred_percent_drop: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { ignoreDropRates: true },
    phrase: "Drop-Guarantee",
  },
  override_drop_quality: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { overrideDropQuality: "legendary" },
    phrase: "Quality-Override",
  },
  status_immunity: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { statusImmune: true },
    phrase: "Status-Nullification",
  },
  remove_stat_cap: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { removeStatCap: true },
    phrase: "Cap-Removal",
  },
  control_rng: {
    priority: PRIORITY.ABSOLUTE,
    ruleBreaker: { controlRng: true },
    phrase: "RNG-Control",
  },
};

// Build rule-breaker objects from registry entries
function buildTalentRuleBreaker(id, entry) {
  const existing = TALENT_RULES[id] || {};
  const actions = entry.actions || {};
  const mergedRuleBreaker = { ...existing.ruleBreaker };

  if (actions.mana === "zero") mergedRuleBreaker.bypassCost = true;
  if (actions.cooldown === "zero") mergedRuleBreaker.bypassCooldown = true;
  if (actions.crit === "guaranteed")
    mergedRuleBreaker.overrideCrit = "guaranteed";
  if (
    actions.crit &&
    typeof actions.crit === "object" &&
    actions.crit.multiplier
  ) {
    mergedRuleBreaker.critMultiplierOverride = actions.crit.multiplier;
  }
  if (actions.drop === "force") mergedRuleBreaker.ignoreDropRates = true;
  if (
    actions.drop &&
    typeof actions.drop === "object" &&
    actions.drop.quality
  ) {
    mergedRuleBreaker.overrideDropQuality = actions.drop.quality;
  }
  if (actions.status === "immune") mergedRuleBreaker.statusImmune = true;
  if (actions.damage === "immune") mergedRuleBreaker.damageImmune = true;
  if (actions.death === "immune") mergedRuleBreaker.deathImmune = true;
  if (actions.stat === "uncapped") mergedRuleBreaker.removeStatCap = true;
  if (actions.rng === "controlled") mergedRuleBreaker.controlRng = true;

  TALENT_RULES[id] = {
    priority: entry.priority || existing.priority || PRIORITY.NORMAL,
    ruleBreaker: mergedRuleBreaker,
    phrase: entry.phrase || existing.phrase || "Directive-Engaged",
    strainCost: entry.strainCost ?? 0,
  };
}

// Initialize rule-breakers from registry at module load
for (const [id, entry] of REGISTRY_MAP.entries()) {
  buildTalentRuleBreaker(id, entry);
}

function getTalentRule(id) {
  return TALENT_RULES[id] || null;
}

/**
 * Calculate magnitude based on player level using component-based system
 * Falls back to class hierarchy for legacy talents
 */
function calculateMagnitude(talentId, playerLevel) {
  // Try component-based system first
  const component = getTalentComponent(talentId);
  if (component?.magnitudeThresholds) {
    const mag = getTalentMagnitude(talentId, playerLevel);
    return {
      ...mag,
      description: `${mag.label} - ${component.description || "Talent effect"}`,
    };
  }

  // Fall back to class-based system
  try {
    const cls = getTalentClassById(talentId);
    return cls.calculateMagnitude(playerLevel);
  } catch (error) {
    console.warn(
      `Failed to calculate magnitude for talent ${talentId}:`,
      error,
    );
    return {
      label: "Region-Scale",
      aoeRadius: 50,
      damageCap: 1000,
      description: "Local area influence (fallback)",
    };
  }
}

/**
 * Get magnitude caps for a talent at specific player level
 */
export function getMagnitudeCaps(talentId, playerLevel) {
  const mag = calculateMagnitude(talentId, playerLevel);
  return {
    aoeRadius: mag.aoeRadius,
    damageCap: mag.damageCap,
    label: mag.label,
    description: mag.description,
  };
}

/**
 * Apply damage cap based on magnitude limits
 */
export function applyMagnitudeDamageCap(damage, caps) {
  if (!caps?.damageCap) return damage;
  return Math.min(damage, caps.damageCap);
}

/**
 * Check if talent exists and is valid
 */
function isValidTalent(talentId) {
  return !!getTalentRule(talentId) || !!getTalentClassById(talentId);
}

/**
 * Get talent description with system-style formatting
 */
function getTalentSystemDescription(talentId) {
  const talentClass = getTalentClassById(talentId);
  if (talentClass && typeof talentClass.getSystemDescription === "function") {
    return talentClass.getSystemDescription();
  }

  const rule = getTalentRule(talentId);
  if (rule?.phrase) {
    return `PROTOCOL: ${rule.phrase.toUpperCase()}_INITIATED`;
  }

  return `PROTOCOL: ${talentId.toUpperCase()}_SYSTEM_ONLINE`;
}

/**
 * Get magnitude description for display
 */
function getMagnitudeDescription(talentId, playerLevel) {
  const mag = calculateMagnitude(talentId, playerLevel);
  const talentClass = getTalentClassById(talentId);

  if (talentClass && typeof talentClass.describeMagnitude === "function") {
    return talentClass.describeMagnitude(mag);
  }

  return `${mag.label} - ${mag.description}`;
}

export function resolveBypasses(talentIds = []) {
  // First try component-based bypass collection
  const componentBypasses = collectBypassFlags(talentIds);

  // Then merge with legacy rule-based bypasses
  const active = talentIds
    .map((id) => ({ id, rule: getTalentRule(id) }))
    .filter((x) => x.rule);
  const absolute = active.filter((x) => x.rule.priority === PRIORITY.ABSOLUTE);
  const high = active.filter((x) => x.rule.priority === PRIORITY.HIGH);
  const legacyBypasses = {};
  for (const item of absolute)
    Object.assign(legacyBypasses, item.rule.ruleBreaker);
  for (const item of high)
    for (const [k, v] of Object.entries(item.rule.ruleBreaker))
      if (legacyBypasses[k] === undefined) legacyBypasses[k] = v;

  // Component bypasses take precedence
  return { ...legacyBypasses, ...componentBypasses };
}

export function applyCostOverride(baseCost, bypasses) {
  if (bypasses.bypassCost) return 0;
  if (typeof bypasses.costMultiplier === "number")
    return Math.floor(baseCost * bypasses.costMultiplier);
  return baseCost;
}

export function applyCooldownOverride(baseCd, bypasses) {
  if (bypasses.bypassCooldown) return 0;
  if (typeof bypasses.cooldownMultiplier === "number")
    return Math.floor(baseCd * bypasses.cooldownMultiplier);
  return baseCd;
}

export function applyCritOverride(baseChance, bypasses) {
  if (bypasses.overrideCrit === "guaranteed") return 1;
  return baseChance;
}

export function applyCritMultiplier(baseMultiplier, bypasses) {
  if (typeof bypasses.critMultiplierOverride === "number")
    return bypasses.critMultiplierOverride;
  return baseMultiplier;
}

/**
 * Apply drop chance override based on talent bypasses
 */
export function applyDropOverrides(baseDropChance, bypasses) {
  if (bypasses.ignoreDropRates) return 1; // 100% drop rate
  if (typeof bypasses.dropChanceMultiplier === "number") {
    return Math.min(1, baseDropChance * bypasses.dropChanceMultiplier);
  }
  return baseDropChance;
}

/**
 * Get comprehensive talent information
 */
export function getTalentInfo(talentId, playerLevel = 1) {
  const rule = getTalentRule(talentId);
  const talentClass = getTalentClassById(talentId);
  const magnitude = calculateMagnitude(talentId, playerLevel);
  const systemDescription = getTalentSystemDescription(talentId);
  const magnitudeDescription = getMagnitudeDescription(talentId, playerLevel);

  return {
    id: talentId,
    rule: rule,
    talentClass: talentClass,
    magnitude: magnitude,
    systemDescription: systemDescription,
    magnitudeDescription: magnitudeDescription,
    isValid: isValidTalent(talentId),
    priority: rule?.priority || PRIORITY.NORMAL,
  };
}

/**
 * Get all talents with their information
 */
export function getAllTalentInfo(playerLevel = 1) {
  const allTalentClasses = _getAllTalentClasses();
  const talentInfo = [];

  for (const TalentClass of allTalentClasses) {
    const talent = new TalentClass();
    const info = getTalentInfo(talent.id, playerLevel);
    talentInfo.push(info);
  }

  // Also include talents from registry
  for (const talentId of Object.keys(TALENT_RULES)) {
    if (!talentInfo.find((t) => t.id === talentId)) {
      const info = getTalentInfo(talentId, playerLevel);
      talentInfo.push(info);
    }
  }

  return talentInfo;
}

/**
 * Filter talents by criteria
 */
function filterTalents(filterFn, playerLevel = 1) {
  const allTalents = getAllTalentInfo(playerLevel);
  return allTalents.filter(filterFn);
}

/**
 * Get talents by priority level
 */
export function getTalentsByPriority(priority, playerLevel = 1) {
  return filterTalents((talent) => talent.priority === priority, playerLevel);
}

/**
 * Get talents by type
 */
export function getTalentsByType(type, playerLevel = 1) {
  return filterTalents(
    (talent) => talent.talentClass?.type === type,
    playerLevel,
  );
}

export const TalentDiagnostics = {
  getTalentInfo,
  getAllTalentInfo,
  getTalentsByPriority,
  getTalentsByType,
};
