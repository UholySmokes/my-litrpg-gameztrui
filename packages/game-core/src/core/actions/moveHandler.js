import { moveToLocation } from "../../systems/exploration/ExplorationSystem.js";

/**
 * Handle move actions — relocate player to a target location.
 * @param {object} state - Current game state
 * @param {object} action - The action object with targetLocation
 * @returns {{ newState: object, description: string, changes: object, incrementsTurn: boolean }|{ earlyReturn: object }}
 */
export function handleMove(state, action) {
  if (!action.targetLocation) {
    return {
      earlyReturn: {
        success: false,
        reason: "No target location specified",
        state: state,
      },
    };
  }

  const newState = moveToLocation(state, action.targetLocation);
  if (newState === state) {
    return {
      newState: state,
      description: `Already at ${action.targetLocation}`,
      changes: {},
      incrementsTurn: false,
    };
  }

  return {
    newState,
    description: `Moved to ${action.targetLocation}`,
    changes: { location: action.targetLocation },
  };
}
