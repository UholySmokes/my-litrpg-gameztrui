import { DataRegistry } from "../data/DataRegistry.js";
import { moveToLocation } from "../systems/exploration/ExplorationSystem.js";
import {
  startCombat,
  playerAttack,
  processEnemyTurns,
} from "../systems/combat/CombatSystem.js";

/**
 * Executes an action and returns the result
 * This is the main dispatcher that routes actions to appropriate logic functions
 * @param {object} state - The current game state object
 * @param {object} action - The action object from InputParser
 * @returns {object} Result object with success flag, new state, and description
 */
export function executeAction(state, action, options = {}) {
  if (!action || !action.type) {
    return {
      success: false,
      reason: "Invalid action",
      state,
    };
  }

  if (!state?.player) {
    return {
      success: false,
      reason:
        "Player data unavailable. Complete character setup before issuing commands.",
      state,
    };
  }

  let newState = state;
  let description = "";
  const changes = {};
  let incrementsTurn = true;

  switch (action.type) {
    case "use_item":
      // Validate item exists and is consumable
      const item = DataRegistry.getItemById(action.itemId);
      if (!item || item.type !== "consumable") {
        return {
          success: false,
          reason: `Cannot use ${action.itemName || action.itemId}`,
          state,
        };
      }

      // Check if item is in inventory
      const hasItem = (state.player.inventory || []).some(
        (i) => i.id === action.itemId,
      );
      if (!hasItem) {
        return {
          success: false,
          reason: `You don't have ${action.itemName || action.itemId}`,
          state,
        };
      }

      // Dispatch CONSUME_ITEM to reducer instead of calling system directly
      newState = {
        ...state,
        // Note: The actual state mutation happens in the reducer
        // We'll apply the action via options.dispatchSystemEvent if provided
      };

      // Queue the action for the reducer to handle
      if (typeof options.dispatchSystemEvent === "function") {
        options.dispatchSystemEvent({
          type: "CONSUME_ITEM",
          payload: { itemId: action.itemId },
        });
      }

      description = `Used ${action.itemName || action.itemId}`;
      changes.itemUsed = action.itemName || action.itemId;
      break;

    case "move":
      if (action.targetLocation) {
        newState = moveToLocation(state, action.targetLocation);
        description = `Moved to ${action.targetLocation}`;
        changes.location = action.targetLocation;
        incrementsTurn = false; // moveToLocation already increments turnCount
      } else {
        return {
          success: false,
          reason: "No target location specified",
          state: state,
        };
      }
      break;

    case "attack":
      // If not already in combat, start combat with a default encounter
      if (!state.combat || state.combat.status !== "active") {
        const enemyIds =
          action.enemyIds && action.enemyIds.length > 0
            ? action.enemyIds
            : ["goblin"];
        newState = startCombat(state, enemyIds);
        description = `Engaged combat with ${newState.combat.enemies.map((e) => e.name).join(", ")}`;
        changes.combatStarted = true;
      } else {
        const enemyIndex =
          action.enemyIndex !== undefined ? action.enemyIndex : 0;
        const result = playerAttack(state, enemyIndex, action.skillId || null);
        if (!result.success) {
          return { success: false, reason: result.reason, state: state };
        }
        newState = processEnemyTurns(result.state);
        const targetName =
          newState.combat.enemies?.[enemyIndex]?.name || "enemy";
        description = `Attacked ${targetName}`;
        changes.damage = result.damage;
      }
      break;

    case "look":
    case "inventory":
      // These are read-only actions, no state change
      return {
        success: true,
        description: `Viewed ${action.type}`,
        state: state,
        readOnly: true,
      };

    case "status":
      // Status action - display character status
      return {
        success: true,
        description: "Status displayed",
        state: state,
        readOnly: true,
        showStatus: true, // Flag to show status block
      };

    case "narrative":
      // Narrative actions don't change game state
      return {
        success: true,
        description: action.originalInput || "Explored",
        state: state,
        readOnly: true,
      };

    default:
      return {
        success: false,
        reason: `Unknown action type: ${action.type}`,
        state: state,
      };
  }

  // Increment turn count for state-changing actions
  if (!action.readOnly && incrementsTurn) {
    newState = {
      ...newState,
      world: {
        ...newState.world,
        turnCount: newState.world.turnCount + 1,
      },
    };
  }

  return {
    success: true,
    description: description || "Action completed",
    state: newState,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  };
}
