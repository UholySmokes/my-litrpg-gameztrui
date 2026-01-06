import { xpForNextLevel } from './LevelingSystem.js';
import { applyRaceLevelUpGrowth } from '../race/RaceSystem.js';

const DEBUG_LOGGING_ENABLED = false;

/**
 * Adds XP to the player and handles level-ups.
 * @param {object} state - The current game state object.
 * @param {number} amount - The amount of XP to add.
 * @returns {object} A new game state object with the updated XP and level.
 */
export function addXp(state, amount) {
    // Create a new state with the added XP
    let newState = {
      ...state,
      player: {
        ...state.player,
        xp: {
          ...state.player.xp,
          current: state.player.xp.current + amount
        }
      }
    };
  
    // Loop to handle multiple level-ups from a single XP gain
    while (newState.player.xp.current >= newState.player.xp.max) {
      newState = levelUp(newState);
    }
  
    return newState;
  }
  
  /**
   * Handles the level-up logic. Resets XP, increases Level, restores resources, and adds free points.
   * NOTE: This function is typically called by addXp(), not directly.
   * @param {object} state - The current game state object (with enough XP to level up).
   * @returns {object} A new game state object with the player leveled up.
   */
  export function levelUp(state) {
    const maxLevel = state.config?.maxLevel ?? state.player.level;
    if (state.player.level >= maxLevel) {
      // Already at or beyond max level; keep XP capped at max.
      return {
        ...state,
        player: {
          ...state.player,
          xp: {
            ...state.player.xp,
            current: Math.min(state.player.xp.current, state.player.xp.max)
          }
        }
      };
    }
    // Calculate overflow XP after leveling up
    const overflowXp = state.player.xp.current - state.player.xp.max;
  
    // Create a new state with all the level-up changes
    // 4. Add Free Attribute Points and Apply Race Growth
      const attributesWithGrowth = applyRaceLevelUpGrowth(state.player.attributes, state.player.race.id);
      
      const newAttributes = {
        ...attributesWithGrowth,
        freePoints: attributesWithGrowth.freePoints + state.config.attributePointsPerLevel
      };

      const newState = {
        ...state,
        player: {
          ...state.player,
          // 1. Increase Level
          level: state.player.level + 1,
          
          // 2. Reset XP and increase maxXp for the next level
          xp: {
            ...state.player.xp,
            current: overflowXp,
            max: xpForNextLevel(state.player.level + 1, state.config)
          },
    
          // 3. Restore HP and Mana to full
          hp: {
            ...state.player.hp,
            current: state.player.hp.max
          },
          mana: {
            ...state.player.mana,
            current: state.player.mana.max
          },
    
          // 4. Update Attributes
          attributes: newAttributes,
    
          // 5. Set a flag for the UI to display a notification
          justLeveledUp: true
        }
      };
  
    console.log(`LEVEL UP! ${newState.player.name} is now level ${newState.player.level}!`);
    return newState;
  }
