// =====================================================
// PROFESSION REGISTRY - Comprehensive Crafting System
// =====================================================
// 9 Tiers with Low/Mid/High sub-ranks
// Player can learn 2-3 professions
// Categories: Crafting, Gathering, Cooking, Service

// =====================================================
// PROFESSION TIERS (9 tiers × 3 sub-ranks = 27 levels)
// =====================================================

const PROFESSION_TIERS = [
  {
    tier: 1,
    name: "Novice",
    subRanks: ["Low Novice", "Mid Novice", "High Novice"],
    xpRequired: 0,
    skillPoints: 1,
  },
  {
    tier: 2,
    name: "Apprentice",
    subRanks: ["Low Apprentice", "Mid Apprentice", "High Apprentice"],
    xpRequired: 500,
    skillPoints: 2,
  },
  {
    tier: 3,
    name: "Journeyman",
    subRanks: ["Low Journeyman", "Mid Journeyman", "High Journeyman"],
    xpRequired: 2000,
    skillPoints: 3,
  },
  {
    tier: 4,
    name: "Adept",
    subRanks: ["Low Adept", "Mid Adept", "High Adept"],
    xpRequired: 5000,
    skillPoints: 4,
  },
  {
    tier: 5,
    name: "Expert",
    subRanks: ["Low Expert", "Mid Expert", "High Expert"],
    xpRequired: 12000,
    skillPoints: 5,
  },
  {
    tier: 6,
    name: "Master",
    subRanks: ["Low Master", "Mid Master", "High Master"],
    xpRequired: 25000,
    skillPoints: 6,
  },
  {
    tier: 7,
    name: "Grandmaster",
    subRanks: ["Low Grandmaster", "Mid Grandmaster", "High Grandmaster"],
    xpRequired: 50000,
    skillPoints: 8,
  },
  {
    tier: 8,
    name: "Artisan",
    subRanks: ["Low Artisan", "Mid Artisan", "High Artisan"],
    xpRequired: 100000,
    skillPoints: 10,
  },
  {
    tier: 9,
    name: "Mythical",
    subRanks: ["Mythical Initiate", "Mythical Adept", "Mythical Sovereign"],
    xpRequired: 250000,
    skillPoints: 15,
  },
];

// =====================================================
// PROFESSION CATEGORIES
// =====================================================

const PROFESSION_CATEGORIES = {
  crafting: {
    id: "crafting",
    name: "Crafting",
    description: "Transform raw materials into finished items.",
    icon: "🔨",
  },
  gathering: {
    id: "gathering",
    name: "Gathering",
    description: "Collect raw materials from the environment.",
    icon: "🌿",
  },
  cooking: {
    id: "cooking",
    name: "Cooking & Provisioning",
    description: "Create consumables that provide temporary buffs.",
    icon: "🍽️",
  },
  service: {
    id: "service",
    name: "Service & Support",
    description: "Provide unique services and create special items.",
    icon: "📜",
  },
};

// =====================================================
// PROFESSIONS - Full Definitions
// =====================================================

