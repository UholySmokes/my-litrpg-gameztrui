import { addItem } from "../inventory/InventorySystem.js";
import { addXp } from "../leveling/LevelingManager.js";
import { calculateEnemyDrops } from "../../entities/Enemy.js";
import { calculateGainedXP } from "../../core/xpCurve.js";
import {
  getProgressionModifiers,
  scalePositiveReward,
  toNumber,
} from "../../utils/shared.js";
import { getTitleBonuses } from "../titles/TitleSystem.js";
import { random } from "../../utils/DeterministicRandom.js";
import { hasCreationPerk } from "../../core/creationPerks.js";

const createEnemyDefeatLog = ({
  combatLog,
  enemyName,
  xpGained,
  baseXp,
  goldEarned,
  itemCount,
}) => [
  ...combatLog,
  `${enemyName} defeated! Gained ${xpGained} XP (Base: ${baseXp}), ${goldEarned} gold, and ${itemCount} item(s).`,
];

export function endCombatPhase(state, result) {
  const newLog = [...state.combat.log];

  if (result === "victory") {
    newLog.push("Victory! All enemies defeated!");
  } else if (result === "defeat") {
    newLog.push("Defeat! You have been knocked unconscious.");
  } else if (result === "escape") {
    newLog.push("You successfully escaped from combat!");
  }

  return {
    ...state,
    combat: {
      status:
        result === "victory"
          ? "victory"
          : result === "defeat"
            ? "defeat"
            : "inactive",
      turn: "player",
      enemies: [],
      log: newLog,
    },
  };
}

export function handleEnemyDefeatPhase(state, enemyIndex) {
  const enemy = state.combat.enemies[enemyIndex];
  const drops = calculateEnemyDrops(enemy);
  const progression = getProgressionModifiers(state.player);
  const titleBonuses = getTitleBonuses(state.player);
  const goldGain = Number.isFinite(titleBonuses.goldGain)
    ? titleBonuses.goldGain
    : 0;
  const titleAdjustedGold =
    drops.gold > 0 ? Math.max(0, Math.ceil(drops.gold * (1 + goldGain))) : 0;
  let goldEarned = scalePositiveReward(
    titleAdjustedGold,
    progression.goldGainMultiplier,
    "ceil",
  );
  if (goldEarned > 0 && hasCreationPerk(state.player, "scavenger")) {
    goldEarned = Math.ceil(goldEarned * 1.1 - 1e-9);
  }

  const lootFactor = Math.max(
    1,
    1 + Math.max(0, toNumber(progression.lootQualityBonus, 0)),
  );
  const adjustedItems = Array.isArray(drops.items)
    ? drops.items.map((item) => {
        if (!item || typeof item !== "object") return item;
        const baseQuantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
        if (lootFactor <= 1) return { ...item, quantity: baseQuantity };
        const scaled = baseQuantity * lootFactor;
        const guaranteed = Math.max(1, Math.floor(scaled));
        const fractional = scaled - guaranteed;
        const bonus = fractional > 0 && random() < fractional ? 1 : 0;
        return { ...item, quantity: guaranteed + bonus };
      })
    : [];

  let nextState = state;
  const progressSource =
    nextState.player.progress &&
    typeof nextState.player.progress === "object" &&
    nextState.player.progress !== null
      ? nextState.player.progress
      : {};
  const killsByEnemyIdSource =
    progressSource.killsByEnemyId &&
    typeof progressSource.killsByEnemyId === "object" &&
    progressSource.killsByEnemyId !== null
      ? progressSource.killsByEnemyId
      : {};
  const killsByEnemyId = { ...killsByEnemyIdSource };
  if (enemy?.id) {
    killsByEnemyId[enemy.id] = (killsByEnemyId[enemy.id] || 0) + 1;
  }

  nextState = {
    ...nextState,
    player: {
      ...nextState.player,
      progress: {
        ...progressSource,
        totalKills: (progressSource.totalKills || 0) + 1,
        killsByEnemyId,
        totalGoldEarned: (progressSource.totalGoldEarned || 0) + goldEarned,
      },
    },
  };

  if (goldEarned > 0) {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        gold: (nextState.player.gold || 0) + goldEarned,
        currency: {
          ...nextState.player.currency,
          goldCoins: (nextState.player.currency?.goldCoins || 0) + goldEarned,
        },
      },
    };
  }

  adjustedItems.forEach((item) => {
    nextState = addItem(nextState, item);
  });

  const baseXp = calculateGainedXP(
    state.player.level,
    enemy.level,
    drops.xp,
    state.config,
  );
  const xpGained = scalePositiveReward(
    baseXp,
    progression.xpGainMultiplier,
    "ceil",
  );
  nextState = addXp(nextState, xpGained);

  const itemCount = adjustedItems.reduce(
    (sum, item) => sum + Math.max(1, Math.floor(toNumber(item?.quantity, 1))),
    0,
  );
  const newEnemies = nextState.combat.enemies.filter((_, idx) => idx !== enemyIndex);

  nextState = {
    ...nextState,
    combat: {
      ...nextState.combat,
      enemies: newEnemies,
      log: createEnemyDefeatLog({
        combatLog: nextState.combat.log,
        enemyName: enemy.name,
        xpGained,
        baseXp: drops.xp,
        goldEarned,
        itemCount,
      }),
    },
  };

  if (
    newEnemies.length === 0 ||
    newEnemies.every((candidate) => candidate.stats.hp.current <= 0)
  ) {
    return endCombatPhase(nextState, "victory");
  }

  return nextState;
}
