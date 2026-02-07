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
  if (!state?.player) return state;
  if (!item) return state;

  // If item is just a string ID, look it up in the database
  let itemData;
  if (typeof item === "string") {
    const itemId = item.trim();
    if (!itemId) return state;
    itemData = getItemData(itemId);
    if (!itemData) {
      console.warn(
        `Item "${itemId}" not found in database. Adding as basic item.`,
      );
      itemData = { id: itemId, name: itemId, type: "misc", quantity: 1 };
    }
  } else if (typeof item === "object") {
    // If it's an object, check if we need to enrich it with database data
    const itemId = typeof item.id === "string" ? item.id : "";
    if (!itemId) return state;
    itemData = getItemData(itemId) || item;
    // Merge provided data with database data (provided data takes precedence)
    itemData = { ...itemData, ...item };
  } else {
    return state;
  }

  if (!itemData?.id) return state;

  const inventory = Array.isArray(state.player.inventory)
    ? [...state.player.inventory]
    : [];
  const quantity = Number.isFinite(itemData.quantity) ? itemData.quantity : 1;
  if (quantity === 0) return state;

  const existingItemIndex = inventory.findIndex(
    (invItem) => invItem.id === itemData.id,
  );

  if (existingItemIndex >= 0) {
    // Item already exists, increase quantity
    inventory[existingItemIndex] = {
      ...inventory[existingItemIndex],
      quantity: inventory[existingItemIndex].quantity + quantity,
    };
  } else {
    // New item, add to inventory with full data from database
    inventory.push({
      ...itemData,
      quantity,
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
