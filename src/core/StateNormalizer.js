import { ensureAttributeShape } from "../constants/attributes.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { titleDatabase } from "../data/titleData.js";
import { xpForNextLevel } from "../systems/leveling/LevelingSystem.js";
import {
  getAutoUnlockableTitles,
  getEffectiveAttributes,
} from "./titleLogic.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";

const DEFAULT_CONFIG = {
  maxLevel: 100,
  attributePointsPerLevel: 3,

  baseAttributeValue: 5,
  strToDamageMultiplier: 2,
  baseLuckCritChance: 0.01,
  agilityEscapeBonus: 0.01,
  baseEscapeChance: 0.3,
  defenseReductionFactor: 0.5,

  xpBrackets: [{ end: 1000, base: 100, growth: 1.5 }],
  xpBonusPerLevelDiff: 0.2,
  xpMalusPerLevelDiff: 0.1,
  xpNoRewardBelowDelta: 10,
  xpMinMultiplier: 0.1,

  restHealAmount: 0,
  restManaAmount: 0,
};

const DEFAULT_RESOURCES = {
  rage: 0,
  chi: 0,
  focus: 0,
  stealth: 0,
  energy: 0,
};

const DEFAULT_CURRENCY = {
  goldCoins: 0,
  soulpoints: 0,
};

const DEFAULT_PROGRESS = {
  totalKills: 0,
  killsByEnemyId: {},
  gachaPulls: 0,
  totalGoldEarned: 0,
};

const toNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalizeEntityRef(value, { kind, fallback } = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const id = typeof value.id === "string" && value.id ? value.id : null;
    const name = typeof value.name === "string" && value.name ? value.name : id;
    if (id) return { id, name };
  }

  if (typeof value === "string" && value) {
    const trimmed = value.trim();
    if (!trimmed) return fallback ?? null;

    if (kind === "race") {
      const byId = DataRegistry.getRaceById(trimmed);
      if (byId) return { id: byId.id, name: byId.name || byId.id };
      const lowered = trimmed.toLowerCase();
      const byName = DataRegistry.getRaces().find(
        (race) =>
          typeof race?.name === "string" && race.name.toLowerCase() === lowered,
      );
      if (byName) return { id: byName.id, name: byName.name || byName.id };
      return trimmed;
    }

    if (kind === "class") {
      const byId = DataRegistry.getClassById(trimmed);
      if (byId) return { id: byId.id, name: byId.name || byId.id };
      const lowered = trimmed.toLowerCase();
      const byName = DataRegistry.getClasses().find(
        (cls) =>
          typeof cls?.name === "string" && cls.name.toLowerCase() === lowered,
      );
      if (byName) return { id: byName.id, name: byName.name || byName.id };
      return trimmed;
    }

    return trimmed;
  }

  return fallback ?? null;
}

function normalizeConfig(rawConfig) {
  const source =
    rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)
      ? rawConfig
      : {};

  const xpBrackets =
    Array.isArray(source.xpBrackets) && source.xpBrackets.length > 0
      ? source.xpBrackets
      : DEFAULT_CONFIG.xpBrackets;

  return {
    ...DEFAULT_CONFIG,
    ...source,
    xpBrackets,
  };
}

function normalizeAttributes(rawAttributes, baseAttributeValue) {
  const source =
    rawAttributes &&
    typeof rawAttributes === "object" &&
    !Array.isArray(rawAttributes)
      ? rawAttributes
      : {};

  const normalized = ensureAttributeShape(source, baseAttributeValue);
  return {
    ...normalized,
    freePoints: toNumber(source.freePoints, 0),
  };
}

function normalizeGauge(rawGauge, maxDefault) {
  if (rawGauge && typeof rawGauge === "object" && !Array.isArray(rawGauge)) {
    const max = toNumber(rawGauge.max, maxDefault);
    const current = clamp(toNumber(rawGauge.current, max), 0, max);
    return {
      ...rawGauge,
      current,
      max,
    };
  }

  const current = clamp(toNumber(rawGauge, maxDefault), 0, maxDefault);
  return {
    current,
    max: maxDefault,
  };
}

function normalizeXp(rawXp, level, config) {
  const xpMaxDefault = xpForNextLevel(level, config);
  if (rawXp && typeof rawXp === "object" && !Array.isArray(rawXp)) {
    return {
      ...rawXp,
      current: toNumber(rawXp.current, 0),
      max: toNumber(rawXp.max, xpMaxDefault),
    };
  }
  return {
    current: toNumber(rawXp, 0),
    max: xpMaxDefault,
  };
}

