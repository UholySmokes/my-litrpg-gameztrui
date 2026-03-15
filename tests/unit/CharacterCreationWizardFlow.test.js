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
  NAME: 1,
  ARCHETYPE: 2,
  IDENTITY: 3,
  RACE: 4,
  CLASS: 5,
  MULTICLASS: 6,
  PROFESSION: 7,
  ATTRIBUTES: 8,
  SKILLS: 9,
  PERKS: 10,
  STARTER_TREE: 11,
  ALIGNMENT: 12,
  REVIEW: 13,
};

describe("character creation wizard flow", () => {
  it("skips advanced-only phases for first-time characters", () => {
    const flow = buildCreationStepSequence(STEPS, false);
    expect(flow.map((entry) => entry.id)).toEqual([
      "name",
      "system",
      "identity",
      "race",
      "class",
      "profession",
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
      "name",
      "system",
      "identity",
      "race",
      "class",
      "multiclass",
      "profession",
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
      name: true,
      system: true,
      identity: true,
      race: true,
      class: true,
      profession: true,
      attributes: false,
      skills: false,
      perks: false,
      alignment: false,
      review: false,
    });
    expect(progress).toBe(60);
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
