// =================================================================
// ITEM DATA REGISTRY
// Consolidated item data
// Migrated from: src/entities/ItemRegistry.js
// =================================================================

/**
 * Item Database - All items in the game with their complete definitions
 */
export const itemDatabase = {
  // Consumables
  minor_health_potion: {
    id: "minor_health_potion",
    name: "Minor Health Potion",
    type: "consumable",
    quantity: 1,
    description: "A small vial of red liquid that restores 25 HP.",
    effect: { heal: 25 },
    rarity: "common",
    value: 10,
  },

  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    type: "consumable",
    quantity: 1,
    description: "A standard health potion that restores 50 HP.",
    effect: { heal: 50 },
    rarity: "common",
    value: 25,
  },

  major_health_potion: {
    id: "major_health_potion",
    name: "Major Health Potion",
    type: "consumable",
    quantity: 1,
    description: "A large health potion that restores 100 HP.",
    effect: { heal: 100 },
    rarity: "uncommon",
    value: 75,
  },

  mana_potion: {
    id: "mana_potion",
    name: "Mana Potion",
    type: "consumable",
    quantity: 1,
    description: "A blue potion that restores 50 Mana.",
    effect: { mana: 50 },
    rarity: "common",
    value: 20,
  },

  // Equipment - Weapons
  wooden_sword: {
    id: "wooden_sword",
    name: "Wooden Sword",
    type: "equipment",
    quantity: 1,
    description: "A crude wooden training sword. +3 Attack.",
    equipSlot: "weapon",
    stats: { attack: 3 },
    rarity: "common",
    value: 5,
  },

  rusty_sword: {
    id: "rusty_sword",
    name: "Rusty Sword",
    type: "equipment",
    quantity: 1,
    description: "An old, rusted blade. Better than nothing.",
    equipSlot: "weapon",
    stats: { attack: 5 },
    rarity: "common",
    value: 15,
  },

  iron_sword: {
    id: "iron_sword",
    name: "Iron Sword",
    type: "equipment",
    quantity: 1,
    description: "A sturdy iron sword. +10 Attack.",
    equipSlot: "weapon",
    stats: { attack: 10 },
    rarity: "uncommon",
    value: 50,
  },

  steel_sword: {
    id: "steel_sword",
    name: "Steel Sword",
    type: "equipment",
    quantity: 1,
    description: "A sharp steel blade with excellent balance.",
    equipSlot: "weapon",
    stats: { attack: 20 },
    rarity: "rare",
    value: 150,
  },

  magic_sword: {
    id: "magic_sword",
    name: "Magic Sword",
    type: "equipment",
    quantity: 1,
    description: "A sword infused with arcane energy.",
    equipSlot: "weapon",
    stats: { attack: 35, magic: 10 },
    rarity: "epic",
    value: 500,
  },

  legendary_blade: {
    id: "legendary_blade",
    name: "Legendary Blade",
    type: "equipment",
    quantity: 1,
    description:
      "A blade spoken of in myths. Legends say it can cut through reality itself.",
    equipSlot: "weapon",
    stats: { attack: 50, magic: 20 },
    rarity: "legendary",
    value: 2000,
    levelRequirement: 50,
    uniquePassive: {
      id: "reality_slash",
      name: "Reality Slash",
      description: "10% chance on hit to deal true damage (ignores armor)",
      proc: { chance: 0.1, effect: "true_damage", multiplier: 2.0 },
    },
  },

  crude_weapon: {
    id: "crude_weapon",
    name: "Crude Weapon",
    type: "equipment",
    quantity: 1,
    description: "A roughly made weapon. Better than bare hands.",
    equipSlot: "weapon",
    stats: { attack: 8 },
    rarity: "common",
    value: 20,
  },

  // Equipment - Armor
  cloth_armor: {
    id: "cloth_armor",
    name: "Cloth Armor",
    type: "equipment",
    quantity: 1,
    description: "Simple cloth garments. +2 Defense.",
    equipSlot: "armor",
    stats: { defense: 2 },
    rarity: "common",
    value: 5,
  },

  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    type: "equipment",
    quantity: 1,
    description: "Basic leather protection.",
    equipSlot: "armor",
    stats: { defense: 5 },
    rarity: "common",
    value: 20,
  },

  chain_mail: {
    id: "chain_mail",
    name: "Chain Mail",
    type: "equipment",
    quantity: 1,
    description: "Interlocking metal rings provide good protection.",
    equipSlot: "armor",
    stats: { defense: 12 },
    rarity: "uncommon",
    value: 75,
  },

  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    type: "equipment",
    quantity: 1,
    description: "Heavy plate armor forged for battle.",
    equipSlot: "armor",
    stats: { defense: 25 },
    rarity: "epic",
    value: 500,
  },

  dragon_scale_armor: {
    id: "dragon_scale_armor",
    name: "Dragon Scale Armor",
    type: "equipment",
    quantity: 1,
    description:
      "Armor crafted from dragon scales. The scales shimmer with ancient power.",
    equipSlot: "armor",
    stats: { defense: 40, magicResist: 15 },
    rarity: "legendary",
    value: 2500,
    levelRequirement: 50,
    uniquePassive: {
      id: "draconic_presence",
      name: "Draconic Presence",
      description:
        "Enemies have -10% accuracy when attacking you. Immune to fire damage.",
      aura: { effect: "accuracy_reduction", value: 0.1 },
      immunity: ["fire"],
    },
  },

  // Materials / loot
  iron_ore: {
    id: "iron_ore",
    name: "Iron Ore",
    type: "material",
    quantity: 1,
    description: "Raw iron ore used for crafting.",
    rarity: "common",
    value: 10,
  },

  leather: {
    id: "leather",
    name: "Leather",
    type: "material",
    quantity: 1,
    description: "Tanned animal hide used for crafting.",
    rarity: "common",
    value: 15,
  },

  magic_essence: {
    id: "magic_essence",
    name: "Magic Essence",
    type: "material",
    quantity: 1,
    description: "Concentrated magical energy.",
    rarity: "uncommon",
    value: 50,
  },

  goblin_ear: {
    id: "goblin_ear",
    name: "Goblin Ear",
    type: "material",
    quantity: 1,
    description: "A grisly trophy. Traders will buy these.",
    rarity: "common",
    value: 2,
  },

  orc_tusk: {
    id: "orc_tusk",
    name: "Orc Tusk",
    type: "material",
    quantity: 1,
    description: "A sharp tusk prized by crafters.",
    rarity: "common",
    value: 8,
  },

  bone_fragment: {
    id: "bone_fragment",
    name: "Bone Fragment",
    type: "material",
    quantity: 1,
    description: "A fragment of ancient bone.",
    rarity: "common",
    value: 3,
  },

  wolf_pelt: {
    id: "wolf_pelt",
    name: "Wolf Pelt",
    type: "material",
    quantity: 1,
    description: "A warm pelt used for leatherworking.",
    rarity: "common",
    value: 6,
  },

  wolf_fang: {
    id: "wolf_fang",
    name: "Wolf Fang",
    type: "material",
    quantity: 1,
    description: "A sharp fang used in crafting.",
    rarity: "common",
    value: 5,
  },

  troll_hide: {
    id: "troll_hide",
    name: "Troll Hide",
    type: "material",
    quantity: 1,
    description: "Thick hide used for tough armor.",
    rarity: "uncommon",
    value: 40,
  },

  troll_claw: {
    id: "troll_claw",
    name: "Troll Claw",
    type: "material",
    quantity: 1,
    description: "A heavy claw used in alchemy and crafting.",
    rarity: "uncommon",
    value: 35,
  },

  dragon_fang: {
    id: "dragon_fang",
    name: "Dragon Fang",
    type: "material",
    quantity: 1,
    description: "A fang radiating draconic power.",
    rarity: "rare",
    value: 120,
  },

  rare_gem: {
    id: "rare_gem",
    name: "Rare Gem",
    type: "material",
    quantity: 1,
    description: "A valuable gemstone sought by traders.",
    rarity: "rare",
    value: 200,
  },

  // Misc
  stolen_coin_purse: {
    id: "stolen_coin_purse",
    name: "Stolen Coin Purse",
    type: "misc",
    quantity: 1,
    description: "A purse filled with suspicious coins.",
    rarity: "common",
    value: 25,
  },

  spell_scroll: {
    id: "spell_scroll",
    name: "Spell Scroll",
    type: "misc",
    quantity: 1,
    description: "A scroll containing a fragment of dark magic.",
    rarity: "uncommon",
    value: 60,
  },

  // Quest Items
  old_key: {
    id: "old_key",
    name: "Old Key",
    type: "quest",
    quantity: 1,
    description: "A rusted key that might unlock something important.",
    rarity: "common",
    value: 0,
  },

  dragon_scale: {
    id: "dragon_scale",
    name: "Dragon Scale",
    type: "quest",
    quantity: 1,
    description: "A shimmering scale from a defeated dragon.",
    rarity: "legendary",
    value: 500,
  },

  // Premium pool exclusives (accessories with canonical stat hooks)
  astral_token: {
    id: "astral_token",
    name: "Astral Token",
    type: "equipment",
    equipSlot: "accessory",
    quantity: 1,
    description: "A faintly glowing coin that steadies the mind. +2 Willpower.",
    stats: { willpower: 2 },
    rarity: "common",
    value: 60,
  },
  auric_resonator: {
    id: "auric_resonator",
    name: "Auric Resonator",
    type: "equipment",
    equipSlot: "accessory",
    quantity: 1,
    description: "Channels battlefield instincts into decisive strikes.",
    stats: { agility: 1, dexterity: 1, critChance: 3 },
    rarity: "uncommon",
    value: 140,
  },
  starlit_diadem: {
    id: "starlit_diadem",
    name: "Starlit Diadem",
    type: "equipment",
    equipSlot: "accessory",
    quantity: 1,
    description:
      "Diadem carved from meteoric glass, suffused with arcane focus.",
    stats: { intelligence: 2, mana: 20 },
    rarity: "rare",
    value: 320,
  },
  voidheart_relic: {
    id: "voidheart_relic",
    name: "Voidheart Relic",
    type: "equipment",
    equipSlot: "accessory",
    quantity: 1,
    description: "Relic that drinks ambient ether, empowering spellcraft.",
    stats: { wisdom: 2, spellPower: 12 },
    rarity: "epic",
    value: 850,
  },
  empyrean_catalyst: {
    id: "empyrean_catalyst",
    name: "Empyrean Catalyst",
    type: "equipment",
    equipSlot: "accessory",
    quantity: 1,
    description:
      "Legendary core that harmonizes soul, luck, and vitality in battle.",
    stats: { vitality: 3, luck: 5, hp: 75 },
    rarity: "legendary",
    value: 2500,
    uniquePassive: {
      id: "empyrean_echo",
      name: "Empyrean Echo",
      description: "Once per combat, survive a killing blow at 10% HP.",
    },
  },
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
 * Get items by type
 * @param {string} type - Item type
 * @returns {Array} Items of specified type
 */
export function getItemsByType(type) {
  return Object.values(itemDatabase).filter((item) => item.type === type);
}

/**
 * Get items by rarity
 * @param {string} rarity - Item rarity
 * @returns {Array} Items of specified rarity
 */
export function getItemsByRarity(rarity) {
  return Object.values(itemDatabase).filter((item) => item.rarity === rarity);
}

export function getItems() {
  return Object.values(itemDatabase);
}
