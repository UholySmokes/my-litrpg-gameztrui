import { useReducer, useEffect, useRef, useCallback } from "react";
import { gameReducer } from "../core/gameReducer.js";
import { initialGameState } from "../data/initialState.js";
import { SystemEventObserver } from "../core/SystemEventObserver.js";
import { SimBridge } from "../simulation/bridge/SimulationContext.js";
import { serializeEvent } from "../simulation/logging/CombatLogSerializer.ts";
import { createSystemEngine } from "../core/createSystemEngine.js";

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const prevStateRef = useRef(state);
  const isInitialRender = useRef(true);
  const stateRef = useRef(state);

  // Create engine once — singleton guard inside createSystemEngine prevents
  // SimBridge re-initialization on re-renders.
  const engineRef = useRef(null);
  if (!engineRef.current) {
    engineRef.current = createSystemEngine({
      mode: "client",
      seed: initialGameState.world?.seed ?? 1,
      contentVersion: initialGameState.contentVersion ?? "core@0.1.0",
      stateVersion: initialGameState.stateVersion ?? 1,
    });
  }
  const engine = engineRef.current;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
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
  };

  const setState = (nextStateOrUpdater) =>
    dispatch({
      type: "SET_STATE",
      payload: nextStateOrUpdater,
    });

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
    evaluateQuestProgress,
    /** SystemEngine instance for direct access. */
    engine,
    /** Submit a player action through the engine pipeline. */
    submitAction,
  };
}
