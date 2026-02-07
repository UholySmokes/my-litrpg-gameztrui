/**
 * Shared utility functions consolidated from across the codebase.
 */

/**
 * Safely convert a value to a finite number, returning a fallback if conversion fails.
 */
export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Merge reward items into an inventory array, stacking by item id.
 */
export function mergeInventoryItems(inventory = [], items = []) {
  if (!Array.isArray(items) || items.length === 0) return [...inventory];
  const next = [...inventory];
  items.forEach((item) => {
    if (!item?.id) return;
    const quantity = toNumber(item.quantity, 1);
    const index = next.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const existing = next[index];
      next[index] = {
        ...existing,
        quantity: toNumber(existing.quantity, 0) + quantity,
      };
    } else {
      next.push({ ...item, quantity });
    }
  });
  return next;
}
