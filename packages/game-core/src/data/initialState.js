import {xpForNextLevel} from "../core/xpCurve.js";
import {createInitialChronicleState} from "../chronicle/ChronicleRuntime.js";
import {calculateMaxHp, calculateMaxMana} from "../utils/AttributeMath.js";
import {createInitialWorldState} from "../world/WorldInitializer.js";
import {DEFAULT_ELEMENTAL_REACTIONS, DEFAULT_XP_BRACKETS, describeBalanceConfig,} from "./balance/balanceConfig.js";
import * as saveCutover from "../../../../shared/save-cutover.js";
import {normalizeAbilityState} from "../systems/abilities/UnifiedAbilityEngine.js";
import {createDefaultCombatState} from "../systems/skirmish/SkirmishState.js";

const { GAME_STATE_VERSION } = saveCutover;

export const INITIAL_CONFIG = {
  maxLevel: 1000,
  attributePointsPerLevel: 3,

  baseAttributeValue: 5,
  strToDamageMultiplier: 2,
  baseLuckCritChance: 0.01,
  agilityEscapeBonus: 0.01,
  baseEscapeChance: 0.3,
  defenseReductionFactor: 0.5,

  restHealAmount: 0,
  restManaAmount: 0,
  restHealPercent: 0.25,
  restManaPercent: 0.40,
  restHealMinFloor: 5,
  restManaMinFloor: 3,
  manaRegenPerTurn: 2,
  classEvolutionLevel: 10,
  classEvolutionLevelStep: 5,
  magicRollout: {
    layerA: true,
    layerB: true,
    layerC: true,
    layerD: true,
  },

  magicBalance: {
    formDefinitions: {
      bolt: {baseMana: 8, baseStrain: 6, damage: 1.05, delivery: "instant", tags: []},
      pulse: {baseMana: 10, baseStrain: 7, damage: 1.0, delivery: "instant", tags: []},
      lance: {baseMana: 14, baseStrain: 9, damage: 1.25, delivery: "instant", tags: []},
      cone: {baseMana: 13, baseStrain: 10, damage: 1.12, delivery: "instant", tags: ["AoE"]},
      wall: {baseMana: 12, baseStrain: 8, damage: 0.7, delivery: "sustained", tags: []},
      shield: {baseMana: 9, baseStrain: 6, damage: 0.55, delivery: "sustained", tags: []},
      vortex: {baseMana: 16, baseStrain: 12, damage: 1.18, delivery: "sustained", tags: ["AoE"]},
      veil: {baseMana: 11, baseStrain: 7, damage: 0.62, delivery: "sustained", tags: []},
      lattice: {baseMana: 15, baseStrain: 11, damage: 1.08, delivery: "sustained", tags: []},
    },
    classProfiles: {
      wanderer: {
        manaMultiplier: 1,
        strainMultiplier: 1,
        potencyByEssence: {},
      },
      mage: {
        manaMultiplier: 0.92,
        strainMultiplier: 0.95,
        potencyByEssence: {fire: 0.12, lightning: 0.14, shadow: 0.08},
      },
      battlemage: {
        manaMultiplier: 0.96,
        strainMultiplier: 0.9,
        potencyByEssence: {fire: 0.1, earth: 0.08, lightning: 0.1},
      },
      priest: {
        manaMultiplier: 0.94,
        strainMultiplier: 0.92,
        potencyByEssence: {light: 0.14, life: 0.14, water: 0.06},
      },
      druid: {
        manaMultiplier: 0.95,
        strainMultiplier: 0.94,
        potencyByEssence: {life: 0.1, earth: 0.08, water: 0.08},
      },
      warlock: {
        manaMultiplier: 1.02,
        strainMultiplier: 0.96,
        potencyByEssence: {shadow: 0.16, destruction: 0.14, fire: 0.08},
      },
      summoner: {
        manaMultiplier: 0.98,
        strainMultiplier: 0.93,
        potencyByEssence: {life: 0.1, space: 0.12},
      },
      templar: {
        manaMultiplier: 0.95,
        strainMultiplier: 0.9,
        potencyByEssence: {light: 0.12, fire: 0.08, earth: 0.08},
      },
    },
    manaCostTiers: {
      TIER_1: {min: 1, max: 20, description: "Basic attacks and utility"},
      TIER_2: {min: 21, max: 50, description: "Core combat abilities"},
      TIER_3: {min: 51, max: 100, description: "Strong AoE and control"},
      TIER_4: {min: 101, max: 200, description: "High-impact ultimates"},
      TIER_5: {min: 201, max: 500, description: "Game-changing effects"},
      TIER_6: {min: 501, max: 1000, description: "Reality-bending powers"},
      TIER_7: {min: 1001, max: 5000, description: "World-altering magic"},
    },
    manaCostMultipliers: {
      LEVEL_MULTIPLIERS: {
        1: 1.0,
        101: 1.5,
        201: 2.0,
        301: 3.0,
        401: 5.0,
        501: 8.0,
        601: 13.0,
        701: 21.0,
        801: 34.0,
        901: 55.0,
      },
      TYPE_MULTIPLIERS: {
        instant: 1.0,
        channel: 0.8,
        dot: 0.6,
        aoe: 1.3,
        single_target: 1.0,
        buff: 0.7,
        debuff: 0.9,
        heal: 1.1,
        utility: 0.5,
      },
      COOLDOWN_EFFICIENCY: {
        0: 1.5,
        1: 1.2,
        3: 1.0,
        5: 0.9,
        10: 0.8,
        20: 0.7,
        30: 0.6,
        60: 0.5,
        120: 0.4,
      },
    },
  },

  xpBrackets: DEFAULT_XP_BRACKETS,
  xpBonusPerLevelDiff: 0.2,
  xpMalusPerLevelDiff: 0.1,
  xpNoRewardBelowDelta: 10,
  xpMinMultiplier: 0.1,
  combatLaneConfig: {
    minLane: 1,
    fallbackMaxLane: 3,
    oneGapMultiplier: 0.85,
    multiGapMultiplier: 0.7,
  },
  elementalReactions: DEFAULT_ELEMENTAL_REACTIONS,
};

