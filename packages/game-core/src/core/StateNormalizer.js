import { ensureAttributeShape } from "../constants/attributes.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { titleDatabase } from "../data/titleData.js";
import { xpForNextLevel } from "../systems/leveling/LevelingSystem.js";
import {
  getAutoUnlockableTitles,
  getEffectiveAttributes,
} from "./titleLogic.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { normalizeNarrativeEntries } from "./narrativeLog.js";
import { isPlainObject, toNumber, clamp } from "../utils/shared.js";
import { INITIAL_CONFIG } from "../data/initialState.js";
import {
  WORLD_META,
  MAJOR_FACTION_IDS,
  resolveLocationId,
  getLocationById,
  getBiomeEssenceProfile,
} from "../world/WorldDataRegistry.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";

const DEFAULT_CONFIG = INITIAL_CONFIG;

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

function lookupEntityByKind(trimmed, kind) {
  const registry = kind === "race"
    ? { getById: DataRegistry.getRaceById, getAll: DataRegistry.getRaces }
    : kind === "class"
      ? { getById: DataRegistry.getClassById, getAll: DataRegistry.getClasses }
      : null;
  if (!registry) return null;

  const byId = registry.getById(trimmed);
  if (byId) return { id: byId.id, name: byId.name || byId.id };

  const lowered = trimmed.toLowerCase();
  const byName = registry.getAll().find(
    (entry) =>
      typeof entry?.name === "string" && entry.name.toLowerCase() === lowered,
  );
  if (byName) return { id: byName.id, name: byName.name || byName.id };
  return null;
}

function normalizeEntityRef(value, { kind, fallback } = {}) {
  if (isPlainObject(value)) {
    const id = typeof value.id === "string" && value.id ? value.id : null;
    const name = typeof value.name === "string" && value.name ? value.name : id;
    if (id) return { id, name };
  }

  if (typeof value === "string" && value) {
    const trimmed = value.trim();
    if (!trimmed) return fallback ?? null;
    return lookupEntityByKind(trimmed, kind) ?? trimmed;
  }

  return fallback ?? null;
}

function normalizeConfig(rawConfig) {
  const source = isPlainObject(rawConfig) ? rawConfig : {};

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
  const source = isPlainObject(rawAttributes) ? rawAttributes : {};

  const normalized = ensureAttributeShape(source, baseAttributeValue);
  return {
    ...normalized,
    freePoints: toNumber(source.freePoints, 0),
  };
}

