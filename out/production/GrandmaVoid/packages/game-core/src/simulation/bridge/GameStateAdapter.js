import { SimBridge } from "./SimulationContext.js";
import { zones as canonicalZones } from "../../world/WorldDataRegistry.js";

/**
 * GameStateAdapter - Converts between existing game state and simulation state
 *
 * This adapter maps the current game state structure to the simulation's entity model
 * without requiring a full rewrite of existing systems.
 */

/**
 * Convert player state to simulation Entity
 */
export function playerToEntity(player) {
  const hp =
    player.hp && typeof player.hp === "object"
      ? player.hp
      : { current: player.hp || 0, max: player.maxHp || 100 };

  const mana =
    player.mana && typeof player.mana === "object"
      ? player.mana
      : { current: player.mana || 0, max: player.maxMana || 100 };

  const attributes = player.attributes || {};
  const stamina = resolveStamina(player);
  const cooldowns = resolveCooldowns(player);

  return {
    id: "player",
    name: player.name || "Player",
    type: "player",
    level: player.level || 1,
    experience:
      typeof player.xp === "object" ? player.xp.current : player.xp || 0,
    stats: {
      strength: attributes.strength || 5,
      dexterity: attributes.dexterity || 5,
      constitution: attributes.constitution || 5,
      intelligence: attributes.intelligence || 5,
      wisdom: attributes.wisdom || 5,
      charisma: attributes.charisma || 5,
      health: { current: hp.current, maximum: hp.max },
      mana: { current: mana.current, maximum: mana.max },
      stamina,
      attackPower: calculateAttackPower(attributes),
      defense: calculateDefense(attributes),
      speed: attributes.agility || 5,
      criticalChance: calculateCritChance(attributes),
      criticalMultiplier: 1.5,
      evasion: calculateEvasion(attributes),
      accuracy: 0.9,
    },
    position: { lane: 1, slot: 0 },
    actionPoints: 10,
    maxActionPoints: 10,
    initiative: attributes.agility || 5,
    effects: convertEffects(player.effects || []),
    equipment: convertEquipment(player.equipment || {}),
    cooldowns,
    faction: "player",
    tags: buildPlayerTags(player),
    isDead: player.isDead || false,
  };
}

/**
 * Convert enemy state to simulation Entity
 */
export function enemyToEntity(enemy, index = 0) {
  return {
    id: `enemy_${index}`,
    name: enemy.name || "Enemy",
    type: "enemy",
    level: enemy.level || 1,
    experience: 0,
    stats: {
      strength: enemy.attack || 5,
      dexterity: 5,
      constitution: 10,
      intelligence: 5,
      wisdom: 5,
      charisma: 5,
      health: {
        current: enemy.hp?.current || enemy.hp || 100,
        maximum: enemy.hp?.max || enemy.maxHp || 100,
      },
      mana: { current: 50, maximum: 50 },
      stamina: { current: 100, maximum: 100 },
      attackPower: enemy.attack || 5,
      defense: enemy.defense || 0,
      speed: 5,
      criticalChance: 0.05,
      criticalMultiplier: 1.5,
      evasion: 0.05,
      accuracy: 0.85,
    },
    position: { lane: 1, slot: index },
    actionPoints: 10,
    maxActionPoints: 10,
    initiative: 5,
    effects: convertEffects(enemy.effects || []),
    equipment: [],
    cooldowns: enemy.cooldowns || [],
    faction: "enemy",
    tags: enemy.tags || [],
    isDead: enemy.isDead || false,
  };
}

/**
 * Convert game state to simulation state
 */