function getFreeAtStartTitleIds() {
  return titleDatabase
    .filter((title) => {
      const purchase = title?.unlockConditions?.purchase;
      if (!purchase) return false;
      const gold = toNumber(purchase.goldCoins, 0);
      const soul = toNumber(purchase.soulpoints, 0);
      const total = gold + soul;
      return total <= 0 && (title.unlockConditions?.level ?? 1) <= 1;
    })
    .map((title) => title.id)
    .filter(Boolean);
}

function normalizeTitles(player) {
  const unlocked = Array.isArray(player.unlockedTitles)
    ? player.unlockedTitles
    : Array.isArray(player.titles)
      ? player.titles
      : [];

  const freeAtStart = getFreeAtStartTitleIds();
  const unlockedSet = new Set(
    [...unlocked, ...freeAtStart].filter((id) => typeof id === "string" && id),
  );

  const unlockedTitles = Array.from(unlockedSet);
  const equippedTitle =
    typeof player.equippedTitle === "string" &&
    unlockedSet.has(player.equippedTitle)
      ? player.equippedTitle
      : null;

  return { unlockedTitles, equippedTitle };
}

function normalizeCurrency(player) {
  const currency =
    player.currency &&
    typeof player.currency === "object" &&
    !Array.isArray(player.currency)
      ? player.currency
      : {};

  const goldCoins = toNumber(currency.goldCoins ?? player.gold, 0);
  const soulpoints = toNumber(currency.soulpoints ?? player.soulpoints, 0);

  return {
    goldCoins,
    soulpoints,
    currency: {
      ...DEFAULT_CURRENCY,
      ...currency,
      goldCoins,
      soulpoints,
    },
  };
}

function normalizeResources(rawResources) {
  const source =
    rawResources &&
    typeof rawResources === "object" &&
    !Array.isArray(rawResources)
      ? rawResources
      : {};

  const next = { ...DEFAULT_RESOURCES };
  Object.entries(source).forEach(([key, value]) => {
    if (!key) return;
    const numeric = toNumber(value, null);
    if (numeric === null) return;
    next[key] = numeric;
  });
  return next;
}

