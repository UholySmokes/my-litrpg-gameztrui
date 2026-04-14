
// Magic System Unification Constants
// Central canonical definitions resolving inconsistencies across unified casting, ecology, engineProfile, SpellStudy

export const CANONICAL_ESSENCES = [
  'fire', 'water', 'earth', 'air', 'lightning', 'shadow', 'light', 'life',
  'creation', 'destruction', 'space', 'time'
];

export const ALIAS_MAP = {
  // Unified casting aliases
  'ice': 'water',
  'frost': 'water',
  'holy': 'light',
  'radiant': 'light',
  'dark': 'shadow',
  'nature': 'life',
  'arcane': 'creation',
  // engineProfile expansions
  'void': 'space',
  'temporal': 'time',
  // Add more as needed, e.g. SpellStudy conflicts resolved to canonical
};

export const DELIVERIES = ['instant', 'sustained', 'channeled'];

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

// Unified forms from task (superset resolving ecology/shape/weave/SpellStudy)
export const UNIFIED_FORMS = [
  'bolt', 'pulse', 'lance', 'cone', 'wall', 'shield', 'vortex', 'veil', 'lattice',
  'jet', 'burst', 'nova' // ecology/SpellStudy additions
];

// Form base data for computeResolution (invent reasonable defaults matching pseudocode scale)
export const FORM_DATA = {
  bolt: { baseMana: 4, baseStrain: 5, damage: 1.2 },
  pulse: { baseMana: 6, baseStrain: 4, damage: 1.0 },
  lance: { baseMana: 8, baseStrain: 7, damage: 1.5 },
  cone: { baseMana: 10, baseStrain: 8, damage: 1.1 },
  wall: { baseMana: 12, baseStrain: 6, damage: 0.8 },
  shield: { baseMana: 7, baseStrain: 3, damage: 0.0 }, // defensive
  vortex: { baseMana: 14, baseStrain: 10, damage: 1.3 },
  veil: { baseMana: 9, baseStrain: 5, damage: 0.5 },
  lattice: { baseMana: 11, baseStrain: 9, damage: 1.4 },
  jet: { baseMana: 5, baseStrain: 6, damage: 1.1 },
  burst: { baseMana: 7, baseStrain: 8, damage: 1.6 },
  nova: { baseMana: 15, baseStrain: 12, damage: 2.0 }
};

// Utility: canonicalize essence string
export function canonicalize(essence) {
  return ALIAS_MAP[essence.toLowerCase()] || essence.toLowerCase();
}

// Validate form/scale/delivery
export function validateSpellParams(form, scale, delivery) {
  const validForm = UNIFIED_FORMS.includes(form.toLowerCase());
  const validScale = Number.isInteger(scale) && scale >= SCALE_MIN && scale <= SCALE_MAX;
  const validDelivery = DELIVERIES.includes(delivery.toLowerCase());
  return { validForm, validScale, validDelivery };
}

