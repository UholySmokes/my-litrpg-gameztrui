import talentRegistry from "../../data/talent.registry.json" with { type: "json" };
import {
  PERSISTENT_LATTICE_MODIFIER_BLACKLIST,
  canPersistentLatticeModifierContainTalent,
} from "./LivingLatticeSystem.js";

export const TALENT_MIGRATION_LANES = Object.freeze([
  "direct_native_miracle",
  "persistent_lattice_modifier",
  "external_contract_only",
]);

const DIRECT_NATIVE_TALENTS = new Set([
  "infinite_mana_regen",
  "mana_cost_zero",
  "cooldown_removal",
  "damage_immunity",
  "death_immunity",
  "critical_guarantee",
  "status_immunity",
]);
const EXTERNAL_CONTRACT_TALENTS = new Set([
  "hundred_percent_drop",
  "override_drop_quality",
  "remove_stat_cap",
  "control_rng",
]);
const ABSOLUTE_ACTION_KEYS = new Set([
  "mana",
  "cooldown",
  "damage",
  "death",
  "crit",
  "drop",
  "status",
  "stat",
  "rng",
]);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function getRegistryEntries() {
  return Array.isArray(talentRegistry?.talents) ? talentRegistry.talents : [];
}

function getTalentEntry(talentId) {
  return getRegistryEntries().find((entry) => entry?.id === talentId) || null;
}

function normalizeActions(entry) {
  return entry && typeof entry.actions === "object" && !Array.isArray(entry.actions)
    ? entry.actions
    : {};
}

function hasAbsoluteAction(entry) {
  const actions = normalizeActions(entry);
  return Object.keys(actions).some((key) => ABSOLUTE_ACTION_KEYS.has(normalizeString(key)));
}

function classifyLane(entry) {
  if (!entry || typeof entry !== "object") {
    return {
      lane: "persistent_lattice_modifier",
      reason: "Missing talent definition; defaulting to bounded persistent lane.",
    };
  }

  if (EXTERNAL_CONTRACT_TALENTS.has(entry.id)) {
    return {
      lane: "external_contract_only",
      reason: "Talent forces outcomes that belong to external authority contracts.",
    };
  }

  if (DIRECT_NATIVE_TALENTS.has(entry.id)) {
    return {
      lane: "direct_native_miracle",
      reason: "Talent is a short-window impossible effect best represented as a native miracle.",
    };
  }

  if (hasAbsoluteAction(entry) || entry.priority === "ABSOLUTE") {
    return {
      lane: "direct_native_miracle",
      reason: "Absolute actions cannot remain always-on inside the persistent lattice lane.",
    };
  }

  return {
    lane: "persistent_lattice_modifier",
    reason: "Talent is a bounded passive or identity modifier suitable for persistent lattice integration.",
  };
}

export function getTalentMigrationLane(talentId, entry = null) {
  const resolvedEntry = entry || getTalentEntry(talentId);
  return classifyLane(resolvedEntry).lane;
}

export function validateTalentMigrationAssignment(talentId, lane, entry = null) {
  const resolvedEntry = entry || getTalentEntry(talentId);
  const normalizedLane = normalizeString(lane);
  const errors = [];

  if (!TALENT_MIGRATION_LANES.includes(normalizedLane)) {
    errors.push(`Unknown migration lane: ${JSON.stringify(lane)}`);
  }
  if (
    normalizedLane === "persistent_lattice_modifier" &&
    !canPersistentLatticeModifierContainTalent(talentId)
  ) {
    errors.push(
      `${talentId} is blacklisted from persistent_lattice_modifier and must move to a miracle or contract lane.`,
    );
  }
  if (
    normalizedLane === "persistent_lattice_modifier" &&
    resolvedEntry &&
    (resolvedEntry.priority === "ABSOLUTE" || hasAbsoluteAction(resolvedEntry))
  ) {
    errors.push(
      `${talentId} contains absolute actions and cannot remain a persistent lattice modifier.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getTalentMigrationAudit() {
  return getRegistryEntries().map((entry) => {
    const { lane, reason } = classifyLane(entry);
    const validation = validateTalentMigrationAssignment(entry.id, lane, entry);
    return {
      id: entry.id,
      priority: entry.priority || "NORMAL",
      lane,
      reason,
      blacklistedFromPersistent: PERSISTENT_LATTICE_MODIFIER_BLACKLIST.includes(entry.id),
      valid: validation.valid,
      errors: validation.errors,
    };
  });
}
