import {
  toNumber,
  isPlainObject,
  mergeInventoryItems,
  getProgressionModifiers,
  scalePositiveReward,
} from "../../utils/shared.js";
import { getTitleBonuses } from "../../core/titleLogic.js";
import { updatePlayerVitals } from "../../core/PlayerVitals.js";

const mergeResources = (existing = {}, rewardResources = {}, multiplier = 1) => {
  const next = { ...existing };
  Object.entries(rewardResources).forEach(([key, delta]) => {
    if (!Number.isFinite(delta)) return;
    const scaledDelta = scalePositiveReward(delta, multiplier, "ceil");
    next[key] = toNumber(next[key], 0) + scaledDelta;
  });
  return next;
};

const scaleQuestItemRewards = (items = [], multiplier = 1, lootQualityBonus = 0) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const rewardFactor = Math.max(0, multiplier * (1 + Math.max(0, toNumber(lootQualityBonus, 0))));

  return items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
    if (quantity <= 0 || rewardFactor <= 1) {
      return { ...item, quantity };
    }
    const scaled = Math.max(1, Math.floor(quantity * rewardFactor));
    return { ...item, quantity: scaled };
  });
};

export const applyQuestRewards = (state, reward) => {
  if (!reward || typeof reward !== "object") return state;

  let playerChanged = false;
  let worldChanged = false;
  const player = { ...(state.player || {}) };
  const world = { ...(state.world || {}) };
  const progression = getProgressionModifiers(player);
  const xpRewardFactor =
    progression.xpGainMultiplier * progression.questRewardMultiplier;
  const goldRewardFactor =
    progression.goldGainMultiplier * progression.questRewardMultiplier;
  const resourceRewardFactor =
    progression.resourceGainMultiplier * progression.questRewardMultiplier;
  const soulRewardFactor = progression.questRewardMultiplier;
  const itemRewardFactor = progression.questRewardMultiplier;

  if (Number.isFinite(reward.xp) && reward.xp !== 0) {
    const adjustedXp = scalePositiveReward(reward.xp, xpRewardFactor, "ceil");
    if (isPlainObject(player.xp) && "current" in player.xp) {
      player.xp = {
        ...player.xp,
        current: toNumber(player.xp.current, 0) + adjustedXp,
      };
    } else {
      player.xp = toNumber(player.xp, 0) + adjustedXp;
    }
    playerChanged = true;
  }

  if (isPlainObject(reward.resources)) {
    player.resources = mergeResources(
      player.resources,
      reward.resources,
      resourceRewardFactor,
    );
    playerChanged = true;
  }

  if (Number.isFinite(reward.gold) && reward.gold !== 0) {
    const rawDelta = toNumber(reward.gold, 0);
    const titleBonuses = getTitleBonuses(player);
    const goldGain = Number.isFinite(titleBonuses.goldGain)
      ? titleBonuses.goldGain
      : 0;
    const titleAdjusted =
      rawDelta > 0 ? Math.ceil(rawDelta * (1 + goldGain)) : rawDelta;
    const delta = scalePositiveReward(titleAdjusted, goldRewardFactor, "ceil");
    const currentGold = toNumber(player.currency?.goldCoins ?? player.gold, 0);
    const nextGold = currentGold + delta;

    player.gold = nextGold;
    player.currency = {
      ...(player.currency || {}),
      goldCoins: nextGold,
      soulpoints: toNumber(player.currency?.soulpoints ?? player.soulpoints, 0),
    };
    if (player.soulpoints !== undefined) {
      player.soulpoints = toNumber(player.soulpoints, 0);
    }

    const progress = isPlainObject(player.progress) ? player.progress : {};
    const earnedDelta = Math.max(0, delta);
    player.progress = {
      ...progress,
      totalGoldEarned: toNumber(progress.totalGoldEarned, 0) + earnedDelta,
    };

    playerChanged = true;
  }

  if (Number.isFinite(reward.soulpoints) && reward.soulpoints !== 0) {
    const delta = scalePositiveReward(toNumber(reward.soulpoints, 0), soulRewardFactor, "ceil");
    const currentSoul = toNumber(
      player.currency?.soulpoints ?? player.soulpoints,
      0,
    );
    const nextSoul = currentSoul + delta;

    player.soulpoints = nextSoul;
    player.currency = {
      ...(player.currency || {}),
      goldCoins: toNumber(player.currency?.goldCoins ?? player.gold, 0),
      soulpoints: nextSoul,
    };

    playerChanged = true;
  }

  if (Array.isArray(reward.items) && reward.items.length > 0) {
    const scaledItems = scaleQuestItemRewards(
      reward.items,
      itemRewardFactor,
      progression.lootQualityBonus,
    );
    player.inventory = mergeInventoryItems(player.inventory, scaledItems);
    playerChanged = true;
  }

  if (Array.isArray(reward.titles) && reward.titles.length > 0) {
    const unlockedIds = player.unlockedTitles || player.titles || [];
    const titleSet = new Set(unlockedIds);
    reward.titles.forEach((title) => {
      if (typeof title === "string" && title) {
        titleSet.add(title);
      }
    });
    const unlockedTitles = Array.from(titleSet);
    player.unlockedTitles = unlockedTitles;
    player.titles = unlockedTitles;
    Object.assign(player, updatePlayerVitals(player, state.config));
    playerChanged = true;
  }

  if (isPlainObject(reward.flags)) {
    world.flags = {
      ...(world.flags || {}),
      ...reward.flags,
    };
    worldChanged = true;
  }

  if (isPlainObject(reward.magic)) {
    const magic = isPlainObject(player.magic) ? { ...player.magic } : {};

    if (Array.isArray(reward.magic.perks) && reward.magic.perks.length > 0) {
      const perkSet = new Set(
        (Array.isArray(magic.perks) ? magic.perks : [])
          .map((p) => (typeof p === "string" ? p : p && typeof p.id === "string" ? p.id : null))
          .filter(Boolean)
          .map((p) => String(p).trim().toLowerCase()),
      );
      const nextPerks = Array.isArray(magic.perks) ? [...magic.perks] : [];
      reward.magic.perks.forEach((perk) => {
        if (typeof perk === "string") {
          const id = perk.trim().toLowerCase();
          if (!id || perkSet.has(id)) return;
          perkSet.add(id);
          nextPerks.push(id);
          return;
        }
        if (perk && typeof perk === "object" && !Array.isArray(perk)) {
          const id = typeof perk.id === "string" ? perk.id.trim().toLowerCase() : "";
          if (!id) return;
          const rank = Math.max(1, Math.floor(toNumber(perk.rank, 1)));
          const existingIndex = nextPerks.findIndex((p) => p && typeof p === "object" && p.id === id);
          if (existingIndex >= 0) {
            const existing = nextPerks[existingIndex];
            nextPerks[existingIndex] = { ...existing, id, rank: Math.max(rank, existing.rank || 1) };
          } else if (!perkSet.has(id)) {
            nextPerks.push({ id, rank });
            perkSet.add(id);
          }
        }
      });
      magic.perks = nextPerks;
    }

    if (isPlainObject(reward.magic.patterns)) {
      const unlocked = isPlainObject(magic.unlockedPatterns) ? { ...magic.unlockedPatterns } : {};
      ["shape", "weave"].forEach((kind) => {
        const incoming = reward.magic.patterns[kind];
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        const set = new Set(
          (Array.isArray(unlocked[kind]) ? unlocked[kind] : [])
            .map((p) => String(p).trim().toLowerCase())
            .filter(Boolean),
        );
        incoming.forEach((p) => {
          if (typeof p !== "string") return;
          const id = p.trim().toLowerCase();
          if (!id) return;
          set.add(id);
        });
        unlocked[kind] = Array.from(set);
      });
      magic.unlockedPatterns = unlocked;
    }

    player.magic = magic;
    playerChanged = true;
  }

  if (!playerChanged && !worldChanged) {
    return state;
  }

  return {
    ...state,
    ...(playerChanged ? { player } : {}),
    ...(worldChanged ? { world } : {}),
  };
};
