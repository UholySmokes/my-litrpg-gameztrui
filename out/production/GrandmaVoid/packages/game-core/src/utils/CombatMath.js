/**
 * CombatMath.js
 * Pure, stateless combat and progression calculations
 * Used by gameReducer to ensure deterministic logic
 */

/**
 * Calculate XP required for the next level
 * @param {number} level - Current level
 * @returns {number} XP needed for next level
 */
export function xpForNextLevel(level) {
  // Bracketed exponential scaling: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate XP gained from defeating an enemy
 * @param {number} playerLevel - Player's current level
 * @param {number} monsterLevel - Defeated enemy's level
 * @returns {number} XP gained
 */
export function calculateGainedXP(playerLevel, monsterLevel) {
  const baseXP = 50;
  const levelDiff = monsterLevel - playerLevel;

  let multiplier = 1;
  if (levelDiff > 0) {
    // +20% per level higher
    multiplier = 1 + levelDiff * 0.2;
  } else if (levelDiff < 0) {
    // -10% per level lower, minimum 10% XP
    multiplier = Math.max(0.1, 1 + levelDiff * 0.1);
  }

  // Anti-farming: 0 XP if 10+ levels below
  if (levelDiff <= -10) return 0;

  return Math.floor(baseXP * multiplier);
}

/**
 * Calculate base damage before modifiers
 * @param {object} attacker - Attacker stats
 * @param {object} defender - Defender stats
 * @param {boolean} isMagic - Whether this is a magic attack
 * @returns {number} Base damage
 */
export function calculateDamage(attacker, defender, isMagic = false) {
  const scalingStat = isMagic
    ? attacker.intelligence || 10
    : attacker.strength || 10;
  const baseDamage = scalingStat * 2;

  const defense = defender.defense || 0;
  const reducedDamage = baseDamage - defense * 0.5;

  // Minimum damage is 10% of base
  return Math.max(baseDamage * 0.1, reducedDamage);
}

/**
 * Calculate critical hit chance
 * @param {number} luck - Luck stat
 * @returns {number} Critical hit chance (0-1)
 */
export function calculateCritChance(luck = 0) {
  const baseChance = luck * 0.01;
  // Soft cap at 50%
  return Math.min(0.5, baseChance);
}

/**
 * Calculate critical hit multiplier
 * @param {boolean} isCritical - Whether this is a critical hit
 * @returns {number} Damage multiplier
 */
export function calculateCritMultiplier(isCritical) {
  return isCritical ? 1.5 : 1.0;
}

/**
 * Apply level-up to state (pure function)
 * @param {object} state - Current game state
 * @returns {object} New state with level applied
 */
export function applyLevelUp(state) {
  const newLevel = (state.player.level || 1) + 1;
  const xpThreshold = xpForNextLevel(newLevel);

  return {
    ...state,
    player: {
      ...state.player,
      level: newLevel,
      xp: {
        ...(state.player.xp || {}),
        current: (state.player.xp?.current || 0) - (state.player.xp?.max || 0),
        max: xpThreshold,
      },
      hp: {
        ...(state.player.hp || {}),
        current: state.player.hp?.max || 100,
      },
      mana: {
        ...(state.player.mana || {}),
        current: state.player.mana?.max || 100,
      },
    },
  };
}
