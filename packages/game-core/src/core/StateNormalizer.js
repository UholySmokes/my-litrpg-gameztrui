import { ensureAttributeShape } from "../constants/attributes.js";
import { normalizeChronicleState } from "../chronicle/ChronicleRuntime.js";
import { DataRegistry } from "../data/DataRegistry.js";
import { titleDatabase } from "../data/titleData.js";
import { xpForNextLevel } from "../systems/leveling/LevelingSystem.js";
import {
  getAutoUnlockableTitles,
  getEffectiveAttributes,
} from "./titleLogic.js";
import * as saveCutover from "../../../../shared/save-cutover.js";
import { calculateMaxHp, calculateMaxMana } from "../utils/AttributeMath.js";
import { normalizeNarrativeEntries } from "./narrativeLog.js";
import {
  isPlainObject,
  toNumber,
  clamp,
  normalizeProgressionModifiers,
} from "../utils/shared.js";
import { INITIAL_CONFIG } from "../data/initialState.js";
import { describeBalanceConfig } from "../data/balance/balanceConfig.js";
import { getArchetypeSystemById } from "../systems/archetype/ArchetypeSystemRegistry.js";
import { isDevourerCorePlayer, normalizeDevourerArchetypeState } from "../systems/archetype/devourerCore.js";
import {
  DEFAULT_START_LOCATION_ID,
  DEFAULT_START_ZONE_ID,
  WORLD_FLAG_DEFAULTS,
  WORLD_META,
  MAJOR_FACTION_IDS,
  resolveLocationId,
  resolveZoneId,
  getLocationById,
  getZoneById,
  getZoneEntryLocationId,
  getBiomeEssenceProfile,
  getEssenceAnomalyById,
} from "../world/WorldDataRegistry.js";
import {
  getOpeningArcByOathOriginId,
  resolveOpeningArcId,
} from "../world/OpeningArcRegistry.js";
import { resolveOpeningTutorialBundleId } from "../world/OpeningTutorialBundleRegistry.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { defaultPrestigeStats } from "../systems/PrestigeSystem";
import {
  normalizeAbilityState,
  syncPlayerAbilityState,
} from "../systems/abilities/UnifiedAbilityEngine.js";
import { createDefaultCombatState } from "../systems/skirmish/SkirmishState.js";

const DEFAULT_CONFIG = INITIAL_CONFIG;
const { GAME_STATE_VERSION } = saveCutover;

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
  gachaPullsSinceRare: 0,
  gachaPullsSinceEpic: 0,
  totalGoldEarned: 0,
};

const DEFAULT_DUNGEON_STATE = {
  activeRun: null,
  completedRuns: [],
};

