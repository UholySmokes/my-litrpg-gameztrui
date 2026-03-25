import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { gameReducer } from "../core/gameReducer.js";
import { initialGameState } from "../data/initialState.js";
import { SystemEventObserver } from "../core/SystemEventObserver.js";
import { emit } from "../core/EventBus.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { serializeEvent } from "../simulation/logging/CombatLogSerializer.ts";
import { createSystemEngine } from "../core/createSystemEngine.js";

const resolveEngineSeed = (gameState) => {
  const worldSeed = gameState?.world?.vars?.worldSeed ?? gameState?.world?.seed;
  const numericSeed = Number(worldSeed);
  return Number.isFinite(numericSeed) ? numericSeed : 1;
};

const resolveEngineTick = (gameState) => {
  const rawTick = gameState?.tick ?? gameState?.world?.turnCount;
  const numericTick = Number(rawTick);
  return Number.isFinite(numericTick) && numericTick >= 0 ? Math.floor(numericTick) : 0;
};

const resolveEngineConfig = (gameState) => ({
  mode: "client",
  seed: resolveEngineSeed(gameState),
  contentVersion: gameState?.contentVersion ?? "core@0.1.0",
  stateVersion: gameState?.stateVersion ?? 1,
});

const createEngineForState = (gameState) => {
  const config = resolveEngineConfig(gameState);
  SimBridge.initialize(config.seed);
  SimBridge.currentTick = resolveEngineTick(gameState);
  return createSystemEngine(config);
};

const cloneInitialState = () => {
  if (typeof structuredClone === "function") {
    return structuredClone(initialGameState);
  }
  return JSON.parse(JSON.stringify(initialGameState));
};

const rootReducer = (state, action) => {
  if (action.type === 'RESET_GAME_STATE') {
    return cloneInitialState();
  }
  return gameReducer(state, action);
};

export function useGameEngine() {
  const [state, dispatch] = useReducer(rootReducer, undefined, cloneInitialState);
  const [engine, setEngine] = useState(() => createEngineForState(initialGameState));
  const prevStateRef = useRef(state);
  const isInitialRender = useRef(true);
  const stateRef = useRef(state);
  const suppressObserverRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevStateRef.current = state;
      return;
    }

    if (suppressObserverRef.current) {
      suppressObserverRef.current = false;
      prevStateRef.current = state;
      return;
    }

    SystemEventObserver.evaluate(prevStateRef.current, state, dispatch);
    prevStateRef.current = state;
  }, [state, dispatch]);

  useEffect(() => {
    const resolveEntityName = (entityId) => {
      if (!entityId) return "Unknown";
      const currentState = stateRef.current;
      if (!currentState) return entityId;

      if (entityId === "player") {
        return currentState.player?.name || "Player";
      }

      if (entityId.startsWith("enemy_")) {
        const [, rawIndex] = entityId.split("_");
        const index = Number.parseInt(rawIndex, 10);
        const enemyName = currentState.combat?.enemies?.[index]?.name;
        return (
          enemyName || `Enemy ${Number.isFinite(index) ? index + 1 : entityId}`
        );
      }

      return entityId;
    };

    const unsubscribe = SimBridge.subscribeToEvents((event) => {
      const entry = serializeEvent(event, {
        resolveName: resolveEntityName,
      });
      dispatch({
        type: "APPEND_SIMULATION_LOG",
        payload: { entries: [entry] },
      });
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [dispatch]);

  const addSystemMessage = (message, type = "system") => {
    dispatch({
      type: "ADD_SYSTEM_MESSAGE",
      payload: { message, type },
    });
    emit("system:log", {
      type: "system:message",
      data: {
        message,
        messageType: type,
      },
    });
  };

  const setState = (nextStateOrUpdater) =>
    dispatch({
      type: "SET_STATE",
      payload: nextStateOrUpdater,
    });

  const loadState = useCallback((nextState) => {
    if (!nextState || typeof nextState !== "object") return;
    suppressObserverRef.current = true;
    setEngine(createEngineForState(nextState));
    dispatch({
      type: "SET_STATE",
      payload: nextState,
    });
  }, []);

  const evaluateQuestProgress = (nextState) => {
    const resolvedNext = nextState ?? state;
    SystemEventObserver.checkQuestObjectives(state, resolvedNext, dispatch);
  };

  /**
   * Submit a player action through the SystemEngine pipeline.
   * Tier 1: gameplay inputs go through engine.step() → APPLY_ENGINE_RESULT.
   *
   * @param {{ kind: "text", text: string } | { kind: "action", action: object }} input
   * @returns {object} StepResult
   */
  const submitAction = useCallback(
    (input) => {
      const result = engine.step(input, stateRef.current);
      if (result.ok) {
        dispatch({ type: "APPLY_ENGINE_RESULT", payload: result });
      }
      return result;
    },
    [engine],
  );

  return {
    state,
    dispatch,
    dispatchSystemEvent: dispatch,
    chatLog: state.chatLog || [],
    addSystemMessage,
    setState,
    loadState,
    evaluateQuestProgress,
    /** SystemEngine instance for direct access. */
    engine,
    /** Submit a player action through the engine pipeline. */
    submitAction,
  };
}
