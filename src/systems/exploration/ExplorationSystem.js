import { addXp } from '../leveling/LevelingManager.js';

/**
 * Moves the player to a new location
 * @param {object} state - The current game state object
 * @param {string} locationId - The ID of the location to move to
 * @returns {object} A new game state object with updated location
 */
export function moveToLocation(state, locationId) {
  const world = { ...state.world };
  const visitedLocations = [...(world.location?.visited || [])];
  const currentLocation = world.location?.current ?? "Starting Zone";

  const targetRaw = typeof locationId === "string" ? locationId.trim() : "";
  const targetLocationId = targetRaw || currentLocation;
  const targetLower = targetLocationId.toLowerCase();
  const resolvedTarget =
    visitedLocations.find(
      (loc) => typeof loc === "string" && loc.toLowerCase() === targetLower,
    ) || targetLocationId;
  
  // Don't move if already at target location
  if (typeof currentLocation === "string" && currentLocation.toLowerCase() === targetLower) {
    return state;
  }
  
  // Add to visited locations if not already there
  if (!visitedLocations.some((loc) => typeof loc === "string" && loc.toLowerCase() === targetLower)) {
    visitedLocations.push(resolvedTarget);
    // Award exploration XP for first-time visit
    const explorationXp = state.config?.explorationXpPerNewLocation ?? 0;
    if (explorationXp > 0) {
      world.turnCount = world.turnCount + 0; // no-op, keep structure
      return addXp({
        ...state,
        world: {
          ...world,
          location: {
            ...world.location,
            current: resolvedTarget,
            visited: visitedLocations
          },
          turnCount: world.turnCount + 1
        }
      }, explorationXp);
    }
  }
  
  return {
    ...state,
    world: {
      ...world,
      location: {
        ...world.location,
        current: resolvedTarget,
        visited: visitedLocations
      },
      turnCount: world.turnCount + 1
    }
  };
}