export function gameStateToSimulation(gameState) {
  const entities = new Map();

  // Add player
  if (gameState.player) {
    const playerEntity = playerToEntity(gameState.player);
    entities.set("player", playerEntity);
  }

  // Add enemies if in combat
  if (gameState.combat?.enemies) {
    gameState.combat.enemies.forEach((enemy, index) => {
      const enemyEntity = enemyToEntity(enemy, index);
      entities.set(`enemy_${index}`, enemyEntity);
    });
  }

  const zones = new Map(
    (Array.isArray(canonicalZones) ? canonicalZones : []).map((zone) => [
      zone.id,
      {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        connections: Array.isArray(zone.connections) ? zone.connections : [],
        defaultEntities: [],
        environmentalEffects: [],
      },
    ]),
  );

  const flagEntries = Object.entries(gameState.world?.flags || {}).filter(
    ([, value]) => typeof value === "boolean",
  );
  const counterEntries = Object.entries(gameState.world?.counters || {}).filter(
    ([, value]) => Number.isFinite(value),
  );

  return {
    world: {
      currentTick: gameState.world?.turnCount || 0,
      currentTime: Number.isFinite(gameState.world?.time?.currentTime)
        ? gameState.world.time.currentTime
        : gameState.world?.time || 0,
      zones,
      globalFlags: new Map(flagEntries),
      globalCounters: new Map(counterEntries),
      activeEntities: Array.from(entities.keys()),
    },
    entities,
    eventLog: [],
    snapshots: new Map(),
    seed: gameState.simulationSeed ?? SimBridge.now(),
    currentTick: gameState.world?.turnCount || 0,
    isRunning: gameState.combat?.status === "active",
  };
}

/**
 * Convert simulation entity back to player state
 */
export function entityToPlayer(entity, existingPlayer = {}) {
  const existingResources = existingPlayer.resources || {};
  const nextResources = {
    ...existingResources,
    stamina: entity.stats.stamina.current,
    maxStamina: entity.stats.stamina.maximum,
  };

  return {
    ...existingPlayer,
    name: entity.name,
    level: entity.level,
    xp: {
      current: entity.experience,
      max: existingPlayer.xp?.max || 100,
    },
    hp: {
      current: entity.stats.health.current,
      max: entity.stats.health.maximum,
    },
    mana: {
      current: entity.stats.mana.current,
      max: entity.stats.mana.maximum,
    },
    stamina: {
      current: entity.stats.stamina.current,
      max: entity.stats.stamina.maximum,
    },
    resources: nextResources,
    attributes: {
      ...existingPlayer.attributes,
      strength: entity.stats.strength,
      dexterity: entity.stats.dexterity,
      constitution: entity.stats.constitution,
      intelligence: entity.stats.intelligence,
      wisdom: entity.stats.wisdom,
      charisma: entity.stats.charisma,
    },
    effects: entity.effects.map(convertEffectFromSim),
    cooldowns: entity.cooldowns,
    isDead: entity.isDead,
  };
}

/**
 * Convert simulation entity back to enemy state
 */
