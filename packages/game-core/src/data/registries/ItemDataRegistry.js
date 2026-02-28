// =================================================================
// ITEM DATA REGISTRY
// Consolidated item data
// Migrated from: src/entities/ItemRegistry.js
// =================================================================

import {
  PROFESSIONS,
  getRecipesForProfession,
} from "../../systems/profession/ProfessionRegistry.js";

/**
 * Item Database - All items in the game with their complete definitions
 */
export let itemDatabase = {
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

  ration_pack: {
    id: "ration_pack",
    name: "Ration Pack",
    type: "consumable",
    quantity: 1,
    description: "Compact field rations that restore a small amount of health.",
    effect: { heal: 15 },
    rarity: "common",
    value: 8,
  },

  bandage_roll: {
    id: "bandage_roll",
    name: "Bandage Roll",
    type: "consumable",
    quantity: 1,
    description: "A sterile bandage roll for patching minor wounds.",
    effect: { heal: 20 },
    rarity: "common",
    value: 12,
  },

  mana_leaf: {
    id: "mana_leaf",
    name: "Mana Leaf",
    type: "material",
    quantity: 1,
    description: "A luminous leaf used in low-tier mana tinctures.",
    rarity: "common",
    value: 10,
  },

  leyline_shard: {
    id: "leyline_shard",
    name: "Leyline Shard",
    type: "quest",
    quantity: 1,
    description: "A stabilized shard harvested from a fractured leyline core.",
    rarity: "rare",
    value: 120,
  },

  soulseal_token: {
    id: "soulseal_token",
    name: "Soulseal Token",
    type: "quest",
    quantity: 1,
    description: "A notarized token stamped by undercity contract brokers.",
    rarity: "uncommon",
    value: 85,
  },

  ember_bloom_petal: {
    id: "ember_bloom_petal",
    name: "Ember Bloom Petal",
    type: "material",
    quantity: 1,
    description: "A heatless petal from the Ember Bloom, prized by alchemists.",
    rarity: "rare",
    value: 140,
  },

  skyforge_core: {
    id: "skyforge_core",
    name: "Skyforge Core",
    type: "quest",
    quantity: 1,
    description: "A compact core from seized skydock forge machinery.",
    rarity: "rare",
    value: 160,
  },

  caldera_seal: {
    id: "caldera_seal",
    name: "Caldera Seal",
    type: "quest",
    quantity: 1,
    description: "A warded seal used to stabilize volcanic vent lines.",
    rarity: "rare",
    value: 150,
  },

  veil_ledger: {
    id: "veil_ledger",
    name: "Veil Ledger",
    type: "quest",
    quantity: 1,
    description: "An encoded ledger page recovered from the Veil Archive.",
    rarity: "rare",
    value: 170,
  },

  resonance_shard: {
    id: "resonance_shard",
    name: "Resonance Shard",
    type: "material",
    quantity: 1,
    description: "A crystal fragment vibrating at a stable tuning frequency.",
    rarity: "uncommon",
    value: 65,
  },

  tide_ward_charm: {
    id: "tide_ward_charm",
    name: "Tideward Charm",
    type: "quest",
    quantity: 1,
    description: "A charm attuned to coastal barrier wards.",
    rarity: "uncommon",
    value: 90,
  },

  sundial_glyph: {
    id: "sundial_glyph",
    name: "Sundial Glyph",
    type: "quest",
    quantity: 1,
    description: "A glyph plate copied from the Oracle Sundial.",
    rarity: "rare",
    value: 130,
  },

  encrypted_cube: {
    id: "encrypted_cube",
    name: "Encrypted Cube",
    type: "quest",
    quantity: 1,
    description: "A stasis cube sealed behind rotating rune ciphers.",
    rarity: "uncommon",
    value: 75,
  },

  cleansed_toxin: {
    id: "cleansed_toxin",
    name: "Cleansed Toxin",
    type: "material",
    quantity: 1,
    description: "Neutralized ghoul toxin safe for antidote refining.",
    rarity: "uncommon",
    value: 55,
  },

  skyfisher_filament: {
    id: "skyfisher_filament",
    name: "Skyfisher Filament",
    type: "material",
    quantity: 1,
    description: "Elastic filament harvested from skyfisher wing-webbing.",
    rarity: "uncommon",
    value: 60,
  },

  mnemonic_vial: {
    id: "mnemonic_vial",
    name: "Mnemonic Vial",
    type: "quest",
    quantity: 1,
    description: "A sealed vial containing distilled memory dust.",
    rarity: "uncommon",
    value: 95,
  },

  storm_capacitor: {
    id: "storm_capacitor",
    name: "Storm Capacitor",
    type: "quest",
    quantity: 1,
    description: "A stabilized capacitor coil humming with static charge.",
    rarity: "rare",
    value: 135,
  },

  frost_lattice: {
    id: "frost_lattice",
    name: "Frost Lattice",
    type: "quest",
    quantity: 1,
    description: "A chilled lattice crystal for containment studies.",
    rarity: "rare",
    value: 125,
  },

  rune_cache: {
    id: "rune_cache",
    name: "Rune Cache",
    type: "quest",
    quantity: 1,
    description: "A cache capsule of compressed runic tablets.",
    rarity: "rare",
    value: 145,
  },

  spore_sac: {
    id: "spore_sac",
    name: "Spore Sac",
    type: "material",
    quantity: 1,
    description: "A volatile sac of bloom spores gathered in the wilds.",
    rarity: "common",
    value: 22,
  },

  prime_venom: {
    id: "prime_venom",
    name: "Prime Venom",
    type: "material",
    quantity: 1,
    description: "A concentrated venom sample for high-potency antidotes.",
    rarity: "rare",
    value: 110,
  },

  auric_chime: {
    id: "auric_chime",
    name: "Auric Chime",
    type: "quest",
    quantity: 1,
    description: "A tuning chime used in cathedral resonance rites.",
    rarity: "uncommon",
    value: 88,
  },

  support_brace: {
    id: "support_brace",
    name: "Support Brace",
    type: "material",
    quantity: 1,
    description: "A reinforced brace used to secure unstable tunnel supports.",
    rarity: "common",
    value: 18,
  },

  waypoint_fragment: {
    id: "waypoint_fragment",
    name: "Waypoint Fragment",
    type: "quest",
    quantity: 1,
    description: "A shard from an astral navigation waypoint.",
    rarity: "rare",
    value: 118,
  },

  mirage_map: {
    id: "mirage_map",
    name: "Mirage Map",
    type: "quest",
    quantity: 1,
    description: "A shifting map that reveals trails only at the right light angle.",
    rarity: "uncommon",
    value: 92,
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

function humanizeItemId(itemId) {
  return String(itemId || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// PLACEHOLDER DESCRIPTION GENERATOR
// Produces lore-consistent flavor text for auto-generated items by pattern-
// matching on the item ID.  All text is grounded in the Shardfall Meridian
// setting (neon arcology, leylines, factional economy).
// ---------------------------------------------------------------------------

const PLACEHOLDER_MATERIAL_PATTERNS = [
  // Metals & ores
  [/iron_ore|raw_iron/, "Chunks of iron ore pried from the Meridian's underlayer. Unremarkable on its own, essential in bulk."],
  [/iron_ingot/, "A bar of smelted iron, still warm from the forge. The backbone of every armorer's work order."],
  [/coal/, "Dense coal bricks hauled from the lower vents. Burns slow and hot — the forge's quiet partner."],
  [/steel_ingot/, "A bar of folded steel, grain tight and even. Standard output from a journeyman smith."],
  [/mythril_ore/, "A shimmering vein fragment of mythril. The resonance in it makes compass needles spin."],
  [/mythril_ingot/, "Refined mythril: lightweight, corrosion-resistant, and faintly audible to those who listen for leyline hum."],
  [/adamantine/, "Adamantine — near-indestructible and notoriously difficult to work. Smiths charge extra just to touch it."],
  [/divine_metal/, "An alloy whispered from a collapse-rift. Wardens classify it as a controlled salvage material."],
  [/copper_ore/, "Surface-layer copper ore, common and oxidizing quickly. Good starting material."],
  [/copper_gear/, "A small copper gear machined to standard tolerances. Base component for engineering projects."],
  [/steel_gear/, "Steel gear stock. Engineers go through these faster than they admit."],
  // Essences & magical reagents
  [/primordial_essence/, "Distilled from pre-Spirefall node sites. The taste of it in the air causes memory gaps."],
  [/rare_essence/, "Concentrated essence drawn off a stabilized leyline tap. Bottled fast, sold faster."],
  [/void_essence/, "Essence harvested from a thin-place. Approaches the absolute zero of meaning — handle carefully."],
  [/spirit_essence/, "Residue from a spiritual anchor site. Practitioners use it in rituals; others sell it at the bazaar."],
  [/arcane_dust/, "Powder ground from spent enchantment foci. Still warm to the touch and faintly luminescent."],
  [/arcane_ink/, "Ink infused with condensed mana-charge. Inscriptions written with it stay legible in low-light leyline zones."],
  [/arcane_core/, "A lattice-crystal grown inside a spent mana battery. Holds residual charge useful for enchantment work."],
  [/arcane_binding/, "Binding thread woven with sigil-work. Used to stitch enchantments into physical substrates."],
  [/mana_battery/, "A standardized Aurum Exchange energy cell. Discharged ones still fetch a few soulcoins as scrap."],
  [/void_capacitor/, "An unstable storage unit compressing void-matter. Warden-restricted. The serial number has been filed off."],
  [/elemental_shard/, "A fractured crystal still cycling through its elemental phase. Touch it wrong and it cycles through you."],
  [/lightning_core/, "A crystallized storm-discharge. Engineers prize it; everyone else should respect it."],
  [/soulthread/, "Drawn from a living-essence extraction. Warm and resistant to physical damage."],
  [/soul_gem/, "A gem lattice that has absorbed an imprint of consciousness. Trade in them is technically legal."],
  [/soul_ink/, "Ink catalyzed with a processed soul-imprint. The inscriptions it creates can move on their own."],
  [/void_ink/, "Ink extracted from Void-adjacent repositories. The text written with it only reads in certain light conditions."],
  [/void_crystal/, "A crystal grown in void-adjacent conditions. Portal engineers need these; everyone else should stay away."],
  [/prismatic_powder/, "Ground from multi-spectrum gemstones. Changes color depending on the viewer's essence type."],
  [/aurora_flux/, "A volatile mixture of ambient leyline discharge and prismatic pigment. Reacts unpredictably with raw mana."],
  [/wisdom_essence/, "Crystallized essence from a meditation-site node. Favored by enchanters working on cognitive items."],
  [/mindshield_charm/, "A rough charm assembly providing minor cognitive protection. A stop-gap until proper enchanting is available."],
  [/stormbrand_enchant/, "An enchantment pattern that channels storm-energy into a bound object. Handle the installation carefully."],
  // Cloth & textiles
  [/linen_cloth/, "Woven linen, durable and breathable. Supplies most of the Meridian's non-combat wardrobe."],
  [/wool_cloth/, "Sheared wool from the highland herds above the city platforms. Warm and reliable."],
  [/silk_cloth/, "Spun by silkworms kept in the upper arcade. Its trade value exceeds most metals by weight."],
  [/mageweave_cloth/, "Cloth grown in leyline-adjacent weaving rooms. The threads carry minor arcane conductivity."],
  [/mooncloth/, "Woven under harmonic conditions during leyline surge events. Cool to the touch and unnaturally white."],
  [/enchanted_leather/, "Leather processed through an enchantment bath. Flexible and resistant to minor magical abrasion."],
  // Herbs & botanicals
  [/common_herb/, "A dried bundle of regionally common medicinal herbs. Every apothecary stocks shelves of the stuff."],
  [/spirit_flower/, "A bloom that grows near spirit-anchor sites. The petals cause mild euphoria when brewed."],
  [/medicinal_herb/, "A carefully selected handful of healing herbs. Properly processed, it doubles the yield of most remedies."],
  [/antidote_herb/, "A bitter-tasting herb known for neutralizing common poisons. Required in every field kit."],
  [/ancient_root/, "A root system pre-dating the Spirefall. Radiates trace essence and resists standard preservation."],
  [/rare_herb/, "An uncommon botanical found in low-population zones. Sought by both cooks and alchemists."],
  [/divine_bloom/, "A flower that blooms only near collapse-rift sites. Picking it is technically a Warden infraction."],
  // Hides & leather
  [/raw_hide/, "Untreated animal hide, still carrying the smell of the field. Needs processing before use."],
  [/thick_hide/, "Heavier hide from larger fauna. Requires specialized tools to tan correctly."],
  [/exotic_hide/, "Hide from a creature outside the common registry. Skinners charge premium rates for the extra effort."],
  [/dragon_hide/, "Dragon hide — dense, heat-resistant, and structurally superior to most armors."],
  [/divine_hide/, "Hide harvested from a creature of confirmed rift-origin. Wardens consider it a controlled material."],
  // Wood & timber
  [/oak_wood/, "Straight-grained oak, widely used in the lower districts for construction and handles."],
  [/maple_wood/, "Maple from the highland groves. Dense and fine-grained; preferred for bows and instrument crafts."],
  [/ironwood/, "Wood as hard as mild steel. Only the best tools can cut it cleanly."],
  [/ancient_wood/, "Timber from a grove predating recorded settlement. Each plank holds trace spatial memory."],
  [/world_tree_wood/, "Wood from a rift-adjacent ancient. The grain shifts like it is still deciding what shape to be."],
  // Fish
  [/common_fish/, "A standard catch from the water channels beneath the arcology. Protein, no frills."],
  [/rare_fish/, "A variety from deeper or more esoteric water sources. Prized by serious cooks."],
  [/magical_fish/, "A fish that absorbed ambient leyline energy. Glows faintly. Interesting to eat."],
  [/legendary_fish/, "One of a class of fish with documented history in the Meridian fishing guilds. A status catch."],
  [/divine_fish/, "A creature from near-void water sources. Not available through standard market channels."],
  // Gems
  [/rough_gem/, "Uncut mineral with gemstone potential. Requires a jeweler's eye to realize its value."],
  [/polished_gem/, "A cut and polished gem, ready for setting. Standard quality for commercial jewelry."],
  [/perfect_gem/, "A flawless specimen. Jewelers take time off to talk about these."],
  [/prismatic_gem/, "A gem that cycles through visible spectrums. Its market value changes depending on who needs what this week."],
  // Farming
  [/wheat/, "Cultivated wheat from the upper-tier growing platforms. Feeds a quarter of the arcology's population."],
  [/^fruit$/, "Fresh produce from the agricultural terraces. Shelf life is short; move it fast."],
  [/magical_crop/, "A crop grown in leyline-adjacent soil. Nutritionally superior; mildly psychoactive in raw form."],
  [/ancient_seed/, "A seed from a pre-Spirefall cultivar. Germination requires specialized soil conditions."],
  [/divine_harvest/, "A crop harvested from a rift-adjacent growing site. Trade is monitored by the Wardens."],
  [/^grain$/, "Processed grain, ready for brewing or baking. Moves quickly through the market."],
  // Cooking
  [/raw_meat/, "Field-dressed meat, unprocessed. Needs work before it becomes food."],
  [/^vegetables$/, "Mixed vegetables from market stalls. Diet basics."],
  [/^flour$/, "Ground grain, ready for baking. A domestic staple."],
  [/prime_meat/, "Well-sourced, well-cut meat. Makes a difference in the finished dish."],
  [/^spices$/, "Trade-route spices from the bazaar quarter. Transforms adequate food into something worth talking about."],
  [/divine_flesh/, "Butchered from a rift-adjacent creature. Cooks handle it with care and curiosity."],
  [/exotic_meat/, "Meat from outside the standard fauna registry. Unusual flavor profile; high novelty value."],
  [/dragon_steak/, "Dragon steak — dense, hot to handle even after butchery, and difficult to overcook."],
  [/divine_nectar/, "A fermentation base of unclear origin. One vintage per decade if the rift cooperates."],
  // Inscription
  [/parchment/, "Standard writing parchment, treated for long-term inscription. Bulk commodity in the archive district."],
  [/light_ink/, "Basic ink, clear and consistent. Entry-level inscription work requires nothing more."],
  [/stone_tablet/, "A carved tablet for rune inscription. Heavy, durable, and impossible to casually destroy."],
  [/basic_glyph/, "A freshly inscribed glyph on treated surface. Activates under standard mana application."],
  [/rune_stone/, "A stone prepared for advanced runic inscription. The surface has already been tuned."],
  // Portal creation
  [/portal_shard/, "A fragment from a decommissioned portal frame. Still carries a dimensional echo."],
  [/waypoint_core/, "The key component in a waypoint anchor. Requires proper attunement before deployment."],
  [/dimensional_anchor/, "A device that pins local space to a fixed coordinate. Warden-issued hardware, usually."],
  [/planar_key/, "A resonance key that bridges planar boundaries. Each one is keyed to a specific pair of coordinates."],
  // First aid & repair
  [/clean_cloth/, "Sanitized cloth bandaging. Standard issue across all district medic posts."],
  [/herb_paste/, "A prepared medicinal paste combining common herbs. Applied directly to wounds."],
  [/healing_kit/, "A mid-tier field kit with supplies for multiple wound types. Standard guild-issued gear."],
  [/regeneration_kit/, "An advanced recovery kit combining alchemical compounds and enchanted dressings."],
  [/divine_intervention_kit/, "A Warden-restricted medical kit. The name is not figurative."],
  [/scrap_metal/, "Mixed salvage from the repair district. Usefulness varies by job."],
  [/polishing_oil/, "A light oil for surface finish work. Blacksmiths use it; everyone with nice things should own it."],
  [/reinforced_plate/, "A plate steel section, pre-reinforced for use in armor repair or construction."],
  [/divine_thread/, "Thread spun from a rift-adjacent source. It self-repairs minor cuts over time."],
  // Dye & cosmetics
  [/basic_dye/, "A vat-brewed dye in standard market colors. Reliable and color-fast."],
  [/metallic_pigment/, "Pigment ground from metallic ore. Produces sheen finishes unavailable in standard dyes."],
  [/prismatic_pigment/, "A pigment that shifts color in different light conditions. Popular in the upper-district fashion market."],
  [/illusion_dust/, "Enchantment pigment that projects a visual overlay. Wears off without regular re-application."],
  [/divine_radiance/, "A luminescent dye compound from rift-adjacent material. Produces light without consuming it."],
  // Miscellaneous reagents
  [/purified_water/, "Water run through a leyline-adjacent filtration system. No impurities. No flavor either."],
  [/^water$/, "Water. The arcology's filtration infrastructure keeps it available and drinkable."],
  [/charcoal/, "Char from controlled burns in the lower district. Fuel for alchemical furnaces and forge work."],
];

// Profession, tier, and output-type labels used when the item ID follows the
// convention: <profession>_<tier>_<output_type>
const PROFESSION_CRAFT_LABEL = {
  blacksmithing: "forged by a Meridian smith",
  alchemy: "prepared in an alchemical workspace",
  enchanting: "inscribed by an enchanter",
  tailoring: "stitched by a skilled tailor",
  jewelcrafting: "set by a jeweler",
  engineering: "assembled by an engineer",
  construction: "erected by a licensed builder",
  mining: "extracted and refined by a miner",
  herbalism: "harvested and prepared by an herbalist",
  skinning: "processed by a skinner",
  logging: "worked by a woodcutter",
  fishing: "sourced by a certified fisher",
  farming: "cultivated and processed by a farmer",
  cooking: "prepared in a proper kitchen",
  brewing: "brewed to specification",
  butchery: "processed by a butcher",
  inscription: "inscribed by a trained scribe",
  first_aid: "assembled for field medical use",
  repair: "fabricated for maintenance work",
  portal_creation: "engineered for spatial anchoring",
  dyeing: "finished by a dye specialist",
};

const TIER_QUALITY_LABEL = {
  basic: "entry-level",
  sturdy: "reliable",
  enchanted: "magically enhanced",
  masterwork: "masterwork-grade",
  mythic: "mythic-quality",
};

const OUTPUT_TYPE_LABEL = {
  blade: "blade", dagger: "dagger", sword: "sword", armor: "armor piece",
  shield: "shield", tool: "tool", helmet: "helmet", robe: "robe",
  cloak: "cloak", gloves: "gloves", bag: "bag", ring: "ring",
  amulet: "amulet", gem: "gem", circlet: "circlet",
  bomb: "demolition charge", turret: "turret assembly",
  gadget: "gadget", automaton: "automaton unit",
  wall: "wall section", gate: "gate assembly",
  tower: "tower section", workshop: "workshop kit",
  potion: "potion", elixir: "elixir", tonic: "tonic", catalyst: "catalyst",
  rune: "rune", sigil: "sigil", ward: "ward inscription", charm: "charm",
  refined_ore: "refined ore batch", cut_gem: "cut gem",
  alloy: "alloy ingot", core: "core component",
  herb_bundle: "herb bundle", salve: "salve", draught: "draught",
  leather: "leather sheet", hide_armor: "hide armor",
  trophy: "trophy", pelt: "pelt",
  plank: "timber plank", bow: "bow", totem: "totem", workbench: "workbench kit",
  fish_fillet: "fish fillet", oil: "rendered oil",
  bait: "fishing bait", talisman: "talisman",
  grain_sack: "grain sack", fertilizer: "fertilizer batch",
  seedling: "seedling tray", harvest_feast: "harvest feast",
  meal: "meal", stew: "stew", skewer: "skewer", dessert: "dessert",
  ale: "ale", wine: "wine", cured_meat: "cured meat",
  jerky: "jerky", sausage: "sausage", ration: "ration pack",
  scroll: "scroll", glyph: "glyph tablet", contract: "contract document",
  bandage: "bandage", kit: "kit", antidote: "antidote",
  repair_kit: "repair kit", polish: "polish compound",
  reinforcement: "reinforcement plate", restoration: "restoration compound",
  portal_rune: "portal rune", waypoint_seal: "waypoint seal",
  anchor_stone: "anchor stone", gate_sigil: "gate sigil",
  dye: "dye batch", pattern: "dye pattern",
  glamour: "glamour finish", finish: "surface finish",
};

/**
 * Generates a lore-appropriate description for an auto-generated placeholder
 * item.  Pattern-matches on the item ID first; falls back to a profession /
 * tier / output-type pattern, then to generic type copy.
 */
function generatePlaceholderDescription(itemId, type, professionId, isResult) {
  const id = String(itemId || "").toLowerCase();

  for (const [pattern, desc] of PLACEHOLDER_MATERIAL_PATTERNS) {
    if (pattern.test(id)) return desc;
  }

  // Match profession_tier_outputType convention (e.g. "blacksmithing_basic_blade")
  for (const [profKey, profLabel] of Object.entries(PROFESSION_CRAFT_LABEL)) {
    if (!id.startsWith(profKey + "_")) continue;
    const rest = id.slice(profKey.length + 1);
    for (const [tierKey, tierLabel] of Object.entries(TIER_QUALITY_LABEL)) {
      if (!rest.startsWith(tierKey + "_") && rest !== tierKey) continue;
      const typeKey = rest.startsWith(tierKey + "_")
        ? rest.slice(tierKey.length + 1)
        : "";
      const typeLabel =
        OUTPUT_TYPE_LABEL[typeKey] || typeKey.replace(/_/g, " ") || "item";
      const article = /^[aeiou]/i.test(tierLabel) ? "An" : "A";
      return `${article} ${tierLabel} ${typeLabel} ${profLabel}. Meets guild specifications for Shardfall Meridian trade.`;
    }
    // Profession matches but no tier token — generic craft line
    const typeLabel = OUTPUT_TYPE_LABEL[rest] || rest.replace(/_/g, " ") || "item";
    return `A ${typeLabel} ${profLabel}. Produced to Meridian standard.`;
  }

  // Generic fallback by resolved type
  if (type === "consumable") {
    return "A prepared consumable sourced from the Meridian's production districts. Consult the label before use.";
  }
  if (type === "equipment") {
    return "A crafted piece of equipment from the Meridian workshops. Functional and field-ready.";
  }
  return "A material component sourced from the Meridian's production districts. Required for advanced crafting.";
}

function inferPlaceholderRarity(tier) {
  const safeTier = Number.isFinite(tier) ? Number(tier) : 1;
  if (safeTier >= 9) return "legendary";
  if (safeTier >= 7) return "epic";
  if (safeTier >= 5) return "rare";
  if (safeTier >= 3) return "uncommon";
  return "common";
}

function inferPlaceholderType(itemId, { isResult = false } = {}) {
  const normalized = String(itemId || "").toLowerCase();
  if (!isResult) return "material";
  if (
    /(potion|elixir|tonic|meal|stew|bread|ale|wine|jerky|salve|antidote|ration|bandage|kit)/u.test(
      normalized,
    )
  ) {
    return "consumable";
  }
  if (
    /(sword|blade|dagger|armor|robe|cloak|gloves|shield|ring|amulet|circlet|crown|tool|bow|helmet|charm|relic|catalyst)/u.test(
      normalized,
    )
  ) {
    return "equipment";
  }
  if (/(cache|ledger|glyph|scroll|map|token|seal|fragment|core|shard|rune)/u.test(normalized)) {
    return "quest";
  }
  return "material";
}

function withPlaceholderProvenance(item, { professionId, recipeId, role }) {
  const existingMeta =
    item?.placeholderMeta && typeof item.placeholderMeta === "object"
      ? item.placeholderMeta
      : {};
  const existingRefs = Array.isArray(existingMeta.references)
    ? [...existingMeta.references]
    : [];
  const nextRef = {
    professionId: String(professionId || ""),
    recipeId: String(recipeId || ""),
    role: String(role || "reference"),
  };
  const hasRef = existingRefs.some(
    (ref) =>
      ref?.professionId === nextRef.professionId &&
      ref?.recipeId === nextRef.recipeId &&
      ref?.role === nextRef.role,
  );
  if (!hasRef) {
    existingRefs.push(nextRef);
  }

  const nextTags = Array.isArray(item?.tags) ? [...item.tags] : [];
  if (!nextTags.includes("placeholder_generated")) {
    nextTags.push("placeholder_generated");
  }

  return {
    ...item,
    tags: nextTags,
    contentStatus: "placeholder",
    placeholderMeta: {
      generated: true,
      source: "recipe_reference_closure",
      references: existingRefs,
    },
  };
}

function buildRecipePlaceholderItems() {
  const placeholders = {};
  const professions = Object.values(PROFESSIONS || {});

  const upsertPlaceholder = (itemId, payload, provenance) => {
    if (itemDatabase[itemId]) return;
    if (placeholders[itemId]) {
      placeholders[itemId] = withPlaceholderProvenance(
        placeholders[itemId],
        provenance,
      );
      return;
    }
    placeholders[itemId] = withPlaceholderProvenance(payload, provenance);
  };

  for (const profession of professions) {
    const recipes = getRecipesForProfession(profession.id, 9) || [];
    for (const recipe of recipes) {
      const tier = Number.isFinite(recipe?.tier) ? recipe.tier : 1;
      const rarity = inferPlaceholderRarity(tier);
      const baseValue = Math.max(5, 8 + tier * 12);

      const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
      for (const ingredient of ingredients) {
        const ingredientId = ingredient?.id || ingredient?.itemId;
        if (!ingredientId || itemDatabase[ingredientId]) {
          continue;
        }
        upsertPlaceholder(
          ingredientId,
          {
          id: ingredientId,
          name: humanizeItemId(ingredientId),
          type: inferPlaceholderType(ingredientId, { isResult: false }),
          quantity: 1,
          description: generatePlaceholderDescription(ingredientId, inferPlaceholderType(ingredientId, { isResult: false }), profession.id, false),
          rarity,
          value: baseValue,
          },
          { professionId: profession.id, recipeId: recipe.id, role: "ingredient" },
        );
      }

      const resultId = recipe?.result?.id || recipe?.result?.itemId;
      if (resultId && !itemDatabase[resultId]) {
        upsertPlaceholder(
          resultId,
          {
          id: resultId,
          name: humanizeItemId(resultId),
          type: inferPlaceholderType(resultId, { isResult: true }),
          quantity: 1,
          description: generatePlaceholderDescription(resultId, inferPlaceholderType(resultId, { isResult: true }), profession.id, true),
          rarity,
          value: baseValue + 10,
          },
          { professionId: profession.id, recipeId: recipe.id, role: "result" },
        );
      }
    }
  }

  return placeholders;
}

Object.assign(itemDatabase, buildRecipePlaceholderItems());

/**
 * Cached item lookup data.
 * Populated lazily on first lookup and cleared via resetItemCaches() if the
 * item database is modified at runtime.
 */
let itemListCache = null;
const itemsByTypeCache = new Map();
const itemsByRarityCache = new Map();
const equipmentBySlotCache = new Map();

// Internal helper for cached lookup operations; returns the shared cache array.
const getItemListCache = () => {
  if (!itemListCache) {
    itemListCache = Object.values(itemDatabase);
  }
  return itemListCache;
};

const getItemsByTypeCache = (type) => {
  if (!itemsByTypeCache.has(type)) {
    itemsByTypeCache.set(
      type,
      getItemListCache().filter((item) => item.type === type),
    );
  }
  return itemsByTypeCache.get(type);
};

const getItemsByRarityCache = (rarity) => {
  if (!itemsByRarityCache.has(rarity)) {
    itemsByRarityCache.set(
      rarity,
      getItemListCache().filter((item) => item.rarity === rarity),
    );
  }
  return itemsByRarityCache.get(rarity);
};

const getEquipmentBySlotCache = (slot) => {
  if (!equipmentBySlotCache.has(slot)) {
    equipmentBySlotCache.set(
      slot,
      getItemListCache().filter(
        (item) => item.type === "equipment" && item.equipSlot === slot,
      ),
    );
  }
  return equipmentBySlotCache.get(slot);
};

export function setItemDatabase(nextDatabase) {
  if (!nextDatabase || typeof nextDatabase !== "object" || Array.isArray(nextDatabase)) {
    return;
  }
  itemDatabase = nextDatabase;
  resetItemCaches();
}

/**
 * Clears cached lookup results so subsequent calls recompute from itemDatabase.
 * Call this after mutating itemDatabase at runtime.
 */
export function resetItemCaches() {
  itemListCache = null;
  itemsByTypeCache.clear();
  itemsByRarityCache.clear();
  equipmentBySlotCache.clear();
}

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
  return getItemsByTypeCache(type).slice();
}

/**
 * Get items by rarity
 * @param {string} rarity - Item rarity
 * @returns {Array} Items of specified rarity
 */
export function getItemsByRarity(rarity) {
  return getItemsByRarityCache(rarity).slice();
}

/**
 * Get equipment by slot
 * @param {string} slot - Equipment slot
 * @returns {Array} Equipment for the specified slot
 */
export function getEquipmentBySlot(slot) {
  return getEquipmentBySlotCache(slot).slice();
}

export function getItems() {
  return getItemListCache().slice();
}

export function isGeneratedPlaceholderItem(item) {
  return Boolean(item?.placeholderMeta?.generated === true);
}

export function getGeneratedPlaceholderItemIds() {
  return getItemListCache()
    .filter((item) => isGeneratedPlaceholderItem(item))
    .map((item) => item.id);
}
