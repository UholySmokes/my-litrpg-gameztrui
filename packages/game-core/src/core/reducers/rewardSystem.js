import { getTitleBonuses } from "../titleLogic.js";
import {
  isPlainObject,
  mergeInventoryItems,
  toNumber,
} from "../../utils/shared.js";

const mergeResources = (existing = {}, rewardResources = {}) => {
  const next = { ...existing };
  Object.entries(rewardResources).forEach(([key, delta]) => {
    if (!Number.isFinite(delta)) return;
    next[key] = toNumber(next[key], 0) + delta;
  });
  return next;
};

const normalizePerkId = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export const applyQuestRewards = (
  state,
  reward,
  { updatePlayerVitals } = {},
) => {
  if (!reward || typeof reward !== "object") return state;

  let playerChanged = false;
  let worldChanged = false;
  const player = { ...(state.player || {}) };
  const world = { ...(state.world || {}) };

  if (Number.isFinite(reward.xp) && reward.xp !== 0) {
    if (isPlainObject(player.xp) && "current" in player.xp) {
      player.xp = {
        ...player.xp,
        current: toNumber(player.xp.current, 0) + reward.xp,
      };
    } else {
      player.xp = toNumber(player.xp, 0) + reward.xp;
    }
    playerChanged = true;
  }

  if (isPlainObject(reward.resources)) {
    player.resources = mergeResources(player.resources, reward.resources);
    playerChanged = true;
  }

  if (Number.isFinite(reward.gold) && reward.gold !== 0) {
    const rawDelta = toNumber(reward.gold, 0);
    const titleBonuses = getTitleBonuses(player);
    const goldGain = Number.isFinite(titleBonuses.goldGain)
      ? titleBonuses.goldGain
      : 0;
    const delta =
      rawDelta > 0 ? Math.ceil(rawDelta * (1 + goldGain)) : rawDelta;
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
    const delta = toNumber(reward.soulpoints, 0);
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
    player.inventory = mergeInventoryItems(player.inventory, reward.items);
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
    if (typeof updatePlayerVitals === "function") {
      Object.assign(player, updatePlayerVitals(player, state.config));
    }
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
          .map((perk) =>
            typeof perk === "string"
              ? normalizePerkId(perk)
              : normalizePerkId(perk?.id),
          )
          .filter(Boolean),
      );
      const nextPerks = Array.isArray(magic.perks) ? [...magic.perks] : [];

      reward.magic.perks.forEach((perk) => {
        if (typeof perk === "string") {
          const id = normalizePerkId(perk);
          if (!id || perkSet.has(id)) return;
          perkSet.add(id);
          nextPerks.push(id);
          return;
        }

        if (!perk || typeof perk !== "object" || Array.isArray(perk)) {
          return;
        }

        const id = normalizePerkId(perk.id);
        if (!id) return;

        const rank = Math.max(1, Math.floor(toNumber(perk.rank, 1)));
        const existingIndex = nextPerks.findIndex(
          (entry) => entry && typeof entry === "object" && entry.id === id,
        );

        if (existingIndex >= 0) {
          const existing = nextPerks[existingIndex];
          nextPerks[existingIndex] = {
            ...existing,
            id,
            rank: Math.max(rank, existing.rank || 1),
          };
          return;
        }

        if (perkSet.has(id)) return;
        nextPerks.push({ id, rank });
        perkSet.add(id);
      });

      magic.perks = nextPerks;
    }

    if (isPlainObject(reward.magic.patterns)) {
      const unlocked = isPlainObject(magic.unlockedPatterns)
        ? { ...magic.unlockedPatterns }
        : {};

      ["shape", "weave"].forEach((kind) => {
        const incoming = reward.magic.patterns[kind];
        if (!Array.isArray(incoming) || incoming.length === 0) return;
        const set = new Set(
          (Array.isArray(unlocked[kind]) ? unlocked[kind] : [])
            .map((pattern) => String(pattern).trim().toLowerCase())
            .filter(Boolean),
        );
        incoming.forEach((pattern) => {
          if (typeof pattern !== "string") return;
          const id = pattern.trim().toLowerCase();
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
