// =================================================================
// EFFECT REGISTRY
// Central repository for all status effect definitions
// =================================================================

/**
 * Standardized Effect Types
 */
export const EFFECT_TYPES = {
  BUFF: "BUFF",
  DEBUFF: "DEBUFF",
  DOT: "DOT", // Damage over time
  HOT: "HOT", // Heal over time
  CONTROL: "CONTROL", // Stun, Freeze, etc.
};

/**
 * Stacking Behaviors
 */
export const STACKING_RULES = {
  DONT_STACK: "DONT_STACK", // New application refreshes duration only
  STACK_DURATION: "STACK_DURATION", // Add new duration to existing
  STACK_INTENSITY: "STACK_INTENSITY", // Add new magnitude to existing
  INDEPENDENT: "INDEPENDENT", // Track each instance separately
};

/**
 * EFFECT DEFINITIONS
 * Templates for creating concrete effect instances
 */
const EFFECT_DEFINITIONS = {
  // --- BUFFS ---
  BLUR: {
    id: "blur",
    name: "Blur",
    type: EFFECT_TYPES.BUFF,
    description: "Reduces enemy hit chance by 20%.",
    duration: 3, // Turns
    magnitude: 0.2,
    stacking: STACKING_RULES.DONT_STACK,
    onApply: () => {
      // Logic handled in combat calculation via tag lookup
    },
    tags: ["DODGE_BOOST"],
  },
  HASTE: {
    id: "haste",
    name: "Haste",
    type: EFFECT_TYPES.BUFF,
    description: "Increases attack speed/initiative.",
    duration: 3,
    magnitude: 0.3,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["SPEED_BOOST"],
  },
  MIGHT: {
    id: "might",
    name: "Might",
    type: EFFECT_TYPES.BUFF,
    description: "Increases physical damage.",
    duration: 5,
    magnitude: 0.2,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 5,
    tags: ["DMG_BOOST_PHYSICAL"],
  },

  // --- DEBUFFS ---
  BURN: {
    id: "burn",
    name: "Burn",
    type: EFFECT_TYPES.DOT,
    description: "Deals Fire damage at start of turn.",
    duration: 3,
    magnitude: 10, // Base damage per turn
    stacking: STACKING_RULES.INDEPENDENT,
    element: "fire",
  },
  POISON: {
    id: "poison",
    name: "Poison",
    type: EFFECT_TYPES.DOT,
    description: "Deals Nature damage at start of turn.",
    duration: 5,
    magnitude: 5,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 10,
    element: "nature",
  },
  FROSTBITE: {
    id: "frostbite",
    name: "Frostbite",
    type: EFFECT_TYPES.DOT,
    description: "Cold damage over time and slows the target.",
    duration: 3,
    magnitude: 6,
    stacking: STACKING_RULES.STACK_DURATION,
    element: "ice",
    tags: ["SLOW"],
  },
  SHOCK: {
    id: "shock",
    name: "Shock",
    type: EFFECT_TYPES.DEBUFF,
    description: "Disrupts focus, increasing damage taken.",
    duration: 2,
    magnitude: 0.1,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 3,
    tags: ["VULNERABLE"],
  },
  RADIANT_MARK: {
    id: "radiant_mark",
    name: "Radiant Mark",
    type: EFFECT_TYPES.DEBUFF,
    description: "Marked by light, taking increased damage.",
    duration: 3,
    magnitude: 0.12,
    stacking: STACKING_RULES.STACK_DURATION,
    tags: ["VULNERABLE"],
  },
  CURSE: {
    id: "curse",
    name: "Curse",
    type: EFFECT_TYPES.DEBUFF,
    description: "A dark hex that makes the target vulnerable.",
    duration: 3,
    magnitude: 0.12,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 3,
    tags: ["VULNERABLE"],
  },
  SUNDER: {
    id: "sunder",
    name: "Sunder",
    type: EFFECT_TYPES.DEBUFF,
    description: "Shredded defenses.",
    duration: 3,
    magnitude: 0.15,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 5,
    tags: ["DEFENSE_DOWN"],
  },
  STUN: {
    id: "stun",
    name: "Stun",
    type: EFFECT_TYPES.CONTROL,
    description: "Cannot act this turn.",
    duration: 1,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["SKIP_TURN"],
  },
  FREEZE: {
    id: "freeze",
    name: "Freeze",
    type: EFFECT_TYPES.CONTROL,
    description: "Frozen solid. Cannot act. Shatters on physical hit.",
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["SKIP_TURN", "WEAK_PHYSICAL"],
  },
  BLEED: {
    id: "bleed",
    name: "Bleed",
    type: EFFECT_TYPES.DOT,
    description: "Physical damage over time.",
    duration: 3,
    magnitude: 8,
    stacking: STACKING_RULES.STACK_INTENSITY,
    tags: ["PHYSICAL_DOT"],
  },

  // --- CONTROL EFFECTS ---
  CHARM: {
    id: "charm",
    name: "Charm",
    type: EFFECT_TYPES.CONTROL,
    description: "Forced to attack allies.",
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["ATTACK_ALLIES"],
  },
  CONFUSE: {
    id: "confuse",
    name: "Confuse",
    type: EFFECT_TYPES.CONTROL,
    description: "50% chance to attack self or miss.",
    duration: 3,
    magnitude: 0.5,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["RANDOM_TARGET", "MISS_CHANCE"],
  },
  TAUNT: {
    id: "taunt",
    name: "Taunt",
    type: EFFECT_TYPES.CONTROL,
    description: "Forced to target the taunter.",
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["FORCE_TARGET"],
  },
  SILENCE: {
    id: "silence",
    name: "Silence",
    type: EFFECT_TYPES.CONTROL,
    description: "Cannot use magical abilities.",
    duration: 3,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["BLOCK_MAGIC"],
  },
  DISARM: {
    id: "disarm",
    name: "Disarm",
    type: EFFECT_TYPES.CONTROL,
    description: "Cannot use weapon attacks.",
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["BLOCK_PHYSICAL"],
  },
  ROOT: {
    id: "root",
    name: "Root",
    type: EFFECT_TYPES.CONTROL,
    description: "Cannot move but can still attack.",
    duration: 3,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["IMMOBILE"],
  },

  // --- UTILITY EFFECTS ---
  INVISIBLE: {
    id: "invisible",
    name: "Invisible",
    type: EFFECT_TYPES.BUFF,
    description: "Cannot be targeted by enemies.",
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["UNTARGETABLE"],
  },
  TRANSFORM: {
    id: "transform",
    name: "Transform",
    type: EFFECT_TYPES.BUFF,
    description: "Changed form with altered stats.",
    duration: 5,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["FORM_CHANGE"],
  },
  SHIELD: {
    id: "shield",
    name: "Shield",
    type: EFFECT_TYPES.BUFF,
    description: "Absorbs incoming damage.",
    duration: 3,
    magnitude: 50, // Damage absorbed
    stacking: STACKING_RULES.INDEPENDENT,
    tags: ["DAMAGE_ABSORB"],
  },
  REFLECT: {
    id: "reflect",
    name: "Reflect",
    type: EFFECT_TYPES.BUFF,
    description: "Reflects 25% of damage taken.",
    duration: 4,
    magnitude: 0.25,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["DAMAGE_REFLECT"],
  },
  SLOW: {
    id: "slow",
    name: "Slow",
    type: EFFECT_TYPES.DEBUFF,
    description: "Reduces attack speed/initiative.",
    duration: 3,
    magnitude: -0.3,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ["SPEED_REDUCTION"],
  },
};

/**
 * Helper to get an effect template
 */
export function getEffectDefinition(effectId) {
  const def = Object.values(EFFECT_DEFINITIONS).find((e) => e.id === effectId);
  if (!def) {
    console.warn(`Effect definition not found for ID: ${effectId}`);
    return null;
  }
  return def;
}
