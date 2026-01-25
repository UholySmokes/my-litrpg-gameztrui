// =================================================================
// RACE REGISTRY SHIM
// Provides backward-compatible exports without duplicating data
// =================================================================

import {
  EFFECT_TAGS,
  RACE_TRAITS,
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
} from "../../data/registries/RaceDataRegistry.js";

export {
  EFFECT_TAGS,
  RACE_TRAITS,
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
