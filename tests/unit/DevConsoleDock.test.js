import { describe, expect, it, jest } from "@jest/globals";
import {
  buildDevConsoleSessionLog,
  executeDevConsoleCommand,
} from "../../src/components/gameui/DevConsoleDock.jsx";

describe("DevConsoleDock helpers", () => {
  it("builds a deduped combined timeline from retained log sources", () => {
    const entries = buildDevConsoleSessionLog({
      narrative: {
        entries: [
          { id: "n1", type: "system", text: "boot", timestamp: 10 },
          { id: "n2", type: "narrative", text: "scene", timestamp: 20 },
        ],
      },
      chatLog: [
        { type: "system", text: "boot", timestamp: 10 },
        { type: "user", text: "look around", timestamp: 30 },
      ],
      combat: {
        log: [{ id: "c1", type: "combat", text: "rat bites", timestamp: 40 }],
      },
    });

    expect(entries.map((entry) => entry.text)).toEqual([
      "boot",
      "scene",
      "look around",
      "rat bites",
    ]);
  });

  it("applies gold mutations through the explicit state updater", async () => {
    let state = {
      player: {
        gold: 50,
        currency: { goldCoins: 50, soulpoints: 0 },
      },
    };

    await executeDevConsoleCommand("/gold 250", {
      setState: (updater) => {
        state = updater(state);
      },
    });

    expect(state.player.gold).toBe(300);
    expect(state.player.currency.goldCoins).toBe(300);
  });

  it("routes plain text through the story runner and user log", async () => {
    const addSystemMessage = jest.fn();
    const runStoryCommand = jest.fn().mockResolvedValue(undefined);

    const result = await executeDevConsoleCommand("look around", {
      addSystemMessage,
      runStoryCommand,
    });

    expect(result.ok).toBe(true);
    expect(addSystemMessage).toHaveBeenCalledWith("> look around", "user");
    expect(runStoryCommand).toHaveBeenCalledWith("look around");
  });
});