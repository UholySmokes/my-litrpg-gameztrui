import { getEnemiesByLevelRange, getEnemyTemplate } from "../../data/registries/EnemyDataRegistry.js";
import { randomChoice } from "../../utils/DeterministicRandom.js";
import { clamp, toNumber } from "../../utils/shared.js";
import { applyQuestRewards } from "../quest/QuestRewards.js";

const DEFAULT_TEMPLATE_ID = "training_depths";
const ROOM_KIND_POOL = ["combat", "treasure", "combat", "recovery", "elite"];

function getDungeonState(state) {
  const dungeon = state?.dungeon;
  if (dungeon && typeof dungeon === "object" && !Array.isArray(dungeon)) {
    return {
      activeRun: dungeon.activeRun || null,
      completedRuns: Array.isArray(dungeon.completedRuns) ? dungeon.completedRuns : [],
    };
  }

  return {
    activeRun: null,
    completedRuns: [],
  };
}

function resolveDifficulty(state, payload = {}) {
  const requested = Math.floor(toNumber(payload.difficulty, NaN));
  if (Number.isFinite(requested) && requested > 0) {
    return requested;
  }

  return Math.max(1, Math.floor(toNumber(state?.player?.level, 1)));
}

function resolveRoomCount(difficulty, payload = {}) {
  const requested = Math.floor(toNumber(payload.roomCount, NaN));
  if (Number.isFinite(requested) && requested > 0) {
    return clamp(requested, 1, 8);
  }

  return clamp(3 + Math.floor(difficulty / 15), 3, 6);
}

function getEncounterPool(targetLevel) {
  const primary = getEnemiesByLevelRange(
    Math.max(1, targetLevel - 3),
    targetLevel + 4,
  );
  if (primary.length > 0) return primary;

  const fallback = getEnemiesByLevelRange(1, Math.max(5, targetLevel + 8));
  if (fallback.length > 0) return fallback;

  return getEnemiesByLevelRange(1, Number.MAX_SAFE_INTEGER);
}

function selectEnemyIds(roomKind, encounterPool) {
  if (!Array.isArray(encounterPool) || encounterPool.length === 0) return [];
  if (roomKind === "treasure" || roomKind === "recovery") return [];

  if (roomKind === "boss") {
    const boss = [...encounterPool].sort((left, right) => right.level - left.level)[0];
    return boss ? [boss.id] : [];
  }

  const picks = roomKind === "elite" ? 2 : 1;
  const chosen = [];
  for (let index = 0; index < picks; index += 1) {
    const pick = randomChoice(encounterPool);
    if (!pick?.id) continue;
    chosen.push(pick.id);
  }
  return chosen;
}

function createRoomRewards(roomKind, enemyIds, difficulty, roomIndex) {
  const enemyRewardTotal = enemyIds.reduce(
    (totals, enemyId) => {
      const template = getEnemyTemplate(enemyId);
      return {
        xp: totals.xp + Math.max(0, toNumber(template?.xpReward, 0)),
        gold: totals.gold + Math.max(0, toNumber(template?.goldReward, 0)),
      };
    },
    { xp: 0, gold: 0 },
  );

  const roomNumber = roomIndex + 1;
  const difficultyBonus = Math.max(1, difficulty);
  const baseXp = roomNumber * 3 + difficultyBonus * 2;
  const baseGold = roomNumber * 2 + difficultyBonus;
  const kindMultiplier =
    roomKind === "boss"
      ? 2.4
      : roomKind === "elite"
        ? 1.6
        : roomKind === "treasure"
          ? 1.2
          : roomKind === "recovery"
            ? 0.7
            : 1;

  return {
    xp: Math.max(1, Math.ceil((baseXp + enemyRewardTotal.xp) * kindMultiplier)),
    gold: Math.max(1, Math.ceil((baseGold + enemyRewardTotal.gold) * kindMultiplier)),
    ...(roomKind === "boss" ? { soulpoints: 1 } : {}),
  };
}

function resolveRoomKind(roomIndex, roomCount) {
  if (roomIndex === roomCount - 1) return "boss";
  if (roomIndex === 0) return "combat";
  return randomChoice(ROOM_KIND_POOL) || "combat";
}

