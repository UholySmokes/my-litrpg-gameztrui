// =================================================================
// TIME SYSTEM - Day/Night Cycle
// Handles time-based mechanics for Nature Spirit, Shadow Walker, etc.
// =================================================================

import { emit } from "../../core/EventBus.js";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { regenerateMana } from "../magic/ManaSystem.js";

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
  if (!state.world?.time) {
    return initializeTime(state);
  }

  const currentTime = state.world.time.currentTime;
  const newTime = (currentTime + deltaMinutes) % 1440;
  const oldTimeOfDay = state.world.time.timeOfDay;
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
    ...state,
    world: {
      ...state.world,
      time: {
        ...state.world.time,
        currentTime: newTime,
        timeOfDay: newTimeOfDay,
        lastUpdate: SimBridge.now(),
      },
    },
  };
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
