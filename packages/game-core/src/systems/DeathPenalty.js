/**
 * Death penalty system.
 * Called when player HP reaches 0 in combat.
 */

export const DEATH_GOLD_PENALTY_PERCENT = 0.10;
export const DEATH_RESPAWN_HP = 1;
export const DEATH_RESPAWN_MANA = 1;

/**
 * Calculate and apply death penalty.
 * @param {object} playerState - Current player state
 * @param {string} deathCause - Description of what killed the player
 * @returns {object} { updatedPlayer, deathNotification }
 */
export function applyDeathPenalty(playerState, deathCause) {
  const currentGold = playerState?.gold ?? playerState?.currency?.goldCoins ?? 0;
  const goldLost = Math.floor(currentGold * DEATH_GOLD_PENALTY_PERCENT);
  const remainingGold = currentGold - goldLost;

  const updatedPlayer = {
    ...playerState,
    hp: {
      ...playerState.hp,
      current: DEATH_RESPAWN_HP,
    },
    mana: {
      ...playerState.mana,
      current: DEATH_RESPAWN_MANA,
    },
    gold: remainingGold,
    currency: playerState?.currency?.goldCoins !== undefined
      ? {
        ...playerState.currency,
        goldCoins: Math.max(0, (playerState.currency.goldCoins ?? 0) - goldLost),
      }
      : playerState?.currency,
  };

  const deathNotification = {
    type: 'death',
    cause: deathCause || 'Unknown cause',
    goldLost,
    respawnHp: DEATH_RESPAWN_HP,
    respawnMana: DEATH_RESPAWN_MANA,
    message: `You have been defeated${deathCause ? ` by ${deathCause}` : ''}! Lost ${goldLost} gold. Respawning with ${DEATH_RESPAWN_HP} HP.`,
  };

  return { updatedPlayer, deathNotification };
}
