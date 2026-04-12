import { SKILL_CATALOG_VERSION } from "@voidverse/game-core";

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
    if (!isRecord(parsed) || !parsed.started) return null;
    const topLevelVersion =
      typeof parsed.skillCatalogVersion === "string"
        ? parsed.skillCatalogVersion.trim()
        : "";
    const blueprintVersion =
      typeof parsed.characterCreationBlueprint?.skillCatalogVersion === "string"
        ? parsed.characterCreationBlueprint.skillCatalogVersion.trim()
        : "";
    return topLevelVersion === SKILL_CATALOG_VERSION ||
        blueprintVersion === SKILL_CATALOG_VERSION
      ? parsed
      : null;
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
  const current = readCharacterCreationDraft(sessionStorageRef) || {
    started: true,
    skillCatalogVersion: SKILL_CATALOG_VERSION,
  };
  return persistCharacterCreationDraft(
    { ...current, ...patch, skillCatalogVersion: SKILL_CATALOG_VERSION },
    sessionStorageRef,
  );
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
