// =================================================================
// STEALTH SYSTEM
// Handles stealth mechanics for Shadow Walker, Assassin, Rogue classes
// Includes detection, ambush damage, and stealth-breaking logic
// =================================================================

import { emit } from "../../core/EventBus.js";
import { hasRaceTag } from "../../data/registries/RaceDataRegistry.js";
import {
  ensureAttributeShape,
  getAttributeValue,
} from "../../utils/AttributeMath.js";
import { getEffectiveAttributes } from "../titles/TitleSystem.js";
import { random } from "../../utils/DeterministicRandom.js";

/**
 * STEALTH CONFIGURATION
 */
const STEALTH_CONFIG = {
  baseDetectionRange: 10,
  stealthBreakOnAttack: true,
  ambushDamageMultiplier: 2.0,
  stealthDecayChancePerTurn: 0.1, // 10% chance to be detected per turn
  stealthClasses: [
    "assassin",
    "rogue",
    "shadowblade",
    "void_assassin",
    "shadow_tactician",
    "void_marauder",
  ],
  stealthRaces: ["shadow_walker"],
};

/**
 * Check if entity can use stealth
 * @param {object} entity - Player or entity object
 * @returns {boolean} True if can stealth
 */
function canStealth(entity) {
  const classId = entity.class?.id || entity.class;
  const raceId = entity.race?.id || entity.race;

  const hasStealthClass = STEALTH_CONFIG.stealthClasses.includes(classId);
  const hasStealthRace = STEALTH_CONFIG.stealthRaces.includes(raceId);
  const hasStealthTalent = entity.talents?.includes("stealth_mastery");

  return hasStealthClass || hasStealthRace || hasStealthTalent;
}

/**
 * Enter stealth mode
 * @param {object} state - Current game state
 * @returns {object} Result with updated state
 */
export function enterStealth(state) {
  const player = state.player;

  if (!canStealth(player)) {
    return {
      success: false,
      reason: "Your class/race cannot enter stealth",
      state,
    };
  }

  // Cannot stealth in active combat (unless special ability)
  if (state.combat?.status === "active" && !player.canCombatStealth) {
    return {
      success: false,
      reason: "Cannot enter stealth during combat",
      state,
    };
  }

  // Already stealthed
  if (player.isStealthed) {
    return {
      success: false,
      reason: "Already in stealth",
      state,
    };
  }

  // Calculate stealth power based on agility and race bonus
  const raceId = player.race?.id || player.race;
  const stealthBonus = hasRaceTag(raceId, "STEALTH_BOOST") ? 0.5 : 0;
  const baseAttributeValue = state.config?.baseAttributeValue ?? 5;
  const normalizedAttributes = ensureAttributeShape(
    player.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...player, attributes: normalizedAttributes },
    { ...state.config, baseAttributeValue },
    normalizedAttributes,
  );
  const agilityValue =
    getAttributeValue(effectiveAttributes, "agility") || baseAttributeValue;
  const agilityBonus = agilityValue * 2;
  const stealthPower = Math.floor(agilityBonus * (1 + stealthBonus));

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(`🌑 ${player.name} vanishes into the shadows...`);

  emit("stealth:enter", { player: player.name, stealthPower });

  return {
    success: true,
    state: {
      ...state,
      player: {
        ...player,
        isStealthed: true,
        stealthPower: stealthPower,
        stealthTurns: 0,
      },
      combat: state.combat
        ? {
            ...state.combat,
            log: combatLog,
          }
        : state.combat,
    },
  };
}

/**
 * Exit stealth mode
 * @param {object} state - Current game state
 * @param {string} reason - Reason for breaking stealth
 * @returns {object} Updated state
 */
