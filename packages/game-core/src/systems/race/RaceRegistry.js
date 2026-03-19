// =================================================================
// RACE REGISTRY SHIM
// Provides backward-compatible exports without duplicating data
// =================================================================

import * as RaceDataRegistry from "../../data/registries/RaceDataRegistry.js";

const {
  EFFECT_TAGS,
  RACE_TRAITS,
  RACE_ATTRIBUTE_MODIFIERS,
  races,
  getPassiveAbility,
  getHiddenTraits,
  hasRaceTag,
  getRaceEffectTags,
  getRaceEntityTags,
  getRaceRebirth,
  canRaceRebirth,
  getRandomStartBuff,
  getRandomDebuff,
  rollGambleCast,
  getRandomElementAbsorption,
} = RaceDataRegistry;

export {
  EFFECT_TAGS,
  RACE_TRAITS,
  RACE_ATTRIBUTE_MODIFIERS,
  races,
  getPassiveAbility,
  getHiddenTraits,
  hasRaceTag,
  getRaceEffectTags,
  getRaceEntityTags,
  getRaceRebirth,
  canRaceRebirth,
  getRandomStartBuff,
  getRandomDebuff,
  rollGambleCast,
  getRandomElementAbsorption,
};

export function getRacePassiveEffect(raceId) {
  const race = getRaceById(raceId);
  return race?.passiveAbility ?? null;
}

export function getRaceById(id) {
  return races.find((race) => race.id === id) || null;
}

export function applyRaceModifiers(baseAttributes, raceId) {
  const race = getRaceById(raceId);
  if (!race?.attributeModifiers) return { ...baseAttributes };

  const modified = { ...baseAttributes };
  for (const [attr, mod] of Object.entries(race.attributeModifiers)) {
    if (modified[attr] !== undefined) {
      modified[attr] = Math.max(1, modified[attr] + mod);
    }
  }
  return modified;
}
