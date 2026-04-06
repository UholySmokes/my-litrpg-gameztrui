export const CHARACTER_CREATION_DRAFT_KEY = "characterCreationDraft:v1";

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getSessionStorageRef = (storageRef) => {
  if (storageRef) return storageRef;
  if (typeof globalThis === "undefined") return null;
  return globalThis.sessionStorage ?? null;
};

const safeParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const readCharacterCreationDraft = (sessionStorageRef = null) => {
  const storage = getSessionStorageRef(sessionStorageRef);
  if (!storage) return null;

  try {
    const raw = storage.getItem(CHARACTER_CREATION_DRAFT_KEY);
    const parsed = safeParseJson(raw);
    return isRecord(parsed) && parsed.started ? parsed : null;
  } catch {
    return null;
  }
};

export const hasCharacterCreationDraft = (sessionStorageRef = null) =>
  Boolean(readCharacterCreationDraft(sessionStorageRef));

export const persistCharacterCreationDraft = (
  draft,
  sessionStorageRef = null,
) => {
  const storage = getSessionStorageRef(sessionStorageRef);
  if (!storage || !isRecord(draft)) return false;

  try {
    storage.setItem(CHARACTER_CREATION_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
};

export const patchCharacterCreationDraft = (
  patch,
  sessionStorageRef = null,
) => {
  const current = readCharacterCreationDraft(sessionStorageRef) || { started: true };
  return persistCharacterCreationDraft({ ...current, ...patch }, sessionStorageRef);
};

export const clearCharacterCreationDraft = (sessionStorageRef = null) => {
  const storage = getSessionStorageRef(sessionStorageRef);
  if (!storage) return false;

  try {
    storage.removeItem(CHARACTER_CREATION_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
};