// =================================================================
// ACTION VALIDATOR
// Cheat Prevention Layer - Validates actions before execution
// =================================================================

import { getItemData } from '../entities/ItemRegistry.js';
import {
  getAccessibleLocationIds,
  resolveLocationId,
} from "../data/registries/WorldDataRegistry.js";

/**
 * Validates an action before it's executed
 * @param {object} action - The parsed action object
 * @param {object} gameState - Current game state
 * @returns {object} Validation result with valid flag and reason
 */
function validateAction(action, gameState) {
  if (!action || !action.type) {
    return {
      valid: false,
      reason: 'Invalid action format'
    };
  }

  switch (action.type) {
    case 'use_item':
      return validateUseItem(action, gameState);
    
    case 'move':
      return validateMove(action, gameState);

    case "rest":
      return validateRest(action, gameState);
    
    case 'attack':
      return validateAttack(action, gameState);
    
    case 'look':
    case 'inventory':
    case 'status':
    case 'narrative':
      // These actions are always valid (read-only)
      return { valid: true };
    
    default:
      return {
        valid: false,
        reason: `Unknown action type: ${action.type}`
      };
  }
}

/**
 * Validates "use item" actions
 */
function validateUseItem(action, gameState) {
  // Check if item exists in inventory
  const inventory = gameState.player.inventory || [];
  const item = inventory.find(invItem => invItem.id === action.itemId);
  
  if (!item) {
    return {
      valid: false,
      reason: `You don't have "${action.itemName || action.itemId}" in your inventory.`
    };
  }

  // Check if item quantity is sufficient
  if (item.quantity <= 0) {
    return {
      valid: false,
      reason: `You don't have any "${item.name}" left.`
    };
  }

  // Check if item is usable (has effect)
  const itemData = getItemData(action.itemId);
  if (!itemData) {
    return {
      valid: false,
      reason: `The item "${action.itemName}" cannot be used.`
    };
  }

  // Check if item is consumable
  if (itemData.type !== 'consumable') {
    return {
      valid: false,
      reason: `"${item.name}" is not a consumable item.`
    };
  }

  // Check if player is dead (can't use items when dead)
  if (gameState.player.isDead) {
    return {
      valid: false,
      reason: 'You cannot use items while dead.'
    };
  }

  // Check if effect would be redundant (e.g., healing at full HP)
  if (itemData.effect && itemData.effect.heal) {
    const currentHp = gameState.player.hp.current;
    const maxHp = gameState.player.hp.max;
    if (currentHp >= maxHp) {
      return {
        valid: false,
        reason: 'You are already at full health.'
      };
    }
  }

  return { valid: true };
}

/**
 * Validates movement actions
 */
function validateMove(action, gameState) {
  // Check if player is dead (can't move when dead)
  if (gameState.player.isDead) {
    return {
      valid: false,
      reason: 'You cannot move while dead.'
    };
  }

  const world = gameState.world || {};
  const currentRaw =
    world.location?.current ?? world.location ?? "starting_zone";

  // If target location is specified
  if (action.targetLocation) {
    const allowedLocationIds = getAccessibleLocationIds(gameState);
    const targetId = resolveLocationId(action.targetLocation, {
      allowedLocationIds,
    });

    if (!targetId) {
      return {
        valid: false,
        reason: `You cannot go to "${action.targetLocation}". That location is not accessible.`,
      };
    }

    const currentId =
      resolveLocationId(currentRaw) ||
      (typeof currentRaw === "string" ? currentRaw.trim() : null);

    // Check if already at target location
    if (currentId && currentId === targetId) {
      return {
        valid: false,
        reason: `You are already at ${action.targetLocation}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates rest/recovery actions
 */
function validateRest(action, gameState) {
  void action;
  const combat = gameState.combat || {};
  if (combat.status === "active") {
    return {
      valid: false,
      reason: "You cannot rest during combat.",
    };
  }

  const hp = gameState.player?.hp;
  const mana = gameState.player?.mana;

  const hpCurrent = hp?.current ?? 0;
  const hpMax = hp?.max ?? 0;
  const manaCurrent = mana?.current ?? 0;
  const manaMax = mana?.max ?? 0;

  const needsRest = hpCurrent < hpMax || manaCurrent < manaMax;
  if (!needsRest) {
    return { valid: false, reason: "You already feel fully rested." };
  }

  return { valid: true };
}

/**
 * Validates attack actions
 */
function validateAttack(action, gameState) {
  // Check if player is dead
  if (gameState.player.isDead) {
    return {
      valid: false,
      reason: 'You cannot attack while dead.'
    };
  }

  // If not in combat, allow attack to be interpreted as combat start.
  const combat = gameState.combat || {};
  if (combat.status !== 'active') {
    return { valid: true };
  }

  // In combat: ensure enemies exist
  const enemies = combat.enemies || [];
  if (enemies.length === 0) {
    return { valid: false, reason: 'There are no enemies to attack.' };
  }

  return { valid: true };
}

/**
 * Validates that an action doesn't violate game rules
 * This is a catch-all for any other validation rules
 */
function validateGameRules(action, gameState) {
  // Prevent actions that would modify state in invalid ways
  // This is where you'd add rules like:
  // - Can't use items in certain locations
  // - Can't move during combat
  // - etc.

  const combat = gameState.combat || {};
  
  // Prevent non-combat actions during active combat
  if (combat.status === 'active' && action.type !== 'attack' && action.type !== 'look') {
    return {
      valid: false,
      reason: 'You are in combat! Focus on the enemy.'
    };
  }

  return { valid: true };
}

/**
 * Comprehensive validation that checks both action validity and game rules
 */
export function validateActionComprehensive(action, gameState) {
  // First check basic action validity
  const actionValidation = validateAction(action, gameState);
  if (!actionValidation.valid) {
    return actionValidation;
  }

  // Then check game rules
  const rulesValidation = validateGameRules(action, gameState);
  if (!rulesValidation.valid) {
    return rulesValidation;
  }

  return { valid: true };
}