function lookupEntityByKind(trimmed, kind) {
  const registry = kind === "race"
    ? {
        getById: (id) => DataRegistry.getRaceById(id),
        getAll: () => DataRegistry.getRaces(),
      }
    : kind === "class"
      ? {
          getById: (id) => DataRegistry.getClassById(id),
          getAll: () => DataRegistry.getClasses(),
        }
      : kind === "origin"
        ? {
            getById: (id) => DataRegistry.getOriginById(id),
            getAll: () => DataRegistry.getOrigins(),
          }
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

function normalizeOriginRef(value, fallback = null) {
  const normalized = normalizeEntityRef(value, {
    kind: "origin",
    fallback,
  });

  if (!normalized) return fallback ?? null;

  const originId =
    typeof normalized === "string"
      ? normalized
      : typeof normalized.id === "string"
        ? normalized.id
        : null;
  const registryOrigin = originId ? DataRegistry.getOriginById(originId) : null;

  if (registryOrigin) {
    return {
      ...registryOrigin,
      ...(isPlainObject(value) ? value : {}),
      id: registryOrigin.id,
      name:
        typeof value?.name === "string" && value.name.trim()
          ? value.name
          : registryOrigin.name,
      description:
        typeof value?.description === "string" && value.description.trim()
          ? value.description
          : registryOrigin.description,
      attributeBonuses: ensureAttributeShape(
        isPlainObject(value?.attributeBonuses)
          ? value.attributeBonuses
          : registryOrigin.attributeBonuses,
        0,
      ),
      favoredBiome:
        typeof value?.favoredBiome === "string" && value.favoredBiome.trim()
          ? value.favoredBiome
          : registryOrigin.favoredBiome,
      favoredFactionId:
        typeof value?.favoredFactionId === "string" && value.favoredFactionId.trim()
          ? value.favoredFactionId
          : registryOrigin.favoredFactionId || null,
      favoredQuestTags: Array.isArray(value?.favoredQuestTags)
        ? value.favoredQuestTags.filter((tag) => typeof tag === "string" && tag.trim())
        : Array.isArray(registryOrigin.favoredQuestTags)
          ? [...registryOrigin.favoredQuestTags]
          : [],
    };
  }

  if (isPlainObject(value) && typeof value.id === "string" && value.id.trim()) {
    return {
      id: value.id,
      name: typeof value.name === "string" && value.name.trim() ? value.name : value.id,
      description: typeof value.description === "string" ? value.description : "",
      attributeBonuses: ensureAttributeShape(value.attributeBonuses, 0),
      favoredBiome:
        typeof value.favoredBiome === "string" ? value.favoredBiome : "neutral",
      favoredFactionId:
        typeof value.favoredFactionId === "string" ? value.favoredFactionId : null,
      favoredQuestTags: Array.isArray(value.favoredQuestTags)
        ? value.favoredQuestTags.filter((tag) => typeof tag === "string" && tag.trim())
        : [],
    };
  }

  return fallback ?? null;
}

function normalizeOathOriginRef(value, fallback = null) {
  const source =
    isPlainObject(value) && typeof value.id === "string" && value.id.trim()
      ? value
      : null;
  const zoneId =
    (typeof value === "string" && value.trim()) ||
    source?.zoneId ||
    source?.id ||
    fallback?.zoneId ||
    fallback?.id ||
    null;

  const resolvedZoneId = canonicalizeZoneId(zoneId, null);
  if (!resolvedZoneId) return fallback ?? null;
  const resolvedLocationId =
    canonicalizeLocationId(source?.locationId) ||
    canonicalizeLocationId(fallback?.locationId) ||
    getZoneEntryLocationId(resolvedZoneId) ||
    null;
  const zone = getZoneById(resolvedZoneId);

  return {
    id: resolvedZoneId,
    name:
      (typeof source?.name === "string" && source.name.trim()) ||
      (typeof fallback?.name === "string" && fallback.name.trim()) ||
      zone?.name ||
      resolvedZoneId,
    zoneId: resolvedZoneId,
    locationId: resolvedLocationId,
    type:
      (typeof source?.type === "string" && source.type.trim()) ||
      (typeof fallback?.type === "string" && fallback.type.trim()) ||
      "exploration",
    summary:
      (typeof source?.summary === "string" && source.summary.trim()) ||
      (typeof fallback?.summary === "string" && fallback.summary.trim()) ||
      "",
  };
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
    balanceSummary: describeBalanceConfig({
      ...DEFAULT_CONFIG,
      ...source,
      xpBrackets,
    }),
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
  const normalizedOrigin = normalizeOriginRef(player.origin, null);
  const normalizedStartingZoneId = canonicalizeZoneId(player.startingZoneId, null);
  const normalizedStartingLocationId = canonicalizeLocationId(
    player.startingLocationId || null,
  );
  const legacyOathOriginFallback =
    normalizedStartingZoneId
      ? {
          id: normalizedStartingZoneId,
          zoneId: normalizedStartingZoneId,
          locationId:
            normalizedStartingLocationId ||
            getZoneEntryLocationId(normalizedStartingZoneId) ||
            null,
        }
      : null;
  const normalizedOathOrigin = normalizeOathOriginRef(
    player.oathOrigin,
    legacyOathOriginFallback,
  );
  const resolvedOpeningArc =
    getOpeningArcByOathOriginId(
      normalizedOathOrigin?.id || normalizedStartingZoneId,
    ) || null;
  const normalizedOpeningArcId =
    resolveOpeningArcId(player.openingArcId) || resolvedOpeningArc?.id || null;
  const normalizedTutorialBundleId =
    resolveOpeningTutorialBundleId(player.tutorialBundleId) ||
    resolvedOpeningArc?.tutorialBundleId ||
    null;
  const attributes = normalizeAttributes(
    player.attributes,
    config.baseAttributeValue,
  );

  const { goldCoins, soulpoints, currency } = normalizeCurrency(player);
  const rawArchetypeSystem = isPlainObject(player.archetypeSystem)
    ? player.archetypeSystem
    : typeof player.archetypeSystem === "string"
      ? { id: player.archetypeSystem, name: player.archetypeSystem }
      : null;
  const resolvedArchetype = rawArchetypeSystem?.id
    ? getArchetypeSystemById(rawArchetypeSystem.id)
    : null;
  const archetypeSystemBase = resolvedArchetype
    ? {
        ...resolvedArchetype,
        ...(rawArchetypeSystem || {}),
        id: rawArchetypeSystem?.id || resolvedArchetype.id,
        name: rawArchetypeSystem?.name || resolvedArchetype.name,
        category: rawArchetypeSystem?.category || resolvedArchetype.category,
        progressionImpact: resolvedArchetype.progressionImpact,
        quality: resolvedArchetype.quality,
        implementationProfile: resolvedArchetype.implementationProfile,
      }
    : rawArchetypeSystem;
  const archetypeSystem = isDevourerCorePlayer({ archetypeSystem: archetypeSystemBase })
    ? normalizeDevourerArchetypeState(archetypeSystemBase)
    : archetypeSystemBase;
  const progressionModifiers = normalizeProgressionModifiers(
    player.progressionModifiers,
    archetypeSystem?.progressionImpact,
  );
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
  const normalizedMana = normalizeGauge(player.mana, manaMaxDefault);
  const normalizedAbilityState = normalizeAbilityState(player.abilityState, {
    player: {
      ...player,
      class: normalizedClass,
      mana: normalizedMana,
      magic: player.magic,
    },
  });

  const normalizedPlayer = {
    ...player,
    name: player.name ?? "Wanderer",
    level,
    race: normalizedRace,
    class: normalizedClass,
    origin: normalizedOrigin,
    oathOrigin: normalizedOathOrigin,
    attributes,
    attributeInvestments: isPlainObject(player.attributeInvestments)
        ? player.attributeInvestments
        : {},
    xp: normalizeXp(player.xp, level, config),
    hp: normalizeGauge(player.hp, hpMaxDefault),
    mana: normalizedMana,
    abilityState: normalizedAbilityState,
    magic: normalizedAbilityState.families.magic,
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
    progressionModifiers,
    talents: Array.isArray(player.talents) ? player.talents : [],
    startingZoneId: normalizedStartingZoneId || normalizedOathOrigin?.zoneId || null,
    startingLocationId:
      normalizedStartingLocationId ||
      normalizedOathOrigin?.locationId ||
      getZoneEntryLocationId(normalizedOathOrigin?.zoneId || normalizedStartingZoneId) ||
      DEFAULT_START_LOCATION_ID,
    openingArcId: normalizedOpeningArcId,
    entrySceneId:
      typeof player.entrySceneId === "string" && player.entrySceneId.trim()
        ? player.entrySceneId.trim()
        : null,
    tutorialBundleId: normalizedTutorialBundleId,
    professions: isPlainObject(player.professions) ? player.professions : {},
    prestige: isPlainObject(player.prestige)
      ? { ...defaultPrestigeStats(), ...player.prestige }
      : defaultPrestigeStats(),
    progress: {
      ...DEFAULT_PROGRESS,
      ...progress,
      totalKills: Math.max(0, Math.floor(toNumber(progress.totalKills, 0))),
      killsByEnemyId,
      gachaPulls: Math.max(0, Math.floor(toNumber(progress.gachaPulls, 0))),
      gachaPullsSinceRare: Math.max(0, Math.floor(toNumber(progress.gachaPullsSinceRare, 0))),
      gachaPullsSinceEpic: Math.max(0, Math.floor(toNumber(progress.gachaPullsSinceEpic, 0))),
      totalGoldEarned: Math.max(
        goldCoins,
        Math.max(0, Math.floor(toNumber(progress.totalGoldEarned, 0))),
      ),
    },
  };

  return syncPlayerAbilityState(normalizedPlayer, normalizedPlayer.abilityState);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return isPlainObject(value) ? value : {};
}

function normalizeDungeonRewards(rawRewards) {
  const rewards = normalizeObject(rawRewards);
  const next = {};

  ["xp", "gold", "soulpoints"].forEach((key) => {
    const numeric = toNumber(rewards[key], null);
    if (numeric === null) return;
    next[key] = Math.max(0, numeric);
  });

  return next;
}

function normalizeDungeonRoom(rawRoom, index = 0) {
  const room = normalizeObject(rawRoom);
  const order = Math.max(1, Math.floor(toNumber(room.order, index + 1)));
  const kind =
    typeof room.kind === "string" && room.kind.trim()
      ? room.kind.trim()
      : "combat";

  return {
    ...room,
    id:
      typeof room.id === "string" && room.id.trim()
        ? room.id.trim()
        : `dungeon_room_${order}`,
    order,
    kind,
    title:
      typeof room.title === "string" && room.title.trim()
        ? room.title.trim()
        : `${kind.charAt(0).toUpperCase()}${kind.slice(1)} Room ${order}`,
    enemyIds: normalizeArray(room.enemyIds)
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean),
    rewards: normalizeDungeonRewards(room.rewards),
    cleared: Boolean(room.cleared),
  };
}

