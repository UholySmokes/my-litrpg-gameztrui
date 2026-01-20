import { useReducer, useEffect, useRef } from "react";
import { gameReducer } from "../core/gameReducer.js";
import { initialGameState } from "../data/initialState.js";
import { SystemEventObserver } from "../core/SystemEventObserver.js";

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const prevStateRef = useRef(state);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevStateRef.current = state;
      return;
    }

    SystemEventObserver.evaluate(prevStateRef.current, state, dispatch);
    prevStateRef.current = state;
  }, [state, dispatch]);

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

  return {
    state,
    dispatch,
    dispatchSystemEvent: dispatch,
    chatLog: state.chatLog || [],
    addSystemMessage,
    setState,
    evaluateQuestProgress,
  };
}
