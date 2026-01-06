// =================================================================
// EFFECT REGISTRY
// Central repository for all status effect definitions
// =================================================================

/**
 * Standardized Effect Types
 */
export const EFFECT_TYPES = {
  BUFF: 'BUFF',
  DEBUFF: 'DEBUFF',
  DOT: 'DOT', // Damage over time
  HOT: 'HOT', // Heal over time
  CONTROL: 'CONTROL' // Stun, Freeze, etc.
};

/**
 * Stacking Behaviors
 */
export const STACKING_RULES = {
  DONT_STACK: 'DONT_STACK', // New application refreshes duration only
  STACK_DURATION: 'STACK_DURATION', // Add new duration to existing
  STACK_INTENSITY: 'STACK_INTENSITY', // Add new magnitude to existing
  INDEPENDENT: 'INDEPENDENT' // Track each instance separately
};

/**
 * EFFECT DEFINITIONS
 * Templates for creating concrete effect instances
 */
export const EFFECT_DEFINITIONS = {
  // --- BUFFS ---
  BLUR: {
    id: 'blur',
    name: 'Blur',
    type: EFFECT_TYPES.BUFF,
    description: 'Reduces enemy hit chance by 20%.',
    duration: 3, // Turns
    magnitude: 0.20,
    stacking: STACKING_RULES.DONT_STACK,
    onApply: (target, effect) => {
      // Logic handled in combat calculation via tag lookup
    },
    tags: ['DODGE_BOOST']
  },
  HASTE: {
    id: 'haste',
    name: 'Haste',
    type: EFFECT_TYPES.BUFF,
    description: 'Increases attack speed/initiative.',
    duration: 3,
    magnitude: 0.30,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ['SPEED_BOOST']
  },
  MIGHT: {
    id: 'might',
    name: 'Might',
    type: EFFECT_TYPES.BUFF,
    description: 'Increases physical damage.',
    duration: 5,
    magnitude: 0.20,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 5,
    tags: ['DMG_BOOST_PHYSICAL']
  },

  // --- DEBUFFS ---
  BURN: {
    id: 'burn',
    name: 'Burn',
    type: EFFECT_TYPES.DOT,
    description: 'Deals Fire damage at start of turn.',
    duration: 3,
    magnitude: 10, // Base damage per turn
    stacking: STACKING_RULES.INDEPENDENT,
    element: 'fire'
  },
  POISON: {
    id: 'poison',
    name: 'Poison',
    type: EFFECT_TYPES.DOT,
    description: 'Deals Nature damage at start of turn.',
    duration: 5,
    magnitude: 5,
    stacking: STACKING_RULES.STACK_INTENSITY,
    maxStacks: 10,
    element: 'nature'
  },
  STUN: {
    id: 'stun',
    name: 'Stun',
    type: EFFECT_TYPES.CONTROL,
    description: 'Cannot act this turn.',
    duration: 1,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ['SKIP_TURN']
  },
  FREEZE: {
    id: 'freeze',
    name: 'Freeze',
    type: EFFECT_TYPES.CONTROL,
    description: 'Frozen solid. Cannot act. Shatters on physical hit.',
    duration: 2,
    magnitude: 1,
    stacking: STACKING_RULES.DONT_STACK,
    tags: ['SKIP_TURN', 'WEAK_PHYSICAL']
  },
  BLEED: {
    id: 'bleed',
    name: 'Bleed',
    type: EFFECT_TYPES.DOT,
    description: 'Physical damage over time.',
    duration: 3,
    magnitude: 8,
    stacking: STACKING_RULES.STACK_INTENSITY,
    tags: ['PHYSICAL_DOT']
  }
};

/**
 * Helper to get an effect template
 */
export function getEffectDefinition(effectId) {
  const def = Object.values(EFFECT_DEFINITIONS).find(e => e.id === effectId);
  if (!def) {
    console.warn(`Effect definition not found for ID: ${effectId}`);
    return null;
  }
  return def;
}