function normalizeGauge(rawGauge, maxDefault) {
  if (isPlainObject(rawGauge)) {
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
  if (isPlainObject(rawXp)) {
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

let _freeAtStartTitleIds = null;
function getFreeAtStartTitleIds() {
  if (_freeAtStartTitleIds) return _freeAtStartTitleIds;
  _freeAtStartTitleIds = titleDatabase
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
  return _freeAtStartTitleIds;
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
  const currency = isPlainObject(player.currency) ? player.currency : {};

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
  const source = isPlainObject(rawResources) ? rawResources : {};

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
  const player = isPlainObject(rawPlayer) ? rawPlayer : {};

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
  const archetypeSystem = isPlainObject(player.archetypeSystem)
      ? player.archetypeSystem
      : typeof player.archetypeSystem === "string"
        ? { id: player.archetypeSystem, name: player.archetypeSystem }
        : null;
  const { unlockedTitles, equippedTitle } = normalizeTitles(player);
  const progress = isPlainObject(player.progress) ? player.progress : {};
  const killsByEnemyId = isPlainObject(progress.killsByEnemyId)
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
    attributeInvestments: isPlainObject(player.attributeInvestments)
        ? player.attributeInvestments
        : {},
    xp: normalizeXp(player.xp, level, config),
    hp: normalizeGauge(player.hp, hpMaxDefault),
    mana: normalizeGauge(player.mana, manaMaxDefault),
    resources: normalizeResources(player.resources),
    inventory: Array.isArray(player.inventory) ? player.inventory : [],
    equipment: isPlainObject(player.equipment) ? player.equipment : {},
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
    archetypeSystem,
    talents: Array.isArray(player.talents) ? player.talents : [],
    professions: isPlainObject(player.professions) ? player.professions : {},
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
  return isPlainObject(value) ? value : {};
}

const DEFAULT_WORLD_ID = WORLD_META.id;
const DEFAULT_START_LOCATION_ID = "starting_zone";
const DEFAULT_WORLD_COUNTERS = {
  day: 1,
  chapter: 0,
  notoriety: 0,
};

function createDefaultWorldFlags() {
  return {
    leyline_storms_active: false,
    market_unrest_active: false,
    bloom_ignition_active: false,
    skydock_lockdown_active: false,
    veil_alert_active: false,
    tideward_breach_active: false,
    mirage_storm_active: false,
    caldera_vents_unstable: false,
    dream_wisps_active: false,
  };
}

function canonicalizeLocationId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "starting zone") return DEFAULT_START_LOCATION_ID;

  // Prefer canonical ids when possible; preserve unknown strings for forward-compat.
  return resolveLocationId(trimmed) || trimmed;
}

function canonicalizeLocationArray(values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  values.forEach((value) => {
    const id = canonicalizeLocationId(value);
    if (!id) return;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(id);
  });
  return out;
}

function normalizeWorldVars(rawVars) {
  const source = normalizeObject(rawVars);
  const next = { ...source };

  next.worldSeed = Number.isFinite(next.worldSeed) ? next.worldSeed : 1;

  next.startingSceneId =
    typeof next.startingSceneId === "string" && next.startingSceneId.trim()
      ? next.startingSceneId.trim()
      : null;
  next.current_quest_id =
    typeof next.current_quest_id === "string" && next.current_quest_id.trim()
      ? next.current_quest_id.trim()
      : null;

  return next;
}

function normalizeWorldCounters(rawCounters) {
  const source = normalizeObject(rawCounters);
  const next = {};

  Object.entries(source).forEach(([key, value]) => {
    if (!key) return;
    if (!Number.isFinite(value)) return;
    next[key] = toNumber(value, 0);
  });

  Object.entries(DEFAULT_WORLD_COUNTERS).forEach(([key, fallback]) => {
    next[key] = toNumber(next[key], fallback);
  });

  return next;
}

function normalizeFactionReputation(rawFactionReputation) {
  const source = normalizeObject(rawFactionReputation);
  const next = {};

  MAJOR_FACTION_IDS.forEach((id) => {
    next[id] = toNumber(source[id], 0);
  });

  Object.entries(source).forEach(([key, value]) => {
    if (!key) return;
    if (key in next) return;
    if (!Number.isFinite(value)) return;
    next[key] = toNumber(value, 0);
  });

  return next;
}

function migrateWorldFlags(rawFlags, baseVars, baseCounters) {
  const source = normalizeObject(rawFlags);
  const nextFlags = {};
  const nextVars = { ...(baseVars || {}) };
  const nextCounters = { ...(baseCounters || {}) };

  Object.entries(source).forEach(([key, value]) => {
    if (!key) return;

    // Explicit legacy migrations
    if (key === "startingSceneId" && typeof value === "string") {
      if (value.trim()) nextVars.startingSceneId = value.trim();
      return;
    }
    if (key === "current_quest_id" && typeof value === "string") {
      if (value.trim()) nextVars.current_quest_id = value.trim();
      return;
    }

    if (typeof value === "boolean") {
      nextFlags[key] = value;
      return;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      nextCounters[key] = value;
      return;
    }

    if (typeof value === "string") {
      if (value.trim()) nextVars[key] = value;
      return;
    }

    if (value !== undefined && value !== null) {
      // Preserve unknown non-boolean data without polluting flags.
      nextVars[key] = value;
    }
  });

  // Ensure known flags exist and remain boolean-only.
  const defaults = createDefaultWorldFlags();
  Object.entries(defaults).forEach(([key, fallback]) => {
    if (typeof nextFlags[key] !== "boolean") nextFlags[key] = fallback;
  });

  return { flags: nextFlags, vars: nextVars, counters: nextCounters };
}

function normalizeLocation(rawLocation) {
  if (isPlainObject(rawLocation)) {
    const current = canonicalizeLocationId(rawLocation.current);
    const visited = canonicalizeLocationArray(rawLocation.visited);
    const unlockedAreas = canonicalizeLocationArray(rawLocation.unlockedAreas);

    const resolvedCurrent =
      current ?? visited[0] ?? DEFAULT_START_LOCATION_ID;
    const resolvedVisited = visited.includes(resolvedCurrent)
      ? visited
      : [resolvedCurrent, ...visited];
    const resolvedUnlocked = unlockedAreas.includes(resolvedCurrent)
      ? unlockedAreas
      : [resolvedCurrent, ...unlockedAreas];

    const resolvedLoc = resolvedCurrent ? getLocationById(resolvedCurrent) : null;
    const derivedBiome = resolvedLoc?.zoneId || null;
    const biomeRaw = typeof rawLocation.biome === "string" ? rawLocation.biome : null;
    const biome = biomeRaw || derivedBiome || "city";

    return {
      ...rawLocation,
      current: resolvedCurrent,
      visited: resolvedVisited,
      unlockedAreas: resolvedUnlocked,
      biome,
    };
  }

  if (typeof rawLocation === "string" && rawLocation.trim()) {
    const current = canonicalizeLocationId(rawLocation) || DEFAULT_START_LOCATION_ID;
    const biome = getLocationById(current)?.zoneId || "city";
    return {
      current,
      visited: [current],
      unlockedAreas: [current],
      biome,
    };
  }

  const biome = getLocationById(DEFAULT_START_LOCATION_ID)?.zoneId || "city";
  return {
    current: DEFAULT_START_LOCATION_ID,
    visited: [DEFAULT_START_LOCATION_ID],
    unlockedAreas: [DEFAULT_START_LOCATION_ID],
    biome,
  };
}

function getTimeOfDayFromMinutes(gameTime) {
  const time = ((gameTime % 1440) + 1440) % 1440;
  if (time >= 1260 || time < 360) return "night";
  if (time >= 360 && time < 480) return "dawn";
  if (time >= 480 && time < 1140) return "day";
  if (time >= 1140 && time < 1260) return "dusk";
  return "day";
}

function normalizeWorldTime(rawTime) {
  if (isPlainObject(rawTime)) {
    const currentTime = Math.max(0, Math.floor(toNumber(rawTime.currentTime, 480)));
    const timeOfDayRaw = typeof rawTime.timeOfDay === "string" ? rawTime.timeOfDay : null;
    const timeOfDay = ["dawn", "day", "dusk", "night"].includes(timeOfDayRaw)
      ? timeOfDayRaw
      : getTimeOfDayFromMinutes(currentTime);
    const isOutdoors = rawTime.isOutdoors !== false;
    const lastUpdate = toNumber(rawTime.lastUpdate, SimBridge.now());
    return { currentTime, timeOfDay, isOutdoors, lastUpdate };
  }

  const legacyMinutes = toNumber(rawTime, 480);
  const currentTime = Math.max(0, Math.floor(legacyMinutes));
  return {
    currentTime,
    timeOfDay: getTimeOfDayFromMinutes(currentTime),
    isOutdoors: true,
    lastUpdate: SimBridge.now(),
  };
}

function normalizeWorldWeather(rawWeather, biomeId, turnCount) {
  const byBiome = isPlainObject(rawWeather?.byBiome) ? { ...rawWeather.byBiome } : {};
  const existing = isPlainObject(byBiome[biomeId]) ? byBiome[biomeId] : null;
  if (!existing) {
    byBiome[biomeId] = {
      type: "clear",
      intensity: 0.3,
      updatedTurn: turnCount,
    };
  } else {
    const typeRaw = typeof existing.type === "string" ? existing.type : "clear";
    const type = ["clear", "rain", "storm", "drought", "fog"].includes(typeRaw)
      ? typeRaw
      : "clear";
    byBiome[biomeId] = {
      type,
      intensity: clamp(toNumber(existing.intensity, 0.3), 0, 1),
      updatedTurn: Math.max(0, Math.floor(toNumber(existing.updatedTurn, turnCount))),
    };
  }

  return { byBiome };
}

function normalizeWorldEssence(rawEssence, { locationId, biomeId, time, weather } = {}) {
  const essence = isPlainObject(rawEssence) ? rawEssence : {};
  const sources = Array.isArray(essence.sources) ? essence.sources : [];
  const ambient = essence.ambient;

  const timeMinutes = toNumber(time?.currentTime, NaN);
  const isMidnightWindow = Number.isFinite(timeMinutes) ? timeMinutes >= 0 && timeMinutes < 120 : false;
  const resolvedTimeOfDay = typeof time?.timeOfDay === "string" ? time.timeOfDay : null;

  const essenceIds = [
    "fire",
    "water",
    "earth",
    "air",
    "lightning",
    "shadow",
    "light",
    "life",
    "creation",
    "destruction",
    "space",
    "time",
  ];

  const baselineFromLocation = (id) => {
    const text = String(id || "").toLowerCase();
    const base = {
      fire: 0.12,
      water: 0.12,
      earth: 0.12,
      air: 0.12,
      lightning: 0.08,
      shadow: 0.06,
      light: 0.06,
      life: 0.08,
      creation: 0.03,
      destruction: 0.03,
      space: 0.03,
      time: 0.03,
    };
    if (text.includes("coast") || text.includes("pier") || text.includes("tide")) {
      return { ...base, water: 0.35, air: 0.18, life: 0.14, fire: 0.06 };
    }
    if (text.includes("wilds") || text.includes("grove") || text.includes("root")) {
      return { ...base, life: 0.28, earth: 0.16, water: 0.16, shadow: 0.08 };
    }
    if (text.includes("mountain") || text.includes("ridge") || text.includes("foundry")) {
      return { ...base, earth: 0.30, air: 0.16, water: 0.06, life: 0.04 };
    }
    if (text.includes("ruins") || text.includes("leyline") || text.includes("plaza")) {
      return { ...base, lightning: 0.16, earth: 0.18, air: 0.14, shadow: 0.08 };
    }
    if (text.includes("undercity") || text.includes("veil") || text.includes("wet_gate")) {
      return { ...base, shadow: 0.18, water: 0.16, earth: 0.14, light: 0.04 };
    }
    if (text.includes("volcanic") || text.includes("caldera") || text.includes("ash")) {
      return { ...base, fire: 0.30, earth: 0.18, destruction: 0.06, water: 0.05 };
    }
    if (text.includes("desert") || text.includes("sands") || text.includes("mirage")) {
      return { ...base, air: 0.18, fire: 0.16, light: 0.10, water: 0.06, time: 0.05 };
    }
    if (text.includes("dream") || text.includes("mnemonic") || text.includes("mirrorpool")) {
      return { ...base, shadow: 0.12, light: 0.12, space: 0.08, time: 0.08 };
    }
    if (text.includes("city") || text.includes("bazaar") || text.includes("arcology")) {
      return { ...base, air: 0.16, light: 0.10, shadow: 0.08, earth: 0.10 };
    }
    return base;
  };

  const toSnapshotFromDensities = (densities) => {
    const profile = getBiomeEssenceProfile(biomeId);
    const dominant = new Set(Array.isArray(profile?.dominantTriad) ? profile.dominantTriad : []);
    const drawDominant = clamp(toNumber(profile?.draw?.dominant, 1.2), 0.9, 1.2);
    const drawOff = clamp(toNumber(profile?.draw?.off, 0.95), 0.9, 1.2);
    const refineDominant = clamp(toNumber(profile?.refine?.dominant, 1.1), 0.9, 1.2);
    const refineOff = clamp(toNumber(profile?.refine?.off, 0.98), 0.9, 1.2);
    const stabilityCapDeltaBase = clamp(toNumber(profile?.stabilityCapDelta, 0), -20, 20);
    const taintBaseline = clamp(toNumber(profile?.taintBaseline, 0), 0, 1);

    const compositionByEssence = essenceIds.reduce((acc, e) => {
      acc[e] = {
        density: clamp(toNumber(densities?.[e], 0), 0, 1),
        purity: clamp(1 - taintBaseline * 0.5, 0, 1),
        taint: taintBaseline,
      };
      return acc;
    }, {});

    const drawMultByEssence = essenceIds.reduce((acc, e) => {
      acc[e] = dominant.has(e) ? drawDominant : drawOff;
      return acc;
    }, {});
    const refineYieldMultByEssence = essenceIds.reduce((acc, e) => {
      acc[e] = dominant.has(e) ? refineDominant : refineOff;
      return acc;
    }, {});
    const recordOnes = essenceIds.reduce((acc, e) => {
      acc[e] = 1;
      return acc;
    }, {});

    const applyEssenceMult = (map, updates) => {
      Object.entries(updates || {}).forEach(([essenceId, mult]) => {
        if (!essenceIds.includes(essenceId)) return;
        map[essenceId] = clamp(toNumber(map[essenceId], 1) * toNumber(mult, 1), 0.9, 1.2);
      });
    };

    let stabilityCapDelta = stabilityCapDeltaBase;
    if (resolvedTimeOfDay === "dawn") stabilityCapDelta += 5;
    if (resolvedTimeOfDay === "night") stabilityCapDelta -= 2;
    stabilityCapDelta = clamp(stabilityCapDelta, -20, 20);

    if (resolvedTimeOfDay === "dawn") {
      applyEssenceMult(drawMultByEssence, { light: 1.05, life: 1.05, shadow: 0.98 });
      applyEssenceMult(refineYieldMultByEssence, { light: 1.03, life: 1.03 });
    } else if (resolvedTimeOfDay === "dusk") {
      applyEssenceMult(drawMultByEssence, { shadow: 1.06, air: 1.04 });
      applyEssenceMult(refineYieldMultByEssence, { shadow: 1.02 });
    } else if (resolvedTimeOfDay === "night") {
      applyEssenceMult(drawMultByEssence, { shadow: 1.03, time: 1.03, space: 1.02 });
    }

    const compressRiskMultByEssence = { ...recordOnes };
    const potencyMultByEssence = { ...recordOnes };

    if (isMidnightWindow) {
      essenceIds.forEach((e) => {
        compressRiskMultByEssence[e] = clamp(compressRiskMultByEssence[e] * 1.12, 0.9, 1.2);
        potencyMultByEssence[e] = clamp(potencyMultByEssence[e] * 1.08, 0.9, 1.2);
      });
      applyEssenceMult(potencyMultByEssence, { time: 1.04, space: 1.03, shadow: 1.02 });
    }

    const weatherNode = isPlainObject(weather?.byBiome) ? weather.byBiome[biomeId] : null;

    return {
      compositionByEssence,
      global: {
        drawMultByEssence,
        refineYieldMultByEssence,
        stabilityCapDelta,
        compressRiskMultByEssence,
        potencyMultByEssence,
      },
      provenance: {
        biome: biomeId || null,
        timeOfDay: resolvedTimeOfDay || null,
        weatherType: typeof weatherNode?.type === "string" ? weatherNode.type : null,
        weatherIntensity: Number.isFinite(weatherNode?.intensity) ? weatherNode.intensity : null,
        anomalyIds: [],
        locationId: locationId || null,
      },
      tags: [],
    };
  };

  const isSnapshot = isPlainObject(ambient) && isPlainObject(ambient.compositionByEssence);
  if (isSnapshot) {
    return {
      ambient,
      sources,
    };
  }

  const isLegacyMap = isPlainObject(ambient);
  if (isLegacyMap) {
    return {
      ambient: toSnapshotFromDensities(ambient),
      sources,
    };
  }

  return {
    ambient: toSnapshotFromDensities(baselineFromLocation(locationId)),
    sources,
  };
}

export function normalizeGameState(rawState) {
  const state = isPlainObject(rawState) ? rawState : {};

  const config = normalizeConfig(state.config);
  const player = normalizePlayer(state.player, config);

  const quests = normalizeObject(state.quests);
  const world = normalizeObject(state.world);
  const narrative = normalizeObject(state.narrative);
  const combat = normalizeObject(state.combat);

  const baseWorldVars = normalizeObject(world.vars);
  const baseWorldCounters = normalizeObject(world.counters);
  const migratedWorldFlags = migrateWorldFlags(
    world.flags,
    baseWorldVars,
    baseWorldCounters,
  );
  const normalizedWorldId =
    typeof world.id === "string" && world.id.trim() ? world.id.trim() : DEFAULT_WORLD_ID;
  const normalizedWorldLocation = normalizeLocation(world.location);
  const normalizedWorldVars = normalizeWorldVars(migratedWorldFlags.vars);
  const normalizedWorldCounters = normalizeWorldCounters(
    migratedWorldFlags.counters,
  );
  const normalizedFactionReputation = normalizeFactionReputation(
    world.factionReputation,
  );
  const normalizedTurnCount = Math.max(0, Math.floor(toNumber(world.turnCount, 0)));
  const normalizedWorldTime = normalizeWorldTime(world.time);
  const normalizedWorldWeather = normalizeWorldWeather(
    world.weather,
    normalizedWorldLocation.biome || "city",
    normalizedTurnCount,
  );
  const normalizedWorldEssence = normalizeWorldEssence(world.essence, {
    locationId: normalizedWorldLocation.current,
    biomeId: normalizedWorldLocation.biome || "city",
    time: normalizedWorldTime,
    weather: normalizedWorldWeather,
  });
  const legacyNarrativeEntries = normalizeArray(narrative.chatLog);
  const legacySystemEntries = normalizeArray(state.chatLog).filter((entry) =>
    ["system", "status-update"].includes(entry?.type),
  );
  const normalizedEntries = normalizeNarrativeEntries(
    normalizeArray(narrative.entries),
  );
  const legacyEntries = normalizeNarrativeEntries([
    ...legacyNarrativeEntries,
    ...legacySystemEntries,
  ]);

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
      id: normalizedWorldId,
      location: normalizedWorldLocation,
      flags: migratedWorldFlags.flags,
      vars: normalizedWorldVars,
      counters: normalizedWorldCounters,
      factionReputation: normalizedFactionReputation,
      time: normalizedWorldTime,
      turnCount: normalizedTurnCount,
      weather: normalizedWorldWeather,
      essence: normalizedWorldEssence,
    },
    combat: {
      ...combat,
      status: combat.status ?? "inactive",
      turn: combat.turn ?? "player",
      enemies: normalizeArray(combat.enemies),
      skillCooldowns: normalizeObject(combat.skillCooldowns),
      classAbilityCooldowns: normalizeObject(combat.classAbilityCooldowns),
      raceAbilityCooldowns: normalizeObject(combat.raceAbilityCooldowns),
      log: normalizeArray(combat.log),
    },
    chatLog: normalizeArray(state.chatLog),
    narrative: {
      ...narrative,
      summary: narrative.summary ?? "",
      entries: normalizedEntries.length ? normalizedEntries : legacyEntries,
      sequence: Math.max(
        0,
        ...normalizedEntries.map((entry) => entry.sequence || 0),
        ...legacyEntries.map((entry) => entry.sequence || 0),
      ),
    },
    contentVersion: state.contentVersion ?? "core@0.1.0",
    stateVersion: typeof state.stateVersion === "number" ? state.stateVersion : 1,
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
