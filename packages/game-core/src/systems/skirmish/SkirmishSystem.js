import { DataRegistry } from "../../data/DataRegistry.js";
import { createEnemy } from "../../entities/Enemy.js";
import { getItemData } from "../../entities/ItemRegistry.js";
import {
  combatBoardToSimulation,
  combatBoardUnitToEntity,
  entityToCombatBoardUnit,
  entityToPlayer,
  playerToEntity,
} from "../../simulation/bridge/GameStateAdapter.js";
import { serializeEvents } from "../../simulation/logging/CombatLogSerializer.ts";
import {
  resolveCommand,
  setSimulationSkillResolver,
} from "../../simulation/combat/ActionResolver.ts";
import { SimBridge } from "../../simulation/bridge/SimulationContext.js";
import { getSkillById } from "../skills/SkillRegistry.js";
import { endCombatPhase, handleEnemyDefeatPhase } from "../combat/combatAftermath.js";
import { random } from "../../utils/DeterministicRandom.js";
import {
  createDefaultCombatState,
  isSkirmishCombat,
  SKIRMISH_MODE,
} from "./SkirmishState.js";
import {
  ALLY_POSITION_PRIORITY,
  ENEMY_POSITION_PRIORITY,
  getSquadProfileForClass,
  resolveSquadProfileId,
} from "./SkirmishSquadProfiles.js";

const MAX_BOARD_SLOTS = 9;
const MAX_COMBAT_LOG = 200;
const DEFAULT_ITEM_FALLBACK = {
  heal: 0,
  mana: 0,
};

const BIOME_ENCOUNTER_POOLS = {
  city: ["bandit", "slime", "giant_rat"],
  ruins: ["goblin", "slime", "giant_rat", "bandit"],
  wilds: ["wolf", "slime", "giant_rat", "wild_boar"],
  skydocks: ["bandit", "goblin", "slime"],
  undercity: ["giant_rat", "slime", "bandit", "goblin"],
  mountain: ["goblin", "wolf", "bandit", "wild_boar"],
  coast: ["slime", "wolf", "bandit", "goblin"],
  desert: ["bandit", "slime", "goblin", "giant_rat"],
  volcanic: ["slime", "goblin", "wolf", "bandit"],
  dreamscape: ["slime", "goblin", "giant_rat", "bandit"],
};

setSimulationSkillResolver((skillId) => getSkillById(skillId) || { id: skillId });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeSkillList(skills) {
  const seen = new Set();
  return (Array.isArray(skills) ? skills : [])
    .map((skill) => {
      if (!skill) return null;
      if (typeof skill === "string") {
        return { id: skill, name: skill };
      }
      const id = skill.id || skill.skillId || skill.abilityId;
      if (!id) return null;
      return {
        ...skill,
        id,
        name: skill.name || skill.label || id,
      };
    })
    .filter((skill) => {
      if (!skill || seen.has(skill.id)) return false;
      seen.add(skill.id);
      return true;
    });
}

function normalizeEffectList(effects = []) {
  return (Array.isArray(effects) ? effects : []).map((effect) => ({
    ...effect,
    id: effect?.id || effect?.name || `effect_${SimBridge.now()}`,
    name: effect?.name || effect?.id || "Effect",
    duration: toNumber(effect?.duration ?? effect?.remainingDuration, 0),
    stacks: toNumber(effect?.stacks, 1),
    maxStacks: toNumber(effect?.maxStacks, 1),
    source: effect?.source || "unknown",
    stackingRule: effect?.stackingRule || "add",
    modifiers: effect?.modifiers || {
      statModifiers: effect?.statModifiers || {},
      damagePerTick: toNumber(effect?.damagePerTick, 0),
      healingPerTick: toNumber(effect?.healingPerTick, 0),
    },
    tags: Array.isArray(effect?.tags) ? effect.tags : [],
  }));
}

function buildBoardUnitId(prefix, sourceId, index = 0) {
  return `${prefix}_${sourceId || "unit"}_${index}`;
}

function normalizeStatsBlock(entityStats = {}) {
  const health = entityStats.health || {
    current: toNumber(entityStats.hp?.current ?? entityStats.hp, 0),
    maximum: toNumber(entityStats.hp?.max ?? entityStats.maxHp, 1),
  };
  const mana = entityStats.mana || {
    current: toNumber(entityStats.mp?.current ?? entityStats.mana?.current ?? 0, 0),
    maximum: toNumber(
      entityStats.mp?.max ?? entityStats.mana?.maximum ?? entityStats.mana?.max,
      0,
    ),
  };
  const stamina = entityStats.stamina || {
    current: toNumber(entityStats.stamina?.current ?? 10, 10),
    maximum: toNumber(entityStats.stamina?.maximum ?? entityStats.stamina?.max ?? 10, 10),
  };

  return {
    strength: toNumber(entityStats.strength, 5),
    dexterity: toNumber(entityStats.dexterity, 5),
    constitution: toNumber(entityStats.constitution, 5),
    intelligence: toNumber(entityStats.intelligence, 5),
    wisdom: toNumber(entityStats.wisdom, 5),
    charisma: toNumber(entityStats.charisma, 5),
    health: {
      current: clamp(toNumber(health.current, 0), 0, Math.max(1, toNumber(health.maximum, 1))),
      maximum: Math.max(1, toNumber(health.maximum, 1)),
    },
    mana: {
      current: clamp(toNumber(mana.current, 0), 0, Math.max(0, toNumber(mana.maximum, 0))),
      maximum: Math.max(0, toNumber(mana.maximum, 0)),
    },
    stamina: {
      current: clamp(toNumber(stamina.current, 1), 0, Math.max(1, toNumber(stamina.maximum, 1))),
      maximum: Math.max(1, toNumber(stamina.maximum, 1)),
    },
    attackPower: Math.max(1, toNumber(entityStats.attackPower ?? entityStats.attack, 5)),
    defense: Math.max(0, toNumber(entityStats.defense, 0)),
    speed: Math.max(1, toNumber(entityStats.speed, 5)),
    criticalChance: Math.max(0, Math.min(1, toNumber(entityStats.criticalChance, 0.05))),
    criticalMultiplier: Math.max(1, toNumber(entityStats.criticalMultiplier, 1.5)),
    evasion: Math.max(0, Math.min(1, toNumber(entityStats.evasion, 0.05))),
    accuracy: Math.max(0, Math.min(1, toNumber(entityStats.accuracy, 0.85))),
  };
}