function normalizeDungeonRun(rawRun) {
  if (!isPlainObject(rawRun)) return null;

  const rooms = normalizeArray(rawRun.rooms).map((room, index) =>
    normalizeDungeonRoom(room, index),
  );
  const currentRoomIndex = clamp(
    Math.floor(toNumber(rawRun.currentRoomIndex, 0)),
    0,
    Math.max(0, rooms.length - 1),
  );

  return {
    ...rawRun,
    runId:
      typeof rawRun.runId === "string" && rawRun.runId.trim()
        ? rawRun.runId.trim()
        : "dungeon_run_1",
    templateId:
      typeof rawRun.templateId === "string" && rawRun.templateId.trim()
        ? rawRun.templateId.trim()
        : "training_depths",
    difficulty: Math.max(1, Math.floor(toNumber(rawRun.difficulty, 1))),
    status:
      typeof rawRun.status === "string" && rawRun.status.trim()
        ? rawRun.status.trim()
        : "active",
    currentRoomIndex,
    clearedRoomIds: normalizeArray(rawRun.clearedRoomIds)
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean),
    rooms,
  };
}

function normalizeCompletedDungeonRun(rawRun) {
  const run = normalizeObject(rawRun);

  return {
    runId:
      typeof run.runId === "string" && run.runId.trim()
        ? run.runId.trim()
        : "dungeon_run_1",
    templateId:
      typeof run.templateId === "string" && run.templateId.trim()
        ? run.templateId.trim()
        : "training_depths",
    difficulty: Math.max(1, Math.floor(toNumber(run.difficulty, 1))),
    roomCount: Math.max(0, Math.floor(toNumber(run.roomCount, 0))),
    clearedRoomIds: normalizeArray(run.clearedRoomIds)
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean),
    completed: true,
  };
}

