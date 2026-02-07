import { describe, it, expect } from "@jest/globals";
import { validateActionComprehensive } from "../../src/core/InputValidator.js";
import { initialGameState } from "../../src/data/initialState.js";

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
});
