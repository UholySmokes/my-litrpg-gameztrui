import { xpForNextLevel } from "./LevelingSystem.js";
import { applyRaceLevelUpGrowth } from "../race/RaceSystem.js";
import {
  calculateMaxHp,
  calculateMaxMana,
  ensureAttributeShape,
} from "../../utils/AttributeMath.js";
import { getEffectiveAttributes } from "../titles/TitleSystem.js";

const DEBUG_LOGGING_ENABLED = false;

/**
 * Adds XP to the player and handles level-ups.
 * @param {object} state - The current game state object.
 * @param {number} amount - The amount of XP to add.
 * @returns {object} A new game state object with the updated XP and level.
 */
export function addXp(state, amount) {
  let newState = {
    ...state,
    player: {
      ...state.player,
      xp: {
        ...state.player.xp,
        current: state.player.xp.current + amount,
      },
    },
  };

  while (newState.player.xp.current >= newState.player.xp.max) {
    newState = performLevelUp(newState);
  }

  return newState;
}

/**
 * Handles the level-up logic. Resets XP, increases Level, restores resources, and adds free points.
 * NOTE: This function is typically called by addXp(), not directly.
 * @param {object} state - The current game state object (with enough XP to level up).
 * @returns {object} A new game state object with the player leveled up.
 */
export function performLevelUp(state) {
  if (!state?.player) return state;

  const currentLevel = state.player.level ?? 1;
  const maxLevel = state.config?.maxLevel ?? currentLevel;
  if (currentLevel >= maxLevel) {
    return {
      ...state,
      player: {
        ...state.player,
        xp: {
          ...state.player.xp,
          current: Math.min(
            state.player.xp?.current ?? 0,
            state.player.xp?.max ?? 0,
          ),
        },
      },
    };
  }

  const currentXp = state.player.xp?.current ?? 0;
  const xpToSpend = state.player.xp?.max ?? 0;
  const overflowXp = Math.max(0, currentXp - xpToSpend);

  const growthBase = ensureAttributeShape(state.player.attributes, 0);
  const raceId = state.player?.race?.id || state.player?.race || null;
  const attributesWithGrowth = applyRaceLevelUpGrowth(growthBase, raceId);

  const freePointReward = state.config?.attributePointsPerLevel ?? 0;
  const existingFreePoints = state.player.attributes?.freePoints ?? 0;
  const newAttributes = {
    ...attributesWithGrowth,
    freePoints: existingFreePoints + freePointReward,
  };

  const nextLevel = currentLevel + 1;
  const effectiveAttributes = getEffectiveAttributes(
    state.player,
    state.config,
    newAttributes,
  );
  const nextHpMax = calculateMaxHp(effectiveAttributes);
  const nextManaMax = calculateMaxMana(effectiveAttributes);

  const newState = {
    ...state,
    player: {
      ...state.player,
      level: nextLevel,
      xp: {
        ...state.player.xp,
        current: overflowXp,
        max: xpForNextLevel(nextLevel, state.config),
      },
      hp: {
        ...state.player.hp,
        max: nextHpMax,
        current: nextHpMax,
      },
      mana: {
        ...state.player.mana,
        max: nextManaMax,
        current: nextManaMax,
      },
      attributes: newAttributes,
      justLeveledUp: true,
    },
  };

  if (DEBUG_LOGGING_ENABLED) {
    console.log(
      `LEVEL UP! ${newState.player.name} is now level ${newState.player.level}!`,
    );
  }

  return newState;
}

/**
 * Checks if the player has leveled up based on the current XP.
 * @param {object} playerSnapshot - A snapshot of the player's current state.
 * @param {object} config - The game configuration.
 * @returns {object} An object containing a boolean indicating whether the player has leveled up, the number of levels gained, and the updated player snapshot.
 */
export function checkThreshold(playerSnapshot, config = {}) {
  if (!playerSnapshot) {
    return { leveledUp: false, levelsGained: 0 };
  }

  const clone = JSON.parse(JSON.stringify(playerSnapshot));
  let leveledUp = false;
  let levelsGained = 0;

  while (clone.xp.current >= clone.xp.max) {
    clone.xp.current -= clone.xp.max;
    clone.level += 1;
    clone.xp.max = xpForNextLevel(clone.level, config);
    leveledUp = true;
    levelsGained += 1;
  }

  return { leveledUp, levelsGained, snapshot: clone };
}