function createHeroUnit(player) {
  const heroEntity = playerToEntity(player || {});
  return {
    id: "player",
    name: heroEntity.name,
    faction: "ally",
    sourceType: "hero",
    sourceId: "player",
    lane: 2,
    slot: 1,
    level: heroEntity.level,
    stats: normalizeStatsBlock(heroEntity.stats),
    skills: normalizeSkillList([
      ...(Array.isArray(player?.activeSkills) ? player.activeSkills : []),
      ...(Array.isArray(player?.skills?.active) ? player.skills.active : []),
      ...(Array.isArray(player?.abilities)
        ? player.abilities.filter((ability) => ability?.type === "active")
        : []),
      "basic_attack",
    ]),
    effects: normalizeEffectList(heroEntity.effects),
    initiative: Math.max(1, toNumber(heroEntity.initiative, heroEntity.stats.speed)),
    actionPoints: 1,
    maxActionPoints: 1,
    cooldowns: Array.isArray(heroEntity.cooldowns) ? heroEntity.cooldowns : [],
    tags: Array.isArray(heroEntity.tags) ? heroEntity.tags : [],
    alive: !heroEntity.isDead,
  };
}

function scaleStat(value, scale, floor = 1) {
  return Math.max(floor, Math.floor(toNumber(value, floor) * scale));
}

function createProfileUnit(template, player, index) {
  const baseEntity = playerToEntity(player || {});
  const baseStats = normalizeStatsBlock(baseEntity.stats);
  const hpMax = scaleStat(baseStats.health.maximum, template.hpScale, 8);
  const manaMax = scaleStat(Math.max(5, baseStats.mana.maximum || 10), template.manaScale, 5);
  const attackPower = scaleStat(baseStats.attackPower, template.attackScale, 3);
  const defense = Math.max(0, Math.floor(baseStats.defense * template.defenseScale));
  const speed = scaleStat(baseStats.speed, template.speedScale, 3);

  return {
    id: buildBoardUnitId("ally_profile", template.id, index),
    name: template.name,
    faction: "ally",
    sourceType: "profile",
    sourceId: template.id,
    lane: template.preferredLane,
    slot: template.preferredSlot,
    level: Math.max(1, toNumber(player?.level, 1)),
    stats: {
      ...baseStats,
      health: { current: hpMax, maximum: hpMax },
      mana: { current: manaMax, maximum: manaMax },
      stamina: { current: 12, maximum: 12 },
      attackPower,
      defense,
      speed,
      criticalChance: Math.max(0.03, baseStats.criticalChance),
      evasion: Math.max(0.02, Math.min(0.4, baseStats.evasion + 0.02)),
      accuracy: Math.max(0.75, baseStats.accuracy),
    },
    skills: normalizeSkillList(
      template.skills.length > 0 ? template.skills : ["basic_attack"],
    ),
    effects: [],
    initiative: Math.max(1, speed + toNumber(template.initiativeBonus, 0)),
    actionPoints: 1,
    maxActionPoints: 1,
    cooldowns: [],
    tags: ["profile", ...(template.tags || [])],
    alive: true,
  };
}

function buildSummonStats(summon, fallbackLevel) {
  const summonStats = summon?.stats || {};
  const hpSource = summonStats.hp || {};
  const hpMax = Math.max(
    8,
    toNumber(hpSource.max ?? hpSource.maximum ?? hpSource.current ?? summon.maxHp, 24),
  );
  const attackPower = Math.max(3, toNumber(summonStats.attack ?? summon.attack, 6));
  const defense = Math.max(0, toNumber(summonStats.defense, 1));
  const speed = Math.max(3, toNumber(summonStats.speed, 5));

  return {
    strength: attackPower,
    dexterity: speed,
    constitution: Math.max(3, defense + 5),
    intelligence: Math.max(3, toNumber(summonStats.intelligence, 5)),
    wisdom: Math.max(3, toNumber(summonStats.wisdom, 5)),
    charisma: Math.max(2, toNumber(summonStats.charisma, 3)),
    health: {
      current: clamp(toNumber(hpSource.current ?? hpMax, hpMax), 0, hpMax),
      maximum: hpMax,
    },
    mana: {
      current: Math.max(5, toNumber(summonStats.mana?.current ?? 12, 12)),
      maximum: Math.max(5, toNumber(summonStats.mana?.max ?? summonStats.mana?.maximum ?? 12, 12)),
    },
    stamina: { current: 12, maximum: 12 },
    attackPower,
    defense,
    speed,
    criticalChance: 0.05,
    criticalMultiplier: 1.5,
    evasion: 0.05,
    accuracy: 0.86,
    level: Math.max(1, toNumber(summon?.level, fallbackLevel)),
  };
}

function createSummonUnit(summon, summonType, index, fallbackLevel) {
  const stats = buildSummonStats(summon, fallbackLevel);
  return {
    id: buildBoardUnitId("ally_summon", summon.id || summonType, index),
    name: summon?.name || summonType,
    faction: "ally",
    sourceType: "summon",
    sourceId: summon?.id || `${summonType}_${index}`,
    summonType,
    lane: 2,
    slot: 2,
    level: stats.level,
    stats: {
      strength: stats.strength,
      dexterity: stats.dexterity,
      constitution: stats.constitution,
      intelligence: stats.intelligence,
      wisdom: stats.wisdom,
      charisma: stats.charisma,
      health: stats.health,
      mana: stats.mana,
      stamina: stats.stamina,
      attackPower: stats.attackPower,
      defense: stats.defense,
      speed: stats.speed,
      criticalChance: stats.criticalChance,
      criticalMultiplier: stats.criticalMultiplier,
      evasion: stats.evasion,
      accuracy: stats.accuracy,
    },
    skills: normalizeSkillList(
      Array.isArray(summon?.abilities) && summon.abilities.length > 0
        ? summon.abilities
        : ["basic_attack"],
    ),
    effects: [],
    initiative: Math.max(1, stats.speed),
    actionPoints: 1,
    maxActionPoints: 1,
    cooldowns: [],
    tags: ["summon", summonType],
    duration: toNumber(summon?.duration, 0),
    alive: true,
  };
}

