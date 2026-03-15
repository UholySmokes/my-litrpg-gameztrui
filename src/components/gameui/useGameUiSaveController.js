import { useCallback, useEffect, useRef, useState } from "react";
import { resetLegacyProgress } from "../../core/CloudSaveService.js";
import {
  clearLegacyLocalProgress,
  persistLocalAutosaveSnapshot,
  readAppliedResetEpoch,
} from "./autosaveResume.js";
import {
  DEFAULT_SAVE_RESET_STATE,
  createRemoteBusySaveResetState,
  isAuthenticatedGameplayUser,
  runSaveResetFlow,
} from "./saveResetController.js";

const AUTOSAVE_DEBOUNCE_MS = 2000;

export function useGameUiSaveController({ state, user }) {
  const autosaveTimerRef = useRef(null);
  const [saveResetAttempt, setSaveResetAttempt] = useState(0);
  const [saveResetState, setSaveResetState] = useState(DEFAULT_SAVE_RESET_STATE);
  const userId = user?.id || null;

  const persistLocalAutosave = useCallback(
    (snapshotState, saveName = "Autosave") => {
      const success = persistLocalAutosaveSnapshot({
        snapshotState,
        saveName,
        ready: saveResetState.ready,
        userId: userId || "unknown",
      });
      if (!success && saveResetState.ready && snapshotState) {
        console.warn(`${saveName} failed.`);
      }
    },
    [saveResetState.ready, userId],
  );

  const retrySaveReset = useCallback(() => {
    setSaveResetAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensureSaveCutover = async () => {
      const nextUser = userId ? { id: userId } : null;
      if (isAuthenticatedGameplayUser(nextUser) && !cancelled) {
        setSaveResetState(createRemoteBusySaveResetState());
      }

      const nextState = await runSaveResetFlow({
        user: nextUser,
        readAppliedResetEpochFn: readAppliedResetEpoch,
        clearLegacyLocalProgressFn: clearLegacyLocalProgress,
        resetLegacyProgressFn: resetLegacyProgress,
      });

      if (!cancelled) {
        setSaveResetState(nextState);
      }
    };

    ensureSaveCutover();
    return () => {
      cancelled = true;
    };
  }, [saveResetAttempt, userId]);

  useEffect(() => {
    if (!saveResetState.ready || !state) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      persistLocalAutosave(state, "Autosave");
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [persistLocalAutosave, saveResetState.ready, state]);

  return {
    persistLocalAutosave,
    retrySaveReset,
    saveResetAttempt,
    saveResetState,
  };
}