function buildDungeonRooms({ runId, roomCount, difficulty, targetLevel }) {
  const encounterPool = getEncounterPool(targetLevel);

  return Array.from({ length: roomCount }, (_, roomIndex) => {
    const kind = resolveRoomKind(roomIndex, roomCount);
    const enemyIds = selectEnemyIds(kind, encounterPool);
    const roomNumber = roomIndex + 1;

    return {
      id: `${runId}_room_${roomNumber}`,
      order: roomNumber,
      kind,
      title: `${kind.charAt(0).toUpperCase()}${kind.slice(1)} Room ${roomNumber}`,
      enemyIds,
      rewards: createRoomRewards(kind, enemyIds, difficulty, roomIndex),
      cleared: false,
    };
  });
}

function summarizeRun(activeRun) {
  return {
    runId: activeRun.runId,
    templateId: activeRun.templateId,
    difficulty: activeRun.difficulty,
    roomCount: activeRun.rooms.length,
    clearedRoomIds: [...activeRun.clearedRoomIds],
    completed: true,
  };
}

export function startDungeonRun(state, payload = {}) {
  const dungeon = getDungeonState(state);
  if (dungeon.activeRun) {
    return state;
  }

  const difficulty = resolveDifficulty(state, payload);
  const roomCount = resolveRoomCount(difficulty, payload);
  const runIndex = dungeon.completedRuns.length + 1;
  const runId = `dungeon_run_${runIndex}`;
  const targetLevel = Math.max(
    1,
    Math.floor((difficulty + Math.max(1, toNumber(state?.player?.level, 1))) / 2),
  );
  const activeRun = {
    runId,
    templateId:
      typeof payload.templateId === "string" && payload.templateId.trim()
        ? payload.templateId.trim()
        : DEFAULT_TEMPLATE_ID,
    difficulty,
    status: "active",
    currentRoomIndex: 0,
    clearedRoomIds: [],
    rooms: buildDungeonRooms({ runId, roomCount, difficulty, targetLevel }),
  };

  return {
    ...state,
    dungeon: {
      ...dungeon,
      activeRun,
    },
  };
}

export function completeCurrentDungeonRoom(state) {
  const dungeon = getDungeonState(state);
  const activeRun = dungeon.activeRun;
  if (!activeRun) {
    return state;
  }

  const room = activeRun.rooms[activeRun.currentRoomIndex];
  if (!room || room.cleared) {
    return state;
  }

  const rewardState = applyQuestRewards(state, room.rewards);
  const nextRooms = activeRun.rooms.map((entry, index) =>
    index === activeRun.currentRoomIndex ? { ...entry, cleared: true } : entry,
  );
  const nextClearedRoomIds = activeRun.clearedRoomIds.includes(room.id)
    ? activeRun.clearedRoomIds
    : [...activeRun.clearedRoomIds, room.id];

  return {
    ...rewardState,
    dungeon: {
      ...getDungeonState(rewardState),
      activeRun: {
        ...activeRun,
        rooms: nextRooms,
        clearedRoomIds: nextClearedRoomIds,
      },
    },
  };
}

export function advanceDungeonRoom(state) {
  const dungeon = getDungeonState(state);
  const activeRun = dungeon.activeRun;
  if (!activeRun) {
    return state;
  }

  const room = activeRun.rooms[activeRun.currentRoomIndex];
  if (!room?.cleared) {
    return state;
  }

  const isLastRoom = activeRun.currentRoomIndex >= activeRun.rooms.length - 1;
  if (isLastRoom) {
    return {
      ...state,
      dungeon: {
        activeRun: null,
        completedRuns: [...dungeon.completedRuns, summarizeRun(activeRun)],
      },
    };
  }

  return {
    ...state,
    dungeon: {
      ...dungeon,
      activeRun: {
        ...activeRun,
        currentRoomIndex: activeRun.currentRoomIndex + 1,
      },
    },
  };
}

export function abandonDungeonRun(state) {
  const dungeon = getDungeonState(state);
  if (!dungeon.activeRun) {
    return state;
  }

  return {
    ...state,
    dungeon: {
      ...dungeon,
      activeRun: null,
    },
  };
}