function buildEnemyStats(enemy) {
  const hp = enemy?.stats?.hp || enemy?.hp || {};
  const hpMax = Math.max(10, toNumber(hp.max ?? enemy?.maxHp ?? 20, 20));
  const speed = Math.max(3, toNumber(enemy?.stats?.speed, enemy?.level || 4));
  return {
    strength: Math.max(4, toNumber(enemy?.stats?.attack ?? enemy?.attack, 5)),
    dexterity: Math.max(3, speed),
    constitution: Math.max(4, toNumber(enemy?.stats?.defense ?? enemy?.defense, 2) + 6),
    intelligence: Math.max(3, toNumber(enemy?.level, 1) + 2),
    wisdom: Math.max(3, toNumber(enemy?.level, 1) + 1),
    charisma: Math.max(1, toNumber(enemy?.level, 1)),
    health: {
      current: clamp(toNumber(hp.current ?? hpMax, hpMax), 0, hpMax),
      maximum: hpMax,
    },
    mana: {
      current: 16,
      maximum: 16,
    },
    stamina: {
      current: 12,
      maximum: 12,
    },
    attackPower: Math.max(3, toNumber(enemy?.stats?.attack ?? enemy?.attack, 5)),
    defense: Math.max(0, toNumber(enemy?.stats?.defense ?? enemy?.defense, 0)),
    speed,
    criticalChance: 0.05,
    criticalMultiplier: 1.5,
    evasion: 0.05,
    accuracy: 0.84,
  };
}

function createEnemyUnit(enemy, index) {
  const stats = buildEnemyStats(enemy);
  const skills = normalizeSkillList(enemy?.skills || enemy?.skillIds || ["basic_attack"]);

  return {
    id: buildBoardUnitId("enemy", enemy?.id || enemy?.name, index),
    name: enemy?.name || "Enemy",
    faction: "enemy",
    sourceType: "enemy",
    sourceId: enemy?.id || `enemy_${index}`,
    lane: 2,
    slot: 0,
    level: Math.max(1, toNumber(enemy?.level, 1)),
    stats,
    skills,
    effects: normalizeEffectList(enemy?.currentEffects || enemy?.effects || []),
    initiative: Math.max(1, stats.speed),
    actionPoints: 1,
    maxActionPoints: 1,
    cooldowns: [],
    tags: Array.isArray(enemy?.tags) ? enemy.tags : [],
    alive: stats.health.current > 0,
    dropTable: Array.isArray(enemy?.dropTable) ? enemy.dropTable : [],
    xpReward: toNumber(enemy?.xpReward, 0),
    goldReward: toNumber(enemy?.goldReward, 0),
    enemyType: enemy?.type || "enemy",
  };
}

function isCellOccupied(units, faction, lane, slot) {
  return units.some(
    (unit) =>
      unit?.alive !== false &&
      unit?.faction === faction &&
      unit?.lane === lane &&
      unit?.slot === slot,
  );
}

function placeUnit(units, faction, unit, preferredCells) {
  const candidates = [
    ...(Array.isArray(preferredCells) ? preferredCells : []),
    ...(faction === "ally" ? ALLY_POSITION_PRIORITY : ENEMY_POSITION_PRIORITY),
  ];

  for (const cell of candidates) {
    if (!cell) continue;
    if (!isCellOccupied(units, faction, cell.lane, cell.slot)) {
      units.push({
        ...unit,
        lane: cell.lane,
        slot: cell.slot,
      });
      return true;
    }
  }

  return false;
}

function getCombatBiome(state) {
  return state?.world?.location?.biome || "city";
}

function scoreEncounterType(seeds) {
  const maxLevel = seeds.reduce(
    (highest, template) => Math.max(highest, toNumber(template?.level, 1)),
    1,
  );
  const bossLike = seeds.some((template) =>
    /boss|lord|queen|king|dragon|overlord|behemoth|titan/i.test(
      `${template?.id || ""} ${template?.name || ""}`,
    ),
  );
  if (bossLike || maxLevel >= 30) {
    return { type: "boss", min: 1, max: 3 };
  }
  if (maxLevel >= 12 || seeds.length <= 2) {
    return { type: "elite", min: 2, max: 4 };
  }
  return { type: "standard", min: 3, max: 5 };
}

function expandEnemyRoster(state, enemyIds = []) {
  const seedIds = (Array.isArray(enemyIds) ? enemyIds : []).filter(Boolean);
  const seedTemplates = seedIds
    .map((id) => DataRegistry.getEnemyById(id))
    .filter(Boolean);
  const combatBiome = getCombatBiome(state);
  const encounterProfile = scoreEncounterType(seedTemplates);
  const averageLevel =
    seedTemplates.length > 0
      ? seedTemplates.reduce((sum, template) => sum + toNumber(template.level, 1), 0) /
        seedTemplates.length
      : 1;
  const allEnemies = DataRegistry.getEnemies();
  const biomePoolIds = BIOME_ENCOUNTER_POOLS[combatBiome] || [];
  const bandCandidates = allEnemies.filter((template) => {
    const level = toNumber(template?.level, 1);
    return level >= averageLevel - 4 && level <= averageLevel + 6;
  });
  const weightedIds = [
    ...seedIds,
    ...biomePoolIds,
    ...bandCandidates.map((template) => template.id),
  ].filter(Boolean);

  const uniqueIds = [...new Set(weightedIds)];
  const targetCount = clamp(seedIds.length + 2, encounterProfile.min, encounterProfile.max);
  const nextRoster = seedIds.slice();
  let cursor = Math.abs(
    seedIds.join("").length +
      toNumber(state?.world?.turnCount, 0) +
      combatBiome.length,
  );

  while (nextRoster.length < targetCount && uniqueIds.length > 0) {
    const nextId = uniqueIds[cursor % uniqueIds.length];
    nextRoster.push(nextId);
    cursor += 1;
  }

  return {
    encounterType: encounterProfile.type,
    enemyIds: nextRoster,
  };
}