function normalizePlayer(rawPlayer, config) {
  const player =
    rawPlayer && typeof rawPlayer === "object" && !Array.isArray(rawPlayer)
      ? rawPlayer
      : {};

  const level = Math.max(1, Math.floor(toNumber(player.level, 1)));
  const normalizedRace = normalizeEntityRef(player.race, {
    kind: "race",
    fallback: null,
  });
  const normalizedClass = normalizeEntityRef(player.class, {
    kind: "class",
    fallback: null,
  });
  const attributes = normalizeAttributes(
    player.attributes,
    config.baseAttributeValue,
  );

  const { goldCoins, soulpoints, currency } = normalizeCurrency(player);
  const { unlockedTitles, equippedTitle } = normalizeTitles(player);
  const progress =
    player.progress &&
    typeof player.progress === "object" &&
    !Array.isArray(player.progress)
      ? player.progress
      : {};
  const killsByEnemyId =
    progress.killsByEnemyId &&
    typeof progress.killsByEnemyId === "object" &&
    !Array.isArray(progress.killsByEnemyId)
      ? progress.killsByEnemyId
      : {};

  const effectiveAttributes = getEffectiveAttributes(
    {
      ...player,
      attributes,
      unlockedTitles,
      equippedTitle,
    },
    config,
    attributes,
  );
  const hpMaxDefault = calculateMaxHp(effectiveAttributes);
  const manaMaxDefault = calculateMaxMana(effectiveAttributes);

  return {
    ...player,
    name: player.name ?? "Wanderer",
    level,
    race: normalizedRace,
    class: normalizedClass,
    attributes,
    attributeInvestments:
      player.attributeInvestments &&
      typeof player.attributeInvestments === "object"
        ? player.attributeInvestments
        : {},
    xp: normalizeXp(player.xp, level, config),
    hp: normalizeGauge(player.hp, hpMaxDefault),
    mana: normalizeGauge(player.mana, manaMaxDefault),
    resources: normalizeResources(player.resources),
    inventory: Array.isArray(player.inventory) ? player.inventory : [],
    equipment:
      player.equipment &&
      typeof player.equipment === "object" &&
      !Array.isArray(player.equipment)
        ? player.equipment
        : {},
    abilities: Array.isArray(player.abilities) ? player.abilities : [],
    titles: unlockedTitles,
    unlockedTitles,
    equippedTitle,
    activeSkills: Array.isArray(player.activeSkills) ? player.activeSkills : [],
    passiveSkills: Array.isArray(player.passiveSkills)
      ? player.passiveSkills
      : [],
    gold: goldCoins,
    soulpoints,
    currency,
    talents: Array.isArray(player.talents) ? player.talents : [],
    professions:
      player.professions &&
      typeof player.professions === "object" &&
      !Array.isArray(player.professions)
        ? player.professions
        : {},
    progress: {
      ...DEFAULT_PROGRESS,
      ...progress,
      totalKills: Math.max(0, Math.floor(toNumber(progress.totalKills, 0))),
      killsByEnemyId,
      gachaPulls: Math.max(0, Math.floor(toNumber(progress.gachaPulls, 0))),
      totalGoldEarned: Math.max(
        goldCoins,
        Math.max(0, Math.floor(toNumber(progress.totalGoldEarned, 0))),
      ),
    },
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizeLocation(rawLocation) {
  if (
    rawLocation &&
    typeof rawLocation === "object" &&
    !Array.isArray(rawLocation)
  ) {
    const current =
      typeof rawLocation.current === "string" && rawLocation.current.trim()
        ? rawLocation.current.trim()
        : null;
    const visited = Array.isArray(rawLocation.visited)
      ? rawLocation.visited.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [];
    const unlockedAreas = Array.isArray(rawLocation.unlockedAreas)
      ? rawLocation.unlockedAreas.filter(
          (value) => typeof value === "string" && value.trim(),
        )
      : [];

    const resolvedCurrent = current ?? visited[0] ?? "Starting Zone";
    const resolvedVisited = visited.includes(resolvedCurrent)
      ? visited
      : [resolvedCurrent, ...visited];

    return {
      ...rawLocation,
      current: resolvedCurrent,
      visited: resolvedVisited,
      unlockedAreas,
    };
  }

  if (typeof rawLocation === "string" && rawLocation.trim()) {
    const current = rawLocation.trim();
    return {
      current,
      visited: [current],
      unlockedAreas: [],
    };
  }

  return {
    current: "Starting Zone",
    visited: ["Starting Zone"],
    unlockedAreas: [],
  };
}

export function normalizeGameState(rawState) {
  const state =
    rawState && typeof rawState === "object" && !Array.isArray(rawState)
      ? rawState
      : {};

  const config = normalizeConfig(state.config);
  const player = normalizePlayer(state.player, config);

  const quests = normalizeObject(state.quests);
  const world = normalizeObject(state.world);
  const narrative = normalizeObject(state.narrative);
  const combat = normalizeObject(state.combat);

  let normalized = {
    ...state,
    config,
    player,
    quests: {
      ...quests,
      active: normalizeArray(quests.active),
      completed: normalizeArray(quests.completed),
    },
    world: {
      ...world,
      location: normalizeLocation(world.location),
      flags: normalizeObject(world.flags),
      time: toNumber(world.time, 0),
      turnCount: Math.max(0, Math.floor(toNumber(world.turnCount, 0))),
    },
    combat: {
      ...combat,
      status: combat.status ?? "inactive",
      turn: combat.turn ?? "player",
      enemies: normalizeArray(combat.enemies),
      skillCooldowns: normalizeObject(combat.skillCooldowns),
      log: normalizeArray(combat.log),
    },
    chatLog: normalizeArray(state.chatLog),
    narrative: {
      ...narrative,
      summary: narrative.summary ?? "",
      chatLog: normalizeArray(narrative.chatLog),
    },
  };

  const autoUnlockable = getAutoUnlockableTitles(normalized);
  if (Array.isArray(autoUnlockable) && autoUnlockable.length > 0) {
    const unlocked = new Set(
      (normalized.player.unlockedTitles || []).filter(
        (id) => typeof id === "string" && id,
      ),
    );
    autoUnlockable.forEach((title) => {
      if (title?.id) unlocked.add(title.id);
    });

    const unlockedTitles = Array.from(unlocked);
    const equippedTitle =
      typeof normalized.player.equippedTitle === "string" &&
      unlocked.has(normalized.player.equippedTitle)
        ? normalized.player.equippedTitle
        : null;

    const nextPlayer = {
      ...normalized.player,
      titles: unlockedTitles,
      unlockedTitles,
      equippedTitle,
    };

    const effective = getEffectiveAttributes(nextPlayer, normalized.config);
    const nextHpMax = calculateMaxHp(effective);
    const nextManaMax = calculateMaxMana(effective);
    normalized = {
      ...normalized,
      player: {
        ...nextPlayer,
        hp: {
          ...nextPlayer.hp,
          max: nextHpMax,
          current: clamp(
            toNumber(nextPlayer.hp?.current, nextHpMax),
            0,
            nextHpMax,
          ),
        },
        mana: {
          ...nextPlayer.mana,
          max: nextManaMax,
          current: clamp(
            toNumber(nextPlayer.mana?.current, nextManaMax),
            0,
            nextManaMax,
          ),
        },
      },
    };
  }

  return normalized;
}
