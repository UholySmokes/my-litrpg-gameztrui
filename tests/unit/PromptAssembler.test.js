import { describe, it, expect } from "@jest/globals";
import {
  assemblePrompt,
  buildHistorySection,
} from "../../src/core/PromptAssembler.js";

const makeEntry = ({ id, type, text, timestamp, sequence }) => ({
  id,
  type,
  text,
  timestamp,
  sequence,
});

describe("buildHistorySection", () => {
  it("orders entries deterministically and filters non-narrative noise", () => {
    const gameState = {
      narrative: {
        summary: "Summary text",
        entries: [
          makeEntry({
            id: "c",
            type: "narrative",
            text: "Third event",
            timestamp: 2,
            sequence: 3,
          }),
          makeEntry({
            id: "a",
            type: "system",
            text: "System notice",
            timestamp: 1,
            sequence: 1,
          }),
          makeEntry({
            id: "b",
            type: "narrative",
            text: "Second event",
            timestamp: 1,
            sequence: 2,
          }),
          makeEntry({
            id: "ignored",
            type: "combat",
            text: "Combat log",
            timestamp: 3,
            sequence: 4,
          }),
        ],
      },
    };

    const history = buildHistorySection(gameState);
    const lines = history.split("\n").slice(1);
    expect(lines).toEqual([
      "System: System notice",
      "Narrator: Second event",
      "Narrator: Third event",
    ]);
    expect(history).not.toContain("Combat log");
  });

  it("caps history entries by count", () => {
    const entries = Array.from({ length: 15 }, (_, index) =>
      makeEntry({
        id: `entry-${index}`,
        type: "narrative",
        text: `Event ${index}`,
        timestamp: index,
        sequence: index,
      }),
    );
    const history = buildHistorySection({
      narrative: {
        summary: "Summary",
        entries,
      },
    });
    const lines = history.split("\n").slice(1);
    expect(lines.length).toBe(15);
    expect(lines[0]).toBe("Narrator: Event 0");
    expect(lines[14]).toBe("Narrator: Event 14");
  });
});

describe("assemblePrompt", () => {
  it("injects magic ecology context when available", () => {
    const gameState = {
      player: {
        name: "Tester",
        level: 5,
        hp: { current: 70, max: 100 },
        mana: { current: 30, max: 50 },
        xp: { current: 10, max: 100 },
        inventory: [],
        equipment: {},
        magic: {
          resonance: { current: 42, max: 100, state: "humming" },
          reserves: { fire: 4.2 },
          reservesTaint: { fire: 0.15 },
          charges: [{ essence: "fire", amount: 1 }],
          prepared: { kind: "weave", pattern: "spiral" },
          unlockedPatterns: { weave: ["spiral"] },
          perks: [{ id: "stable_weaves", rank: 1 }],
        },
      },
      world: {
        flags: {},
        location: { current: "starting_zone", biome: "city" },
        essence: {
          ambient: {
            compositionByEssence: { fire: { density: 0.4, purity: 0.8, taint: 0.1 } },
            global: {
              drawMultByEssence: { fire: 1.1 },
            },
            provenance: {
              timeOfDay: "dusk",
              weatherType: "rain",
              weatherIntensity: 0.6,
              anomalyIds: ["storm_node"],
              sourceIds: ["storm_water"],
            },
          },
        },
      },
      quests: { active: [] },
      narrative: { entries: [], summary: "" },
      combat: { status: "inactive" },
    };

    const prompt = assemblePrompt(gameState, "sense essence", {
      success: true,
      actionType: "magic_sense",
      description: "Sensed essence",
    });

    expect(prompt).toContain("Magic Resonance:");
    expect(prompt).toContain("Magic Reserves:");
    expect(prompt).toContain("Ambient Context:");
    expect(prompt).toContain("Ambient Draw Multipliers:");
  });
});
