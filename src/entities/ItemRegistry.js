// =================================================================
// GAME DATA - The Encyclopedia
// This file contains all item definitions, their properties, and metadata.
// When addItem() is called, it should look up items here to get full data.
// =================================================================

/**
 * Item Database - All items in the game with their complete definitions
 */
export const itemDatabase = {
  // Consumables
  'minor_health_potion': {
    id: 'minor_health_potion',
    name: 'Minor Health Potion',
    type: 'consumable',
    quantity: 1,
    description: 'A small vial of red liquid that restores 25 HP.',
    effect: { heal: 25 },
    rarity: 'common',
    value: 10
  },
  
  'health_potion': {
    id: 'health_potion',
    name: 'Health Potion',
    type: 'consumable',
    quantity: 1,
    description: 'A standard health potion that restores 50 HP.',
    effect: { heal: 50 },
    rarity: 'common',
    value: 25
  },
  
  'major_health_potion': {
    id: 'major_health_potion',
    name: 'Major Health Potion',
    type: 'consumable',
    quantity: 1,
    description: 'A large health potion that restores 100 HP.',
    effect: { heal: 100 },
    rarity: 'uncommon',
    value: 75
  },
  
  // Equipment - Weapons
  'rusty_sword': {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    type: 'equipment',
    quantity: 1,
    description: 'An old, rusted blade. Better than nothing.',
    equipSlot: 'weapon',
    stats: { attack: 5 },
    rarity: 'common',
    value: 15
  },
  
  'iron_sword': {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'equipment',
    quantity: 1,
    description: 'A sturdy iron sword. +10 Attack.',
    equipSlot: 'weapon',
    stats: { attack: 10 },
    rarity: 'uncommon',
    value: 50
  },
  
  'steel_sword': {
    id: 'steel_sword',
    name: 'Steel Sword',
    type: 'equipment',
    quantity: 1,
    description: 'A sharp steel blade with excellent balance.',
    equipSlot: 'weapon',
    stats: { attack: 20 },
    rarity: 'rare',
    value: 150
  },
  
  // Equipment - Armor
  'leather_armor': {
    id: 'leather_armor',
    name: 'Leather Armor',
    type: 'equipment',
    quantity: 1,
    description: 'Basic leather protection.',
    equipSlot: 'armor',
    stats: { defense: 5 },
    rarity: 'common',
    value: 20
  },
  
  'chain_mail': {
    id: 'chain_mail',
    name: 'Chain Mail',
    type: 'equipment',
    quantity: 1,
    description: 'Interlocking metal rings provide good protection.',
    equipSlot: 'armor',
    stats: { defense: 12 },
    rarity: 'uncommon',
    value: 75
  },

  // Consumables
  'mana_potion': {
    id: 'mana_potion',
    name: 'Mana Potion',
    type: 'consumable',
    quantity: 1,
    description: 'A blue potion that restores 50 Mana.',
    effect: { mana: 50 },
    rarity: 'common',
    value: 20
  },

  // Equipment (low-tier / gacha commons)
  'wooden_sword': {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    type: 'equipment',
    quantity: 1,
    description: 'A crude wooden training sword. +3 Attack.',
    equipSlot: 'weapon',
    stats: { attack: 3 },
    rarity: 'common',
    value: 5
  },
  'cloth_armor': {
    id: 'cloth_armor',
    name: 'Cloth Armor',
    type: 'equipment',
    quantity: 1,
    description: 'Simple cloth garments. +2 Defense.',
    equipSlot: 'armor',
    stats: { defense: 2 },
    rarity: 'common',
    value: 5
  },

  // Equipment (gacha higher tiers)
  'magic_sword': {
    id: 'magic_sword',
    name: 'Magic Sword',
    type: 'equipment',
    quantity: 1,
    description: 'A sword infused with arcane energy.',
    equipSlot: 'weapon',
    stats: { attack: 35, magic: 10 },
    rarity: 'epic',
    value: 500
  },
  'plate_armor': {
    id: 'plate_armor',
    name: 'Plate Armor',
    type: 'equipment',
    quantity: 1,
    description: 'Heavy plate armor forged for battle.',
    equipSlot: 'armor',
    stats: { defense: 25 },
    rarity: 'epic',
    value: 500
  },
  'legendary_blade': {
    id: 'legendary_blade',
    name: 'Legendary Blade',
    type: 'equipment',
    quantity: 1,
    description: 'A blade spoken of in myths.',
    equipSlot: 'weapon',
    stats: { attack: 50, magic: 20 },
    rarity: 'legendary',
    value: 2000
  },
  'dragon_scale_armor': {
    id: 'dragon_scale_armor',
    name: 'Dragon Scale Armor',
    type: 'equipment',
    quantity: 1,
    description: 'Armor crafted from dragon scales.',
    equipSlot: 'armor',
    stats: { defense: 40, magicResist: 15 },
    rarity: 'legendary',
    value: 2500
  },

  // Materials / loot (enemy drops, crafting)
  'iron_ore': {
    id: 'iron_ore',
    name: 'Iron Ore',
    type: 'material',
    quantity: 1,
    description: 'Raw iron ore used for crafting.',
    rarity: 'common',
    value: 10
  },
  'leather': {
    id: 'leather',
    name: 'Leather',
    type: 'material',
    quantity: 1,
    description: 'Tanned animal hide used for crafting.',
    rarity: 'common',
    value: 15
  },
  'magic_essence': {
    id: 'magic_essence',
    name: 'Magic Essence',
    type: 'material',
    quantity: 1,
    description: 'Concentrated magical energy.',
    rarity: 'uncommon',
    value: 50
  },
  'goblin_ear': {
    id: 'goblin_ear',
    name: 'Goblin Ear',
    type: 'material',
    quantity: 1,
    description: 'A grisly trophy. Traders will buy these.',
    rarity: 'common',
    value: 2
  },
  'orc_tusk': {
    id: 'orc_tusk',
    name: 'Orc Tusk',
    type: 'material',
    quantity: 1,
    description: 'A sharp tusk prized by crafters.',
    rarity: 'common',
    value: 8
  },
  'bone_fragment': {
    id: 'bone_fragment',
    name: 'Bone Fragment',
    type: 'material',
    quantity: 1,
    description: 'A fragment of ancient bone.',
    rarity: 'common',
    value: 3
  },
  'wolf_pelt': {
    id: 'wolf_pelt',
    name: 'Wolf Pelt',
    type: 'material',
    quantity: 1,
    description: 'A warm pelt used for leatherworking.',
    rarity: 'common',
    value: 6
  },
  'wolf_fang': {
    id: 'wolf_fang',
    name: 'Wolf Fang',
    type: 'material',
    quantity: 1,
    description: 'A sharp fang used in crafting.',
    rarity: 'common',
    value: 5
  },
  'stolen_coin_purse': {
    id: 'stolen_coin_purse',
    name: 'Stolen Coin Purse',
    type: 'misc',
    quantity: 1,
    description: 'A purse filled with suspicious coins.',
    rarity: 'common',
    value: 25
  },
  'troll_hide': {
    id: 'troll_hide',
    name: 'Troll Hide',
    type: 'material',
    quantity: 1,
    description: 'Thick hide used for tough armor.',
    rarity: 'uncommon',
    value: 40
  },
  'troll_claw': {
    id: 'troll_claw',
    name: 'Troll Claw',
    type: 'material',
    quantity: 1,
    description: 'A heavy claw used in alchemy and crafting.',
    rarity: 'uncommon',
    value: 35
  },
  'spell_scroll': {
    id: 'spell_scroll',
    name: 'Spell Scroll',
    type: 'misc',
    quantity: 1,
    description: 'A scroll containing a fragment of dark magic.',
    rarity: 'uncommon',
    value: 60
  },
  'dragon_fang': {
    id: 'dragon_fang',
    name: 'Dragon Fang',
    type: 'material',
    quantity: 1,
    description: 'A fang radiating draconic power.',
    rarity: 'rare',
    value: 120
  },
  'rare_gem': {
    id: 'rare_gem',
    name: 'Rare Gem',
    type: 'material',
    quantity: 1,
    description: 'A valuable gemstone sought by traders.',
    rarity: 'rare',
    value: 200
  },
  'crude_weapon': {
    id: 'crude_weapon',
    name: 'Crude Weapon',
    type: 'equipment',
    quantity: 1,
    description: 'A roughly made weapon. Better than bare hands.',
    equipSlot: 'weapon',
    stats: { attack: 8 },
    rarity: 'common',
    value: 20
  },

  // Premium pool filler items (placeholder)
  'premium_common': {
    id: 'premium_common',
    name: 'Common Item',
    type: 'misc',
    quantity: 1,
    description: 'A common premium item.',
    rarity: 'common',
    value: 1
  },
  'premium_uncommon': {
    id: 'premium_uncommon',
    name: 'Uncommon Item',
    type: 'misc',
    quantity: 1,
    description: 'An uncommon premium item.',
    rarity: 'uncommon',
    value: 1
  },
  'premium_rare': {
    id: 'premium_rare',
    name: 'Rare Item',
    type: 'misc',
    quantity: 1,
    description: 'A rare premium item.',
    rarity: 'rare',
    value: 1
  },
  'premium_epic': {
    id: 'premium_epic',
    name: 'Epic Item',
    type: 'misc',
    quantity: 1,
    description: 'An epic premium item.',
    rarity: 'epic',
    value: 1
  },
  'premium_legendary': {
    id: 'premium_legendary',
    name: 'Legendary Item',
    type: 'misc',
    quantity: 1,
    description: 'A legendary premium item.',
    rarity: 'legendary',
    value: 1
  },
  
  // Quest Items
  'old_key': {
    id: 'old_key',
    name: 'Old Key',
    type: 'quest',
    quantity: 1,
    description: 'A rusted key that might unlock something important.',
    rarity: 'common',
    value: 0
  },
  
  'dragon_scale': {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    type: 'quest',
    quantity: 1,
    description: 'A shimmering scale from a defeated dragon.',
    rarity: 'legendary',
    value: 500
  }
};

/**
 * Looks up an item in the database by ID
 * @param {string} itemId - The ID of the item to look up
 * @returns {object|null} The item definition or null if not found
 */
export function getItemData(itemId) {
  return itemDatabase[itemId] || null;
}

/**
 * Gets all items of a specific type
 * @param {string} type - The type of items to retrieve (e.g., 'consumable', 'equipment')
 * @returns {array} Array of item definitions
 */
export function getItemsByType(type) {
  return Object.values(itemDatabase).filter(item => item.type === type);
}

/**
 * Gets all items of a specific rarity
 * @param {string} rarity - The rarity level (e.g., 'common', 'uncommon', 'rare', 'legendary')
 * @returns {array} Array of item definitions
 */
export function getItemsByRarity(rarity) {
  return Object.values(itemDatabase).filter(item => item.rarity === rarity);
}