export function breakStealth(state, reason = "unknown") {
  const player = state.player;

  if (!player.isStealthed) {
    return state;
  }

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(`💡 ${player.name} breaks stealth! (${reason})`);

  emit("stealth:break", { player: player.name, reason });

  return {
    ...state,
    player: {
      ...player,
      isStealthed: false,
      stealthPower: 0,
      stealthTurns: 0,
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
 * Check if enemy detects stealthed player
 * @param {object} player - Player object
 * @param {object} enemy - Enemy object
 * @returns {object} { detected: boolean, reason: string }
 */
function checkDetection(player, enemy) {
  if (!player.isStealthed) {
    return { detected: true, reason: "Not stealthed" };
  }

  // Calculate detection chance
  const enemyPerception =
    enemy.perception || enemy.stats?.int || enemy.level * 2;
  const playerStealth = player.stealthPower || 10;

  // Base detection chance: enemy perception vs player stealth
  const detectionChance = Math.max(
    0.05,
    Math.min(0.95, enemyPerception / (playerStealth + enemyPerception)),
  );

  const roll = random();

  if (roll < detectionChance) {
    return { detected: true, reason: "Enemy spotted you" };
  }

  return { detected: false, reason: "" };
}

/**
 * Process stealth detection for all enemies
 * @param {object} state - Current game state
 * @returns {object} Updated state (may break stealth)
 */
export function processStealthDetection(state) {
  const player = state.player;

  if (!player.isStealthed || !state.combat?.enemies) {
    return state;
  }

  if (player.vanishTurnsRemaining && player.vanishTurnsRemaining > 0) {
    return {
      ...state,
      player: {
        ...player,
        stealthTurns: (player.stealthTurns || 0) + 1,
      },
    };
  }

  // Increment stealth turns
  let newState = {
    ...state,
    player: {
      ...player,
      stealthTurns: (player.stealthTurns || 0) + 1,
    },
  };

  // Check each alive enemy for detection
  for (const enemy of state.combat.enemies) {
    if (enemy.stats.hp.current <= 0) continue;

    const detection = checkDetection(player, enemy);
    if (detection.detected) {
      newState = breakStealth(newState, `${enemy.name} spotted you!`);
      break;
    }
  }

  return newState;
}

/**
 * Calculate ambush damage bonus
 * @param {object} player - Player object
 * @param {number} baseDamage - Base damage amount
 * @returns {object} { damage: number, isAmbush: boolean, message: string }
 */
function calculateAmbushDamage(player, baseDamage) {
  if (!player.isStealthed) {
    return { damage: baseDamage, isAmbush: false, message: "" };
  }

  const ambushMultiplier = STEALTH_CONFIG.ambushDamageMultiplier;
  const ambushDamage = Math.floor(baseDamage * ambushMultiplier);

  return {
    damage: ambushDamage,
    isAmbush: true,
    message: `🗡️ AMBUSH! Damage x${ambushMultiplier}!`,
  };
}

/**
 * Handle attack from stealth
 * @param {object} state - Current game state
 * @param {number} baseDamage - Base damage of attack
 * @returns {object} { state: object, damage: number, wasAmbush: boolean }
 */
export function handleStealthAttack(state, baseDamage) {
  const player = state.player;

  if (!player.isStealthed) {
    return { state, damage: baseDamage, wasAmbush: false };
  }

  // Calculate ambush damage
  const ambushResult = calculateAmbushDamage(player, baseDamage);

  // Add ambush message to log
  let combatLog = state.combat?.log ? [...state.combat.log] : [];
  if (ambushResult.isAmbush) {
    combatLog.push(ambushResult.message);
  }

  let newState = {
    ...state,
    combat: state.combat
      ? {
          ...state.combat,
          log: combatLog,
        }
      : state.combat,
  };

  // Break stealth after attack (unless special ability)
  if (STEALTH_CONFIG.stealthBreakOnAttack && !player.stealthAttackPersist) {
    newState = breakStealth(newState, "Attacked from stealth");
  }

  emit("stealth:ambush", {
    player: player.name,
    damage: ambushResult.damage,
    originalDamage: baseDamage,
  });

  return {
    state: newState,
    damage: ambushResult.damage,
    wasAmbush: ambushResult.isAmbush,
  };
}

/**
 * Use Vanish ability (enter stealth during combat)
 * @param {object} state - Current game state
 * @param {number} duration - Turns of guaranteed stealth
 * @returns {object} Result with updated state
 */
export function useVanish(state, duration = 2) {
  const player = state.player;

  if (!canStealth(player)) {
    return {
      success: false,
      reason: "Cannot use Vanish",
      state,
    };
  }

  // Calculate stealth power
  const raceId = player.race?.id || player.race;
  const stealthBonus = hasRaceTag(raceId, "STEALTH_BOOST") ? 0.5 : 0;
  const baseAttributeValue = state.config?.baseAttributeValue ?? 5;
  const normalizedAttributes = ensureAttributeShape(
    player.attributes,
    baseAttributeValue,
  );
  const effectiveAttributes = getEffectiveAttributes(
    { ...player, attributes: normalizedAttributes },
    { ...state.config, baseAttributeValue },
    normalizedAttributes,
  );
  const agilityValue =
    getAttributeValue(effectiveAttributes, "agility") || baseAttributeValue;
  const agilityBonus = agilityValue * 2;
  const stealthPower = Math.floor(agilityBonus * (1 + stealthBonus));

  const combatLog = state.combat?.log ? [...state.combat.log] : [];
  combatLog.push(`💨 ${player.name} uses VANISH and disappears!`);

  emit("stealth:vanish", { player: player.name, duration });

  return {
    success: true,
    state: {
      ...state,
      player: {
        ...player,
        isStealthed: true,
        stealthPower: stealthPower,
        stealthTurns: 0,
        vanishTurnsRemaining: duration, // Guaranteed stealth for this many turns
        canCombatStealth: true,
      },
      combat: state.combat
        ? {
            ...state.combat,
            log: combatLog,
          }
        : state.combat,
    },
  };
}

/**
 * Process vanish duration decay
 * @param {object} state - Current game state
 * @returns {object} Updated state
 */
export function processVanishDuration(state) {
  const player = state.player;

  if (!player.vanishTurnsRemaining || player.vanishTurnsRemaining <= 0) {
    return state;
  }

  const newTurns = player.vanishTurnsRemaining - 1;

  let newState = {
    ...state,
    player: {
      ...player,
      vanishTurnsRemaining: newTurns,
    },
  };

  // If vanish expired, can now be detected normally
  if (newTurns <= 0) {
    const combatLog = state.combat?.log ? [...state.combat.log] : [];
    combatLog.push(`⚠️ ${player.name}'s Vanish effect fades...`);

    newState = {
      ...newState,
      player: {
        ...newState.player,
        canCombatStealth: false,
      },
      combat: state.combat
        ? {
            ...state.combat,
            log: combatLog,
          }
        : state.combat,
    };
  }

  return newState;
}

/**
 * Check if player can use backstab (requires stealth)
 * @param {object} player - Player object
 * @returns {object} { canUse: boolean, reason: string }
 */
export function canBackstab(player) {
  if (!player.isStealthed) {
    return { canUse: false, reason: "Must be stealthed to use Backstab" };
  }

  return { canUse: true, reason: "" };
}

/**
 * Get stealth status for UI display
 * @param {object} player - Player object
 * @returns {object} Stealth status info
 */
export function getStealthStatus(player) {
  return {
    isStealthed: player.isStealthed || false,
    stealthPower: player.stealthPower || 0,
    stealthTurns: player.stealthTurns || 0,
    vanishTurnsRemaining: player.vanishTurnsRemaining || 0,
    canEnterStealth: canStealth(player) && !player.isStealthed,
  };
}

/**
 * Reset stealth state (for combat end)
 * @param {object} player - Player object
 * @returns {object} Updated player
 */
export function resetStealth(player) {
  return {
    ...player,
    isStealthed: false,
    stealthPower: 0,
    stealthTurns: 0,
    vanishTurnsRemaining: 0,
    canCombatStealth: false,
  };
}
