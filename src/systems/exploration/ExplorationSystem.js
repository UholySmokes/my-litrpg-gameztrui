import { addXp } from '../leveling/LevelingManager.js';
import {
  getAccessibleLocationIds,
  resolveLocationId,
} from "../../data/registries/WorldDataRegistry.js";

/**
 * Moves the player to a new location
 * @param {object} state - The current game state object
 * @param {string} locationId - The ID of the location to move to
 * @returns {object} A new game state object with updated location
 */
export function moveToLocation(state, locationId) {
  const world = { ...state.world };
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
  if (isFirstVisit) {
    visitedLocations.push(resolvedTargetId);
    // Award exploration XP for first-time visit
    const explorationXp = state.config?.explorationXpPerNewLocation ?? 0;
    if (explorationXp > 0) {
      return addXp({
        ...state,
        world: {
          ...world,
          location: {
            ...locationState,
            current: resolvedTargetId,
            visited: visitedLocations,
            unlockedAreas,
          },
          turnCount: (world.turnCount || 0) + 1
        }
      }, explorationXp);
    }
  }
  
  return {
    ...state,
    world: {
      ...world,
      location: {
        ...locationState,
        current: resolvedTargetId,
        visited: visitedLocations,
        unlockedAreas,
      },
      turnCount: (world.turnCount || 0) + 1
    }
  };
}
