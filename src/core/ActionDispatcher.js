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
export function executeAction(state, action, _options = {}) {
  void _options;
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

      const inventory = [...(state.player.inventory || [])];
      const itemIndex = inventory.findIndex((i) => i.id === action.itemId);
      if (itemIndex === -1) {
        return {
          success: false,
          reason: `You don't have ${action.itemName || action.itemId}`,
          state,
        };
      }

      const player = state.player;
      let nextPlayer = { ...player };

      // Apply effects with clamping
      if (item.effect?.heal) {
        const currentHp =
          typeof player.hp === "object" && player.hp !== null
            ? player.hp.current ?? 0
            : player.hp ?? 0;
        const maxHp =
          typeof player.hp === "object" && player.hp !== null
            ? player.hp.max ?? 100
            : player.maxHp ?? player.maxHealth ?? 100;
        const nextHp = Math.min(maxHp, currentHp + item.effect.heal);
        nextPlayer = {
          ...nextPlayer,
          hp:
            typeof player.hp === "object" && player.hp !== null
              ? { ...player.hp, current: nextHp }
              : nextHp,
        };
        changes.hp =
          typeof player.hp === "object" && player.hp !== null
            ? { ...player.hp, current: nextHp, max: maxHp }
            : { current: nextHp, max: maxHp };
      }

      if (item.effect?.mana) {
        const currentMana =
          typeof player.mana === "object" && player.mana !== null
            ? player.mana.current ?? 0
            : player.mana ?? 0;
        const maxMana =
          typeof player.mana === "object" && player.mana !== null
            ? player.mana.max ?? 100
            : player.maxMana ?? 100;
        const nextMana = Math.min(maxMana, currentMana + item.effect.mana);
        nextPlayer = {
          ...nextPlayer,
          mana:
            typeof player.mana === "object" && player.mana !== null
              ? { ...player.mana, current: nextMana }
              : nextMana,
        };
        changes.mana =
          typeof player.mana === "object" && player.mana !== null
            ? { ...player.mana, current: nextMana, max: maxMana }
            : { current: nextMana, max: maxMana };
      }

      // Remove item from inventory
      const existing = inventory[itemIndex] || { quantity: 1 };
      if ((existing.quantity || 1) > 1) {
        inventory[itemIndex] = {
          ...existing,
          quantity: (existing.quantity || 1) - 1,
        };
      } else {
        inventory.splice(itemIndex, 1);
      }

      newState = {
        ...state,
        player: {
          ...nextPlayer,
          inventory,
        },
      };

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
