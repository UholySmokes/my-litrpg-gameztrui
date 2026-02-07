import { xpForNextLevel } from "../core/xpCurve.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";

export const INITIAL_CONFIG = {
  maxLevel: 100,
  attributePointsPerLevel: 3,

  baseAttributeValue: 5,
  strToDamageMultiplier: 2,
  baseLuckCritChance: 0.01,
  agilityEscapeBonus: 0.01,
  baseEscapeChance: 0.3,
  defenseReductionFactor: 0.5,

  restHealAmount: 0,
  restManaAmount: 0,
  manaRegenPerTurn: 2,
  classEvolutionLevel: 10,

  xpBrackets: [{ end: 1000, base: 100, growth: 1.5 }],
  xpBonusPerLevelDiff: 0.2,
  xpMalusPerLevelDiff: 0.1,
  xpNoRewardBelowDelta: 10,
  xpMinMultiplier: 0.1,
};

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

const initialGameState = {
  config: INITIAL_CONFIG,
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
    profession: null,
    professions: {},
    progress: {
      totalKills: 0,
      killsByEnemyId: {},
      gachaPulls: 0,
      totalGoldEarned: 0,
    },
  },
  quests: {
    active: [],
    completed: [],
  },
  world: {
    location: {
      current: "Starting Zone",
      visited: ["Starting Zone"],
      unlockedAreas: [],
    },
    flags: {},
    time: 0,
    turnCount: 0,
  },
  chatLog: [],
  narrative: {
    summary: "",
    entries: [],
    sequence: 0,
  },
};

export { initialGameState };
