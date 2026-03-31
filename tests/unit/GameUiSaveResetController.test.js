import { describe, expect, jest, test } from "@jest/globals";
import {
  SAVE_RESET_EPOCH,
  isAuthenticatedGameplayUser,
  runSaveResetFlow,
} from "../../src/components/gameui/saveResetController.js";

describe("GameUI save reset controller", () => {
  test("treats local users as unauthenticated for save reset flow", async () => {
    const clearLegacyLocalProgressFn = jest.fn();
    const resetLegacyProgressFn = jest.fn();

    const nextState = await runSaveResetFlow({
      user: { id: "local" },
      readAppliedResetEpochFn: () => SAVE_RESET_EPOCH - 1,
      clearLegacyLocalProgressFn,
      resetLegacyProgressFn,
    });

    expect(isAuthenticatedGameplayUser({ id: "local" })).toBe(false);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledWith({
      resetEpoch: SAVE_RESET_EPOCH,
    });
    expect(resetLegacyProgressFn).not.toHaveBeenCalled();
    expect(nextState).toEqual({
      ready: true,
      busy: false,
      error: "",
      mode: "local",
      recoverable: false,
    });
  });

  test("returns remote ready state after synced reset succeeds", async () => {
    const clearLegacyLocalProgressFn = jest.fn();
    const resetLegacyProgressFn = jest.fn().mockResolvedValue({ success: true });

    const nextState = await runSaveResetFlow({
      user: { id: "player-123" },
      readAppliedResetEpochFn: () => SAVE_RESET_EPOCH,
      clearLegacyLocalProgressFn,
      resetLegacyProgressFn,
    });

    expect(resetLegacyProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledWith({
      resetEpoch: SAVE_RESET_EPOCH,
    });
    expect(nextState).toEqual({
      ready: true,
      busy: false,
      error: "",
      mode: "remote",
      recoverable: false,
    });
  });

  test("returns remote error state after synced reset failure", async () => {
    const clearLegacyLocalProgressFn = jest.fn();
    const resetLegacyProgressFn = jest
      .fn()
      .mockResolvedValue({ success: false, error: "sync down" });

    const nextState = await runSaveResetFlow({
      user: { id: "player-123" },
      readAppliedResetEpochFn: () => SAVE_RESET_EPOCH - 1,
      clearLegacyLocalProgressFn,
      resetLegacyProgressFn,
    });

    expect(resetLegacyProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledWith({
      resetEpoch: SAVE_RESET_EPOCH,
    });
    expect(nextState).toEqual({
      ready: false,
      busy: false,
      error: "sync down",
      mode: "remote",
      recoverable: false,
    });
  });

  test("falls back to recoverable local mode for transient sync db temp-file failures", async () => {
    const clearLegacyLocalProgressFn = jest.fn();
    const resetLegacyProgressFn = jest.fn().mockResolvedValue({
      success: false,
      error:
        "ENOENT: no such file or directory, copyfile 'C:\\temp\\sync-db.json.tmp' -> 'C:\\temp\\sync-db.json'",
    });

    const nextState = await runSaveResetFlow({
      user: { id: "player-123" },
      readAppliedResetEpochFn: () => SAVE_RESET_EPOCH - 1,
      clearLegacyLocalProgressFn,
      resetLegacyProgressFn,
    });

    expect(resetLegacyProgressFn).toHaveBeenCalledTimes(1);
    expect(clearLegacyLocalProgressFn).toHaveBeenCalledTimes(1);
    expect(nextState).toEqual({
      ready: true,
      busy: false,
      error:
        "ENOENT: no such file or directory, copyfile 'C:\\temp\\sync-db.json.tmp' -> 'C:\\temp\\sync-db.json'",
      mode: "recoverable-local",
      recoverable: true,
    });
  });
});
