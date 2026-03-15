import { describe, expect, it } from "@jest/globals";
import {
  buildCreationStepSequence,
  calculateCreationSyncProgress,
} from "../../src/core/characterCreationWizardFlow.js";
import {
  getCharactersCreated,
  incrementCharactersCreated,
  isAdvancedCreationUnlocked,
} from "../../src/core/playerProfile.js";

const STEPS = {
  IDENTITY: 1,
  RACE: 2,
  CLASS: 3,
  MULTICLASS: 4,
  PROFESSION: 5,
  ARCHETYPE: 6,
  ATTRIBUTES: 7,
  SKILLS: 8,
  PERKS: 9,
  STARTER_TREE: 10,
  ALIGNMENT: 11,
  REVIEW: 12,
};

describe("character creation wizard flow", () => {
  it("skips advanced-only phases for first-time characters", () => {
    const flow = buildCreationStepSequence(STEPS, false);
    expect(flow.map((entry) => entry.id)).toEqual([
      "identity",
      "race",
      "class",
      "profession",
      "system",
      "attributes",
      "skills",
      "perks",
      "alignment",
      "review",
    ]);
  });

  it("includes multiclass and starter tree after unlock", () => {
    const flow = buildCreationStepSequence(STEPS, true);
    expect(flow.map((entry) => entry.id)).toEqual([
      "identity",
      "race",
      "class",
      "multiclass",
      "profession",
      "system",
      "attributes",
      "skills",
      "perks",
      "starter-tree",
      "alignment",
      "review",
    ]);
  });

  it("computes sync progress from visible steps only", () => {
    const flow = buildCreationStepSequence(STEPS, false);
    const progress = calculateCreationSyncProgress(flow, {
      identity: true,
      race: true,
      class: true,
      profession: true,
      system: true,
      attributes: false,
      skills: false,
      perks: false,
      alignment: false,
      review: false,
    });
    expect(progress).toBe(56);
  });
});

describe("player profile helpers", () => {
  it("increments characters created while preserving existing fields", () => {
    expect(
      incrementCharactersCreated({
        display_name: "Wanderer",
        characters_created: 2,
      }),
    ).toEqual({
      display_name: "Wanderer",
      characters_created: 3,
    });
  });

  it("derives advanced unlock from nested game state", () => {
    const state = {
      player_profile: {
        characters_created: 1,
      },
    };
    expect(getCharactersCreated(state)).toBe(1);
    expect(isAdvancedCreationUnlocked(state)).toBe(true);
  });
});
