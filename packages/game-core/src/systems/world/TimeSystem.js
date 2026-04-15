// =================================================================
// TIME SYSTEM - Day/Night Cycle
// Handles time-based mechanics for Nature Spirit, Shadow Walker, etc.
// =================================================================

import { emit } from "../../core/EventBus.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { regenerateMana } from "../magic/ManaSystem.js";
import {
  DEFAULT_START_ZONE_ID,
  resolveZoneId,
} from "../../world/WorldDataRegistry.js";

/**
 * TIME CONFIGURATION
 */
const TIME_CONFIG = {
  // Time periods (in game minutes, 0-1440 = 24 hours)
  nightStart: 1260, // 9:00 PM
  nightEnd: 360, // 6:00 AM
  dawnStart: 360, // 6:00 AM
  dawnEnd: 480, // 8:00 AM
  dayStart: 480, // 8:00 AM
  dayEnd: 1140, // 7:00 PM
  duskStart: 1140, // 7:00 PM
  duskEnd: 1260, // 9:00 PM

  // Real-time to game-time ratio (1 real minute = X game minutes)
  timeScale: 10,

  // Update interval in real milliseconds
  updateInterval: 60000, // 1 real minute
};

/**
 * Time of day enum
 */
const TIME_OF_DAY = {
  NIGHT: "night",
  DAWN: "dawn",
  DAY: "day",
  DUSK: "dusk",
};

