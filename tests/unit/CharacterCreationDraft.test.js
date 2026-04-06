import { describe, expect, it } from "@jest/globals";
import {
  clearCharacterCreationDraft,
  hasCharacterCreationDraft,
  patchCharacterCreationDraft,
  readCharacterCreationDraft,
} from "../../src/components/gameui/characterCreationDraft.js";

function createStorageMock() {
  const store = new Map();
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

describe("character creation draft storage", () => {
  it("persists and reads an in-progress draft", () => {
    const storage = createStorageMock();

    patchCharacterCreationDraft(
      {
        started: true,
        name: "TestHero",
        selectedArchetypeSystemId: "skill_copy_interface",
        activeChamberIndex: 2,
      },
      storage,
    );

    expect(hasCharacterCreationDraft(storage)).toBe(true);
    expect(readCharacterCreationDraft(storage)).toMatchObject({
      started: true,
      name: "TestHero",
      selectedArchetypeSystemId: "skill_copy_interface",
      activeChamberIndex: 2,
    });
  });

  it("clears a stored draft", () => {
    const storage = createStorageMock();

    patchCharacterCreationDraft({ started: true, name: "TestHero" }, storage);
    expect(hasCharacterCreationDraft(storage)).toBe(true);

    clearCharacterCreationDraft(storage);

    expect(hasCharacterCreationDraft(storage)).toBe(false);
    expect(readCharacterCreationDraft(storage)).toBeNull();
  });
});