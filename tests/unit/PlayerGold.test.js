import { describe, expect, it } from "@jest/globals";
import { getPlayerGold } from "../../src/components/shell/shellState.js";

describe("getPlayerGold", () => {
  it("supports legacy player gold", () => {
    expect(getPlayerGold({ gold: 42 })).toBe(42);
  });
  it("prefers canonical currency, including zero", () => {
    expect(getPlayerGold({ gold: 42, currency: { goldCoins: 7 } })).toBe(7);
    expect(getPlayerGold({ gold: 42, currency: { goldCoins: 0 } })).toBe(0);
  });
  it("defaults missing balances to zero", () => {
    expect(getPlayerGold()).toBe(0);
    expect(getPlayerGold({})).toBe(0);
  });
});
