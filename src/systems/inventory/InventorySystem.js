import { getItemData } from "../../entities/ItemRegistry.js";

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
  if (typeof item === "string") {
    itemData = getItemData(item);
    if (!itemData) {
      console.warn(
        `Item "${item}" not found in database. Adding as basic item.`,
      );
      itemData = { id: item, name: item, type: "misc", quantity: 1 };
    }
  } else {
    // If it's an object, check if we need to enrich it with database data
    itemData = getItemData(item.id) || item;
    // Merge provided data with database data (provided data takes precedence)
    itemData = { ...itemData, ...item };
  }

  const inventory = [...state.player.inventory];
  const existingItemIndex = inventory.findIndex(
    (invItem) => invItem.id === itemData.id,
  );

  if (existingItemIndex >= 0) {
    // Item already exists, increase quantity
    inventory[existingItemIndex] = {
      ...inventory[existingItemIndex],
      quantity:
        inventory[existingItemIndex].quantity + (itemData.quantity || 1),
    };
  } else {
    // New item, add to inventory with full data from database
    inventory.push({
      ...itemData,
      quantity: itemData.quantity || 1,
    });
  }

  return {
    ...state,
    player: {
      ...state.player,
      inventory,
    },
  };
}
