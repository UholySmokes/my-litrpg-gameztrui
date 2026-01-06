// =================================================================
// GACHA DATABASE - Pools, rates, and rarity tiers
// =================================================================

import { getItemData } from '../entities/ItemRegistry.js';

export const gachaPools = {
  equipment: {
    id: 'equipment',
    name: 'Equipment Gacha',
    description: 'Pull for weapons and armor',
    cost: { goldCoins: 100 },
    pullCount: 1,
    rarityRates: {
      common: 0.5,
      uncommon: 0.3,
      rare: 0.15,
      epic: 0.04,
      legendary: 0.01
    },
    items: {
      common: [
        { id: 'wooden_sword', name: 'Wooden Sword' },
        { id: 'cloth_armor', name: 'Cloth Armor' }
      ],
      uncommon: [
        { id: 'iron_sword', name: 'Iron Sword' },
        { id: 'leather_armor', name: 'Leather Armor' }
      ],
      rare: [
        { id: 'steel_sword', name: 'Steel Sword' },
        { id: 'chain_mail', name: 'Chain Mail' }
      ],
      epic: [
        { id: 'magic_sword', name: 'Magic Sword' },
        { id: 'plate_armor', name: 'Plate Armor' }
      ],
      legendary: [
        { id: 'legendary_blade', name: 'Legendary Blade' },
        { id: 'dragon_scale_armor', name: 'Dragon Scale Armor' }
      ]
    }
  },
  
  skills: {
    id: 'skills',
    name: 'Skill Gacha',
    description: 'Pull for rare skills',
    cost: { soulpoints: 10 },
    pullCount: 1,
    rarityRates: {
      common: 0.4,
      uncommon: 0.35,
      rare: 0.2,
      epic: 0.04,
      legendary: 0.01
    },
    items: {
      common: [
        { id: 'gacha_skill_basic', name: 'Basic Skill', description: 'A basic skill', type: 'passive', manaCost: 0 }
      ],
      uncommon: [
        { id: 'gacha_skill_enhanced', name: 'Enhanced Skill', description: 'An enhanced skill', type: 'passive', manaCost: 0 }
      ],
      rare: [
        { id: 'gacha_skill_advanced', name: 'Advanced Skill', description: 'An advanced skill', type: 'active', manaCost: 20 }
      ],
      epic: [
        { id: 'gacha_skill_master', name: 'Master Skill', description: 'A master-level skill', type: 'active', manaCost: 30 }
      ],
      legendary: [
        { id: 'gacha_skill_legendary', name: 'Legendary Skill', description: 'A legendary skill', type: 'active', manaCost: 50 }
      ]
    }
  },
  
  premium: {
    id: 'premium',
    name: 'Premium Gacha',
    description: 'Pull for rare items and skills',
    cost: { soulpoints: 50 },
    pullCount: 1,
    rarityRates: {
      common: 0.3,
      uncommon: 0.3,
      rare: 0.25,
      epic: 0.12,
      legendary: 0.03
    },
    items: {
      common: [
        { id: 'premium_common', name: 'Common Item' }
      ],
      uncommon: [
        { id: 'premium_uncommon', name: 'Uncommon Item' }
      ],
      rare: [
        { id: 'premium_rare', name: 'Rare Item' }
      ],
      epic: [
        { id: 'premium_epic', name: 'Epic Item' }
      ],
      legendary: [
        { id: 'premium_legendary', name: 'Legendary Item' }
      ]
    }
  }
};

/**
 * Calculate gacha result based on rates
 */
export function calculateGachaResult(poolId, pullCount = 1) {
  const pool = gachaPools[poolId];
  if (!pool) return null;
  
  const results = [];
  
  for (let i = 0; i < pullCount; i++) {
    const roll = Math.random();
    let rarity = 'common';
    let cumulative = 0;
    
    for (const [rarityName, rate] of Object.entries(pool.rarityRates)) {
      cumulative += rate;
      if (roll <= cumulative) {
        rarity = rarityName;
        break;
      }
    }
    
    const rarityItems = pool.items[rarity];
    if (rarityItems && rarityItems.length > 0) {
      const randomItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
      const itemData = getItemData(randomItem.id) || null;
      // Preserve any metadata on the entry (e.g., skill name/description) as fallback.
      results.push({
        ...randomItem,
        rarity,
        itemData
      });
    }
  }
  
  return results;
}

/**
 * Get gacha pool by ID
 */
export function getGachaPoolById(poolId) {
  return gachaPools[poolId] || null;
}