function buildEnemyUnits(state, seedEnemyIds = []) {
  const expansion = expandEnemyRoster(state, seedEnemyIds);
  const createdEnemies = expansion.enemyIds
    .map((enemyId) => createEnemy(enemyId))
    .filter(Boolean);

  return {
    encounterType: expansion.encounterType,
    units: createdEnemies.map((enemy, index) => createEnemyUnit(enemy, index)),
    enemyIds: expansion.enemyIds,
  };
}

function buildSummonUnits(player) {
  const fallbackLevel = Math.max(1, toNumber(player?.level, 1));
  const summons = [];
  if (player?.activePet) {
    summons.push(createSummonUnit(player.activePet, "pet", summons.length, fallbackLevel));
  }
  if (player?.activeDemon) {
    summons.push(createSummonUnit(player.activeDemon, "demon", summons.length, fallbackLevel));
  }
  (player?.undead || []).forEach((undead, index) => {
    summons.push(createSummonUnit(undead, "undead", index, fallbackLevel));
  });
  (player?.totems || []).forEach((totem, index) => {
    summons.push(createSummonUnit(totem, "totem", index, fallbackLevel));
  });
  (player?.traps || []).forEach((trap, index) => {
    summons.push(createSummonUnit(trap, "trap", index, fallbackLevel));
  });
  return summons.slice(0, MAX_BOARD_SLOTS - 1);
}

function buildProfileUnitsForPlayer(player) {
  const profile = getSquadProfileForClass(player?.class);
  return profile.units.map((template, index) => createProfileUnit(template, player, index));
}

function buildTurnQueue(units, preferredFaction = null) {
  return units
    .filter((unit) => unit?.alive !== false)
    .sort((a, b) => {
      if (b.initiative !== a.initiative) {
        return b.initiative - a.initiative;
      }
      if (preferredFaction && a.faction !== b.faction) {
        if (a.faction === preferredFaction) return -1;
        if (b.faction === preferredFaction) return 1;
      }
      if (a.lane !== b.lane) {
        return a.lane - b.lane;
      }
      if (a.slot !== b.slot) {
        return a.slot - b.slot;
      }
      return String(a.id).localeCompare(String(b.id));
    })
    .map((unit) => unit.id);
}

function getUnitMap(board) {
  const map = new Map();
  (board?.units || []).forEach((unit) => {
    if (unit?.id) {
      map.set(unit.id, unit);
    }
  });
  return map;
}

function getUnit(board, unitId) {
  return getUnitMap(board).get(unitId) || null;
}

function getLivingUnits(board, faction = null) {
  return (board?.units || []).filter(
    (unit) => unit?.alive !== false && (faction ? unit?.faction === faction : true),
  );
}

function heroUnitId(board) {
  return board?.units?.find((unit) => unit?.sourceType === "hero")?.id || "player";
}

function chooseDefaultTarget(board, activeUnitId = null, preferredFaction = "enemy") {
  const actor = getUnit(board, activeUnitId || board?.activeUnitId);
  const targetFaction =
    preferredFaction ||
    (actor?.faction === "enemy" ? "ally" : "enemy");
  const candidates = getLivingUnits(board, targetFaction).sort((a, b) => {
    if (actor && Math.abs(a.lane - actor.lane) !== Math.abs(b.lane - actor.lane)) {
      return Math.abs(a.lane - actor.lane) - Math.abs(b.lane - actor.lane);
    }
    if (a.slot !== b.slot) {
      return a.slot - b.slot;
    }
    return String(a.id).localeCompare(String(b.id));
  });
  return candidates[0]?.id || null;
}

function ensureSelectedTarget(board) {
  const selected = getUnit(board, board?.selectedTargetId);
  if (selected?.alive !== false) {
    return board.selectedTargetId;
  }
  return chooseDefaultTarget(board, board?.activeUnitId, "enemy");
}

function ensureBoardTurn(board, preferredFaction = null) {
  let units = (board?.units || []).map((unit) => ({ ...unit }));
  const living = units.filter((unit) => unit?.alive !== false);
  if (living.length === 0) {
    return {
      ...board,
      units,
      activeUnitId: null,
      turnQueue: [],
      selectedTargetId: null,
    };
  }

  let turnQueue = (board?.turnQueue || []).filter((unitId) => {
    const unit = units.find((candidate) => candidate.id === unitId);
    return unit?.alive !== false;
  });

  let round = toNumber(board?.round, 0);
  if (turnQueue.length === 0) {
    round += 1;
    units = units.map((unit) =>
      unit?.alive === false
        ? unit
        : {
            ...unit,
            actionPoints: unit.maxActionPoints || 1,
          },
    );
    turnQueue = buildTurnQueue(units, preferredFaction);
  }

  return {
    ...board,
    units,
    round,
    turnQueue,
    activeUnitId: turnQueue[0] || null,
    selectedTargetId: ensureSelectedTarget({
      ...board,
      units,
      turnQueue,
      activeUnitId: turnQueue[0] || null,
    }),
  };
}