function normalizeDungeonState(rawDungeon) {
  const dungeon = normalizeObject(rawDungeon);

  return {
    ...DEFAULT_DUNGEON_STATE,
    ...dungeon,
    activeRun: normalizeDungeonRun(dungeon.activeRun),
    completedRuns: normalizeArray(dungeon.completedRuns).map(
      normalizeCompletedDungeonRun,
    ),
  };
}

const DEFAULT_WORLD_ID = WORLD_META.id;
const LEGACY_WORLD_FLAG_MAP = {
  leyline_storms_active: "riftscar_fold_event_active",
  market_unrest_active: "auric_choir_tension_active",
  bloom_ignition_active: "wildroot_bloom_surge_active",
  skydock_lockdown_active: "skybound_redline_active",
  veil_alert_active: "veilward_ledger_surge_active",
  tideward_breach_active: "dawnreef_maelstrom_watch_active",
  mirage_storm_active: "glassstep_shatterstorm_active",
  caldera_vents_unstable: "emberline_vent_alarm_active",
  dream_wisps_active: "lucent_revelation_active",
};
const DEFAULT_WORLD_COUNTERS = {
  day: 1,
  chapter: 0,
  notoriety: 0,
};

function createDefaultWorldFlags() {
  return { ...WORLD_FLAG_DEFAULTS };
}

function canonicalizeZoneId(value, fallback = null) {
  return resolveZoneId(value) || fallback;
}

