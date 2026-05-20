import { describe, expect, it } from "@jest/globals";
import { parseAction } from "../../packages/game-core/src/core/InputParser.js";

describe("Lore Action Parser", () => {
  it("parses lore inspection commands", () => {
    expect(parseAction("check oath", {}).type).toBe("lore_inspect");
    expect(parseAction("check oath", {}).topic).toBe("oath");

    expect(parseAction("review ledger debt", {}).type).toBe("lore_inspect");
    expect(parseAction("review ledger debt", {}).topic).toBe("ledger_debt");

    expect(parseAction("sense leyline pressure", {}).type).toBe("lore_inspect");
    expect(parseAction("sense leyline pressure", {}).topic).toBe("leyline_pressure");

    expect(parseAction("inspect System label", {}).type).toBe("lore_inspect");
    expect(parseAction("inspect System label", {}).topic).toBe("system_label");

    expect(parseAction("ask about faction terms", {}).type).toBe("lore_inspect");
    expect(parseAction("ask about faction terms", {}).topic).toBe("faction_terms");

    expect(parseAction("check soulcoin", {}).type).toBe("lore_inspect");
    expect(parseAction("check soulcoin", {}).topic).toBe("soulcoin");

    expect(parseAction("study voidspark", {}).type).toBe("lore_inspect");
    expect(parseAction("study voidspark", {}).topic).toBe("voidspark");
  });
});