function projectEnemySummary(board) {
  return getLivingUnits(board, "enemy").map((unit) => ({
    id: unit.sourceId,
    combatantId: unit.id,
    name: unit.name,
    level: unit.level,
    type: unit.enemyType || "enemy",
    tags: Array.isArray(unit.tags) ? unit.tags : [],
    lane: unit.lane,
    dropTable: Array.isArray(unit.dropTable) ? unit.dropTable : [],
    xpReward: toNumber(unit.xpReward, 0),
    goldReward: toNumber(unit.goldReward, 0),
    skillCooldowns: {},
    stats: {
      hp: {
        current: toNumber(unit.stats?.health?.current, 0),
        max: toNumber(unit.stats?.health?.maximum, 1),
      },
      attack: toNumber(unit.stats?.attackPower, 0),
      defense: toNumber(unit.stats?.defense, 0),
      speed: toNumber(unit.stats?.speed, 0),
    },
    isDead: unit.alive === false,
  }));
}

function buildNameResolver(board) {
  const names = new Map();
  (board?.units || []).forEach((unit) => {
    names.set(unit.id, unit.name || unit.id);
  });
  return (entityId) => names.get(entityId) || entityId || "Unknown";
}

function replaceBoardUnits(board, nextUnits) {
  const nextBoard = {
    ...board,
    units: nextUnits,
  };
  return ensureBoardTurn(nextBoard);
}

function syncPlayerFromBoard(player, board) {
  const hero = getUnit(board, heroUnitId(board));
  let nextPlayer = { ...(player || {}) };

  if (hero) {
    const heroEntity = combatBoardUnitToEntity(hero);
    nextPlayer = entityToPlayer(heroEntity, nextPlayer);
    nextPlayer.isDead = hero.alive === false;
  } else {
    nextPlayer = {
      ...nextPlayer,
      hp: {
        ...(nextPlayer.hp || {}),
        current: 0,
      },
      isDead: true,
    };
  }

  const updateSingleSummon = (entry, summonType) => {
    if (!entry) return null;
    const unit = (board?.units || []).find(
      (candidate) =>
        candidate?.sourceType === "summon" &&
        candidate?.summonType === summonType &&
        candidate?.sourceId === entry.id,
    );
    if (!unit) return null;
    return {
      ...entry,
      stats: {
        ...(entry.stats || {}),
        hp: {
          ...(entry.stats?.hp || {}),
          current: toNumber(
            unit.stats?.health?.current,
            entry.stats?.hp?.current ?? 0,
          ),
          max: toNumber(
            unit.stats?.health?.maximum,
            entry.stats?.hp?.max ?? 0,
          ),
        },
      },
    };
  };

  const updateSummonList = (entries, summonType) =>
    (Array.isArray(entries) ? entries : [])
      .map((entry) => updateSingleSummon(entry, summonType))
      .filter(Boolean);

  nextPlayer.activePet = updateSingleSummon(player?.activePet, "pet");
  nextPlayer.activeDemon = updateSingleSummon(player?.activeDemon, "demon");
  nextPlayer.undead = updateSummonList(player?.undead, "undead");
  nextPlayer.totems = updateSummonList(player?.totems, "totem");
  nextPlayer.traps = updateSummonList(player?.traps, "trap");

  return nextPlayer;
}

function syncBoardToState(state, board, overrides = {}) {
  const combat = createDefaultCombatState(state?.combat || {});
  const hydratedBoard = ensureBoardTurn({
    ...(combat.board || {}),
    ...(board || {}),
  });
  const nextPlayer = syncPlayerFromBoard(state?.player, hydratedBoard);
  const enemies = projectEnemySummary(hydratedBoard);
  const activeUnit = getUnit(hydratedBoard, hydratedBoard.activeUnitId);

  return {
    ...state,
    player: nextPlayer,
    combat: {
      ...combat,
      ...overrides,
      mode: SKIRMISH_MODE,
      status: overrides.status || hydratedBoard.status || combat.status,
      turn: activeUnit?.faction === "enemy" ? "enemy" : "player",
      enemies,
      lanes: {
        player: getUnit(hydratedBoard, heroUnitId(hydratedBoard))?.lane || 2,
        enemies: enemies.map((enemy) => enemy.lane || 2),
      },
      board: hydratedBoard,
      spawnMeta: hydratedBoard.spawnMeta || combat.spawnMeta,
    },
  };
}

function buildStartLog(hero, enemyUnits) {
  const enemyLabel = enemyUnits.map((unit) => unit.name).join(", ");
  return [`Skirmish ignites. ${hero.name} faces ${enemyLabel}.`];
}

function initializeBoard(state, enemyIds) {
  const player = state?.player || {};
  const hero = createHeroUnit(player);
  const summons = buildSummonUnits(player);
  const profileUnits = buildProfileUnitsForPlayer(player);
  const enemyBuild = buildEnemyUnits(state, enemyIds);

  const alliedUnits = [];
  placeUnit(alliedUnits, "ally", hero, [{ lane: hero.lane, slot: hero.slot }]);

  summons
    .slice(0, MAX_BOARD_SLOTS - alliedUnits.length)
    .forEach((summon) => {
      placeUnit(alliedUnits, "ally", summon, [{ lane: summon.lane, slot: summon.slot }]);
    });

  profileUnits.forEach((unit) => {
    if (alliedUnits.length >= MAX_BOARD_SLOTS) return;
    placeUnit(alliedUnits, "ally", unit, [{ lane: unit.lane, slot: unit.slot }]);
  });

  const enemyUnits = [];
  enemyBuild.units.slice(0, MAX_BOARD_SLOTS).forEach((unit) => {
    placeUnit(enemyUnits, "enemy", unit, [{ lane: unit.lane, slot: unit.slot }]);
  });

  const units = [...alliedUnits, ...enemyUnits];
  const preferredProfileId = resolveSquadProfileId(player?.class);
  const baseBoard = ensureBoardTurn(
    {
      matchId: `skirmish_${SimBridge.now()}`,
      status: "active",
      units,
      activeUnitId: null,
      selectedTargetId: null,
      turnQueue: [],
      eventLog: [],
      spawnMeta: {
        encounterId: `skirmish:${enemyBuild.enemyIds.join("+")}`,
        enemyIds: enemyBuild.enemyIds,
        biome: getCombatBiome(state),
        encounterType: enemyBuild.encounterType,
        allyProfileId: preferredProfileId,
        summonCount: summons.length,
      },
      round: 0,
    },
    "ally",
  );

  return {
    ...baseBoard,
    eventLog: [
      {
        id: `skirmish_open_${SimBridge.now()}`,
        tick: toNumber(state?.world?.turnCount, 0),
        timestamp: SimBridge.now(),
        type: "CombatAction",
        text: `Formation locked: ${preferredProfileId} doctrine deployed.`,
      },
    ],
  };
}