function canonicalizeLocationId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (
    lowered === "starting zone" ||
    lowered === "starting_zone" ||
    lowered === "rebirth alcove" ||
    lowered === "summoning alcove" ||
    lowered === "awakening point"
  ) {
    return DEFAULT_START_LOCATION_ID;
  }

  // Prefer canonical ids when possible; preserve unknown strings for forward-compat.
  const resolvedLocationId = resolveLocationId(trimmed);
  if (resolvedLocationId) return resolvedLocationId;
  const resolvedZoneId = resolveZoneId(trimmed);
  if (resolvedZoneId) {
    return getZoneEntryLocationId(resolvedZoneId) || trimmed;
  }
  return trimmed;
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
  next.openingArcId = resolveOpeningArcId(next.openingArcId) || null;
  next.tutorialBundleId = resolveOpeningTutorialBundleId(next.tutorialBundleId) || null;

  if (isPlainObject(next.onboarding)) {
    next.onboarding = {
      ...next.onboarding,
      bundleId: resolveOpeningTutorialBundleId(next.onboarding.bundleId) || null,
    };
  }

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
      const mappedKey = LEGACY_WORLD_FLAG_MAP[key] || key;
      nextFlags[mappedKey] = value;
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
    const biomeRaw = canonicalizeZoneId(rawLocation.biome);
    const biome = biomeRaw || derivedBiome || DEFAULT_START_ZONE_ID;

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
    const biome = getLocationById(current)?.zoneId || DEFAULT_START_ZONE_ID;
    return {
      current,
      visited: [current],
      unlockedAreas: [current],
      biome,
    };
  }

  const biome = getLocationById(DEFAULT_START_LOCATION_ID)?.zoneId || DEFAULT_START_ZONE_ID;
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
  const rawByBiome = isPlainObject(rawWeather?.byBiome) ? rawWeather.byBiome : {};
  const byBiome = {};

  Object.entries(rawByBiome).forEach(([rawBiomeId, weatherNode]) => {
    const canonicalBiomeId = canonicalizeZoneId(rawBiomeId, rawBiomeId);
    if (!canonicalBiomeId || !isPlainObject(weatherNode)) return;
    byBiome[canonicalBiomeId] = weatherNode;
  });

  const zone = getZoneById(biomeId);
  const fallbackType =
    typeof zone?.seedWeather?.type === "string" ? zone.seedWeather.type : "clear";
  const fallbackIntensity = clamp(toNumber(zone?.seedWeather?.intensity, 0.3), 0, 1);
  const existing = isPlainObject(byBiome[biomeId]) ? byBiome[biomeId] : null;
  if (!existing) {
    byBiome[biomeId] = {
      type: fallbackType,
      intensity: fallbackIntensity,
      updatedTurn: turnCount,
    };
  } else {
    const typeRaw = typeof existing.type === "string" ? existing.type : fallbackType;
    const type = ["clear", "rain", "storm", "drought", "fog"].includes(typeRaw)
      ? typeRaw
      : fallbackType;
    byBiome[biomeId] = {
      type,
      intensity: clamp(toNumber(existing.intensity, fallbackIntensity), 0, 1),
      updatedTurn: Math.max(0, Math.floor(toNumber(existing.updatedTurn, turnCount))),
    };
  }

  return { byBiome };
}