export function entityToEnemy(entity) {
  return {
    name: entity.name,
    level: entity.level,
    hp: {
      current: entity.stats.health.current,
      max: entity.stats.health.maximum,
    },
    maxHp: entity.stats.health.maximum,
    attack: entity.stats.attackPower,
    defense: entity.stats.defense,
    effects: entity.effects.map(convertEffectFromSim),
    cooldowns: entity.cooldowns,
    tags: entity.tags,
    isDead: entity.isDead,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateAttackPower(attributes) {
  const str = attributes.strength || 5;
  return Math.floor(str * 2);
}

function calculateDefense(attributes) {
  const con = attributes.constitution || 5;
  return Math.floor(con * 0.5);
}

function calculateCritChance(attributes) {
  const luck = attributes.luck || 5;
  return Math.min(0.5, 0.05 + luck * 0.01);
}

function calculateEvasion(attributes) {
  const agi = attributes.agility || 5;
  return Math.min(0.3, agi * 0.01);
}

function convertEffects(effects) {
  if (!Array.isArray(effects)) return [];

  return effects.map((effect) => ({
    id: effect.id || "unknown",
    name: effect.name || effect.id || "Unknown Effect",
    duration: effect.duration || -1,
    stacks: effect.stacks || 1,
    maxStacks: effect.maxStacks || 99,
    source: effect.source || "unknown",
    stackingRule: effect.stackingRule || "add",
    modifiers: {
      statModifiers: effect.statModifiers || {},
      damagePerTick: effect.damagePerTick || 0,
      healingPerTick: effect.healingPerTick || 0,
    },
    tags: effect.tags || [],
  }));
}

function convertEffectFromSim(effect) {
  return {
    id: effect.id,
    name: effect.name,
    duration: effect.duration,
    stacks: effect.stacks,
    maxStacks: effect.maxStacks,
    source: effect.source,
    stackingRule: effect.stackingRule,
    magnitude:
      effect.modifiers.damagePerTick || effect.modifiers.healingPerTick || 0,
    tags: effect.tags,
  };
}

function convertEquipment(equipment) {
  if (!equipment || typeof equipment !== "object") return [];

  const slots = [];
  for (const [slot, item] of Object.entries(equipment)) {
    if (item) {
      slots.push({
        slot,
        itemId: item.id || item,
        modifiers: item.modifiers || {},
        effects: item.effects || [],
      });
    }
  }
  return slots;
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeResource(value, fallback) {
  if (value && typeof value === "object") {
    const current = normalizeNumber(value.current, fallback.current);
    const max = normalizeNumber(value.max ?? value.maximum, fallback.maximum);
    return {
      current: Math.max(0, current),
      maximum: Math.max(1, max),
    };
  }

  const numeric = normalizeNumber(value, fallback.current);
  const maximum = Math.max(fallback.maximum, numeric, 1);
  return {
    current: Math.max(0, numeric),
    maximum,
  };
}

function resolveStamina(player) {
  const fallback = { current: 100, maximum: 100 };
  if (player?.stamina) return normalizeResource(player.stamina, fallback);

  if (player?.resources?.stamina !== undefined) {
    const maxStamina = player.resources.maxStamina ?? player.resources.stamina;
    return normalizeResource(
      { current: player.resources.stamina, max: maxStamina },
      fallback,
    );
  }

  if (player?.resources?.energy !== undefined) {
    const maxEnergy = player.resources.maxEnergy ?? player.resources.energy;
    return normalizeResource(
      { current: player.resources.energy, max: maxEnergy },
      fallback,
    );
  }

  return fallback;
}

function normalizeCooldownEntry(entry, index = 0) {
  if (!entry || typeof entry !== "object") {
    return {
      skillId: `cooldown_${index}`,
      remainingTicks: 0,
      totalTicks: 0,
    };
  }

  const remainingTicks = Math.max(
    0,
    normalizeNumber(entry.remainingTicks ?? entry.remaining ?? entry.turns, 0),
  );
  const totalTicks = Math.max(
    remainingTicks,
    normalizeNumber(entry.totalTicks ?? entry.total ?? entry.max, remainingTicks),
  );

  return {
    skillId: String(entry.skillId || entry.id || `cooldown_${index}`),
    remainingTicks,
    totalTicks,
  };
}

function mapCooldownRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return [];
  return Object.entries(record).map(([skillId, value]) => {
    if (value && typeof value === "object") {
      return normalizeCooldownEntry({ skillId, ...value });
    }
    const ticks = Math.max(0, normalizeNumber(value, 0));
    return {
      skillId: String(skillId),
      remainingTicks: ticks,
      totalTicks: ticks,
    };
  });
}

function resolveCooldowns(player) {
  const candidates = [
    player?.cooldowns,
    player?.skillCooldowns,
    player?.resources?.cooldowns,
    player?.combat?.cooldowns,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((entry, index) => normalizeCooldownEntry(entry, index))
        .filter((entry) => entry.remainingTicks > 0);
    }

    const mapped = mapCooldownRecord(candidate).filter(
      (entry) => entry.remainingTicks > 0,
    );
    if (mapped.length > 0) {
      return mapped;
    }
  }

  return [];
}

function buildPlayerTags(player) {
  const tags = [];

  if (player.race) {
    const raceId =
      typeof player.race === "object" ? player.race.id : player.race;
    tags.push(`race:${raceId}`);
  }

  if (player.class) {
    const classId =
      typeof player.class === "object" ? player.class.id : player.class;
    tags.push(`class:${classId}`);
  }

  return tags;
}
