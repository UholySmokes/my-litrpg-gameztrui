import { describe, it, expect } from "@jest/globals";
import { addItem } from "../../src/systems/inventory/InventorySystem.js";
import { initialGameState } from "../../src/data/initialState.js";

const cloneState = (state) => JSON.parse(JSON.stringify(state));

describe("InventorySystem.addItem", () => {
  it("adds items even when inventory is missing", () => {
    const state = cloneState(initialGameState);
    delete state.player.inventory;

    const next = addItem(state, "mystery_token");

    expect(Array.isArray(next.player.inventory)).toBe(true);
    expect(next.player.inventory.length).toBe(1);
    expect(next.player.inventory[0].id).toBe("mystery_token");
  });

  it("increments quantity when item already exists", () => {
    const state = cloneState(initialGameState);
    state.player.inventory = [{ id: "test_item", quantity: 1 }];

    const next = addItem(state, { id: "test_item", quantity: 2 });

    expect(next.player.inventory.length).toBe(1);
    expect(next.player.inventory[0].quantity).toBe(3);
  });

  it("ignores empty item ids", () => {
    const state = cloneState(initialGameState);

    const next = addItem(state, { id: "" });

    expect(next).toEqual(state);
  });
});
