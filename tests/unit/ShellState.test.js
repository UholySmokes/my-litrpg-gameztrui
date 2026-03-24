import { describe, expect, it } from "@jest/globals";
import {
  buildPlayerIdentity,
  clearLegacyShellState,
} from "../../src/components/shell/shellState.js";

function createStorage(seed = {}) {
  const map = new Map(Object.entries(seed));

  return {
    get length() {
      return map.size;
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
  };
}

describe("shellState helpers", () => {
  it("removes only legacy shell persistence keys", () => {
    const storage = createStorage({
      layout_gameMode: "1",
      layout_characterCreation: "1",
      layout_sharedPins: "1",
      window_fullscreen_once_game_shop: "1",
      keep_me: "safe",
    });

    const removed = clearLegacyShellState(storage);

    expect(removed).toEqual(
      expect.arrayContaining([
        "layout_gameMode",
        "layout_characterCreation",
        "layout_sharedPins",
        "window_fullscreen_once_game_shop",
      ]),
    );
    expect(storage.getItem("keep_me")).toBe("safe");
    expect(storage.getItem("layout_gameMode")).toBeNull();
  });

  it("builds a readable player identity fallback", () => {
    expect(buildPlayerIdentity(null)).toEqual({
      name: "Unbound Traveler",
      race: "Unchosen Lineage",
      classLabel: "Unwritten Class",
      level: 1,
    });

    expect(
      buildPlayerIdentity({
        name: "Rook",
        race: { name: "Human" },
        class: { name: "Warrior" },
        level: 7,
      }),
    ).toEqual({
      name: "Rook",
      race: "Human",
      classLabel: "Warrior",
      level: 7,
    });
  });
});