export const PROFESSIONS = {
  // ==================== CRAFTING ====================
  blacksmithing: {
    id: "blacksmithing",
    name: "Blacksmithing",
    category: "crafting",
    description: "Forge weapons, armor, and tools from raw metals.",
    icon: "⚔️",
    primaryStat: "str",
    secondaryStat: "dex",
    actions: ["smelt", "forge", "temper", "repair"],
    specializations: ["weaponsmith", "armorsmith", "toolsmith"],
    tierUnlocks: {
      1: {
        recipes: ["iron_ingot", "iron_dagger", "iron_chainmail"],
        skills: ["basic_smithing"],
      },
      3: {
        recipes: ["steel_ingot", "steel_sword", "steel_plate"],
        skills: ["metal_hardening"],
      },
      5: {
        recipes: ["mythril_ingot", "mythril_blade"],
        skills: ["enchanted_forging"],
      },
      7: {
        recipes: ["adamantine_ingot", "adamantine_armor"],
        skills: ["legendary_smithing"],
      },
      9: {
        recipes: ["divine_metal", "godslayer_blade"],
        skills: ["mythical_forging"],
      },
    },
  },

  alchemy: {
    id: "alchemy",
    name: "Alchemy",
    category: "crafting",
    description: "Brew potions, elixirs, and flasks with magical effects.",
    icon: "⚗️",
    primaryStat: "int",
    secondaryStat: "wisdom",
    actions: ["brew", "distill", "transmute", "extract"],
    specializations: ["potioneer", "transmuter", "poisoner"],
    tierUnlocks: {
      1: {
        recipes: ["minor_healing_potion", "minor_mana_potion"],
        skills: ["basic_brewing"],
      },
      3: {
        recipes: ["healing_potion", "mana_potion", "antidote"],
        skills: ["advanced_distillation"],
      },
      5: {
        recipes: ["greater_healing_potion", "elixir_of_strength"],
        skills: ["essence_extraction"],
      },
      7: {
        recipes: ["supreme_potion", "transmutation_stone"],
        skills: ["philosopher_methods"],
      },
      9: {
        recipes: ["elixir_of_immortality", "void_essence"],
        skills: ["mythical_transmutation"],
      },
    },
  },

  enchanting: {
    id: "enchanting",
    name: "Enchanting",
    category: "crafting",
    description: "Apply magical effects to existing gear.",
    icon: "✨",
    primaryStat: "int",
    secondaryStat: "soul",
    actions: ["enchant", "disenchant", "infuse", "amplify"],
    specializations: ["weapon_enchanter", "armor_enchanter", "soul_binder"],
    tierUnlocks: {
      1: {
        recipes: ["minor_sharpness", "minor_protection"],
        skills: ["basic_enchanting"],
      },
      3: {
        recipes: ["flame_enchant", "frost_enchant"],
        skills: ["elemental_infusion"],
      },
      5: {
        recipes: ["lifesteal_enchant", "spell_power"],
        skills: ["soul_binding"],
      },
      7: {
        recipes: ["legendary_enchant", "void_touch"],
        skills: ["reality_weaving"],
      },
      9: {
        recipes: ["divine_blessing", "primordial_essence"],
        skills: ["mythical_enchanting"],
      },
    },
  },

  tailoring: {
    id: "tailoring",
    name: "Tailoring",
    category: "crafting",
    description: "Create cloth armor, bags, and banners.",
    icon: "🧵",
    primaryStat: "dex",
    secondaryStat: "cha",
    actions: ["weave", "sew", "embroider", "dye"],
    specializations: ["clothier", "bagmaker", "banner_crafter"],
    tierUnlocks: {
      1: { recipes: ["linen_robe", "small_bag"], skills: ["basic_sewing"] },
      3: { recipes: ["silk_robe", "medium_bag"], skills: ["fine_stitching"] },
      5: {
        recipes: ["mageweave_robe", "large_bag"],
        skills: ["magical_threading"],
      },
      7: {
        recipes: ["mooncloth_robe", "bottomless_bag"],
        skills: ["ethereal_weaving"],
      },
      9: {
        recipes: ["celestial_garb", "void_pocket"],
        skills: ["mythical_tailoring"],
      },
    },
  },

  jewelcrafting: {
    id: "jewelcrafting",
    name: "Jewelcrafting",
    category: "crafting",
    description: "Create rings, necklaces, and gem sockets.",
    icon: "💎",
    primaryStat: "dex",
    secondaryStat: "int",
    actions: ["cut", "set", "polish", "socket"],
    specializations: ["gemcutter", "ringsmith", "amulet_crafter"],
    tierUnlocks: {
      1: { recipes: ["copper_ring", "rough_gem"], skills: ["basic_cutting"] },
      3: {
        recipes: ["silver_ring", "polished_gem"],
        skills: ["gem_polishing"],
      },
      5: {
        recipes: ["gold_amulet", "perfect_gem"],
        skills: ["socket_creation"],
      },
      7: {
        recipes: ["platinum_crown", "prismatic_gem"],
        skills: ["essence_socketing"],
      },
      9: {
        recipes: ["divine_circlet", "soul_gem"],
        skills: ["mythical_jewelcraft"],
      },
    },
  },

  engineering: {
    id: "engineering",
    name: "Engineering",
    category: "crafting",
    description: "Build gadgets, bombs, and mechanical mounts.",
    icon: "⚙️",
    primaryStat: "int",
    secondaryStat: "dex",
    actions: ["assemble", "calibrate", "detonate", "repair"],
    specializations: ["gadgeteer", "demolitions", "mechanic"],
    tierUnlocks: {
      1: {
        recipes: ["smoke_bomb", "basic_trap"],
        skills: ["basic_engineering"],
      },
      3: {
        recipes: ["flash_bomb", "mechanical_pet"],
        skills: ["clockwork_mastery"],
      },
      5: {
        recipes: ["explosive_charge", "gyrocopter"],
        skills: ["advanced_mechanics"],
      },
      7: {
        recipes: ["mana_bomb", "war_machine"],
        skills: ["arcane_engineering"],
      },
      9: {
        recipes: ["void_bomb", "titan_construct"],
        skills: ["mythical_engineering"],
      },
    },
  },

  construction: {
    id: "construction",
    name: "Construction",
    category: "crafting",
    description: "Build structures, fortifications, and housing.",
    icon: "🏗️",
    primaryStat: "str",
    secondaryStat: "int",
    actions: ["build", "reinforce", "demolish", "upgrade"],
    specializations: ["architect", "fortifier", "decorator"],
    tierUnlocks: {
      1: {
        recipes: ["wooden_wall", "simple_door"],
        skills: ["basic_construction"],
      },
      3: { recipes: ["stone_wall", "iron_gate"], skills: ["masonry"] },
      5: { recipes: ["tower", "drawbridge"], skills: ["fortification"] },
      7: {
        recipes: ["castle_wall", "magic_barrier"],
        skills: ["grand_architecture"],
      },
      9: {
        recipes: ["floating_fortress", "dimensional_pocket"],
        skills: ["mythical_construction"],
      },
    },
  },

  // ==================== GATHERING ====================
  mining: {
    id: "mining",
    name: "Mining",
    category: "gathering",
    description: "Extract ores, stones, and rare minerals.",
    icon: "⛏️",
    primaryStat: "str",
    secondaryStat: "luck",
    actions: ["mine", "prospect", "smelt_raw", "refine"],
    specializations: ["ore_miner", "gem_hunter", "deep_miner"],
    tierUnlocks: {
      1: { nodes: ["copper_vein", "tin_vein"], skills: ["basic_mining"] },
      3: { nodes: ["iron_vein", "silver_vein"], skills: ["vein_detection"] },
      5: { nodes: ["gold_vein", "mythril_vein"], skills: ["rare_ore_sense"] },
      7: {
        nodes: ["adamantine_vein", "crystal_formation"],
        skills: ["deep_earth_mining"],
      },
      9: {
        nodes: ["divine_ore", "void_crystal"],
        skills: ["mythical_extraction"],
      },
    },
  },

  herbalism: {
    id: "herbalism",
    name: "Herbalism",
    category: "gathering",
    description: "Gather plants, flowers, and fungi.",
    icon: "🌿",
    primaryStat: "wisdom",
    secondaryStat: "luck",
    actions: ["gather", "identify", "cultivate", "preserve"],
    specializations: ["botanist", "mycologist", "cultivator"],
    tierUnlocks: {
      1: { nodes: ["common_herb", "wild_flower"], skills: ["basic_herbalism"] },
      3: {
        nodes: ["medicinal_herb", "rare_mushroom"],
        skills: ["plant_identification"],
      },
      5: {
        nodes: ["magical_herb", "spirit_flower"],
        skills: ["essence_gathering"],
      },
      7: { nodes: ["ancient_root", "void_mushroom"], skills: ["life_sense"] },
      9: {
        nodes: ["divine_bloom", "world_tree_sap"],
        skills: ["mythical_herbalism"],
      },
    },
  },

  skinning: {
    id: "skinning",
    name: "Skinning & Tracking",
    category: "gathering",
    description: "Harvest hides, pelts, and meats from creatures.",
    icon: "🦊",
    primaryStat: "dex",
    secondaryStat: "wisdom",
    actions: ["skin", "track", "butcher", "tan"],
    specializations: ["skinner", "tracker", "tanner"],
    tierUnlocks: {
      1: { creatures: ["beast", "critter"], skills: ["basic_skinning"] },
      3: { creatures: ["predator", "large_beast"], skills: ["clean_cuts"] },
      5: { creatures: ["magical_beast", "drake"], skills: ["exotic_skinning"] },
      7: {
        creatures: ["dragon", "elemental_beast"],
        skills: ["legendary_harvesting"],
      },
      9: {
        creatures: ["divine_beast", "void_creature"],
        skills: ["mythical_skinning"],
      },
    },
  },

  logging: {
    id: "logging",
    name: "Logging & Woodcutting",
    category: "gathering",
    description: "Harvest timber, firewood, and specialty woods.",
    icon: "🪓",
    primaryStat: "str",
    secondaryStat: "dex",
    actions: ["chop", "fell", "split", "treat"],
    specializations: ["lumberjack", "woodworker", "charcoal_maker"],
    tierUnlocks: {
      1: { nodes: ["oak_tree", "pine_tree"], skills: ["basic_logging"] },
      3: {
        nodes: ["maple_tree", "birch_tree"],
        skills: ["efficient_chopping"],
      },
      5: {
        nodes: ["ironwood_tree", "spirit_tree"],
        skills: ["magical_wood_sense"],
      },
      7: {
        nodes: ["ancient_tree", "crystal_tree"],
        skills: ["legendary_logging"],
      },
      9: {
        nodes: ["world_tree_branch", "void_wood"],
        skills: ["mythical_logging"],
      },
    },
  },

  fishing: {
    id: "fishing",
    name: "Fishing",
    category: "gathering",
    description: "Catch fish, aquatic reagents, and treasure.",
    icon: "🎣",
    primaryStat: "dex",
    secondaryStat: "luck",
    actions: ["cast", "reel", "net", "dive"],
    specializations: ["angler", "deep_sea_fisher", "treasure_hunter"],
    tierUnlocks: {
      1: { catches: ["common_fish", "seaweed"], skills: ["basic_fishing"] },
      3: { catches: ["rare_fish", "pearl"], skills: ["lure_crafting"] },
      5: {
        catches: ["magical_fish", "sea_essence"],
        skills: ["deep_water_fishing"],
      },
      7: {
        catches: ["legendary_fish", "sunken_treasure"],
        skills: ["master_angling"],
      },
      9: {
        catches: ["divine_fish", "void_pearl"],
        skills: ["mythical_fishing"],
      },
    },
  },

  farming: {
    id: "farming",
    name: "Farming & Agriculture",
    category: "gathering",
    description: "Grow crops, produce, and raise animals.",
    icon: "🌾",
    primaryStat: "wisdom",
    secondaryStat: "str",
    actions: ["plant", "harvest", "breed", "fertilize"],
    specializations: ["farmer", "rancher", "vintner"],
    tierUnlocks: {
      1: { crops: ["wheat", "vegetables"], skills: ["basic_farming"] },
      3: { crops: ["fruits", "grapes"], skills: ["crop_rotation"] },
      5: {
        crops: ["magical_crops", "spirit_grain"],
        skills: ["essence_cultivation"],
      },
      7: {
        crops: ["ancient_seeds", "crystal_fruit"],
        skills: ["legendary_farming"],
      },
      9: {
        crops: ["divine_harvest", "void_bloom"],
        skills: ["mythical_agriculture"],
      },
    },
  },

  // ==================== COOKING & PROVISIONING ====================
  cooking: {
    id: "cooking",
    name: "Cooking",
    category: "cooking",
    description: "Prepare food that grants stat buffs and regeneration.",
    icon: "🍳",
    primaryStat: "dex",
    secondaryStat: "int",
    actions: ["cook", "roast", "bake", "season"],
    specializations: ["chef", "baker", "grill_master"],
    tierUnlocks: {
      1: {
        recipes: ["simple_meal", "bread"],
        skills: ["basic_cooking"],
        buffs: { hp_regen: 1 },
      },
      3: {
        recipes: ["hearty_stew", "meat_pie"],
        skills: ["seasoning"],
        buffs: { hp_regen: 3, stamina: 5 },
      },
      5: {
        recipes: ["gourmet_feast", "magic_cake"],
        skills: ["magical_cuisine"],
        buffs: { all_stats: 3 },
      },
      7: {
        recipes: ["legendary_banquet", "spirit_food"],
        skills: ["master_chef"],
        buffs: { all_stats: 7 },
      },
      9: {
        recipes: ["divine_ambrosia", "void_cuisine"],
        skills: ["mythical_cooking"],
        buffs: { all_stats: 15 },
      },
    },
  },

  brewing: {
    id: "brewing",
    name: "Brewing & Vinting",
    category: "cooking",
    description: "Create drinks for mana regeneration and spirit buffs.",
    icon: "🍺",
    primaryStat: "int",
    secondaryStat: "cha",
    actions: ["ferment", "age", "blend", "distill_spirits"],
    specializations: ["brewer", "vintner", "distiller"],
    tierUnlocks: {
      1: {
        recipes: ["ale", "simple_wine"],
        skills: ["basic_brewing_drinks"],
        buffs: { mana_regen: 1 },
      },
      3: {
        recipes: ["mead", "aged_wine"],
        skills: ["fermentation"],
        buffs: { mana_regen: 3, spirit: 5 },
      },
      5: {
        recipes: ["enchanted_spirits", "moonshine"],
        skills: ["magical_brewing"],
        buffs: { mana_regen: 5, int: 5 },
      },
      7: {
        recipes: ["legendary_vintage", "void_whiskey"],
        skills: ["master_brewing"],
        buffs: { all_stats: 5 },
      },
      9: {
        recipes: ["divine_nectar", "primordial_elixir"],
        skills: ["mythical_brewing"],
        buffs: { all_stats: 12 },
      },
    },
  },

  butchery: {
    id: "butchery",
    name: "Butchery",
    category: "cooking",
    description: "Process raw meat into cooking components.",
    icon: "🥩",
    primaryStat: "str",
    secondaryStat: "dex",
    actions: ["carve", "fillet", "cure", "smoke"],
    specializations: ["meat_carver", "preserver", "exotic_butcher"],
    tierUnlocks: {
      1: { recipes: ["raw_steak", "jerky"], skills: ["basic_butchery"] },
      3: { recipes: ["prime_cut", "smoked_meat"], skills: ["clean_carving"] },
      5: {
        recipes: ["exotic_meat", "magical_essence"],
        skills: ["exotic_processing"],
      },
      7: {
        recipes: ["dragon_steak", "essence_extract"],
        skills: ["legendary_butchery"],
      },
      9: {
        recipes: ["divine_flesh", "void_essence"],
        skills: ["mythical_butchery"],
      },
    },
  },

  // ==================== SERVICE & SUPPORT ====================
  inscription: {
    id: "inscription",
    name: "Inscription & Scribing",
    category: "service",
    description: "Create scrolls, glyphs, runes, and contracts.",
    icon: "📜",
    primaryStat: "int",
    secondaryStat: "wisdom",
    actions: ["inscribe", "copy", "seal", "decode"],
    specializations: ["scribe", "runemaster", "contract_writer"],
    tierUnlocks: {
      1: {
        recipes: ["scroll_of_light", "basic_glyph"],
        skills: ["basic_inscription"],
      },
      3: { recipes: ["spell_scroll", "ward_rune"], skills: ["arcane_writing"] },
      5: {
        recipes: ["tome_of_power", "binding_contract"],
        skills: ["soul_inscription"],
      },
      7: {
        recipes: ["legendary_grimoire", "reality_rune"],
        skills: ["master_scribing"],
      },
      9: {
        recipes: ["divine_scripture", "void_contract"],
        skills: ["mythical_inscription"],
      },
    },
  },

  first_aid: {
    id: "first_aid",
    name: "First Aid & Medicine",
    category: "service",
    description: "Create bandages, healing kits, and cure status effects.",
    icon: "🩹",
    primaryStat: "wisdom",
    secondaryStat: "dex",
    actions: ["bandage", "treat", "diagnose", "operate"],
    specializations: ["medic", "surgeon", "plague_doctor"],
    tierUnlocks: {
      1: {
        recipes: ["linen_bandage", "basic_salve"],
        skills: ["basic_first_aid"],
      },
      3: {
        recipes: ["healing_kit", "antidote_kit"],
        skills: ["wound_treatment"],
      },
      5: {
        recipes: ["resurrection_kit", "disease_cure"],
        skills: ["advanced_medicine"],
      },
      7: {
        recipes: ["regeneration_kit", "curse_removal"],
        skills: ["miraculous_healing"],
      },
      9: {
        recipes: ["divine_intervention_kit", "soul_mending"],
        skills: ["mythical_medicine"],
      },
    },
  },

  repair: {
    id: "repair",
    name: "Repair & Maintenance",
    category: "service",
    description: "Fix damaged gear and maintain equipment.",
    icon: "🔧",
    primaryStat: "dex",
    secondaryStat: "int",
    actions: ["repair", "maintain", "restore", "upgrade"],
    specializations: ["armor_smith", "weapon_smith", "artifact_restorer"],
    tierUnlocks: {
      1: { abilities: ["basic_repair"], skills: ["basic_maintenance"] },
      3: { abilities: ["quality_repair"], skills: ["durability_boost"] },
      5: { abilities: ["magical_repair"], skills: ["enchant_preservation"] },
      7: { abilities: ["legendary_restoration"], skills: ["artifact_repair"] },
      9: {
        abilities: ["divine_restoration"],
        skills: ["mythical_maintenance"],
      },
    },
  },

  portal_creation: {
    id: "portal_creation",
    name: "Portal Creation",
    category: "service",
    description: "Provide quick travel services through portals.",
    icon: "🌀",
    primaryStat: "int",
    secondaryStat: "soul",
    actions: ["open_portal", "stabilize", "link", "teleport"],
    specializations: ["teleporter", "waygate_keeper", "dimension_walker"],
    tierUnlocks: {
      1: { abilities: ["short_range_portal"], skills: ["basic_teleportation"] },
      3: { abilities: ["city_portal"], skills: ["waypoint_linking"] },
      5: { abilities: ["cross_region_portal"], skills: ["stable_portals"] },
      7: {
        abilities: ["cross_continent_portal"],
        skills: ["dimensional_anchor"],
      },
      9: {
        abilities: ["cross_plane_portal"],
        skills: ["mythical_teleportation"],
      },
    },
  },

  dyeing: {
    id: "dyeing",
    name: "Dyeing & Customization",
    category: "service",
    description: "Change the appearance of armor and items.",
    icon: "🎨",
    primaryStat: "cha",
    secondaryStat: "dex",
    actions: ["dye", "pattern", "emboss", "glamour"],
    specializations: ["colorist", "pattern_maker", "illusionist"],
    tierUnlocks: {
      1: { dyes: ["basic_colors"], skills: ["basic_dyeing"] },
      3: { dyes: ["metallic_colors", "patterns"], skills: ["advanced_dyeing"] },
      5: {
        dyes: ["glowing_colors", "animated_patterns"],
        skills: ["magical_glamour"],
      },
      7: {
        dyes: ["prismatic_effects", "illusion_skins"],
        skills: ["legendary_customization"],
      },
      9: {
        dyes: ["divine_radiance", "void_effects"],
        skills: ["mythical_glamour"],
      },
    },
  },
};