export function startSkirmishCombat(state, enemyIds = []) {
  const board = initializeBoard(state, enemyIds);
  const startState = syncBoardToState(state, board, {
    status: "active",
    log: buildStartLog(getUnit(board, "player"), getLivingUnits(board, "enemy")),
  });
  return syncBoardToState(startState, {
    ...board,
    eventLog: [...board.eventLog],
  });
}

export function selectSkirmishTarget(state, targetId) {
  if (!isSkirmishCombat(state?.combat)) return state;
  const board = state.combat.board;
  const target = getUnit(board, targetId);
  if (!target || target.alive === false) return state;
  return syncBoardToState(state, {
    ...board,
    selectedTargetId: target.id,
  });
}

export function selectSkirmishUnit(state, unitId) {
  if (!isSkirmishCombat(state?.combat)) return state;
  const board = state.combat.board;
  const unit = getUnit(board, unitId);
  if (!unit || unit.alive === false || unit.faction !== "ally") return state;
  const turnQueue = (board.turnQueue || []).filter((entry) => entry !== unit.id);
  turnQueue.unshift(unit.id);
  return syncBoardToState(state, {
    ...board,
    turnQueue,
    activeUnitId: unit.id,
    selectedTargetId:
      unit.faction === "ally"
        ? board.selectedTargetId || chooseDefaultTarget(board, unit.id, "enemy")
        : board.selectedTargetId,
  });
}

function getCurrentActor(board) {
  return getUnit(board, board?.activeUnitId);
}

function resolveTargetForSkill(board, actor, requestedTargetId = null) {
  const requested = requestedTargetId ? getUnit(board, requestedTargetId) : null;
  if (requested && requested.alive !== false && requested.faction !== actor.faction) {
    return requested;
  }
  const selected = getUnit(board, board?.selectedTargetId);
  if (selected && selected.alive !== false && selected.faction !== actor.faction) {
    return selected;
  }
  const defaultTargetId = chooseDefaultTarget(
    board,
    actor.id,
    actor.faction === "enemy" ? "ally" : "enemy",
  );
  return getUnit(board, defaultTargetId);
}

function canReachTarget(actor, target) {
  if (!actor || !target) return false;
  return actor.lane === target.lane;
}

function finalizeQueueAfterAction(board, actorId) {
  const filteredQueue = (board.turnQueue || []).filter((entry) => entry !== actorId);
  return ensureBoardTurn({
    ...board,
    turnQueue: filteredQueue,
    activeUnitId: filteredQueue[0] || null,
  });
}

function appendBoardEvents(board, events) {
  const serialized = serializeEvents(events, {
    resolveName: buildNameResolver(board),
    includeDetails: true,
  });
  return {
    ...board,
    eventLog: [...(board.eventLog || []), ...serialized].slice(-MAX_COMBAT_LOG),
  };
}

function appendCombatLog(state, entries = []) {
  const nextEntries = [...(state?.combat?.log || []), ...entries].slice(-MAX_COMBAT_LOG);
  return {
    ...state,
    combat: {
      ...state.combat,
      log: nextEntries,
    },
  };
}

function applyRewardPhases(state, previousBoard, nextBoard) {
  const previousEnemies = projectEnemySummary(previousBoard);
  const currentEnemies = projectEnemySummary(nextBoard);
  const currentEnemyMap = new Map(
    currentEnemies.map((enemy) => [enemy?.combatantId, enemy]),
  );
  const defeatedIds = previousEnemies
    .map((enemy) => enemy?.combatantId)
    .filter((enemyId) => enemyId && !currentEnemyMap.has(enemyId));

  if (defeatedIds.length === 0) {
    return state;
  }

  let workingState = {
    ...state,
    combat: {
      ...state.combat,
      enemies: previousEnemies.map((enemy) =>
        currentEnemyMap.has(enemy?.combatantId)
          ? currentEnemyMap.get(enemy.combatantId)
          : {
              ...enemy,
              isDead: true,
              stats: {
                ...(enemy?.stats || {}),
                hp: {
                  ...(enemy?.stats?.hp || {}),
                  current: 0,
                },
              },
            },
      ),
    },
  };

  defeatedIds.forEach((defeatedId) => {
    const enemyIndex = (workingState.combat?.enemies || []).findIndex(
      (enemy) => enemy?.combatantId === defeatedId,
    );
    if (enemyIndex >= 0) {
      workingState = handleEnemyDefeatPhase(workingState, enemyIndex);
    }
  });

  return workingState;
}

function finalizeSkirmishState(state, board) {
  const livingAllies = getLivingUnits(board, "ally");
  const livingEnemies = getLivingUnits(board, "enemy");
  const hero = getUnit(board, heroUnitId(board));

  if (livingEnemies.length === 0) {
    const terminal = state?.combat?.status === "victory" ? state : endCombatPhase(state, "victory");
    return syncBoardToState(
      terminal,
      {
        ...board,
        status: "victory",
        activeUnitId: null,
        turnQueue: [],
        selectedTargetId: null,
      },
      {
        status: "victory",
        log: terminal.combat.log,
      },
    );
  }

  if (!hero || hero.alive === false || livingAllies.length === 0) {
    const terminal = state?.combat?.status === "defeat" ? state : endCombatPhase(state, "defeat");
    return syncBoardToState(
      terminal,
      {
        ...board,
        status: "defeat",
        activeUnitId: null,
        turnQueue: [],
        selectedTargetId: null,
      },
      {
        status: "defeat",
        log: terminal.combat.log,
      },
    );
  }

  return syncBoardToState(state, board, {
    status: "active",
  });
}

