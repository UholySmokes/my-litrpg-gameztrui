import { describe, expect, it } from "@jest/globals";
import {
  AUTOSAVE_PROMPT_DISMISS_KEY,
  LOCAL_AUTOSAVE_KEY,
  LOCAL_SAVE_KEY,
  SAVE_RESET_MARKER_KEY,
  clearLegacyLocalProgress,
  getAutosavePromptMarker,
  persistLocalAutosaveSnapshot,
  readAppliedResetEpoch,
  readAutosavePromptCandidate,
  rememberAutosavePromptDismissal,
} from "../../src/components/gameui/autosaveResume.js";

function createStorage(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

describe("GameUI autosave helpers", () => {
  it("reads a resumable autosave candidate when a character snapshot exists", () => {
    const localStorageRef = createStorage({
      [LOCAL_AUTOSAVE_KEY]: JSON.stringify({
        id: "autosave",
        updated_at: "2026-03-10T01:00:00.000Z",
        game_state: {
          player: {
            class: "mage",
          },
        },
      }),
    });

    const candidate = readAutosavePromptCandidate({
      localStorageRef,
      sessionStorageRef: createStorage(),
    });

    expect(candidate?.id).toBe("autosave");
    expect(getAutosavePromptMarker(candidate)).toBe("2026-03-10T01:00:00.000Z");
  });

  it("hides a dismissed autosave candidate", () => {
    const autosaveRecord = {
      id: "autosave",
      updated_at: "2026-03-10T01:00:00.000Z",
      game_state: {
        player: {
          class: "mage",
        },
      },
    };
    const localStorageRef = createStorage({
      [LOCAL_AUTOSAVE_KEY]: JSON.stringify(autosaveRecord),
    });
    const sessionStorageRef = createStorage();

    rememberAutosavePromptDismissal(autosaveRecord, sessionStorageRef);

    const candidate = readAutosavePromptCandidate({
      localStorageRef,
      sessionStorageRef,
    });

    expect(candidate).toBeNull();
    expect(sessionStorageRef.getItem(AUTOSAVE_PROMPT_DISMISS_KEY)).toBe(
      "2026-03-10T01:00:00.000Z",
    );
  });

  it("clears legacy save keys and stores the applied reset epoch", () => {
    const localStorageRef = createStorage({
      [LOCAL_AUTOSAVE_KEY]: "{}",
      [LOCAL_SAVE_KEY]: "{}",
    });
    const sessionStorageRef = createStorage({
      [AUTOSAVE_PROMPT_DISMISS_KEY]: "dismissed",
    });

    const success = clearLegacyLocalProgress({
      localStorageRef,
      sessionStorageRef,
      resetEpoch: 7,
    });

    expect(success).toBe(true);
    expect(localStorageRef.getItem(LOCAL_AUTOSAVE_KEY)).toBeNull();
    expect(localStorageRef.getItem(LOCAL_SAVE_KEY)).toBeNull();
    expect(readAppliedResetEpoch(localStorageRef)).toBe(7);
    expect(localStorageRef.getItem(SAVE_RESET_MARKER_KEY)).toBe("7");
    expect(sessionStorageRef.getItem(AUTOSAVE_PROMPT_DISMISS_KEY)).toBeNull();
  });

  it("persists autosaves without previousState baggage", () => {
    const localStorageRef = createStorage();
    const success = persistLocalAutosaveSnapshot({
      localStorageRef,
      ready: true,
      userId: "player-7",
      saveName: "Checkpoint",
      snapshotState: {
        previousState: { expensive: true },
        player: { class: "rogue" },
      },
    });

    expect(success).toBe(true);
    const saved = JSON.parse(localStorageRef.getItem(LOCAL_AUTOSAVE_KEY));
    expect(saved.user_id).toBe("player-7");
    expect(saved.save_name).toBe("Checkpoint");
    expect(saved.game_state.previousState).toBeUndefined();
    expect(saved.game_state.player.class).toBe("rogue");
  });
});