const WEATHER_TYPES = ["clear", "rain", "storm", "drought", "fog"];
const WEATHER_TRANSITIONS = {
  clear: ["rain", "fog", "drought"],
  rain: ["clear", "storm", "fog"],
  storm: ["rain", "clear"],
  drought: ["clear", "storm"],
  fog: ["clear", "rain"],
};
const WEATHER_BASE_INTENSITY = {
  clear: 0.25,
  rain: 0.55,
  storm: 0.78,
  drought: 0.68,
  fog: 0.45,
};
const DEFAULT_TURN_MINUTES = 10;
const DEFAULT_WEATHER_UPDATE_TURNS = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function hashString(input) {
  const text = String(input ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

/**
 * Initialize time system
 * @param {object} state - Current game state
 * @param {number} startTime - Starting time (0-1440), default 480 (8 AM)
 * @returns {object} Updated state with time initialized
 */
export function initializeTime(state, startTime = 480) {
  return {
    ...state,
    world: {
      ...state.world,
      time: {
        currentTime: startTime,
        timeOfDay: getTimeOfDay(startTime),
        isOutdoors: true,
        lastUpdate: SimBridge.now(),
      },
    },
  };
}

/**
 * Get time of day from game time
 * @param {number} gameTime - Current game time (0-1440)
 * @returns {string} Time of day
 */
export function getTimeOfDay(gameTime) {
  // Normalize time to 0-1440 range
  const time = ((gameTime % 1440) + 1440) % 1440;

  // Night spans midnight, so check differently
  if (time >= TIME_CONFIG.nightStart || time < TIME_CONFIG.nightEnd) {
    return TIME_OF_DAY.NIGHT;
  }
  if (time >= TIME_CONFIG.dawnStart && time < TIME_CONFIG.dawnEnd) {
    return TIME_OF_DAY.DAWN;
  }
  if (time >= TIME_CONFIG.dayStart && time < TIME_CONFIG.dayEnd) {
    return TIME_OF_DAY.DAY;
  }
  if (time >= TIME_CONFIG.duskStart && time < TIME_CONFIG.duskEnd) {
    return TIME_OF_DAY.DUSK;
  }

  return TIME_OF_DAY.DAY; // Default fallback
}

/**
 * Update game time
 * @param {object} state - Current game state
 * @param {number} deltaMinutes - Game minutes to advance
 * @returns {object} Updated state
 */
export function updateTime(state, deltaMinutes) {
  const initialized = state.world?.time ? state : initializeTime(state);
  const safeDelta = Math.floor(toFiniteNumber(deltaMinutes, 0));
  if (safeDelta === 0) {
    return initialized;
  }

  const currentTime = toFiniteNumber(initialized.world?.time?.currentTime, 480);
  const newTime = ((currentTime + safeDelta) % 1440 + 1440) % 1440;
  const oldTimeOfDay = initialized.world.time.timeOfDay;
  const newTimeOfDay = getTimeOfDay(newTime);

  // Emit event if time of day changed
  if (oldTimeOfDay !== newTimeOfDay) {
    emit("time:change", {
      from: oldTimeOfDay,
      to: newTimeOfDay,
      gameTime: newTime,
    });
  }

  return {
    ...initialized,
    world: {
      ...initialized.world,
      time: {
        ...initialized.world.time,
        currentTime: newTime,
        timeOfDay: newTimeOfDay,
        lastUpdate: SimBridge.now(),
      },
    },
  };
}

function normalizeWeatherEntry(entry = {}) {
  const typeRaw = typeof entry.type === "string" ? entry.type.trim().toLowerCase() : "clear";
  const type = WEATHER_TYPES.includes(typeRaw) ? typeRaw : "clear";
  const intensity = clamp(toFiniteNumber(entry.intensity, WEATHER_BASE_INTENSITY[type]), 0, 1);
  const updatedTurn = Math.max(0, Math.floor(toFiniteNumber(entry.updatedTurn, 0)));
  return { type, intensity, updatedTurn };
}

function resolveTurnMinutes(state, explicitMinutes) {
  const candidate = toFiniteNumber(explicitMinutes, NaN);
  if (Number.isFinite(candidate) && candidate > 0) {
    return Math.floor(candidate);
  }
  const fromConfig = toFiniteNumber(state?.config?.worldMinutesPerTurn, DEFAULT_TURN_MINUTES);
  return Math.max(1, Math.floor(fromConfig));
}

function advanceWeather(state, { turnCount, cadenceTurns } = {}) {
  const world = state.world || {};
  const location = world.location && typeof world.location === "object" ? world.location : {};
  const activeBiome =
    resolveZoneId(location.biome) || DEFAULT_START_ZONE_ID;

  const weatherRoot =
    world.weather && typeof world.weather === "object" && !Array.isArray(world.weather)
      ? world.weather
      : {};
  const currentByBiomeRaw =
    weatherRoot.byBiome && typeof weatherRoot.byBiome === "object" && !Array.isArray(weatherRoot.byBiome)
      ? weatherRoot.byBiome
      : {};
  const currentByBiome = Object.fromEntries(
    Object.entries(currentByBiomeRaw)
      .map(([biomeId, entry]) => [resolveZoneId(biomeId) || String(biomeId || "").trim().toLowerCase(), entry])
      .filter(([biomeId]) => Boolean(biomeId)),
  );

  const nextTurn = Math.max(0, Math.floor(toFiniteNumber(turnCount, world.turnCount || 0)));
  const cadence = Math.max(
    1,
    Math.floor(toFiniteNumber(cadenceTurns, state?.config?.weatherUpdateEveryTurns ?? DEFAULT_WEATHER_UPDATE_TURNS)),
  );

  const targetBiomes = new Set([...Object.keys(currentByBiome), activeBiome]);
  const nextByBiome = {};
  let changed = false;

  targetBiomes.forEach((biomeIdRaw) => {
    const biomeId = String(biomeIdRaw || "").trim().toLowerCase();
    if (!biomeId) return;

    const current = normalizeWeatherEntry(currentByBiome[biomeId]);
    const turnsSince = Math.max(0, nextTurn - current.updatedTurn);
    if (turnsSince < cadence) {
      nextByBiome[biomeId] = current;
      return;
    }

    const weatherHash = hashString(`${biomeId}:${nextTurn}:${current.type}`);
    const roll = (weatherHash % 1000) / 1000;
    const transitionPool = WEATHER_TRANSITIONS[current.type] || WEATHER_TRANSITIONS.clear;
    const shouldTransition = roll < 0.35;

    let nextType = current.type;
    if (shouldTransition && transitionPool.length > 0) {
      nextType = transitionPool[weatherHash % transitionPool.length] || current.type;
    }

    const drift = (((weatherHash >>> 8) % 201) - 100) / 1000; // -0.1..0.1
    const baseIntensity = WEATHER_BASE_INTENSITY[nextType] ?? 0.3;
    const intensitySeed = shouldTransition ? baseIntensity : current.intensity;
    const nextIntensity = clamp(intensitySeed + drift, 0.1, 1);

    nextByBiome[biomeId] = {
      type: nextType,
      intensity: nextIntensity,
      updatedTurn: nextTurn,
    };

    if (
      nextType !== current.type ||
      Math.abs(nextIntensity - current.intensity) >= 0.01 ||
      current.updatedTurn !== nextTurn
    ) {
      changed = true;
    }
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    world: {
      ...world,
      weather: {
        ...weatherRoot,
        byBiome: nextByBiome,
      },
    },
  };
}

/**
 * Advances world clock and weather on turn-based actions.
 * This keeps ambient magic inputs (time/weather) in sync with turn progression.
 */
export function advanceWorldTimeAndWeather(
  state,
  { turns = 1, minutesPerTurn } = {},
) {
  const safeTurns = Math.max(1, Math.floor(toFiniteNumber(turns, 1)));
  const deltaMinutes = resolveTurnMinutes(state, minutesPerTurn) * safeTurns;
  const withTime = updateTime(state, deltaMinutes);
  return advanceWeather(withTime, {
    turnCount: withTime.world?.turnCount || 0,
  });
}

/**
 * Process real-time update
 * @param {object} state - Current game state
 * @returns {object} Updated state
 */
export function processRealTimeUpdate(state) {
  if (!state.world?.time) {
    return initializeTime(state);
  }

  const now = SimBridge.now();
  const lastUpdate = state.world.time.lastUpdate || now;
  const realMinutesPassed = (now - lastUpdate) / 60000;
  const gameMinutesPassed = Math.floor(
    realMinutesPassed * TIME_CONFIG.timeScale,
  );

  if (gameMinutesPassed > 0) {
    return updateTime(state, gameMinutesPassed);
  }

  return state;
}

/**
 * Check if it's daytime
 * @param {object} state - Current game state
 * @returns {boolean} True if daytime
 */
export function isDaytime(state) {
  const timeOfDay = state.world?.time?.timeOfDay;
  return timeOfDay === TIME_OF_DAY.DAY || timeOfDay === TIME_OF_DAY.DAWN;
}

/**
 * Check if it's nighttime
 * @param {object} state - Current game state
 * @returns {boolean} True if nighttime
 */
export function isNighttime(state) {
  const timeOfDay = state.world?.time?.timeOfDay;
  return timeOfDay === TIME_OF_DAY.NIGHT || timeOfDay === TIME_OF_DAY.DUSK;
}

/**
 * Check if player is outdoors
 * @param {object} state - Current game state
 * @returns {boolean} True if outdoors
 */
export function isOutdoors(state) {
  return state.world?.time?.isOutdoors !== false;
}

/**
 * Set indoor/outdoor status
 * @param {object} state - Current game state
 * @param {boolean} outdoors - Whether player is outdoors
 * @returns {object} Updated state
 */
export function setOutdoors(state, outdoors) {
  if (!state.world?.time) {
    state = initializeTime(state);
  }

  return {
    ...state,
    world: {
      ...state.world,
      time: {
        ...state.world.time,
        isOutdoors: outdoors,
      },
    },
  };
}

/**
 * Get time-based modifiers for races
 * @param {object} state - Current game state
 * @param {string} raceId - Race ID
 * @returns {object} Modifiers { damage, accuracy, stealth, regen }
 */
export function getTimeBasedModifiers(state, raceId) {
  const modifiers = {
    damage: 1.0,
    accuracy: 1.0,
    stealth: 1.0,
    regen: 0,
  };

  const timeOfDay = state.world?.time?.timeOfDay;
  const outdoors = isOutdoors(state);

  // Shadow Walker: Daylight penalty
  if (raceId === "shadow_walker") {
    if (isDaytime(state) && outdoors) {
      modifiers.accuracy = 0.8; // -20% accuracy in daylight
      modifiers.stealth = 0.5; // Harder to stealth
    } else if (isNighttime(state)) {
      modifiers.stealth = 1.5; // +50% stealth at night
      modifiers.damage = 1.1; // +10% damage at night
    }
  }

  // Nature Spirit: Sun regeneration
  if (raceId === "nature_spirit") {
    if (isDaytime(state) && outdoors) {
      modifiers.regen = 5; // Regen 5 HP per turn in sunlight
    }
  }

  // Undead: Weaker in daylight
  if (raceId === "undead_awakened") {
    if (isDaytime(state) && outdoors) {
      modifiers.damage = 0.9; // -10% damage in daylight
    } else if (isNighttime(state)) {
      modifiers.damage = 1.1; // +10% damage at night
    }
  }

  // Celestial Descendant: Stronger at dawn
  if (raceId === "celestial_descendant") {
    if (timeOfDay === TIME_OF_DAY.DAWN) {
      modifiers.damage = 1.15; // +15% damage at dawn
    }
  }

  // Demon Kin: Stronger at night
  if (raceId === "demon_kin") {
    if (isNighttime(state)) {
      modifiers.damage = 1.1; // +10% damage at night
    }
  }

  return modifiers;
}

/**
 * Process time-based effects (called each turn)
 * @param {object} state - Current game state
 * @returns {object} Updated state with time effects applied
 */
export function processTimeEffects(state) {
  const player = state.player;
  const raceId = player.race?.id || player.race;
  const modifiers = getTimeBasedModifiers(state, raceId);

  let combatLog = state.combat?.log ? [...state.combat.log] : [];
  let playerUpdates = {};

  const manaRegenPerTurn = state.config?.manaRegenPerTurn ?? 0;

  if (
    manaRegenPerTurn > 0 &&
    player.mana?.current !== undefined &&
    player.mana?.max !== undefined &&
    player.mana.current < player.mana.max
  ) {
    const regenerated = regenerateMana(player, manaRegenPerTurn, {
      showFeedback: false,
    });
    const gained =
      (regenerated.mana?.current ?? player.mana.current) -
      player.mana.current;
    if (gained > 0) {
      playerUpdates.mana = regenerated.mana;
    }
  }

  // Apply sun regeneration for Nature Spirit
  if (modifiers.regen > 0 && player.hp.current < player.hp.max) {
    const healAmount = Math.min(
      modifiers.regen,
      player.hp.max - player.hp.current,
    );
    playerUpdates.hp = {
      ...player.hp,
      current: player.hp.current + healAmount,
    };
    combatLog.push(
      `☀️ ${player.name} absorbs sunlight and regenerates ${healAmount} HP!`,
    );
    emit("time:sunRegen", { player: player.name, amount: healAmount });
  }

  return {
    ...state,
    player: {
      ...player,
      ...playerUpdates,
    },
    combat: state.combat
      ? {
          ...state.combat,
          log: combatLog,
        }
      : state.combat,
  };
}

/**
 * Format game time for display
 * @param {number} gameTime - Game time (0-1440)
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
function formatGameTime(gameTime) {
  const hours24 = Math.floor(gameTime / 60);
  const minutes = gameTime % 60;
  const hours12 = hours24 % 12 || 12;
  const ampm = hours24 < 12 ? "AM" : "PM";

  return `${hours12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Get time status for UI display
 * @param {object} state - Current game state
 * @returns {object} Time status info
 */
export function getTimeStatus(state) {
  if (!state.world?.time) {
    return {
      currentTime: 480,
      formattedTime: "8:00 AM",
      timeOfDay: TIME_OF_DAY.DAY,
      isOutdoors: true,
      icon: "☀️",
    };
  }

  const time = state.world.time;
  const icons = {
    [TIME_OF_DAY.NIGHT]: "🌙",
    [TIME_OF_DAY.DAWN]: "🌅",
    [TIME_OF_DAY.DAY]: "☀️",
    [TIME_OF_DAY.DUSK]: "🌆",
  };

  return {
    currentTime: time.currentTime,
    formattedTime: formatGameTime(time.currentTime),
    timeOfDay: time.timeOfDay,
    isOutdoors: time.isOutdoors,
    icon: icons[time.timeOfDay] || "☀️",
  };
}

/**
 * Skip time forward
 * @param {object} state - Current game state
 * @param {number} hours - Hours to skip
 * @returns {object} Updated state
 */
export function skipTime(state, hours) {
  const minutes = hours * 60;
  return updateTime(state, minutes);
}

/**
 * Wait until specific time of day
 * @param {object} state - Current game state
 * @param {string} targetTimeOfDay - Target time of day
 * @returns {object} Updated state
 */
export function waitUntil(state, targetTimeOfDay) {
  if (!state.world?.time) {
    state = initializeTime(state);
  }

  let currentTime = state.world.time.currentTime;
  let iterations = 0;
  const maxIterations = 1440; // Prevent infinite loop

  while (
    getTimeOfDay(currentTime) !== targetTimeOfDay &&
    iterations < maxIterations
  ) {
    currentTime = (currentTime + 1) % 1440;
    iterations++;
  }

  return updateTime(state, iterations);
}