function resolveBoardFromEntities(board, entities) {
  const nextUnits = Array.from(entities.values())
    .map((entity) => entityToCombatBoardUnit(entity, getUnit(board, entity.id)))
    .filter(Boolean)
    .map((unit) => ({
      ...unit,
      alive: unit.alive !== false,
    }))
    .filter((unit) => unit.alive !== false);
  return replaceBoardUnits(board, nextUnits);
}

function executeResolvedCommand(state, board, command, { itemEffect = null } = {}) {
  const simulation = combatBoardToSimulation(board, state);
  const resolution = resolveCommand(command, simulation.entities, {
    tick: toNumber(state?.world?.turnCount, 0),
    timestamp: SimBridge.now(),
    rng: () => random(),
  });

  if (!resolution.success) {
    return {
      success: false,
      reason: resolution.reason || "Action failed.",
      state,
    };
  }

  let nextBoard = resolveBoardFromEntities(board, resolution.entities);

  if (itemEffect) {
    const targetId = itemEffect.targetId;
    nextBoard = {
      ...nextBoard,
      units: nextBoard.units.map((unit) => {
        if (unit.id !== targetId) return unit;
        const maxHealth = toNumber(unit.stats?.health?.maximum, 1);
        const maxMana = toNumber(unit.stats?.mana?.maximum, 0);
        return {
          ...unit,
          stats: {
            ...unit.stats,
            health: {
              ...unit.stats.health,
              current: clamp(
                toNumber(unit.stats?.health?.current, 0) + toNumber(itemEffect.heal, 0),
                0,
                maxHealth,
              ),
            },
            mana: {
              ...unit.stats.mana,
              current: clamp(
                toNumber(unit.stats?.mana?.current, 0) + toNumber(itemEffect.mana, 0),
                0,
                maxMana,
              ),
            },
          },
        };
      }),
    };
  }

  nextBoard = appendBoardEvents(nextBoard, resolution.events);
  nextBoard = finalizeQueueAfterAction(nextBoard, command.entityId);

  let nextState = syncBoardToState(state, nextBoard, {
    status: "active",
  });
  nextState = appendCombatLog(
    nextState,
    serializeEvents(resolution.events, {
      resolveName: buildNameResolver(nextBoard),
      includeDetails: false,
    }).map((entry) => entry.text),
  );
  nextState = applyRewardPhases(nextState, board, nextBoard);

  const syncedBoard = {
    ...(nextState.combat?.board || nextBoard),
    status: nextState.combat?.status || nextBoard.status,
  };
  return {
    success: true,
    state: finalizeSkirmishState(nextState, syncedBoard),
    board: syncedBoard,
  };
}

function useSkillCommand(state, skillId = null, requestedTargetId = null) {
  if (!isSkirmishCombat(state?.combat)) {
    return { success: false, reason: "Skirmish is not active.", state };
  }

  const board = ensureBoardTurn(state.combat.board);
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "ally") {
    return {
      success: false,
      reason: "It is not your squad's turn.",
      state: syncBoardToState(state, board),
    };
  }

  const target = resolveTargetForSkill(board, actor, requestedTargetId);
  if (!target) {
    return { success: false, reason: "No target available.", state };
  }
  if (!canReachTarget(actor, target)) {
    return {
      success: false,
      reason: `${actor.name} must share a lane with ${target.name} before attacking.`,
      state: syncBoardToState(state, board),
    };
  }

  const resolvedSkillId = skillId || actor.skills?.[0]?.id || "basic_attack";
  const command = {
    id: `sk_cmd_${SimBridge.now()}`,
    type: "UseSkill",
    entityId: actor.id,
    skillId: resolvedSkillId,
    targetId: target.id,
    timestamp: toNumber(state?.world?.turnCount, 0),
  };

  return executeResolvedCommand(state, board, command);
}

export function playerAttackSkirmish(state, enemyIndex = 0, skillId = null) {
  if (!isSkirmishCombat(state?.combat)) {
    return { success: false, reason: "Skirmish is not active.", state };
  }

  const board = state.combat.board;
  const targetFromIndex = (state.combat?.enemies || [])[enemyIndex]?.combatantId || null;
  return useSkillCommand(state, skillId, targetFromIndex);
}

export function moveSkirmishUnit(state, lane, slot) {
  if (!isSkirmishCombat(state?.combat)) return state;
  const board = ensureBoardTurn(state.combat.board);
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "ally") {
    return syncBoardToState(state, board);
  }
  const nextLane = clamp(Math.round(toNumber(lane, actor.lane)), 1, 3);
  const nextSlot = clamp(Math.round(toNumber(slot, actor.slot)), 0, 2);
  if (isCellOccupied(board.units, actor.faction, nextLane, nextSlot)) {
    return appendCombatLog(syncBoardToState(state, board), [
      `${actor.name} cannot move to an occupied cell.`,
    ]);
  }

  const command = {
    id: `sk_move_${SimBridge.now()}`,
    type: "Move",
    entityId: actor.id,
    fromPosition: { lane: actor.lane, slot: actor.slot },
    toPosition: { lane: nextLane, slot: nextSlot },
    timestamp: toNumber(state?.world?.turnCount, 0),
  };

  const result = executeResolvedCommand(state, board, command);
  return result.state || state;
}

