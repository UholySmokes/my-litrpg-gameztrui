import { describe, it, expect } from "@jest/globals";
import { validateActionComprehensive } from "../../src/core/InputValidator.js";
import { initialGameState } from "../../src/data/initialState.js";
import {
  DEFAULT_START_LOCATION_ID,
  getAccessibleLocationIds,
} from "../../src/world/WorldDataRegistry.js";

const cloneState = (state) => JSON.parse(JSON.stringify(state));

describe("InputValidator", () => {
  it("rejects missing action type", () => {
    const result = validateActionComprehensive({}, cloneState(initialGameState));
    expect(result.valid).toBe(false);
  });

  it("rejects using items not in inventory", () => {
    const state = cloneState(initialGameState);
    const result = validateActionComprehensive(
      { type: "use_item", itemId: "health_potion" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects using items with zero quantity", () => {
    const state = cloneState(initialGameState);
    state.player.inventory = [{ id: "health_potion", quantity: 0 }];
    const result = validateActionComprehensive(
      { type: "use_item", itemId: "health_potion" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects using non-consumable items", () => {
    const state = cloneState(initialGameState);
    state.player.inventory = [{ id: "wooden_sword", quantity: 1 }];
    const result = validateActionComprehensive(
      { type: "use_item", itemId: "wooden_sword", itemName: "Wooden Sword" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects healing when already at full health", () => {
    const state = cloneState(initialGameState);
    state.player.inventory = [{ id: "health_potion", quantity: 1 }];
    state.player.hp.current = state.player.hp.max;
    const result = validateActionComprehensive(
      { type: "use_item", itemId: "health_potion" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects movement to inaccessible locations", () => {
    const state = cloneState(initialGameState);
    const result = validateActionComprehensive(
      { type: "move", targetLocation: "Forbidden Forest" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it('accepts "Starting Zone" as an alias for the default city start', () => {
    const state = cloneState(initialGameState);
    state.world.location.current = "city_sunspire_temple";
    state.world.location.visited = [DEFAULT_START_LOCATION_ID, "city_sunspire_temple"];
    state.world.location.unlockedAreas = [DEFAULT_START_LOCATION_ID, "city_sunspire_temple"];

    const result = validateActionComprehensive(
      { type: "move", targetLocation: "Starting Zone" },
      state,
    );
    expect(result.valid).toBe(true);
  });

  it("accepts connected zone names such as Wildroot Fringe", () => {
    const state = cloneState(initialGameState);
    state.world.location.current = DEFAULT_START_LOCATION_ID;
    state.world.location.visited = [DEFAULT_START_LOCATION_ID];
    state.world.location.unlockedAreas = [DEFAULT_START_LOCATION_ID];

    const result = validateActionComprehensive(
      { type: "move", targetLocation: "Wildroot Fringe" },
      state,
    );
    expect(result.valid).toBe(true);
  });

  it("rejects direct movement to interior locations in a connected zone", () => {
    const state = cloneState(initialGameState);
    state.world.location.current = DEFAULT_START_LOCATION_ID;
    state.world.location.visited = [DEFAULT_START_LOCATION_ID];
    state.world.location.unlockedAreas = [DEFAULT_START_LOCATION_ID];

    const result = validateActionComprehensive(
      { type: "move", targetLocation: "Breaker Shrine" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects direct movement to a far discovered location that is not nearby", () => {
    const state = cloneState(initialGameState);
    state.world.location.current = DEFAULT_START_LOCATION_ID;
    state.world.location.visited = [DEFAULT_START_LOCATION_ID, "mountain_starforge_foundry"];
    state.world.location.unlockedAreas = [DEFAULT_START_LOCATION_ID, "mountain_starforge_foundry"];

    const result = validateActionComprehensive(
      { type: "move", targetLocation: "Starforge Foundry" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("only exposes nearby public hubs and connected-zone entry points as travel options", () => {
    const state = cloneState(initialGameState);
    state.world.location.current = DEFAULT_START_LOCATION_ID;
    state.world.location.visited = [DEFAULT_START_LOCATION_ID];
    state.world.location.unlockedAreas = [DEFAULT_START_LOCATION_ID];

    const accessibleIds = getAccessibleLocationIds(state);

    expect(accessibleIds.has("city_neon_bazaar")).toBe(true);
    expect(accessibleIds.has("city_sunspire_temple")).toBe(true);
    expect(accessibleIds.has("coast_tideward_pier")).toBe(true);
    expect(accessibleIds.has("coast_breaker_shrine")).toBe(false);
    expect(accessibleIds.has("mountain_starforge_foundry")).toBe(false);
  });

  it("rejects movement when dead", () => {
    const state = cloneState(initialGameState);
    state.player.isDead = true;
    const result = validateActionComprehensive(
      { type: "move", targetLocation: "temple" },
      state,
    );
    expect(result.valid).toBe(false);
  });

  it("rejects rest during combat or when fully recovered", () => {
    const combatState = cloneState(initialGameState);
    combatState.combat = { status: "active" };
    const combatResult = validateActionComprehensive(
      { type: "rest" },
      combatState,
    );
    expect(combatResult.valid).toBe(false);

    const fullState = cloneState(initialGameState);
    fullState.player.hp.current = fullState.player.hp.max;
    fullState.player.mana.current = fullState.player.mana.max;
    const fullResult = validateActionComprehensive({ type: "rest" }, fullState);
    expect(fullResult.valid).toBe(false);
  });

  it("rejects attacks when combat has no enemies", () => {
    const state = cloneState(initialGameState);
    state.combat = { status: "active", enemies: [] };
    const result = validateActionComprehensive({ type: "attack" }, state);
    expect(result.valid).toBe(false);
  });

  it("allows read-only actions", () => {
    const state = cloneState(initialGameState);
    const result = validateActionComprehensive({ type: "inventory" }, state);
    expect(result.valid).toBe(true);
  });

  it("validates magic purge inputs", () => {
    const state = cloneState(initialGameState);
    const valid = validateActionComprehensive(
      { type: "magic_purge", essence: "fire", amount: 6 },
      state,
    );
    expect(valid.valid).toBe(true);

    const invalidAmount = validateActionComprehensive(
      { type: "magic_purge", essence: "fire", amount: 0 },
      state,
    );
    expect(invalidAmount.valid).toBe(false);

    const invalidEssence = validateActionComprehensive(
      { type: "magic_purge", essence: "ice", amount: 4 },
      state,
    );
    expect(invalidEssence.valid).toBe(false);
  });

  it("accepts expressive magic study targets and journal notes", () => {
    const state = cloneState(initialGameState);

    const studyResult = validateActionComprehensive(
      { type: "magic_study", target: "my own blood and its interaction with magic" },
      state,
    );
    expect(studyResult.valid).toBe(true);

    const journalResult = validateActionComprehensive(
      { type: "magic_journal", note: "Sample resonance climbed when the cut touched ambient mana." },
      state,
    );
    expect(journalResult.valid).toBe(true);
  });
});

