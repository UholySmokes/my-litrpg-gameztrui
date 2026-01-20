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

