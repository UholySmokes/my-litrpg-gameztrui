import { useItem } from '../systems/inventory/InventorySystem.js';
import { moveToLocation } from '../systems/exploration/ExplorationSystem.js';
import { startCombat, playerAttack } from '../systems/combat/CombatSystem.js';

/**
 * Executes an action and returns the result
 * This is the main dispatcher that routes actions to appropriate logic functions
 * @param {object} state - The current game state object
 * @param {object} action - The action object from InputParser
 * @returns {object} Result object with success flag, new state, and description
 */
export function executeAction(state, action) {
  if (!action || !action.type) {
    return {
      success: false,
      reason: 'Invalid action',
      state: state
    };
  }
  
  let newState = state;
  let description = '';
  const changes = {};
  let incrementsTurn = true;
  
  switch (action.type) {
    case 'use_item':
      const itemBeforeUse = state.player.hp.current;
      newState = useItem(state, action.itemId);
      const itemAfterUse = newState.player.hp.current;
      
      if (itemBeforeUse !== itemAfterUse) {
        description = `Used ${action.itemName || action.itemId}`;
        changes.itemUsed = action.itemName || action.itemId;
        changes.hp = {
          current: newState.player.hp.current,
          max: newState.player.hp.max
        };
      } else {
        return {
          success: false,
          reason: `Could not use ${action.itemName || action.itemId}`,
          state: state
        };
      }
      break;
    
    case 'move':
      if (action.targetLocation) {
        newState = moveToLocation(state, action.targetLocation);
        description = `Moved to ${action.targetLocation}`;
        changes.location = action.targetLocation;
        incrementsTurn = false; // moveToLocation already increments turnCount
      } else {
        return {
          success: false,
          reason: 'No target location specified',
          state: state
        };
      }
      break;
    
    case 'attack':
      // If not already in combat, start combat with a default encounter
      if (!state.combat || state.combat.status !== 'active') {
        const enemyIds = action.enemyIds && action.enemyIds.length > 0 ? action.enemyIds : ['goblin'];
        newState = startCombat(state, enemyIds);
        description = `Engaged combat with ${newState.combat.enemies.map(e => e.name).join(', ')}`;
        changes.combatStarted = true;
      } else {
        const enemyIndex = action.enemyIndex !== undefined ? action.enemyIndex : 0;
        const result = playerAttack(state, enemyIndex, action.skillId || null);
        if (!result.success) {
          return { success: false, reason: result.reason, state: state };
        }
        newState = result.state;
        const targetName = newState.combat.enemies?.[enemyIndex]?.name || 'enemy';
        description = `Attacked ${targetName}`;
        changes.damage = result.damage;
      }
      break;
    
    case 'look':
    case 'inventory':
      // These are read-only actions, no state change
      return {
        success: true,
        description: `Viewed ${action.type}`,
        state: state,
        readOnly: true
      };
    
    case 'status':
      // Status action - display character status
      return {
        success: true,
        description: 'Status displayed',
        state: state,
        readOnly: true,
        showStatus: true // Flag to show status block
      };
    
    case 'narrative':
      // Narrative actions don't change game state
      return {
        success: true,
        description: action.originalInput || 'Explored',
        state: state,
        readOnly: true
      };
    
    default:
      return {
        success: false,
        reason: `Unknown action type: ${action.type}`,
        state: state
      };
  }
  
  // Increment turn count for state-changing actions
  if (!action.readOnly && incrementsTurn) {
    newState = {
      ...newState,
      world: {
        ...newState.world,
        turnCount: newState.world.turnCount + 1
      }
    };
  }
  
  return {
    success: true,
    description: description || 'Action completed',
    state: newState,
    changes: Object.keys(changes).length > 0 ? changes : undefined
  };
}
