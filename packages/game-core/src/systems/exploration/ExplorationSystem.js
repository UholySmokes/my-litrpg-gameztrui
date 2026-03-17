import { addXp } from '../leveling/LevelingManager.js';
import {
  getAccessibleLocationIds,
  getLocationById,
  getZoneById,
  getBiomeEssenceProfile,
  getEssenceAnomalyById,
  getEssenceAnomalyIdsForBiome,
  resolveLocationId,
} from "../../world/WorldDataRegistry.js";
import { hasCreationPerk } from "../../core/creationPerks.js";

/**
 * Moves the player to a new location
 * @param {object} state - The current game state object
 * @param {string} locationId - The ID of the location to move to
 * @returns {object} A new game state object with updated location
 */
export function moveToLocation(state, locationId) {
  const world = { ...state.world };
  const worldVars =
    world.vars && typeof world.vars === "object" && !Array.isArray(world.vars)
      ? world.vars
      : {};
  const locationState =
    world.location && typeof world.location === "object" && !Array.isArray(world.location)
      ? world.location
      : {
          current: typeof world.location === "string" ? world.location : null,
          visited: [],
          unlockedAreas: [],
        };
  const visitedLocations = Array.isArray(locationState.visited)
    ? [...locationState.visited]
    : [];
  const unlockedAreas = Array.isArray(locationState.unlockedAreas)
    ? [...locationState.unlockedAreas]
    : [];
  const currentRaw = locationState.current ?? "starting_zone";
  const currentId =
    resolveLocationId(currentRaw) ||
    (typeof currentRaw === "string" ? currentRaw.trim() : null);

  const allowedLocationIds = getAccessibleLocationIds(state);
  const resolvedTargetId = resolveLocationId(locationId, { allowedLocationIds });
  if (!resolvedTargetId) {
    // Validator should have caught this; keep exploration system defensive.
    return state;
  }
  
  // Don't move if already at target location
  if (currentId && currentId === resolvedTargetId) {
    return state;
  }
  
  // Add to visited locations if not already there
  const isFirstVisit = !visitedLocations.includes(resolvedTargetId);
  const nextBiome = getLocationById(resolvedTargetId)?.zoneId || locationState.biome;

  let nextVars = worldVars;
  if (hasCreationPerk(state.player, "arcane_sense")) {
    const profile = getBiomeEssenceProfile(nextBiome);
    const triad = Array.isArray(profile?.dominantTriad) ? profile.dominantTriad : [];
    const anomalyIds = getEssenceAnomalyIdsForBiome(nextBiome);
    const anomalyNames = Array.isArray(anomalyIds)
      ? anomalyIds
          .map((id) => getEssenceAnomalyById(id)?.name || null)
          .filter(Boolean)
      : [];
    const biomeLabel = getZoneById(nextBiome)?.name || nextBiome;
    const triadLabel = triad.length ? `Dominant: ${triad.join(", ")}` : null;
    const anomalyLabel = anomalyNames.length
      ? `Anomalies: ${anomalyNames.join(", ")}`
      : "Anomalies: none";
    const summaryParts = [triadLabel, anomalyLabel].filter(Boolean);

    nextVars = {
      ...worldVars,
      arcaneTrace: {
        biomeId: nextBiome,
        biomeName: biomeLabel,
        anomalies: Array.isArray(anomalyIds)
          ? anomalyIds
              .map((id) => ({ id, name: getEssenceAnomalyById(id)?.name || id }))
              .filter((entry) => entry?.id)
          : [],
        summary: `Arcane traces (${biomeLabel}): ${summaryParts.join("; ")}.`,
      },
    };
  }

  const nextWorld = {
    ...world,
    vars: nextVars,
    location: {
      ...locationState,
      current: resolvedTargetId,
      visited: isFirstVisit ? [...visitedLocations, resolvedTargetId] : visitedLocations,
      unlockedAreas,
      biome: nextBiome,
    },
  };
  if (isFirstVisit) {
    // Award exploration XP for first-time visit
    const explorationXp = state.config?.explorationXpPerNewLocation ?? 0;
    if (explorationXp > 0) {
      return addXp({ ...state, world: nextWorld }, explorationXp);
    }
  }
  
  return {
    ...state,
    world: nextWorld,
  };
}
