import {
  CANONICAL_ATTRIBUTES,
  ensureAttributeShape,
  toCanonicalAttributeKey,
} from "../../constants/attributes.js";
import { titleDatabase } from "../../data/titleData.js";

const toNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

export function getTitleById(titleId) {
  if (!titleId) return null;
  return titleDatabase.find((title) => title.id === titleId) || null;
}

function getUnlockedTitleIds(player) {
  const unlocked = Array.isArray(player?.unlockedTitles)
    ? player.unlockedTitles
    : Array.isArray(player?.titles)
      ? player.titles
      : [];

  return Array.from(
    new Set(unlocked.filter((id) => typeof id === "string" && id)),
  );
}

function createEmptyBonuses() {
  return {
    attributes: {},
    allStats: 0,
    attack: 0,
    magic: 0,
    skillPower: 0,
    goldGain: 0,
    shopDiscount: 0,
    gachaBonus: 0,
  };
}

function applyBonusMap(aggregate, bonusMap) {
  if (!bonusMap || typeof bonusMap !== "object") return;

  Object.entries(bonusMap).forEach(([rawKey, rawValue]) => {
    if (!rawKey) return;
    const value = toNumber(rawValue, null);
    if (value === null) return;

    if (rawKey === "allStats") {
      aggregate.allStats += value;
      return;
    }

    const canonical = toCanonicalAttributeKey(rawKey);
    if (canonical) {
      aggregate.attributes[canonical] = toNumber(
        aggregate.attributes[canonical],
        0,
      );
      aggregate.attributes[canonical] += value;
      return;
    }

    switch (rawKey) {
      case "attack":
        aggregate.attack += value;
        break;
      case "magic":
        aggregate.magic += value;
        break;
      case "skillPower":
        aggregate.skillPower += value;
        break;
      case "goldGain":
        aggregate.goldGain += value;
        break;
      case "shopDiscount":
        aggregate.shopDiscount += value;
        break;
      case "gachaBonus":
        aggregate.gachaBonus += value;
        break;
      default:
        break;
    }
  });
}

export function getTitleBonuses(player) {
  const aggregate = createEmptyBonuses();
  if (!player) return aggregate;

  const unlockedIds = getUnlockedTitleIds(player);
  unlockedIds.forEach((id) => {
    const title = getTitleById(id);
    if (title?.secondaryBonus) {
      applyBonusMap(aggregate, title.secondaryBonus);
    }
  });

  const equippedId =
    typeof player.equippedTitle === "string" ? player.equippedTitle : null;
  if (equippedId) {
    const equipped = getTitleById(equippedId);
    if (equipped?.mainBonus) {
      applyBonusMap(aggregate, equipped.mainBonus);
    }
  }

  return aggregate;
}

export function getEffectiveAttributes(player, config = {}, baseAttributesOverride) {
  const baseAttributeValue = config?.baseAttributeValue ?? 0;
  const baseAttributes = baseAttributesOverride ?? player?.attributes ?? {};
  const normalized = ensureAttributeShape(baseAttributes, baseAttributeValue);

  const bonuses = getTitleBonuses(player);
  const allStats = toNumber(bonuses.allStats, 0);

  const effective = { ...normalized };
  CANONICAL_ATTRIBUTES.forEach((key) => {
    effective[key] =
      toNumber(effective[key], 0) +
      toNumber(bonuses.attributes[key], 0) +
      allStats;
  });

  effective.freePoints = toNumber(baseAttributes?.freePoints, 0);
  return effective;
}

function isUnlocked(player, titleId) {
  if (!titleId) return false;
  return getUnlockedTitleIds(player).includes(titleId);
}

function getPlayerProgress(player) {
  const progress =
    player?.progress && typeof player.progress === "object" && !Array.isArray(player.progress)
      ? player.progress
      : {};
  const killsByEnemyId =
    progress.killsByEnemyId &&
    typeof progress.killsByEnemyId === "object" &&
    !Array.isArray(progress.killsByEnemyId)
      ? progress.killsByEnemyId
      : {};
  return { ...progress, killsByEnemyId };
}

export function areNonPurchaseUnlockConditionsMet(titleOrId, gameState) {
  const title =
    typeof titleOrId === "string" ? getTitleById(titleOrId) : titleOrId;
  if (!title) return false;

  const conditions = title.unlockConditions || {};
  const state = gameState || {};
  const player = state.player || {};
  const progress = getPlayerProgress(player);

  if (conditions.level && toNumber(player.level, 1) < conditions.level) {
    return false;
  }

  if (conditions.quest) {
    const completed = Array.isArray(state.quests?.completed)
      ? state.quests.completed
      : [];
    const questCompleted = completed.some((q) => q?.id === conditions.quest);
    if (!questCompleted) return false;
  }

  if (conditions.killCount) {
    if (toNumber(progress.totalKills, 0) < conditions.killCount) {
      return false;
    }
  }

  if (conditions.totalGold) {
    const totalGoldEarned = toNumber(progress.totalGoldEarned, 0);
    if (totalGoldEarned < conditions.totalGold) {
      return false;
    }
  }

  if (conditions.maxedSkills) {
    const abilities = Array.isArray(player.abilities) ? player.abilities : [];
    const maxed = abilities.filter((ability) => (ability?.level || 0) >= 10).length;
    if (maxed < conditions.maxedSkills) {
      return false;
    }
  }

  if (conditions.killType) {
    const kills = toNumber(progress.killsByEnemyId?.[conditions.killType], 0);
    if (kills <= 0) {
      return false;
    }
  }

  if (conditions.gachaPulls) {
    if (toNumber(progress.gachaPulls, 0) < conditions.gachaPulls) {
      return false;
    }
  }

  return true;
}

export function getAutoUnlockableTitles(gameState) {
  const state = gameState || {};
  const player = state.player || {};

  return titleDatabase.filter((title) => {
    if (!title?.id) return false;
    if (title.unlockConditions?.purchase) return false;
    if (isUnlocked(player, title.id)) return false;
    return areNonPurchaseUnlockConditionsMet(title, state);
  });
}

export function canPurchaseTitle(titleOrId, gameState) {
  const title =
    typeof titleOrId === "string" ? getTitleById(titleOrId) : titleOrId;
  if (!title?.id) return false;

  const state = gameState || {};
  const player = state.player || {};
  if (isUnlocked(player, title.id)) return false;
  if (!title.unlockConditions?.purchase) return false;

  return areNonPurchaseUnlockConditionsMet(title, state);
}

export function getPurchasableTitles(gameState) {
  const state = gameState || {};
  return titleDatabase.filter((title) => canPurchaseTitle(title, state));
}
