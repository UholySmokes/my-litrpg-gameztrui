import saveCutover from "../../../shared/save-cutover.cjs";

const { SAVE_RESET_EPOCH } = saveCutover;

export { SAVE_RESET_EPOCH };

export const DEFAULT_SAVE_RESET_STATE = Object.freeze({
  ready: false,
  busy: true,
  error: "",
  mode: "pending",
});

export const isAuthenticatedGameplayUser = (user) =>
  Boolean(user?.id && user.id !== "local");

export const createLocalReadySaveResetState = () => ({
  ready: true,
  busy: false,
  error: "",
  mode: "local",
});

export const createRemoteBusySaveResetState = () => ({
  ready: false,
  busy: true,
  error: "",
  mode: "remote",
});

export const createRemoteReadySaveResetState = () => ({
  ready: true,
  busy: false,
  error: "",
  mode: "remote",
});

export const createRemoteErrorSaveResetState = (error = "") => ({
  ready: false,
  busy: false,
  error: error || "Legacy progress reset failed.",
  mode: "remote",
});

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
    return createRemoteErrorSaveResetState(result?.error);
  }

  clearLegacyLocalProgressFn({ resetEpoch: saveResetEpoch });
  return createRemoteReadySaveResetState();
}
