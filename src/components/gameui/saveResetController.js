import * as saveCutover from "../../../shared/save-cutover.js";

const { SAVE_RESET_EPOCH } = saveCutover;

export { SAVE_RESET_EPOCH };

export const DEFAULT_SAVE_RESET_STATE = Object.freeze({
  ready: false,
  busy: true,
  error: "",
  mode: "pending",
  recoverable: false,
});

export const isAuthenticatedGameplayUser = (user) =>
  Boolean(user?.id && user.id !== "local" && user?.provider !== "dev");

export const createLocalReadySaveResetState = () => ({
  ready: true,
  busy: false,
  error: "",
  mode: "local",
  recoverable: false,
});

export const createRemoteBusySaveResetState = () => ({
  ready: false,
  busy: true,
  error: "",
  mode: "remote",
  recoverable: false,
});

export const createRemoteReadySaveResetState = () => ({
  ready: true,
  busy: false,
  error: "",
  mode: "remote",
  recoverable: false,
});

export const createRemoteErrorSaveResetState = (error = "") => ({
  ready: false,
  busy: false,
  error: error || "Legacy progress reset failed.",
  mode: "remote",
  recoverable: false,
});

export const createRecoverableLocalSaveResetState = (error = "") => ({
  ready: true,
  busy: false,
  error: error || "",
  mode: "recoverable-local",
  recoverable: true,
});

export const isRecoverableLocalSyncFailure = (result) => {
  if (!result || result.success) return false;
  const message = String(result?.error || "").toLowerCase();
  if (!message) return false;

  return (
    message.includes("sync-db.json.tmp") ||
    (message.includes("sync-db.json") && message.includes("enoent")) ||
    (message.includes("copyfile") && message.includes("sync-db.json")) ||
    (message.includes("rename") && message.includes("sync-db.json"))
  );
};

export const clearLegacyProgressIfNeeded = ({
  readAppliedResetEpochFn,
  clearLegacyLocalProgressFn,
  saveResetEpoch = SAVE_RESET_EPOCH,
}) => {
  const appliedEpoch = readAppliedResetEpochFn();
  if (appliedEpoch >= saveResetEpoch) return false;

  clearLegacyLocalProgressFn({ resetEpoch: saveResetEpoch });
  return true;
};

export async function runSaveResetFlow({
  user,
  saveResetEpoch = SAVE_RESET_EPOCH,
  readAppliedResetEpochFn,
  clearLegacyLocalProgressFn,
  resetLegacyProgressFn,
}) {
  clearLegacyProgressIfNeeded({
    readAppliedResetEpochFn,
    clearLegacyLocalProgressFn,
    saveResetEpoch,
  });

  if (!isAuthenticatedGameplayUser(user)) {
    return createLocalReadySaveResetState();
  }

  const result = await resetLegacyProgressFn();
  if (!result?.success) {
    if (isRecoverableLocalSyncFailure(result)) {
      return createRecoverableLocalSaveResetState(result?.error);
    }
    return createRemoteErrorSaveResetState(result?.error);
  }

  clearLegacyLocalProgressFn({ resetEpoch: saveResetEpoch });
  return createRemoteReadySaveResetState();
}
