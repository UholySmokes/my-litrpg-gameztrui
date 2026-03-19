/**
 * Handle rest actions — restore HP and mana based on config.
 * @param {object} state - Current game state
 * @param {object} _action - The action object (unused)
 * @returns {{ newState: object, description: string, changes: object }|{ earlyReturn: object }}
 */
export function handleRest(state, _action) {
  if (state.combat?.status === "active") {
    return {
      earlyReturn: { success: false, reason: "Cannot rest during combat", state },
    };
  }

  const player = state.player;
  const hp =
    player.hp && typeof player.hp === "object" && player.hp !== null
      ? player.hp
      : { current: player.hp ?? 0, max: player.maxHp ?? 100 };
  const mana =
    player.mana && typeof player.mana === "object" && player.mana !== null
      ? player.mana
      : { current: player.mana ?? 0, max: player.maxMana ?? 100 };

  const config = state.config || {};
  const hpAmount = config.restHealAmount > 0
    ? config.restHealAmount
    : Math.max(config.restHealMinFloor ?? 5, Math.floor(hp.max * (config.restHealPercent ?? 0.25)));
  const manaAmount = config.restManaAmount > 0
    ? config.restManaAmount
    : Math.max(config.restManaMinFloor ?? 3, Math.floor(mana.max * (config.restManaPercent ?? 0.40)));

  const nextHp = Math.min(hp.max, (hp.current ?? 0) + hpAmount);
  const nextMana = Math.min(mana.max, (mana.current ?? 0) + manaAmount);

  const changes = {};
  const newState = {
    ...state,
    player: {
      ...player,
      hp: { ...hp, current: nextHp },
      mana: { ...mana, current: nextMana },
    },
  };

  changes.hp = { current: nextHp, max: hp.max };
  changes.mana = { current: nextMana, max: mana.max };

  return { newState, description: "Rested and recovered.", changes };
}