function normalizeWorldEssence(rawEssence, { locationId, biomeId, time, weather } = {}) {
  const essence = isPlainObject(rawEssence) ? rawEssence : {};
  const sourcesRaw = Array.isArray(essence.sources) ? essence.sources : [];
  const sources = sourcesRaw
    .map((s) => {
      if (typeof s === "string") {
        const id = s.trim().toLowerCase();
        return id ? { id } : null;
      }
      if (isPlainObject(s)) {
        const id = typeof s.id === "string" ? s.id.trim().toLowerCase() : null;
        if (!id) return null;
        return {
          id,
          name: typeof s.name === "string" ? s.name : undefined,
          locationId:
            typeof s.locationId === "string" && s.locationId.trim()
              ? s.locationId.trim()
              : null,
          biomeId:
            typeof s.biomeId === "string" && s.biomeId.trim()
              ? s.biomeId.trim().toLowerCase()
              : null,
          discoveredTurn: Math.max(0, Math.floor(toNumber(s.discoveredTurn, 0))),
        };
      }
      return null;
    })
    .filter(Boolean);
  const ambient = essence.ambient;

  const anomaliesRaw = isPlainObject(essence.anomalies) ? essence.anomalies : {};
  const instancesRaw = Array.isArray(anomaliesRaw.instances) ? anomaliesRaw.instances : [];
  const anomalies = {
    instances: instancesRaw
      .filter((entry) => isPlainObject(entry))
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id.trim().toLowerCase() : null,
        locationId:
          typeof entry.locationId === "string" && entry.locationId.trim()
            ? entry.locationId.trim()
            : null,
        biomeId:
          typeof entry.biomeId === "string" && entry.biomeId.trim()
            ? entry.biomeId.trim().toLowerCase()
            : null,
        nextDriftTurn: Math.max(0, Math.floor(toNumber(entry.nextDriftTurn, 0))),
      }))
      .filter((entry) => entry.id),
  };

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
    if (text.includes("auric") || text.includes("basilica") || text.includes("gilt")) {
      return { ...base, light: 0.24, creation: 0.18, air: 0.16, fire: 0.06 };
    }
    if (text.includes("skybound") || text.includes("aerie") || text.includes("cable")) {
      return { ...base, air: 0.24, lightning: 0.18, light: 0.12, earth: 0.08 };
    }
    if (text.includes("glassstep") || text.includes("mirror") || text.includes("oasis")) {
      return { ...base, air: 0.22, fire: 0.16, time: 0.12, water: 0.06 };
    }
    if (text.includes("emberline") || text.includes("ashmouth") || text.includes("vent")) {
      return { ...base, fire: 0.28, earth: 0.18, destruction: 0.08, water: 0.05 };
    }
    if (text.includes("veilward") || text.includes("recall") || text.includes("ledger")) {
      return { ...base, shadow: 0.2, water: 0.16, earth: 0.16, light: 0.04 };
    }
    if (text.includes("wildroot") || text.includes("seed parliament") || text.includes("orchard")) {
      return { ...base, life: 0.26, earth: 0.18, water: 0.14, shadow: 0.06 };
    }
    if (text.includes("frostveil") || text.includes("aurora") || text.includes("hushdock")) {
      return { ...base, water: 0.22, air: 0.16, time: 0.14, earth: 0.08 };
    }
    if (text.includes("dawnreef") || text.includes("salt sanctuary") || text.includes("reef")) {
      return { ...base, water: 0.28, life: 0.16, air: 0.14, fire: 0.05 };
    }
    if (text.includes("bloodwake") || text.includes("crimson") || text.includes("inheritance")) {
      return { ...base, life: 0.22, fire: 0.16, destruction: 0.14, earth: 0.08 };
    }
    if (text.includes("thunderplate") || text.includes("strikemere") || text.includes("herd")) {
      return { ...base, lightning: 0.24, air: 0.18, earth: 0.14, fire: 0.05 };
    }
    if (text.includes("ossuary") || text.includes("sepul") || text.includes("gravewind")) {
      return { ...base, shadow: 0.22, earth: 0.18, time: 0.14, water: 0.06 };
    }
    if (text.includes("hollowroot") || text.includes("loam") || text.includes("underbloom")) {
      return { ...base, life: 0.24, earth: 0.18, shadow: 0.14, water: 0.08 };
    }
    if (text.includes("riftscar") || text.includes("stillpoint") || text.includes("fold")) {
      return { ...base, space: 0.18, time: 0.16, air: 0.14, lightning: 0.08 };
    }
    if (text.includes("moonfen") || text.includes("silver sleep") || text.includes("somnarch")) {
      return { ...base, shadow: 0.18, water: 0.18, time: 0.14, life: 0.08 };
    }
    if (text.includes("ironquake") || text.includes("worldhammer") || text.includes("fault")) {
      return { ...base, earth: 0.26, fire: 0.16, lightning: 0.12, air: 0.06 };
    }
    if (text.includes("lucent") || text.includes("open eye") || text.includes("prism")) {
      return { ...base, light: 0.24, space: 0.16, life: 0.14, air: 0.08 };
    }
    if (text.includes("sunvault") || text.includes("helior")) {
      return { ...base, light: 0.24, air: 0.16, earth: 0.14, fire: 0.06 };
    }
    if (text.includes("gravewell") || text.includes("mourngate") || text.includes("underbloom sea")) {
      return { ...base, shadow: 0.22, earth: 0.16, water: 0.14, fire: 0.05 };
    }
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

    const weatherNode = isPlainObject(weather?.byBiome) ? weather.byBiome[biomeId] : null;
    const weatherType = typeof weatherNode?.type === "string" ? weatherNode.type : null;
    const weatherIntensity = clamp(toNumber(weatherNode?.intensity, 0), 0, 1);

    const densityDeltaByEssence = essenceIds.reduce((acc, e) => {
      acc[e] = 0;
      return acc;
    }, {});

    if (weatherType === "rain") {
      densityDeltaByEssence.water += 0.06 * weatherIntensity;
      densityDeltaByEssence.air += 0.02 * weatherIntensity;
      densityDeltaByEssence.fire -= 0.03 * weatherIntensity;
    } else if (weatherType === "storm") {
      densityDeltaByEssence.lightning += 0.08 * weatherIntensity;
      densityDeltaByEssence.air += 0.05 * weatherIntensity;
      densityDeltaByEssence.water += 0.02 * weatherIntensity;
    } else if (weatherType === "drought") {
      densityDeltaByEssence.fire += 0.05 * weatherIntensity;
      densityDeltaByEssence.water -= 0.06 * weatherIntensity;
      densityDeltaByEssence.earth += 0.02 * weatherIntensity;
    } else if (weatherType === "fog") {
      densityDeltaByEssence.water += 0.03 * weatherIntensity;
      densityDeltaByEssence.shadow += 0.04 * weatherIntensity;
      densityDeltaByEssence.light -= 0.02 * weatherIntensity;
    }

    const anomalyInstances = Array.isArray(anomalies?.instances) ? anomalies.instances : [];
    const resolvedAnomalyIds = anomalyInstances
      .filter((entry) => isPlainObject(entry))
      .filter((entry) => entry.locationId && String(entry.locationId) === String(locationId))
      .map((entry) => String(entry.id || "").trim().toLowerCase())
      .filter(Boolean);
    const anomalyDefs = resolvedAnomalyIds
      .map((id) => getEssenceAnomalyById(id))
      .filter(Boolean);

    anomalyDefs.forEach((def) => {
      const deltas = def?.densityDeltaByEssence;
      if (deltas && typeof deltas === "object") {
        Object.entries(deltas).forEach(([id, delta]) => {
          if (!essenceIds.includes(id)) return;
          densityDeltaByEssence[id] += toNumber(delta, 0);
        });
      }
    });

    const basePurity = clamp(1 - taintBaseline * 0.5, 0, 1);
    const weatherTaintNudge =
      weatherType === "fog"
        ? 0.06 * weatherIntensity
        : weatherType === "storm"
          ? 0.03 * weatherIntensity
          : weatherType === "drought"
            ? 0.02 * weatherIntensity
            : 0;

    const anomalyTaintNudge = anomalyDefs.reduce(
      (sum, def) => sum + clamp(toNumber(def?.taintNudge, 0), -0.2, 0.2),
      0,
    );
    const totalTaintNudge = clamp(weatherTaintNudge + anomalyTaintNudge, -0.2, 0.2);

    const compositionByEssence = essenceIds.reduce((acc, e) => {
      acc[e] = {
        density: clamp(toNumber(densities?.[e], 0) + toNumber(densityDeltaByEssence[e], 0), 0, 1),
        purity: clamp(basePurity - totalTaintNudge * 0.5, 0, 1),
        taint: clamp(taintBaseline + totalTaintNudge, 0, 1),
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
    const contaminationRiskMultByEssence = { ...recordOnes };

    anomalyDefs.forEach((def) => {
      applyEssenceMult(drawMultByEssence, def?.drawMultByEssence);
      applyEssenceMult(refineYieldMultByEssence, def?.refineYieldMultByEssence);
      applyEssenceMult(compressRiskMultByEssence, def?.compressRiskMultByEssence);
      applyEssenceMult(potencyMultByEssence, def?.potencyMultByEssence);
    });

    if (weatherType === "rain") {
      applyEssenceMult(drawMultByEssence, { water: 1.03, fire: 0.98 });
      applyEssenceMult(refineYieldMultByEssence, { water: 1.04, fire: 0.98 });
      applyEssenceMult(compressRiskMultByEssence, { fire: 1.05 });
      applyEssenceMult(contaminationRiskMultByEssence, { water: 1.03, earth: 1.02 });
    } else if (weatherType === "storm") {
      applyEssenceMult(drawMultByEssence, { lightning: 1.06, air: 1.04 });
      applyEssenceMult(refineYieldMultByEssence, { lightning: 1.03, air: 1.01 });
      applyEssenceMult(compressRiskMultByEssence, { lightning: 1.08, air: 1.04 });
      applyEssenceMult(contaminationRiskMultByEssence, { lightning: 1.06, water: 1.03 });
    } else if (weatherType === "drought") {
      applyEssenceMult(drawMultByEssence, { fire: 1.04, water: 0.97 });
      applyEssenceMult(refineYieldMultByEssence, { fire: 1.02, water: 0.96 });
      applyEssenceMult(compressRiskMultByEssence, { fire: 1.03, earth: 1.02 });
      applyEssenceMult(contaminationRiskMultByEssence, { earth: 1.06, air: 1.03 });
    } else if (weatherType === "fog") {
      applyEssenceMult(drawMultByEssence, { shadow: 1.04, light: 0.97 });
      applyEssenceMult(refineYieldMultByEssence, { shadow: 1.02, light: 0.98 });
      applyEssenceMult(compressRiskMultByEssence, { light: 1.04, shadow: 1.02 });
      essenceIds.forEach((e) => {
        contaminationRiskMultByEssence[e] = clamp(contaminationRiskMultByEssence[e] * (1 + 0.12 * weatherIntensity), 0.9, 1.2);
      });
    }

    if (isMidnightWindow) {
      essenceIds.forEach((e) => {
        compressRiskMultByEssence[e] = clamp(compressRiskMultByEssence[e] * 1.12, 0.9, 1.2);
        potencyMultByEssence[e] = clamp(potencyMultByEssence[e] * 1.08, 0.9, 1.2);
      });
      applyEssenceMult(potencyMultByEssence, { time: 1.04, space: 1.03, shadow: 1.02 });
    }

    return {
      compositionByEssence,
      global: {
        drawMultByEssence,
        refineYieldMultByEssence,
        stabilityCapDelta,
        compressRiskMultByEssence,
        potencyMultByEssence,
        contaminationRiskMultByEssence,
      },
      provenance: {
        biome: biomeId || null,
        timeOfDay: resolvedTimeOfDay || null,
        weatherType: typeof weatherNode?.type === "string" ? weatherNode.type : null,
        weatherIntensity: Number.isFinite(weatherNode?.intensity) ? weatherNode.intensity : null,
        anomalyIds: resolvedAnomalyIds,
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
      anomalies,
    };
  }

  const isLegacyMap = isPlainObject(ambient);
  if (isLegacyMap) {
    return {
      ambient: toSnapshotFromDensities(ambient),
      sources,
      anomalies,
    };
  }

  return {
    ambient: toSnapshotFromDensities(baselineFromLocation(locationId)),
    sources,
    anomalies,
  };
}

export function normalizeGameState(rawState) {
  const state = isPlainObject(rawState) ? rawState : {};

  const config = normalizeConfig(state.config);
  const player = normalizePlayer(state.player, config);

  const quests = normalizeObject(state.quests);
  const dungeon = normalizeObject(state.dungeon);
  const world = normalizeObject(state.world);
  const narrative = normalizeObject(state.narrative);
  const combat = normalizeObject(state.combat);
  const chronicle = normalizeChronicleState(state.chronicle);

  const baseWorldVars = normalizeObject(world.vars);
  const baseWorldCounters = normalizeObject(world.counters);
  const migratedWorldFlags = migrateWorldFlags(
    world.flags,
    baseWorldVars,
    baseWorldCounters,
  );
  const normalizedWorldId = DEFAULT_WORLD_ID;
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
    normalizedWorldLocation.biome || DEFAULT_START_ZONE_ID,
    normalizedTurnCount,
  );
  const normalizedWorldEssence = normalizeWorldEssence(world.essence, {
    locationId: normalizedWorldLocation.current,
    biomeId: normalizedWorldLocation.biome || DEFAULT_START_ZONE_ID,
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
    dungeon: normalizeDungeonState(dungeon),
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
      ...createDefaultCombatState(),
      ...combat,
      status: combat.status ?? "inactive",
      turn: combat.turn ?? "player",
      stance:
        typeof combat.stance === "string" && combat.stance.trim()
          ? combat.stance
          : "focused",
      enemies: normalizeArray(combat.enemies),
      skillCooldowns: normalizeObject(combat.skillCooldowns),
      classAbilityCooldowns: normalizeObject(combat.classAbilityCooldowns),
      raceAbilityCooldowns: normalizeObject(combat.raceAbilityCooldowns),
      telegraphs: normalizeArray(combat.telegraphs),
      arenaTags: normalizeArray(combat.arenaTags),
      tacticalVerbs: normalizeArray(combat.tacticalVerbs),
      log: normalizeArray(combat.log),
      board: {
        ...createDefaultCombatState().board,
        ...(combat?.board && typeof combat.board === "object" && !Array.isArray(combat.board)
          ? combat.board
          : {}),
        units: normalizeArray(combat?.board?.units),
        turnQueue: normalizeArray(combat?.board?.turnQueue),
        eventLog: normalizeArray(combat?.board?.eventLog),
      },
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
    chronicle,
    contentVersion: state.contentVersion ?? "core@0.1.0",
    stateVersion:
      typeof state.stateVersion === "number"
        ? state.stateVersion
        : GAME_STATE_VERSION,
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

  normalized = {
    ...normalized,
    player: syncPlayerAbilityState(normalized.player, normalized.player?.abilityState),
  };

  return normalized;
}
