// =================================================================
// SHOP DATABASE - Items, skills, upgrades, materials, and services
// =================================================================

import { getItemData } from '../entities/ItemRegistry.js';

const shopItems = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 50 HP',
    price: { goldCoins: 25 },
    category: 'consumable',
    itemId: 'health_potion'
  },
  {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 50 MP',
    price: { goldCoins: 20 },
    category: 'consumable',
    itemId: 'mana_potion'
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword. +10 Attack',
    price: { goldCoins: 100 },
    category: 'equipment',
    itemId: 'iron_sword'
  },
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic leather protection. +5 Defense',
    price: { goldCoins: 80 },
    category: 'equipment',
    itemId: 'leather_armor'
  },
  {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'A well-crafted steel blade. +20 Attack',
    price: { goldCoins: 250 },
    category: 'equipment',
    itemId: 'steel_sword'
  },
  {
    id: 'chain_mail',
    name: 'Chain Mail',
    description: 'Interlocking metal rings. +12 Defense',
    price: { goldCoins: 200 },
    category: 'equipment',
    itemId: 'chain_mail'
  }
];

export let shopDatabase = {
  items: shopItems,
  
  skills: [
    {
      id: 'shop_skill_meditation',
      name: 'Meditation',
      description: 'Passive skill: Restore mana while meditating',
      price: { goldCoins: 150 },
      category: 'skill',
      skillData: {
        id: 'shop_meditation',
        name: 'Meditation',
        type: 'passive',
        class: 'universal',
        description: 'Restore mana and health while meditating.',
        level: 1,
        canUpgrade: true,
        canEvolve: false,
        canFuse: false
      }
    },
    {
      id: 'shop_skill_herbalism',
      name: 'Herbalism',
      description: 'Passive skill: Identify and harvest medicinal herbs',
      price: { goldCoins: 200 },
      category: 'skill',
      skillData: {
        id: 'shop_herbalism',
        name: 'Herbalism',
        type: 'passive',
        class: 'universal',
        description: 'Identify and harvest medicinal herbs.',
        level: 1,
        canUpgrade: true,
        canEvolve: false,
        canFuse: false
      }
    }
  ],
  
  upgrades: [
    {
      id: 'weapon_upgrade',
      name: 'Weapon Enhancement',
      description: 'Enhance your weapon (+5 Attack)',
      price: { goldCoins: 100 },
      category: 'upgrade',
      service: 'enhance_weapon'
    },
    {
      id: 'armor_upgrade',
      name: 'Armor Enhancement',
      description: 'Enhance your armor (+5 Defense)',
      price: { goldCoins: 100 },
      category: 'upgrade',
      service: 'enhance_armor'
    }
  ],
  
  materials: [
    {
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Raw iron ore for crafting',
      price: { goldCoins: 10 },
      category: 'material',
      itemId: 'iron_ore'
    },
    {
      id: 'leather',
      name: 'Leather',
      description: 'Tanned animal hide',
      price: { goldCoins: 15 },
      category: 'material',
      itemId: 'leather'
    },
    {
      id: 'magic_essence',
      name: 'Magic Essence',
      description: 'Concentrated magical energy',
      price: { soulpoints: 5 },
      category: 'material',
      itemId: 'magic_essence'
    }
  ],
  
  services: [
    {
      id: 'repair_service',
      name: 'Equipment Repair',
      description: 'Repair all equipment to full durability',
      price: { goldCoins: 50 },
      category: 'service',
      service: 'repair'
    },
    {
      id: 'identify_service',
      name: 'Item Identification',
      description: 'Identify unknown items',
      price: { goldCoins: 25 },
      category: 'service',
      service: 'identify'
    }
  ]
};

export function setShopDatabase(nextDatabase) {
  if (!nextDatabase || typeof nextDatabase !== "object" || Array.isArray(nextDatabase)) {
    return;
  }
  shopDatabase = {
    items: Array.isArray(nextDatabase.items) ? nextDatabase.items : [],
    skills: Array.isArray(nextDatabase.skills) ? nextDatabase.skills : [],
    upgrades: Array.isArray(nextDatabase.upgrades) ? nextDatabase.upgrades : [],
    materials: Array.isArray(nextDatabase.materials) ? nextDatabase.materials : [],
    services: Array.isArray(nextDatabase.services) ? nextDatabase.services : [],
  };
}

/**
 * Get all shop items by category
 */
export function getShopItemsByCategory(category) {
  if (category === 'all') {
    return [
      ...shopDatabase.items.map(resolveShopItemData),
      ...shopDatabase.skills,
      ...shopDatabase.upgrades,
      ...shopDatabase.materials.map(resolveShopItemData),
      ...shopDatabase.services
    ];
  }
  
  const categoryMap = {
    items: shopDatabase.items,
    skills: shopDatabase.skills,
    upgrades: shopDatabase.upgrades,
    materials: shopDatabase.materials,
    services: shopDatabase.services
  };
  
  const list = categoryMap[category] || [];
  if (category === 'items' || category === 'materials') {
    return list.map(resolveShopItemData);
  }
  return list;
}

/**
 * Get shop item by ID
 */
export function getShopItemById(itemId) {
  const allItems = getShopItemsByCategory('items');
  return allItems.find(item => item.id === itemId) || null;
}

/**
 * Resolves itemData from gameData as the single source of truth.
 */
function resolveShopItemData(item) {
  if (!item || !item.itemId) return item;
  const itemData = getItemData(item.itemId);
  return {
    ...item,
    itemData: itemData || null
  };
}
