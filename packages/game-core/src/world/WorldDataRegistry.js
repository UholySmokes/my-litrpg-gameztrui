import { createWorldRegistryRuntime } from "./WorldRegistryRuntime.js";
import {
  BIOME_ESSENCE_PROFILES,
  DEFAULT_START_LOCATION_ID,
  DEFAULT_START_ZONE_ID,
  DEFAULT_WORLD_FACTIONS,
  DEFAULT_WORLD_LOCATIONS,
  DEFAULT_WORLD_ZONES,
  ESSENCE_ANOMALY_DEFS,
  LEGACY_ZONE_ID_MAP,
  MAJOR_FACTION_IDS,
  RARE_ESSENCE_SOURCE_DEFS,
  STARTING_LANDMASS_IDS,
  WORLD_ATLAS_LANDMASSES,
  WORLD_FLAG_DEFAULTS,
  WORLD_META,
} from "./CrowngraveWorldRegistryData.js";

export {
  BIOME_ESSENCE_PROFILES,
  DEFAULT_START_LOCATION_ID,
  DEFAULT_START_ZONE_ID,
  ESSENCE_ANOMALY_DEFS,
  LEGACY_ZONE_ID_MAP,
  MAJOR_FACTION_IDS,
  RARE_ESSENCE_SOURCE_DEFS,
  STARTING_LANDMASS_IDS,
  WORLD_ATLAS_LANDMASSES,
  WORLD_FLAG_DEFAULTS,
  WORLD_META,
};

export let factions = [...DEFAULT_WORLD_FACTIONS];
export let zones = [...DEFAULT_WORLD_ZONES];
export let locations = [...DEFAULT_WORLD_LOCATIONS];

let worldRuntime = createWorldRegistryRuntime({
  factions,
  zones,
  locations,
  defaultStartLocationId: DEFAULT_START_LOCATION_ID,
});

export function getRareEssenceSourceById(id) {
  if (!id) return null;
  const key = typeof id === "string" ? id.trim().toLowerCase() : "";
  return RARE_ESSENCE_SOURCE_DEFS[key] || null;
}

export function getEssenceAnomalyById(id) {
  if (!id) return null;
  const key = typeof id === "string" ? id.trim().toLowerCase() : "";
  return ESSENCE_ANOMALY_DEFS[key] || null;
}

export function getEssenceAnomalyIdsForBiome(biomeId) {
  const key = typeof biomeId === "string" ? biomeId.trim().toLowerCase() : "";
  return Object.values(ESSENCE_ANOMALY_DEFS)
    .filter((def) => Array.isArray(def.allowedBiomes) && def.allowedBiomes.includes(key))
    .map((def) => def.id);
}

export function getBiomeEssenceProfile(biomeId) {
  const key = typeof biomeId === "string" ? biomeId.trim().toLowerCase() : "";
  return BIOME_ESSENCE_PROFILES[key] || null;
}

export function setWorldRegistry({
  factions: nextFactions,
  zones: nextZones,
  locations: nextLocations,
} = {}) {
  if (Array.isArray(nextFactions)) factions = nextFactions;
  if (Array.isArray(nextZones)) zones = nextZones;
  if (Array.isArray(nextLocations)) locations = nextLocations;

  worldRuntime = createWorldRegistryRuntime({
    factions,
    zones,
    locations,
    defaultStartLocationId: DEFAULT_START_LOCATION_ID,
  });
}

export function getFactionById(id) {
  return worldRuntime.getFactionById(id);
}

export function getZoneById(id) {
  return worldRuntime.getZoneById(id);
}

export function getLocationById(id) {
  return worldRuntime.getLocationById(id);
}

export function findLocationsByZone(zoneId) {
  return worldRuntime.findLocationsByZone(zoneId);
}

export function getFactionSummaries() {
  return worldRuntime.getFactionSummaries();
}

export function getZoneSummaries() {
  return worldRuntime.getZoneSummaries();
}

export function getLocationSummaries() {
  return worldRuntime.getLocationSummaries();
}

export function resolveLocationId(raw, { allowedLocationIds } = {}) {
  return worldRuntime.resolveLocationId(raw, { allowedLocationIds });
}

export function resolveZoneId(raw) {
  return worldRuntime.resolveZoneId(raw);
}

export function getZoneEntryLocationId(zoneId, { allowedLocationIds } = {}) {
  return worldRuntime.getZoneEntryLocationId(zoneId, { allowedLocationIds });
}

export function resolveTravelLocationId(raw, { allowedLocationIds } = {}) {
  return worldRuntime.resolveTravelLocationId(raw, { allowedLocationIds });
}

export function resolveStartingLocationId(raw, { fallbackLocationId } = {}) {
  return worldRuntime.resolveStartingLocationId(raw, { fallbackLocationId });
}

export function getAccessibleLocationIds(gameState) {
  return worldRuntime.getAccessibleLocationIds(gameState);
}