// =====================================================
// RECIPE DATABASE (Expanded)
// =====================================================

const RECIPES = {
  // === BLACKSMITHING ===
  iron_ingot: {
    id: "iron_ingot",
    name: "Iron Ingot",
    profession: "blacksmithing",
    tier: 1,
    ingredients: [{ id: "iron_ore", count: 2 }],
    result: { id: "iron_ingot", count: 1 },
    xp: 10,
    time: 5,
  },
  iron_dagger: {
    id: "iron_dagger",
    name: "Iron Dagger",
    profession: "blacksmithing",
    tier: 1,
    ingredients: [{ id: "iron_ingot", count: 2 }],
    result: { id: "iron_dagger", count: 1 },
    xp: 25,
    time: 10,
  },
  iron_chainmail: {
    id: "iron_chainmail",
    name: "Iron Chainmail",
    profession: "blacksmithing",
    tier: 1,
    ingredients: [{ id: "iron_ingot", count: 5 }],
    result: { id: "iron_chainmail", count: 1 },
    xp: 50,
    time: 20,
  },
  steel_ingot: {
    id: "steel_ingot",
    name: "Steel Ingot",
    profession: "blacksmithing",
    tier: 3,
    ingredients: [
      { id: "iron_ingot", count: 2 },
      { id: "coal", count: 1 },
    ],
    result: { id: "steel_ingot", count: 1 },
    xp: 30,
    time: 10,
  },
  steel_sword: {
    id: "steel_sword",
    name: "Steel Sword",
    profession: "blacksmithing",
    tier: 3,
    ingredients: [
      { id: "steel_ingot", count: 4 },
      { id: "leather", count: 1 },
    ],
    result: { id: "steel_sword", count: 1 },
    xp: 100,
    time: 30,
  },
  mythril_ingot: {
    id: "mythril_ingot",
    name: "Mythril Ingot",
    profession: "blacksmithing",
    tier: 5,
    ingredients: [
      { id: "mythril_ore", count: 3 },
      { id: "spirit_essence", count: 1 },
    ],
    result: { id: "mythril_ingot", count: 1 },
    xp: 100,
    time: 20,
  },
  mythril_blade: {
    id: "mythril_blade",
    name: "Mythril Blade",
    profession: "blacksmithing",
    tier: 5,
    ingredients: [
      { id: "mythril_ingot", count: 5 },
      { id: "enchanted_leather", count: 2 },
    ],
    result: { id: "mythril_blade", count: 1 },
    xp: 300,
    time: 60,
  },
  soulforged_helmet: {
    id: "soulforged_helmet",
    name: "Soulforged Helmet",
    profession: "blacksmithing",
    tier: 7,
    ingredients: [
      { id: "adamantine_ingot", count: 4 },
      { id: "soul_gem", count: 1 },
      { id: "enchanted_leather", count: 2 },
    ],
    result: { id: "soulforged_helmet", count: 1, effects: { defense: 45 } },
    xp: 420,
    time: 75,
  },

  // === ALCHEMY ===
  minor_healing_potion: {
    id: "minor_healing_potion",
    name: "Minor Healing Potion",
    profession: "alchemy",
    tier: 1,
    ingredients: [
      { id: "common_herb", count: 2 },
      { id: "water", count: 1 },
    ],
    result: { id: "minor_healing_potion", count: 1, effects: { heal: 25 } },
    xp: 10,
    time: 5,
  },
  minor_mana_potion: {
    id: "minor_mana_potion",
    name: "Minor Mana Potion",
    profession: "alchemy",
    tier: 1,
    ingredients: [
      { id: "spirit_flower", count: 2 },
      { id: "water", count: 1 },
    ],
    result: { id: "minor_mana_potion", count: 1, effects: { mana: 20 } },
    xp: 10,
    time: 5,
  },
  healing_potion: {
    id: "healing_potion",
    name: "Healing Potion",
    profession: "alchemy",
    tier: 3,
    ingredients: [
      { id: "medicinal_herb", count: 3 },
      { id: "purified_water", count: 1 },
    ],
    result: { id: "healing_potion", count: 1, effects: { heal: 75 } },
    xp: 30,
    time: 10,
  },
  antidote: {
    id: "antidote",
    name: "Antidote",
    profession: "alchemy",
    tier: 3,
    ingredients: [
      { id: "antidote_herb", count: 2 },
      { id: "charcoal", count: 1 },
    ],
    result: { id: "antidote", count: 1, effects: { cure: "poison" } },
    xp: 25,
    time: 8,
  },
  mind_focus_elixir: {
    id: "mind_focus_elixir",
    name: "Mind Focus Elixir",
    profession: "alchemy",
    tier: 5,
    ingredients: [
      { id: "spirit_flower", count: 3 },
      { id: "arcane_dust", count: 1 },
      { id: "purified_water", count: 1 },
    ],
    result: {
      id: "mind_focus_elixir",
      count: 1,
      effects: { mana: 120, spell_power: 15, duration: 420 },
    },
    xp: 120,
    time: 20,
  },
  aurora_flux: {
    id: "aurora_flux",
    name: "Aurora Flux",
    profession: "alchemy",
    tier: 7,
    ingredients: [
      { id: "void_essence", count: 1 },
      { id: "ancient_root", count: 2 },
      { id: "prismatic_powder", count: 1 },
    ],
    result: {
      id: "aurora_flux",
      count: 1,
      effects: { heal: 250, mana: 150, buff: "elemental_wrath", duration: 600 },
    },
    xp: 260,
    time: 35,
  },

  // === COOKING ===
  simple_meal: {
    id: "simple_meal",
    name: "Simple Meal",
    profession: "cooking",
    tier: 1,
    ingredients: [
      { id: "raw_meat", count: 1 },
      { id: "vegetables", count: 1 },
    ],
    result: {
      id: "simple_meal",
      count: 1,
      effects: { hp_regen: 2, duration: 300 },
    },
    xp: 10,
    time: 5,
  },
  bread: {
    id: "bread",
    name: "Bread",
    profession: "cooking",
    tier: 1,
    ingredients: [
      { id: "flour", count: 2 },
      { id: "water", count: 1 },
    ],
    result: { id: "bread", count: 2, effects: { hp_regen: 1, duration: 180 } },
    xp: 8,
    time: 10,
  },
  hearty_stew: {
    id: "hearty_stew",
    name: "Hearty Stew",
    profession: "cooking",
    tier: 3,
    ingredients: [
      { id: "prime_meat", count: 2 },
      { id: "vegetables", count: 2 },
      { id: "spices", count: 1 },
    ],
    result: {
      id: "hearty_stew",
      count: 1,
      effects: { hp_regen: 5, stamina: 10, duration: 600 },
    },
    xp: 40,
    time: 15,
  },

  // === INSCRIPTION ===
  scroll_of_light: {
    id: "scroll_of_light",
    name: "Scroll of Light",
    profession: "inscription",
    tier: 1,
    ingredients: [
      { id: "parchment", count: 1 },
      { id: "light_ink", count: 1 },
    ],
    result: {
      id: "scroll_of_light",
      count: 1,
      effects: { spell: "light", charges: 3 },
    },
    xp: 15,
    time: 10,
  },
  basic_glyph: {
    id: "basic_glyph",
    name: "Basic Glyph",
    profession: "inscription",
    tier: 1,
    ingredients: [
      { id: "stone_tablet", count: 1 },
      { id: "arcane_ink", count: 1 },
    ],
    result: {
      id: "basic_glyph",
      count: 1,
      effects: { buff: "minor_protection", duration: 300 },
    },
    xp: 20,
    time: 15,
  },
  mindshield_charm: {
    id: "mindshield_charm",
    name: "Mindshield Charm",
    profession: "enchanting",
    tier: 3,
    ingredients: [
      { id: "silver_ring", count: 1 },
      { id: "wisdom_essence", count: 1 },
      { id: "arcane_ink", count: 1 },
    ],
    result: {
      id: "mindshield_charm",
      count: 1,
      effects: { resist: "fear", willpower: 8 },
    },
    xp: 80,
    time: 25,
  },
  stormbrand_enchant: {
    id: "stormbrand_enchant",
    name: "Stormbrand Enchant",
    profession: "enchanting",
    tier: 6,
    ingredients: [
      { id: "mythril_blade", count: 1 },
      { id: "lightning_core", count: 1 },
      { id: "soulthread", count: 2 },
    ],
    result: {
      id: "stormbrand_enchant",
      count: 1,
      effects: { damage: "+18 lightning", proc: "chain_lightning" },
    },
    xp: 190,
    time: 40,
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const getProfession = (id) => PROFESSIONS[id];

export const getProfessionsByCategory = (category) =>
  Object.values(PROFESSIONS).filter((p) => p.category === category);

export const getRecipe = (id) => RECIPES[id];

const getRecipesForProfession = (professionId, maxTier = 9) =>
  Object.values(RECIPES).filter(
    (r) => r.profession === professionId && r.tier <= maxTier,
  );

const getTierData = (tier) => PROFESSION_TIERS.find((t) => t.tier === tier);

const getTierFromXp = (xp) => {
  for (let i = PROFESSION_TIERS.length - 1; i >= 0; i--) {
    if (xp >= PROFESSION_TIERS[i].xpRequired) {
      return PROFESSION_TIERS[i];
    }
  }
  return PROFESSION_TIERS[0];
};

const getSubRankFromXp = (xp, tier) => {
  const tierData = getTierData(tier);
  const nextTier = getTierData(tier + 1);

  if (!tierData) return 0;
  if (!nextTier) return 2; // Max sub-rank at max tier

  const tierXpRange = nextTier.xpRequired - tierData.xpRequired;
  const xpInTier = xp - tierData.xpRequired;
  const subRankProgress = xpInTier / tierXpRange;

  if (subRankProgress < 0.33) return 0; // Low
  if (subRankProgress < 0.67) return 1; // Mid
  return 2; // High
};

const getFullProfessionRank = (xp) => {
  const tier = getTierFromXp(xp);
  const subRank = getSubRankFromXp(xp, tier.tier);
  return {
    tier: tier.tier,
    tierName: tier.name,
    subRank,
    subRankName: tier.subRanks[subRank],
    fullName: tier.subRanks[subRank],
  };
};

// Export functions for external use
export { getTierFromXp, getFullProfessionRank, getRecipesForProfession };