INITIAL_CONFIG.balanceSummary = describeBalanceConfig(INITIAL_CONFIG);

const INITIAL_ATTRIBUTES = {
  strength: 5,
  agility: 5,
  dexterity: 5,
  vitality: 5,
  intelligence: 5,
  wisdom: 5,
  charisma: 5,
  willpower: 5,
  luck: 5,
  soul: 5,
  freePoints: 0,
};

const INITIAL_LEVEL = 1;
const INITIAL_HP_MAX = calculateMaxHp(INITIAL_ATTRIBUTES);
const INITIAL_MANA_MAX = calculateMaxMana(INITIAL_ATTRIBUTES);
const INITIAL_XP_MAX = xpForNextLevel(INITIAL_LEVEL, INITIAL_CONFIG);
const INITIAL_MAGIC_PATTERNS = {
  shape: ["pulse", "wall", "shield"],
  weave: ["lattice"],
};
const INITIAL_MAGIC_AFFINITIES = {
  fire: 0,
  water: 0,
  earth: 0,
  air: 0,
  lightning: 0,
  shadow: 0,
  light: 0,
  life: 0,
  creation: 0,
  destruction: 0,
  space: 0,
  time: 0,
};

const INITIAL_MAGIC_STATE = {
  mana: {
    current: INITIAL_MANA_MAX,
    max: INITIAL_MANA_MAX,
  },
  strain: {
    current: 0,
    max: 100,
    state: "steady",
  },
  stability: {
    body: { current: 100, max: 100 },
    mind: { current: 100, max: 100 },
    cognitive: { current: 100, max: 100 },
  },
  attunement: {
    stance: "open",
    focusedEssence: null,
    environment: null,
  },
  affinities: INITIAL_MAGIC_AFFINITIES,
  classBias: {
    manaMultiplier: 1,
    strainMultiplier: 1,
    potencyByEssence: {},
  },
  grammar: {
    essences: ["fire", "water", "earth", "air"],
    forms: ["bolt", "pulse", "shield"],
    patterns: INITIAL_MAGIC_PATTERNS,
    deliveries: ["instant", "sustained", "channeled"],
    recipes: [],
  },
  unlockedPatterns: INITIAL_MAGIC_PATTERNS,
  prepared: null,
  activeWorkings: [],
  casting: null,
  resonance: {
    current: 0,
    max: 100,
    state: "quiet",
  },
  interference: {
    score: 0,
  },
  anchors: {
    self: null,
    area: null,
    itemId: null,
  },
  reserves: {},
  charges: [],
  journal: [],
};

const INITIAL_ABILITY_STATE = normalizeAbilityState(
  {
    families: {
      magic: INITIAL_MAGIC_STATE,
    },
  },
  {
    player: {
      class: "wanderer",
      mana: {
        current: INITIAL_MANA_MAX,
        max: INITIAL_MANA_MAX,
      },
    },
  },
);

const initialGameState = {
  config: INITIAL_CONFIG,
  player_profile: {
    characters_created: 0,
  },
  player: {
    name: "Wanderer",
    level: INITIAL_LEVEL,
    xp: {
      current: 0,
      max: INITIAL_XP_MAX,
    },
    hp: {
      current: INITIAL_HP_MAX,
      max: INITIAL_HP_MAX,
    },
    mana: {
      current: INITIAL_MANA_MAX,
      max: INITIAL_MANA_MAX,
    },
    abilityState: INITIAL_ABILITY_STATE,
    magic: INITIAL_ABILITY_STATE.families.magic,
    attributes: INITIAL_ATTRIBUTES,
    attributeInvestments: {},
    resources: {
      rage: 0,
      chi: 0,
      focus: 0,
      stealth: 0,
      energy: 0,
    },
    inventory: [],
    equipment: {},
    abilities: [],
    titles: ["novice_adventurer"],
    unlockedTitles: ["novice_adventurer"],
    equippedTitle: null,
    activeSkills: [],
    passiveSkills: [],
    gold: 0,
    soulpoints: 0,
    currency: {
      goldCoins: 0,
      soulpoints: 0,
    },
    talent: "None",
    talents: [],
    archetypeSystem: null,
    origin: null,
    oathOrigin: null,
    openingArcId: null,
    entrySceneId: null,
    tutorialBundleId: null,
    profession: null,
    professions: {},
    progress: {
      totalKills: 0,
      killsByEnemyId: {},
      gachaPulls: 0,
      gachaPullsSinceRare: 0,
      gachaPullsSinceEpic: 0,
      totalGoldEarned: 0,
      classEvolutions: 0,
      raceEvolutions: 0,
      raceEvolutionStage: 0,
    },
  },
  quests: {
    active: [],
    completed: [],
  },
  dungeon: {
    activeRun: null,
    completedRuns: [],
  },
  combat: createDefaultCombatState(),
  world: {
    ...createInitialWorldState({ seed: 1 }),
  },
  chatLog: [],
  narrative: {
    summary: "",
    entries: [],
    sequence: 0,
  },
  chronicle: createInitialChronicleState(),
  contentVersion: "core@0.1.0",
  stateVersion: GAME_STATE_VERSION,
};

export { initialGameState };
