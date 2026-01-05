// =================================================================
// DATA AUDIT HELPERS
// Checks for missing item IDs referenced across shop/gacha/enemy data.
// Usage: call auditItemIds() in tests or dev scripts; not used at runtime.
// =================================================================

import { getItemData } from './gameData';
import { shopDatabase } from './shopData';
import { gachaPools } from './gachaData';
import { enemyDatabase } from './enemyData';

/**
 * Collects all item ids referenced in shop/gacha/enemy drops.
 */
export function collectReferencedItemIds() {
  const ids = new Set();

  // Shop items/materials
  (shopDatabase.items || []).forEach(item => item?.itemId && ids.add(item.itemId));
  (shopDatabase.materials || []).forEach(item => item?.itemId && ids.add(item.itemId));

  // Gacha pools
  Object.values(gachaPools || {}).forEach(pool => {
    if (!pool?.items) return;
    // Skip skill pools (they are not items in gameData).
    if (pool.id === 'skills') return;
    Object.values(pool.items).forEach(list => {
      (list || []).forEach(entry => entry?.id && ids.add(entry.id));
    });
  });

  // Enemy drop tables
  (enemyDatabase || []).forEach(enemy => {
    (enemy.dropTable || []).forEach(drop => {
      if (drop.item) ids.add(drop.item);
    });
  });

  return Array.from(ids);
}

/**
 * Returns an array of missing item IDs (referenced but not found in gameData).
 */
export function auditItemIds() {
  const ids = collectReferencedItemIds();
  const missing = ids.filter(id => !getItemData(id));
  return missing;
}
