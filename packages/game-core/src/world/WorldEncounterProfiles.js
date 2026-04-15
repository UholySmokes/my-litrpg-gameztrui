import { DEFAULT_START_ZONE_ID, resolveZoneId } from "./WorldDataRegistry.js";

const DEFAULT_SKIRMISH_ENCOUNTERS = Object.freeze(["goblin", "slime", "bandit"]);

export const WORLD_SKIRMISH_ENCOUNTER_POOLS = Object.freeze({
  sunvault_crown: Object.freeze(["bandit", "goblin", "slime", "giant_rat"]),
  gravewell_mantle: Object.freeze(["giant_rat", "goblin", "slime", "wolf"]),
  auric_crown: Object.freeze(["bandit", "slime", "giant_rat"]),
  skybound_marches: Object.freeze(["bandit", "goblin", "slime"]),
  glassstep_expanse: Object.freeze(["bandit", "slime", "goblin", "giant_rat"]),
  emberline_archipelago: Object.freeze(["slime", "goblin", "wolf", "bandit"]),
  veilward_depths: Object.freeze(["giant_rat", "slime", "bandit", "goblin"]),
  wildroot_basin: Object.freeze(["wolf", "slime", "giant_rat", "wild_boar"]),
  frostveil_reach: Object.freeze(["wolf", "goblin", "slime", "giant_rat"]),
  dawnreef_tangle: Object.freeze(["slime", "wolf", "bandit", "goblin"]),
  bloodwake_dominion: Object.freeze(["bandit", "wolf", "wild_boar", "goblin"]),
  thunderplate_steppe: Object.freeze(["wolf", "wild_boar", "bandit", "goblin"]),
  ossuary_vale: Object.freeze(["giant_rat", "goblin", "slime", "bandit"]),
  hollowroot_deep: Object.freeze(["wolf", "giant_rat", "slime", "wild_boar"]),
  riftscar_barrens: Object.freeze(["goblin", "slime", "bandit", "giant_rat"]),
  moonfen_coil: Object.freeze(["slime", "giant_rat", "wolf", "goblin"]),
  ironquake_shelf: Object.freeze(["goblin", "wolf", "bandit", "wild_boar"]),
  lucent_verge: Object.freeze(["slime", "goblin", "bandit", "giant_rat"]),
});

const DEFAULT_ATTACK_ENCOUNTER_POOLS = Object.freeze([
  Object.freeze(["goblin", "slime"]),
  Object.freeze(["giant_rat", "goblin"]),
  Object.freeze(["bandit"]),
]);

function normalizeEncounterPool(pool = []) {
  return Array.from(new Set((Array.isArray(pool) ? pool : []).filter(Boolean)));
}

function buildAttackEncounterPools(pool = []) {
  const normalized = normalizeEncounterPool(pool);
  if (normalized.length === 0) return DEFAULT_ATTACK_ENCOUNTER_POOLS;
  if (normalized.length === 1) {
    return Object.freeze([Object.freeze([normalized[0]])]);
  }
  if (normalized.length === 2) {
    return Object.freeze([
      Object.freeze([normalized[0]]),
      Object.freeze([normalized[0], normalized[1]]),
      Object.freeze([normalized[1]]),
    ]);
  }
  return Object.freeze([
    Object.freeze([normalized[0]]),
    Object.freeze([normalized[0], normalized[1]]),
    Object.freeze([normalized[1], normalized[2]]),
  ]);
}

export function resolveEncounterZoneId(zoneId) {
  return resolveZoneId(zoneId) || DEFAULT_START_ZONE_ID;
}

export function getSkirmishEncounterPool(zoneId) {
  return (
    WORLD_SKIRMISH_ENCOUNTER_POOLS[resolveEncounterZoneId(zoneId)] ||
    DEFAULT_SKIRMISH_ENCOUNTERS
  );
}

export function getAttackEncounterPools(zoneId) {
  return buildAttackEncounterPools(getSkirmishEncounterPool(zoneId));
}
