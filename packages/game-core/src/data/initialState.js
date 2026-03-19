import { xpForNextLevel } from "../core/xpCurve.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { createInitialWorldState } from "../world/WorldInitializer.js";
import * as saveCutover from "../../../../shared/save-cutover.js";

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

  xpBrackets: [
    { end: 10,   base: 100,    growth: 1.15 }, // Tier 1: Tutorial/Early game
    { end: 25,   base: 200,    growth: 1.18 }, // Tier 2: Early-mid
    { end: 50,   base: 500,    growth: 1.20 }, // Tier 3: Mid game
    { end: 100,  base: 1500,   growth: 1.22 }, // Tier 4: Late-mid
    { end: 200,  base: 5000,   growth: 1.25 }, // Tier 5: Late game
    { end: 350,  base: 20000,  growth: 1.15 }, // Tier 6: End game
    { end: 500,  base: 50000,  growth: 1.10 }, // Tier 7: Post-game grind
    { end: 1000, base: 100000, growth: 1.05 }, // Tier 8: Prestige/endless
  ],
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
  world: {
    ...createInitialWorldState({ seed: 1 }),
  },
  chatLog: [],
  narrative: {
    summary: "",
    entries: [],
    sequence: 0,
  },
  contentVersion: "core@0.1.0",
  stateVersion: GAME_STATE_VERSION,
};

export { initialGameState };
