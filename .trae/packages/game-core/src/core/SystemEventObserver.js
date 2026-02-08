import { DataRegistry } from "../data/DataRegistry.js";
import { checkThreshold } from "../systems/leveling/LevelingManager.js";

/**
 * SystemEventObserver
 * Monitors state changes post-action to trigger deterministic follow-up logic.
 */
export const SystemEventObserver = {
  evaluate(prevState, nextState, dispatch) {
    if (!nextState || typeof dispatch !== "function") return;

    SystemEventObserver.checkQuestObjectives(prevState, nextState, dispatch);
    SystemEventObserver.checkLevelThresholds(prevState, nextState, dispatch);
    SystemEventObserver.checkInventoryAdditions(prevState, nextState, dispatch);
  },

  checkQuestObjectives(prevState, nextState, dispatch) {
    const activeQuests = nextState.quests?.active || [];
    for (const quest of activeQuests) {
      const meta = DataRegistry.getQuestById(quest.id);
      if (!meta?.autoComplete) continue;

      const existedPreviously = (prevState?.quests?.active || []).some(
        (q) => q.id === quest.id,
      );
      if (!existedPreviously) continue; // only evaluate quests that were already active

      const prevCompleted = SystemEventObserver.isQuestCompleted(
        meta.autoComplete,
        prevState,
      );
      const currCompleted = SystemEventObserver.isQuestCompleted(
        meta.autoComplete,
        nextState,
      );

      if (!prevCompleted && currCompleted) {
        SystemEventObserver.enqueueDispatch(
          {
            type: "COMPLETE_QUEST",
            payload: {
              questId: quest.id,
              reward: meta.rewards || null,
              questMeta: meta || null,
            },
          },
          dispatch,
        );
      }
    }
  },

  isQuestCompleted(autoComplete, state) {
    if (!state || !autoComplete) return false;

    const inventory = state.player?.inventory || [];
    const killsByEnemyId = state.player?.progress?.killsByEnemyId || {};
    const rawLocation = state.world?.location;
    const location =
      rawLocation && typeof rawLocation === "object" && !Array.isArray(rawLocation)
        ? rawLocation.current
        : rawLocation;

    const checks = [];

    if (autoComplete.requiresItem) {
      checks.push(
        inventory.some(
          (item) =>
            item.id === autoComplete.requiresItem && (item.quantity || 0) > 0,
        ),
      );
    }

    if (Array.isArray(autoComplete.requiresKills)) {
      checks.push(
        autoComplete.requiresKills.every(
          (enemyId) => (killsByEnemyId[enemyId] || 0) > 0,
        ),
      );
    }

    if (autoComplete.requiresLocation) {
      const current = typeof location === "string" ? location : "";
      const required =
        typeof autoComplete.requiresLocation === "string"
          ? autoComplete.requiresLocation
          : "";
      checks.push(current.toLowerCase() === required.toLowerCase());
    }

    return checks.length > 0 && checks.every(Boolean);
  },

  checkLevelThresholds(prevState, nextState, dispatch) {
    const prevXp = prevState?.player?.xp?.current ?? 0;
    const nextXp = nextState?.player?.xp?.current ?? 0;
    if (nextXp <= prevXp) return;

    const result = checkThreshold(nextState.player, nextState.config || {});
    if (result.leveledUp) {
      SystemEventObserver.enqueueDispatch(
        {
          type: "LEVEL_UP",
          payload: result.snapshot,
        },
        dispatch,
      );
    }
  },

  checkInventoryAdditions(prevState, nextState, dispatch) {
    const prevMap = SystemEventObserver.buildInventoryMap(prevState);
    const nextMap = SystemEventObserver.buildInventoryMap(nextState);

    const diffs = [];
    for (const [id, nextQty] of Object.entries(nextMap)) {
      const prevQty = prevMap[id] || 0;
      if (nextQty > prevQty) {
        diffs.push({ id, delta: nextQty - prevQty, type: "add" });
      } else if (nextQty < prevQty) {
        diffs.push({ id, delta: prevQty - nextQty, type: "remove" });
      }
    }

    if (diffs.length > 0) {
      SystemEventObserver.enqueueDispatch(
        {
          type: "SYNC_STATE",
          payload: nextState,
          meta: { inventoryDiffs: diffs },
        },
        dispatch,
      );
    }
  },

  buildInventoryMap(state) {
    const inventory = state?.player?.inventory || [];
    const map = {};
    for (const item of inventory) {
      if (!item?.id) continue;
      map[item.id] = (map[item.id] || 0) + (item.quantity || 1);
    }
    return map;
  },

  // Simple microtask-based batching to avoid dispatch floods
  pendingEvents: [],

  enqueueDispatch(action, dispatch) {
    SystemEventObserver.pendingEvents.push(action);
    if (SystemEventObserver.pendingEvents.length === 1) {
      queueMicrotask(() => {
        const batch = SystemEventObserver.pendingEvents.splice(0);
        batch.forEach(dispatch);
      });
    }
  },

  /**
   * Pure variant of evaluate() — returns events as data instead of dispatching.
   * Used by SystemEngine.step() so the engine stays adapter-agnostic.
   *
   * @param {object} prevState
   * @param {object} nextState
   * @param {number} tick - current engine tick
   * @returns {Array<{type: string, tick: number, payload?: unknown}>}
   */
  evaluateToEvents(prevState, nextState, tick = 0) {
    const events = [];
    if (!nextState) return events;

    // Check quest completions
    const activeQuests = nextState.quests?.active || [];
    for (const quest of activeQuests) {
      const meta = DataRegistry.getQuestById(quest.id);
      if (!meta?.autoComplete) continue;

      const existedPreviously = (prevState?.quests?.active || []).some(
        (q) => q.id === quest.id,
      );
      if (!existedPreviously) continue;

      const prevCompleted = SystemEventObserver.isQuestCompleted(
        meta.autoComplete,
        prevState,
      );
      const currCompleted = SystemEventObserver.isQuestCompleted(
        meta.autoComplete,
        nextState,
      );

      if (!prevCompleted && currCompleted) {
        events.push({
          type: "quest.complete",
          tick,
          payload: {
            questId: quest.id,
            reward: meta.rewards || null,
            questMeta: meta || null,
          },
        });
      }
    }

    // Check level thresholds
    const prevXp = prevState?.player?.xp?.current ?? 0;
    const nextXp = nextState?.player?.xp?.current ?? 0;
    if (nextXp > prevXp) {
      const result = checkThreshold(nextState.player, nextState.config || {});
      if (result.leveledUp) {
        events.push({
          type: "player.levelUp",
          tick,
          payload: result.snapshot,
        });
      }
    }

    // Check inventory additions
    const prevMap = SystemEventObserver.buildInventoryMap(prevState);
    const nextMap = SystemEventObserver.buildInventoryMap(nextState);
    const diffs = [];
    for (const [id, nextQty] of Object.entries(nextMap)) {
      const prevQty = prevMap[id] || 0;
      if (nextQty > prevQty) {
        diffs.push({ id, delta: nextQty - prevQty, type: "add" });
      } else if (nextQty < prevQty) {
        diffs.push({ id, delta: prevQty - nextQty, type: "remove" });
      }
    }
    if (diffs.length > 0) {
      events.push({
        type: "inventory.changed",
        tick,
        payload: { diffs },
      });
    }

    return events;
  },
};

