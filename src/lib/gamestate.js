export const initialgamestate = {
    // --- META-DATA ---
    version: "0.1.1", 
    timestamp: Date.now(),
  
    // --- CONFIGURATION (New Section) ---
    // Centralize your math constants here so you can tweak balance easily
    // See system_specs.md for detailed documentation of these values
    config: {
      // === PROGRESSION ===
      xpScalingFactor: 1.5,           // XP required increases by 50% each level
      attributePointsPerLevel: 3,     // Free attribute points per level up
      maxLevel: 100,                  // Maximum achievable level
      baseXpRequired: 100,            // XP needed for level 1 → 2

      // === COMBAT FORMULAS ===
      criticalHitMultiplier: 1.5,     // 50% bonus damage on critical hit
      defenseReductionFactor: 0.5,    // Defense reduces damage by 50% of its value
      armorModel: 'flat',             // 'flat' or 'dr' (diminishing returns)
      armorDrK: 100,                  // K constant for DR curve armor/(armor+K)
      armorDrMax: 0.8,                // Max mitigation cap for DR model
      baseAttackDamage: 5,            // Default attack if no weapon equipped
      baseLuckCritChance: 0.01,       // 1% crit chance per LUCK point (5 LUCK = 5% crit)
      
      // === ESCAPE MECHANICS ===
      baseEscapeChance: 0.3,          // 30% base chance to escape combat
      agilityEscapeBonus: 0.01,       // +1% escape chance per AGI point

      // === EXPLORATION ===
      explorationXpPerNewLocation: 10,

      // === SKILLS ===
      skillManaCostMin: 5,            // Minimum mana cost for skills
      skillManaCostMax: 50,           // Maximum mana cost for skills (ultimates can exceed)
      skillCooldownMin: 2,            // Minimum cooldown in turns
      skillCooldownMax: 120,          // Maximum cooldown for ultimate abilities

      // === RESOURCES ===
      startHp: 100,                   // Starting maximum HP
      startMana: 50,                  // Starting maximum Mana
      maxInventorySize: 20,           // Maximum inventory slots
      hpPerStr: 10,                   // HP gained per STR point (character creation)
      hpPerWill: 5,                   // HP gained per WILL point (character creation)
      manaPerInt: 10,                 // Mana gained per INT point (character creation)
      manaPerSoul: 5,                 // Mana gained per SOUL point (character creation)

      // === ATTRIBUTES ===
      baseAttributeValue: 5,          // Starting value for all attributes
      strToDamageMultiplier: 2,       // STR × 2 = bonus physical damage
      
      // === GACHA & DROPS ===
      commonDropRate: 0.70,           // 70% chance for common items
      rareDropRate: 0.25,             // 25% chance for rare items
      epicDropRate: 0.04,             // 4% chance for epic items
      legendaryDropRate: 0.01,        // 1% chance for legendary items

      // === ECONOMY ===
      baseShopMarkup: 1.5,            // Shop sells at 150% of base price
      baseSellRate: 0.5,              // Player sells at 50% of base price
      charismaDiscountRate: 0.01,     // 1% discount per CHA point when buying

      // === REGENERATION (future) ===
      baseHpRegenRate: 0,             // HP regen per turn (0 = none)
      baseManaRegenRate: 0,           // Mana regen per turn (0 = none)
      regenOutOfCombatOnly: true      // Regen only happens outside combat
    },
  
    // --- THE PLAYER ---
    player: {
      // Core Identity
      name: "User",
      gender: "Unknown",
      level: 1,
      xp: { 
        current: 0, 
        max: 50, // Updated to match levelSystem default bracket 1
        // scalingFactor removed
      },
      title: "None",
      race: "Human",
      evolutionStage: "Mortal",
      class: "None",
      talent: "None",
  
      // Core Resources
      hp: { current: 100, max: 100 },
      mana: { current: 50, max: 50 },
      
      // Attributes
      attributes: {
        str: 5, agi: 5, dex: 5, int: 5,
        cha: 5, will: 5, luck: 5, soul: 5,
        freePoints: 0
      },

      // Level up flag
      justLeveledUp: false,
      isDead: false,

      // Dynamic Systems - Skills/Abilities
      abilities: [
        {
          id: 'basic_attack',
          name: 'Basic Attack',
          type: 'active',
          level: 1,
          class: 'universal',
          source: 'universal',
          description: 'A simple strike with your equipped weapon.',
          manaCost: 0,
          cooldown: 0,
          canUpgrade: true,
          canEvolve: false,
          canFuse: false
        }
      ],
      // Available skills that can be learned (conditions met but not yet learned)
      availableSkills: [],
      inventory: [
        {
          id: 'minor_health_potion',
          name: 'Minor Health Potion',
          quantity: 3,
          type: 'consumable',
          // Logic Helper: AI implies use, Code checks if type == consumable
          effect: { heal: 25 } 
        },
        // ADDED: An equipable item example
        {
          id: 'rusty_sword',
          name: 'Rusty Sword',
          quantity: 1,
          type: 'equipment',
          // Logic Helper: Matches the key in player.equipment
          equipSlot: 'weapon', 
          stats: { attack: 5 }
        }
      ],
      equipment: {
        // IMPLEMENTATION NOTE: When equipping, move the ENTIRE item object here.
        // Do not just store "rusty_sword". Store { id: 'rusty_sword', stats: {...} }
        // This prevents the "Infinite Item Glitch" and makes stat calculation easier.
        weapon: null, 
        armor: null,
        accessory1: null,
        accessory2: null
      },
      
      // Currency System
      currency: {
        goldCoins: 0,
        soulpoints: 0
      },
      
      // Title System
      unlockedTitles: [],
      equippedTitle: null
    },
  
    // --- THE WORLD & NARRATIVE ---
    world: {
      turnCount: 0,
      location: {
        current: "start_room",
        visited: ["start_room"],
        unlockedAreas: [] 
      },
      flags: {
        met_blacksmith: false,
        dragon_slayed: false,
        current_quest_id: "quest_001"
      }
    },
  
    // --- AI CONTEXT MEMORY (New Section) ---
    // Use this to store the "Minified" context for the LLM
    narrative: {
      // The AI summarizes the last 20 turns into one paragraph here.
      // Send THIS to the AI instead of the full log to save tokens.
      summary: "The hero has just awakened in a dark room.", 
      
      // Key facts the AI must never forget (even if they fall out of context)
      importantFacts: [
        "The player has a phobia of spiders.",
        "The main villain is named Malakor."
      ],
      
      // The raw chat logs for display only (don't send all of this to AI)
      chatLog: [] 
    },
  
    // --- COMBAT SYSTEM ---
    combat: {
      status: 'inactive', // 'active', 'victory', 'defeat'
      turn: 'player', 
      enemies: [], 
      log: ["Combat begins!"] 
    },
  
    // --- QUEST SYSTEM ---
    quests: {
      active: [
        {
          id: "quest_001",
          name: "A Grim Discovery",
          description: "Investigate the strange noises coming from the cellar.",
          objectives: [
            { id: "obj_001", description: "Go to the cellar", completed: false },
            { id: "obj_002", description: "Find the source of the noise", completed: false }
          ],
          rewards: { xp: 50, items: [{ id: 'old_key', quantity: 1 }] }
        }
      ],
      completed: []
    },
  
    // --- UI STATE ---
    ui: {
      activeMenu: null, 
      notifications: [] 
    },
    
    // --- REWIND SYSTEM ---
    previousState: null // Stores the state before the last action for single-step rewind
  };