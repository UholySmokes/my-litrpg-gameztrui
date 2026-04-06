import {
  evaluateCharacterReadiness,
  hasCharacterIdentitySnapshot,
  hasReadyCharacterSnapshot,
} from "./characterReadiness.js";

export const LOCAL_AUTOSAVE_KEY = "localAutosave:v1";
export const LOCAL_SAVE_KEY = "localSaves:v1";
export const AUTOSAVE_PROMPT_DISMISS_KEY = "autosavePromptDismissed:v1";
export const SAVE_RESET_MARKER_KEY = "saveResetEpochApplied:v1";

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getStorageRef = (storageRef) => {
  if (storageRef) return storageRef;
  if (typeof globalThis === "undefined") return null;
  return globalThis.localStorage ?? null;
};

const getSessionStorageRef = (storageRef) => {
  if (storageRef) return storageRef;
  if (typeof globalThis === "undefined") return null;
  return globalThis.sessionStorage ?? null;
};

export { evaluateCharacterReadiness, hasCharacterIdentitySnapshot };

export const hasCreatedCharacterSnapshot = (snapshotState) =>
  hasReadyCharacterSnapshot(snapshotState);

export const getAutosavePromptMarker = (autosaveRecord) =>
  String(
    autosaveRecord?.updated_at || autosaveRecord?.created_at || autosaveRecord?.id || "",
  );

export const rememberAutosavePromptDismissal = (
  autosaveRecord,
  sessionStorageRef = null,
) => {
  const storage = getSessionStorageRef(sessionStorageRef);
  if (!storage) return false;

  const marker = getAutosavePromptMarker(autosaveRecord);
  if (!marker) return false;

  try {
    storage.setItem(AUTOSAVE_PROMPT_DISMISS_KEY, marker);
    return true;
  } catch {
    return false;
  }
};

export const readAutosavePromptCandidate = ({
  localStorageRef = null,
  sessionStorageRef = null,
} = {}) => {
  const localStorage = getStorageRef(localStorageRef);
  const sessionStorage = getSessionStorageRef(sessionStorageRef);
  if (!localStorage) return null;

  const rawAutosave = localStorage.getItem(LOCAL_AUTOSAVE_KEY);
  if (!rawAutosave) return null;

  const parsedAutosave = safeParseJson(rawAutosave);
  if (!isRecord(parsedAutosave)) return null;
  if (!hasCreatedCharacterSnapshot(parsedAutosave.game_state)) return null;

  const marker = getAutosavePromptMarker(parsedAutosave);
  const dismissedMarker = sessionStorage?.getItem(AUTOSAVE_PROMPT_DISMISS_KEY);
  if (marker && dismissedMarker === marker) return null;

  return parsedAutosave;
};

export const readAppliedResetEpoch = (localStorageRef = null) => {
  const localStorage = getStorageRef(localStorageRef);
  if (!localStorage) return 0;

  try {
    return Number(localStorage.getItem(SAVE_RESET_MARKER_KEY) || 0) || 0;
  } catch {
    return 0;
  }
};

export const clearLegacyLocalProgress = ({
  localStorageRef = null,
  sessionStorageRef = null,
  resetEpoch,
} = {}) => {
  const localStorage = getStorageRef(localStorageRef);
  const sessionStorage = getSessionStorageRef(sessionStorageRef);
  if (!localStorage) return false;

  try {
    localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
    localStorage.removeItem(LOCAL_SAVE_KEY);
    if (typeof resetEpoch !== "undefined") {
      localStorage.setItem(SAVE_RESET_MARKER_KEY, String(resetEpoch));
    }
  } catch {
    return false;
  }

  try {
    sessionStorage?.removeItem(AUTOSAVE_PROMPT_DISMISS_KEY);
  } catch {
    return false;
  }

  return true;
};

export const persistLocalAutosaveSnapshot = ({
  snapshotState,
  saveName = "Autosave",
  ready = true,
  userId = "unknown",
  localStorageRef = null,
} = {}) => {
  if (!ready || !snapshotState) return false;

  const localStorage = getStorageRef(localStorageRef);
  if (!localStorage) return false;

  try {
    const { previousState: _previousState, ...stateToSave } = snapshotState;
    const timestamp = new Date().toISOString();
    localStorage.setItem(
      LOCAL_AUTOSAVE_KEY,
      JSON.stringify({
        id: "autosave",
        save_name: saveName,
        created_at: timestamp,
        updated_at: timestamp,
        user_id: userId,
        game_state: stateToSave,
      }),
    );
    return true;
  } catch {
    return false;
  }
};
