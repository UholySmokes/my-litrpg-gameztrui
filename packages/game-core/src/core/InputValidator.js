// =================================================================
// ACTION VALIDATOR
// Cheat Prevention Layer - Validates actions before execution
// =================================================================

import { getItemData } from '../entities/ItemRegistry.js';
import { isSkirmishCombat } from "../systems/skirmish/SkirmishState.js";
import {
  DEFAULT_START_LOCATION_ID,
  getAccessibleLocationIds,
  resolveLocationId,
  resolveTravelLocationId,
} from "../world/WorldDataRegistry.js";

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

    case "escape":
      return validateEscape(action, gameState);
    
    case 'look':
    case 'inventory':
    case 'status':
    case 'narrative':
    case 'dialogue':
      // These actions are always valid (read-only)
      return { valid: true };

    case 'magic_sense':
      return { valid: true };

    case "magic_prepare":
      return validateUnifiedMagicPrepare(action);

    case "magic_cast":
      return validateUnifiedMagicCast(action);

    case "magic_sustain":
      return { valid: true };

    case "magic_stabilize":
      return validateUnifiedMagicStabilize(action);

    case 'magic_attune':
      return validateMagicAttune(action);

    case 'magic_draw':
      return validateMagicDraw(action);

    case 'magic_refine':
      return validateMagicRefine(action);

    case 'magic_compress':
      return validateMagicCompress(action);

    case 'magic_shape':
      return validateMagicShape(action);

    case 'magic_weave':
      return validateMagicWeave(action);

    case 'magic_anchor':
      return validateMagicAnchor(action);

    case "magic_purge":
      return validateMagicPurge(action);

    case "magic_study":
      return validateMagicStudy(action);

    case "magic_journal":
      return validateMagicJournal(action);

    case "devourer_digest":
      return validateDevourerTargetedAction(action);

    case "devourer_refine":
      return validateDevourerTargetedAction(action);

    case "devourer_purge":
      return { valid: true };

    case 'magic_release':
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
  if (!isSkirmishCombat(gameState?.combat) && itemData.effect && itemData.effect.heal) {
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
    world.location?.current ?? world.location ?? DEFAULT_START_LOCATION_ID;

  // If target location is specified
  if (action.targetLocation) {
    const allowedLocationIds = getAccessibleLocationIds(gameState);
    const targetId = resolveTravelLocationId(action.targetLocation, {
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
  const isMagic = typeof action.type === "string" && action.type.startsWith("magic_");
  if (
    combat.status === "active" &&
    action.type !== "attack" &&
    action.type !== "escape" &&
    action.type !== "use_item" &&
    action.type !== "look" &&
    !isMagic
  ) {
    return {
      valid: false,
      reason: 'You are in combat! Focus on the enemy.'
    };
  }

  return { valid: true };
}

function isEssenceId(value) {
  return (
    value === "fire" ||
    value === "water" ||
    value === "earth" ||
    value === "air" ||
    value === "lightning" ||
    value === "shadow" ||
    value === "light" ||
    value === "life" ||
    value === "creation" ||
    value === "destruction" ||
    value === "space" ||
    value === "time"
  );
}

function validateMagicAttune(action) {
  const stance = action?.stance;
  if (stance !== "open" && stance !== "focused" && stance !== "guarded") {
    return { valid: false, reason: "Invalid attunement stance." };
  }
  if (stance === "focused" && action?.essence && !isEssenceId(action.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  return { valid: true };
}

function validateMagicDraw(action) {
  if (!isEssenceId(action?.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  if (action?.amount != null && (!Number.isFinite(action.amount) || action.amount <= 0)) {
    return { valid: false, reason: "Invalid draw amount." };
  }
  return { valid: true };
}

function validateMagicRefine(action) {
  if (!isEssenceId(action?.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  if (!Number.isFinite(action?.amount) || action.amount <= 0) {
    return { valid: false, reason: "Invalid refine amount." };
  }
  return { valid: true };
}

function validateMagicCompress(action) {
  if (!isEssenceId(action?.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  if (![0, 1, 2, 3].includes(action?.tier)) {
    return { valid: false, reason: "Invalid compression tier." };
  }
  return { valid: true };
}

function validateMagicShape(action) {
  if (!isEssenceId(action?.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  if (!action?.form || typeof action.form !== "string") {
    return { valid: false, reason: "Missing shape form." };
  }
  if (action?.amount != null && (!Number.isFinite(action.amount) || action.amount <= 0)) {
    return { valid: false, reason: "Invalid shape amount." };
  }
  return { valid: true };
}

function validateMagicWeave(action) {
  const essences = Array.isArray(action?.essences) ? action.essences : [];
  if (essences.length < 2 || !essences.every(isEssenceId)) {
    return { valid: false, reason: "Invalid weave essences." };
  }
  if (!action?.pattern || typeof action.pattern !== "string") {
    return { valid: false, reason: "Missing weave pattern." };
  }
  return { valid: true };
}

function validateMagicAnchor(action) {
  const kind = action?.kind;
  if (kind !== "self" && kind !== "area" && kind !== "item") {
    return { valid: false, reason: "Invalid anchor kind." };
  }
  if (kind === "item" && action?.itemId != null && typeof action.itemId !== "string") {
    return { valid: false, reason: "Invalid item id." };
  }
  return { valid: true };
}

function validateEscape(action, gameState) {
  void action;
  if (gameState.player.isDead) {
    return {
      valid: false,
      reason: "You cannot escape while dead.",
    };
  }

  if (gameState.combat?.status !== "active") {
    return {
      valid: false,
      reason: "You are not in combat.",
    };
  }

  return { valid: true };
}

function validateMagicPurge(action) {
  if (action?.essence != null && !isEssenceId(action.essence)) {
    return { valid: false, reason: "Unknown essence." };
  }
  if (
    action?.amount != null &&
    (!Number.isFinite(action.amount) || action.amount <= 0)
  ) {
    return { valid: false, reason: "Invalid purge amount." };
  }
  return { valid: true };
}

function validateMagicStudy(action) {
  if (typeof action?.target !== "string") {
    return { valid: false, reason: "Magic study target must be text." };
  }

  const trimmed = action.target.trim();
  if (!trimmed) {
    return { valid: false, reason: "Missing magic study target." };
  }

  if (trimmed.length > 180) {
    return { valid: false, reason: "Magic study target is too long." };
  }

  return { valid: true };
}

function validateMagicJournal(action) {
  if (action?.note == null) return { valid: true };
  if (typeof action.note !== "string") {
    return { valid: false, reason: "Magic journal note must be text." };
  }

  if (action.note.trim().length > 400) {
    return { valid: false, reason: "Magic journal note is too long." };
  }

  return { valid: true };
}

function validateUnifiedMagicPrepare(action) {
  const essences = Array.isArray(action?.essences)
    ? action.essences
    : action?.essence
      ? [action.essence]
      : [];
  if (essences.length === 0 || !essences.every(isEssenceId)) {
    return { valid: false, reason: "Invalid magic essence selection." };
  }
  if (!action?.form || typeof action.form !== "string") {
    return { valid: false, reason: "Missing magic form." };
  }
  if (
    action?.scale != null &&
    (!Number.isFinite(action.scale) || action.scale <= 0)
  ) {
    return { valid: false, reason: "Invalid magic scale." };
  }
  return { valid: true };
}

function validateUnifiedMagicCast(action) {
  if (action?.usePrepared) return { valid: true };
  return validateUnifiedMagicPrepare(action);
}

function validateUnifiedMagicStabilize(action) {
  if (action?.essence != null && !isEssenceId(action.essence)) {
    return { valid: false, reason: "Unknown stabilization essence." };
  }
  if (
    action?.stance != null &&
    action.stance !== "open" &&
    action.stance !== "focused" &&
    action.stance !== "guarded"
  ) {
    return { valid: false, reason: "Invalid stabilization stance." };
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


function validateDevourerTargetedAction(action) {
  if (action.target == null) return { valid: true };
  if (typeof action.target !== "string") {
    return { valid: false, reason: "Devourer target must be text." };
  }
  const trimmed = action.target.trim();
  if (!trimmed) return { valid: true };
  if (trimmed.length > 64) {
    return { valid: false, reason: "Devourer target is too long." };
  }
  return { valid: true };
}
