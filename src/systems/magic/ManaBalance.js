/* eslint-disable no-unused-vars */
/* ManaBalance.js - Unified Casting Resolution Engine
 * Implements canonical computeResolution formula from review task.
 * Resolves manaCost, strainGain, damageMult etc. for spells.
 * Handles essence canonicalization, form/scale/delivery validation.
 */

import { 
  canonicalize, 
  FORM_DATA, 
  UNIFIED_FORMS, 
  DELIVERIES, 
  SCALE_MIN, 
  SCALE_MAX 
} from './constants.js';

const ROUND_MODES = {
  manaCost: Math.round,
  strainGain: Math.round,
  damageMultiplier: x => Math.round(x * 100) / 100, // round2 pseudocode
  resonanceGain: x => Math.round(x * 10) / 10, // round1
  backfireDamage: x => Math.floor(x)
};

export function computeResolution(params) {
  const {
    form,
    scale = 1,
    essences = [],
    delivery = 'instant',
    classManaMult = 1,
    classStrainMult = 1,
    attuneManaMult = 1,
    attuneStrainMult = 1,
    potencyBias = 0,
    ambientPotency = 1,
    attunePotency = 1,
    manaCurrent,
    strainCurrent,
    strainMax
  } = params;

  // Canonicalize primary essence (first)
  const primaryEssence = canonicalize(essences[0] || 'fire');
  const extraEssences = Math.max(0, essences.length - 1);

  // Validate
  const formLower = form.toLowerCase();
  const validForm = UNIFIED_FORMS.includes(formLower);
  const validScale = Number.isInteger(scale) && scale >= SCALE_MIN && scale <= SCALE_MAX;
  const validDelivery = DELIVERIES.includes(delivery.toLowerCase());
  if (!validForm || !validScale || !validDelivery) {
    return { error: `Invalid params: form=${formLower} (valid: ${UNIFIED_FORMS.slice(0,5).join(', ')}...), scale=${scale} (1-5), delivery=${delivery}` };
  }

  const fData = FORM_DATA[formLower];
  if (!fData) {
    return { error: `Unknown form: ${formLower}` };
  }

  // Base costs
  let baseMana = fData.baseMana + scale * 3 + extraEssences * 4;
  let deliveryAdd = 0;
  const delLower = delivery.toLowerCase();
  if (delLower === 'sustained') deliveryAdd = 4;
  else if (delLower === 'channeled') deliveryAdd = 2;
  baseMana += deliveryAdd;

  let baseStrain = fData.baseStrain + scale * 4 + extraEssences * 5;
  let strainAdd = 0;
  if (delLower === 'sustained') strainAdd = 6;
  else if (delLower === 'channeled') strainAdd = 3;
  baseStrain += strainAdd;

  // Final costs
  const manaCost = Math.max(1, ROUND_MODES.manaCost(baseMana * classManaMult * attuneManaMult));
  const strainGain = Math.max(1, ROUND_MODES.strainGain(baseStrain * classStrainMult * attuneStrainMult));

  // Fail check
  if (manaCurrent !== undefined && manaCurrent < manaCost) {
    return { failed: true, reason: 'Insufficient mana', manaCost, manaCurrent };
  }

  // Overload
  const overload = Math.max(0, strainCurrent + strainGain - strainMax);
  const backfireDamage = overload > 0 ? Math.max(1, ROUND_MODES.backfireDamage(overload / 4)) : 0;

  // Damage mult
  const damageMultiplier = ROUND_MODES.damageMultiplier(
    fData.damage +
    scale * 0.14 +
    extraEssences * 0.12 +
    potencyBias +
    (ambientPotency - 1) * 0.5 +
    (attunePotency - 1) * 0.65
  );

  // Resonance
  let resonanceGain = ROUND_MODES.resonanceGain(
    1.5 + scale * 1.6 + extraEssences * 1.4 +
    (delLower === 'sustained' ? 2.2 : delLower === 'channeled' ? 1.4 : 0)
  );

  return {
    success: true,
    primaryEssence,
    extraEssencesCount: extraEssences,
    manaCost,
    strainGain,
    overload,
    backfireDamage,
    damageMultiplier,
    resonanceGain,
    debug: { baseMana, baseStrain, deliveryAdd: deliveryAdd, strainAdd }
  };
}

// Example usage
// computeResolution({ form: 'bolt', scale: 2, essences: ['fire', 'arcane'], delivery: 'channeled', classManaMult: 0.9, manaCurrent: 20 })

export default computeResolution;

