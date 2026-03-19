/**
 * Prestige system — pure-function API for reducer integration.
 * All functions return new objects (no mutation).
 */

export interface PrestigeStats {
  prestigeLevel: number;
  soulShards: number;
  xpMultiplier: number;
  upgrades: Record<string, number>;
}

export type PrestigeUpgradeType = "damage" | "gold" | "mana" | "health";

/** Minimum player level required to prestige. */
export const PRESTIGE_MIN_LEVEL = 50;

/** XP multiplier gained per prestige level (additive). */
const XP_MULT_PER_LEVEL = 0.1;

/** Base cost per upgrade level: cost = BASE × (currentLevel + 1). */
const UPGRADE_BASE_COST = 10;

/** Default prestige stats for new players or state normalization. */
export function defaultPrestigeStats(): PrestigeStats {
  return {
    prestigeLevel: 0,
    soulShards: 0,
    xpMultiplier: 1.0,
    upgrades: { damage: 0, gold: 0, mana: 0, health: 0 },
  };
}

/** Calculate soul shards earned based on current player level. */
export function calculatePrestigeShards(currentLevel: number): number {
  if (currentLevel < PRESTIGE_MIN_LEVEL) return 0;
  return Math.floor(Math.pow(currentLevel, 1.5) / 100);
}

/** Return the shard cost for the next level of an upgrade type. */
export function getUpgradeCost(currentUpgradeLevel: number): number {
  return UPGRADE_BASE_COST * (currentUpgradeLevel + 1);
}

/**
 * Perform a prestige reset.  Returns a new player-shaped fragment that the
 * reducer should spread into state.player.
 *
 * Returns `null` when the player doesn't meet the level requirement or would
 * earn 0 shards.
 */
export function performPrestigeReset(player: {
  level: number;
  prestige?: PrestigeStats;
}): { level: number; xp: number; prestige: PrestigeStats } | null {
  const shards = calculatePrestigeShards(player.level);
  if (shards === 0) return null;

  const prev = player.prestige ?? defaultPrestigeStats();
  const nextLevel = prev.prestigeLevel + 1;

  return {
    level: 1,
    xp: 0,
    prestige: {
      prestigeLevel: nextLevel,
      soulShards: prev.soulShards + shards,
      xpMultiplier: 1 + nextLevel * XP_MULT_PER_LEVEL,
      upgrades: { ...prev.upgrades },
    },
  };
}

/**
 * Attempt to buy a prestige upgrade.
 * Returns a new `prestige` object on success, or `null` if the player can't
 * afford it.
 */
export function buyPrestigeUpgrade(
  prestige: PrestigeStats,
  type: PrestigeUpgradeType,
): PrestigeStats | null {
  const currentLevel = prestige.upgrades[type] ?? 0;
  const cost = getUpgradeCost(currentLevel);
  if (prestige.soulShards < cost) return null;

  return {
    ...prestige,
    soulShards: prestige.soulShards - cost,
    upgrades: {
      ...prestige.upgrades,
      [type]: currentLevel + 1,
    },
  };
}
