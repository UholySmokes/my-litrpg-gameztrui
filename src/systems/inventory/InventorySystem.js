import { getItemData } from '../../entities/ItemRegistry.js';

const DEBUG_LOGGING_ENABLED = false;

/**
 * Adds an item to the player's inventory.
 * Looks up the item in the gameData database to get full item definition.
 * @param {object} state - The current game state object.
 * @param {object|string} item - The item to add (can be an item object or just an item ID string).
 * @returns {object} A new game state object with the item added to inventory.
 */
export function addItem(state, item) {
  // If item is just a string ID, look it up in the database
  let itemData;
  if (typeof item === 'string') {
    itemData = getItemData(item);
    if (!itemData) {
      console.warn(`Item "${item}" not found in database. Adding as basic item.`);
      itemData = { id: item, name: item, type: 'misc', quantity: 1 };
    }
  } else {
    // If it's an object, check if we need to enrich it with database data
    itemData = getItemData(item.id) || item;
    // Merge provided data with database data (provided data takes precedence)
    itemData = { ...itemData, ...item };
  }
  
  const inventory = [...state.player.inventory];
  const existingItemIndex = inventory.findIndex(invItem => invItem.id === itemData.id);
  
  if (existingItemIndex >= 0) {
    // Item already exists, increase quantity
    inventory[existingItemIndex] = {
      ...inventory[existingItemIndex],
      quantity: inventory[existingItemIndex].quantity + (itemData.quantity || 1)
    };
  } else {
    // New item, add to inventory with full data from database
    inventory.push({
      ...itemData,
      quantity: itemData.quantity || 1
    });
  }

  return {
    ...state,
    player: {
      ...state.player,
      inventory
    }
  };
}

/**
 * Uses a consumable item from inventory and applies its effects
 * @param {object} state - The current game state object
 * @param {string} itemId - The ID of the item to use
 * @returns {object} A new game state object with item consumed and effects applied
 */
export function useItem(state, itemId) {
  const inventory = [...state.player.inventory];
  const itemIndex = inventory.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    // Item not found in inventory
    return state;
  }
  
  const item = inventory[itemIndex];
  const itemData = getItemData(itemId);
  
  if (!itemData || itemData.type !== 'consumable') {
    // Item cannot be used
    return state;
  }
  
  // Start with base state
  let newState = { ...state };
  
  // Apply item effects
  if (itemData.effect) {
    if (itemData.effect.heal) {
      // Heal HP
      const newHp = Math.min(
        state.player.hp.max,
        state.player.hp.current + itemData.effect.heal
      );
      newState = {
        ...newState,
        player: {
          ...newState.player,
          hp: {
            ...newState.player.hp,
            current: newHp
          }
        }
      };
    }
    
    if (itemData.effect.mana) {
      // Restore Mana
      const newMana = Math.min(
        state.player.mana.max,
        state.player.mana.current + itemData.effect.mana
      );
      newState = {
        ...newState,
        player: {
          ...newState.player,
          mana: {
            ...newState.player.mana,
            current: newMana
          }
        }
      };
    }
  }
  
  // Remove item from inventory (or decrease quantity)
  if (item.quantity > 1) {
    inventory[itemIndex] = {
      ...item,
      quantity: item.quantity - 1
    };
  } else {
    inventory.splice(itemIndex, 1);
  }
  
  newState = {
    ...newState,
    player: {
      ...newState.player,
      inventory
    }
  };
  
  return newState;
}