export function useSkirmishItem(state, itemId) {
  if (!isSkirmishCombat(state?.combat)) {
    return { success: false, reason: "Skirmish is not active.", state };
  }

  const board = ensureBoardTurn(state.combat.board);
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "ally") {
    return {
      success: false,
      reason: "It is not your squad's turn.",
      state: syncBoardToState(state, board),
    };
  }

  const itemData = getItemData(itemId);
  const target =
    getUnit(board, board.selectedTargetId)?.faction === "ally"
      ? getUnit(board, board.selectedTargetId)
      : actor;
  const effect = itemData?.effect || DEFAULT_ITEM_FALLBACK;
  const command = {
    id: `sk_item_${SimBridge.now()}`,
    type: "UseItem",
    entityId: actor.id,
    itemId,
    targetId: target.id,
    timestamp: toNumber(state?.world?.turnCount, 0),
  };

  const result = executeResolvedCommand(state, board, command, {
    itemEffect: {
      targetId: target.id,
      heal: toNumber(effect?.heal, 0),
      mana: toNumber(effect?.mana, 0),
    },
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    state: result.state,
  };
}

export function waitSkirmishTurn(state) {
  if (!isSkirmishCombat(state?.combat)) return state;
  const board = ensureBoardTurn(state.combat.board);
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "ally") {
    return syncBoardToState(state, board);
  }
  const nextBoard = finalizeQueueAfterAction(
    {
      ...board,
      units: board.units.map((unit) =>
        unit.id === actor.id
          ? {
              ...unit,
              actionPoints: 0,
            }
          : unit,
      ),
      eventLog: [
        ...(board.eventLog || []),
        {
          id: `wait_${SimBridge.now()}`,
          tick: toNumber(state?.world?.turnCount, 0),
          timestamp: SimBridge.now(),
          type: "CombatAction",
          text: `${actor.name} holds position and waits.`,
        },
      ].slice(-MAX_COMBAT_LOG),
    },
    actor.id,
  );
  return appendCombatLog(syncBoardToState(state, nextBoard), [
    `${actor.name} holds position and waits.`,
  ]);
}

function chooseEnemyAction(state, board) {
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "enemy") {
    return null;
  }

  const target = resolveTargetForSkill(
    board,
    actor,
    chooseDefaultTarget(board, actor.id, "ally"),
  );
  if (!target) {
    return {
      type: "Rest",
      id: `sk_rest_${SimBridge.now()}`,
      entityId: actor.id,
      duration: 1,
      timestamp: toNumber(state?.world?.turnCount, 0),
    };
  }

  if (!canReachTarget(actor, target)) {
    const candidateCells = [
      { lane: target.lane, slot: actor.slot },
      { lane: target.lane, slot: 0 },
      { lane: target.lane, slot: 1 },
      { lane: target.lane, slot: 2 },
    ];
    const openCell = candidateCells.find(
      (cell) => !isCellOccupied(board.units, actor.faction, cell.lane, cell.slot),
    );
    if (openCell) {
      return {
        type: "Move",
        id: `sk_enemy_move_${SimBridge.now()}`,
        entityId: actor.id,
        fromPosition: { lane: actor.lane, slot: actor.slot },
        toPosition: openCell,
        timestamp: toNumber(state?.world?.turnCount, 0),
      };
    }
  }

  return {
    type: "UseSkill",
    id: `sk_enemy_skill_${SimBridge.now()}`,
    entityId: actor.id,
    skillId: actor.skills?.[0]?.id || "basic_attack",
    targetId: target.id,
    timestamp: toNumber(state?.world?.turnCount, 0),
  };
}

export function processSkirmishEnemyTurns(state) {
  if (!isSkirmishCombat(state?.combat)) {
    return state;
  }

  let workingState = syncBoardToState(state, state.combat.board);
  let guard = 0;

  while (
    workingState?.combat?.status === "active" &&
    getCurrentActor(workingState.combat.board)?.faction === "enemy" &&
    guard < 32
  ) {
    const board = ensureBoardTurn(workingState.combat.board);
    const command = chooseEnemyAction(workingState, board);
    if (!command) break;
    const result = executeResolvedCommand(workingState, board, command);
    if (!result.success || !result.state) {
      workingState = appendCombatLog(syncBoardToState(workingState, board), [
        result.reason || "Enemy action failed.",
      ]);
      break;
    }
    workingState = result.state;
    guard += 1;
  }

  return workingState;
}

function calculateEscapeChance(state) {
  const agility =
    toNumber(state?.player?.attributes?.agility, 0) ||
    toNumber(state?.player?.attributes?.dexterity, 0);
  const base = toNumber(state?.config?.baseEscapeChance, 0.3);
  const bonus = toNumber(state?.config?.agilityEscapeBonus, 0.01);
  return clamp(base + agility * bonus, 0.05, 1);
}

export function escapeSkirmish(state) {
  if (!isSkirmishCombat(state?.combat)) {
    return { success: false, reason: "Not in combat.", state };
  }

  const board = ensureBoardTurn(state.combat.board);
  const actor = getCurrentActor(board);
  if (!actor || actor.faction !== "ally") {
    return {
      success: false,
      reason: "It is not your squad's turn.",
      state: syncBoardToState(state, board),
    };
  }

  if (random() <= calculateEscapeChance(state)) {
    const terminal = endCombatPhase(state, "escape");
    return {
      success: true,
      state: syncBoardToState(
        terminal,
        {
          ...board,
          status: "inactive",
          activeUnitId: null,
          turnQueue: [],
        },
        {
          status: "inactive",
          log: terminal.combat.log,
        },
      ),
    };
  }

  const waited = waitSkirmishTurn(
    appendCombatLog(syncBoardToState(state, board), [
      `${actor.name} fails to break away from the skirmish.`,
    ]),
  );
  const postEnemy = processSkirmishEnemyTurns(waited);
  return {
    success: false,
    reason: "Escape attempt failed.",
    state: postEnemy,
  };
}

export function buildSkirmishEnemyIndex(board, combatState = {}) {
  const selectedTargetId = ensureSelectedTarget(board || combatState?.board || {});
  return projectEnemySummary(board || combatState?.board || {}).findIndex(
    (enemy) => enemy?.combatantId === selectedTargetId,
  );
}
