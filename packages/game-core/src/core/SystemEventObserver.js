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
    SystemEventObserver.checkAmbientShift(prevState, nextState, dispatch);
  },

  checkAmbientShift(prevState, nextState, dispatch) {
    const event = SystemEventObserver.getAmbientShiftEvent(prevState, nextState, 0);
    if (!event?.payload?.message) return;
    SystemEventObserver.enqueueDispatch(
      {
        type: "ADD_SYSTEM_MESSAGE",
        payload: { message: event.payload.message, type: "system" },
      },
      dispatch,
    );
  },

  getAmbientShiftEvent(prevState, nextState, tick = 0) {
    const prevAmbient = prevState?.world?.essence?.ambient;
    const nextAmbient = nextState?.world?.essence?.ambient;

    const isSnapshot = (a) =>
      a &&
      typeof a === "object" &&
      !Array.isArray(a) &&
      a.compositionByEssence &&
      typeof a.compositionByEssence === "object" &&
      a.global &&
      typeof a.global === "object";

    if (!isSnapshot(prevAmbient) || !isSnapshot(nextAmbient)) return null;

    const prevProv = prevAmbient.provenance || {};
    const nextProv = nextAmbient.provenance || {};

    const normList = (v) =>
      Array.isArray(v)
        ? v.map((x) => String(x).trim().toLowerCase()).filter(Boolean).sort()
        : [];
    const sameList = (a, b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    const prevAnoms = normList(prevProv.anomalyIds);
    const nextAnoms = normList(nextProv.anomalyIds);
    const prevSources = normList(prevProv.sourceIds);
    const nextSources = normList(nextProv.sourceIds);

    const weatherChanged =
      String(prevProv.weatherType || "") !== String(nextProv.weatherType || "") ||
      Math.abs(Number(prevProv.weatherIntensity || 0) - Number(nextProv.weatherIntensity || 0)) >= 0.25;
    const timeChanged = String(prevProv.timeOfDay || "") !== String(nextProv.timeOfDay || "");
    const anomalyChanged = !sameList(prevAnoms, nextAnoms);
    const sourcesChanged = !sameList(prevSources, nextSources);

    const globalKeys = [
      "drawMultByEssence",
      "refineYieldMultByEssence",
      "compressRiskMultByEssence",
      "potencyMultByEssence",
      "contaminationRiskMultByEssence",
    ];

    const maxAbsDelta = (mapKey) => {
      const prevMap = prevAmbient.global?.[mapKey] || {};
      const nextMap = nextAmbient.global?.[mapKey] || {};
      const keys = new Set([
        ...Object.keys(prevMap || {}),
        ...Object.keys(nextMap || {}),
      ]);
      let max = 0;
      keys.forEach((k) => {
        const a = Number(prevMap?.[k] ?? 1);
        const b = Number(nextMap?.[k] ?? 1);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        max = Math.max(max, Math.abs(a - b));
      });
      return max;
    };

    const maxDrawDelta = maxAbsDelta("drawMultByEssence");
    const maxRefineDelta = maxAbsDelta("refineYieldMultByEssence");
    const maxCompressDelta = maxAbsDelta("compressRiskMultByEssence");
    const maxContamDelta = maxAbsDelta("contaminationRiskMultByEssence");
    const maxPotencyDelta = maxAbsDelta("potencyMultByEssence");

    const numericChanged =
      maxDrawDelta >= 0.05 ||
      maxRefineDelta >= 0.04 ||
      maxCompressDelta >= 0.06 ||
      maxContamDelta >= 0.06 ||
      maxPotencyDelta >= 0.05;

    if (!(weatherChanged || timeChanged || anomalyChanged || sourcesChanged || numericChanged)) {
      return null;
    }

    const parts = [];
    if (nextProv.timeOfDay) parts.push(`Time: ${nextProv.timeOfDay}`);
    if (nextProv.weatherType) {
      const intensity = Number.isFinite(nextProv.weatherIntensity)
        ? ` (${Number(nextProv.weatherIntensity).toFixed(2)})`
        : "";
      parts.push(`Weather: ${nextProv.weatherType}${intensity}`);
    }
    if (nextAnoms.length) parts.push(`Anomalies: ${nextAnoms.join(", ")}`);
    if (nextSources.length) parts.push(`Sources: ${nextSources.join(", ")}`);

    const topNotables = [];
    const collectNotables = (mapKey, label, threshold) => {
      const map = nextAmbient.global?.[mapKey] || {};
      Object.entries(map).forEach(([essence, mult]) => {
        const m = Number(mult);
        if (!Number.isFinite(m)) return;
        if (Math.abs(m - 1) < threshold) return;
        topNotables.push({ w: Math.abs(m - 1), text: `${label} ${essence} x${m.toFixed(2)}` });
      });
    };
    collectNotables("drawMultByEssence", "draw", 0.05);
    collectNotables("compressRiskMultByEssence", "compress", 0.07);
    collectNotables("contaminationRiskMultByEssence", "taint", 0.07);
    collectNotables("potencyMultByEssence", "potency", 0.06);
    topNotables.sort((a, b) => b.w - a.w);
    const notableLine = topNotables.length
      ? ` Notable: ${topNotables.slice(0, 3).map((n) => n.text).join("; ")}.`
      : "";

    const message = `Ambient shifts. ${parts.join(" | ")}.${notableLine}`;
    return { type: "world.ambientShift", tick, payload: { message } };
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

    if (autoComplete.requiresMagicPattern) {
      const req = autoComplete.requiresMagicPattern;
      const rawKind = typeof req === "object" && req ? req.kind : null;
      const rawId = typeof req === "object" && req ? req.id : typeof req === "string" ? req : null;
      const kind = typeof rawKind === "string" ? rawKind.trim().toLowerCase() : "weave";
      const id = typeof rawId === "string" ? rawId.trim().toLowerCase() : "";
      const unlocked = state.player?.magic?.unlockedPatterns;
      const list = unlocked && typeof unlocked === "object" ? unlocked[kind] : null;
      const has = Array.isArray(list)
        ? list.map((p) => String(p).trim().toLowerCase()).includes(id)
        : false;
      checks.push(Boolean(id) && has);
    }

    if (autoComplete.requiresEssenceSource) {
      const id = typeof autoComplete.requiresEssenceSource === "string"
        ? autoComplete.requiresEssenceSource.trim().toLowerCase()
        : "";
      const sources = state.world?.essence?.sources;
      const has = Array.isArray(sources)
        ? sources.some((s) => {
            if (typeof s === "string") return s.trim().toLowerCase() === id;
            if (s && typeof s === "object" && !Array.isArray(s)) {
              return typeof s.id === "string" && s.id.trim().toLowerCase() === id;
            }
            return false;
          })
        : false;
      checks.push(Boolean(id) && has);
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

    {
      const ambientEvent = SystemEventObserver.getAmbientShiftEvent(
        prevState,
        nextState,
        tick,
      );
      if (ambientEvent) events.push(ambientEvent);
    }

    return events;
  },
};

