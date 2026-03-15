import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { generateNarrativeStream } from "../../src/core/AIService.js";

describe("AIService streaming narrative", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete globalThis.fetch;
    delete globalThis.window;
    delete globalThis.__RUNTIME_CONFIG__;
  });

  it("preserves mood and suggestions from a completed poll response", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            threadId: "thread-1",
            runId: "run-1",
            status: "running",
            done: false,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            status: "completed",
            done: true,
            narrative: "A hush settles over the shrine courtyard.",
            mood: "serene",
            suggestions: [{ t: "kneel at the altar", w: 0.92 }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const promise = generateNarrativeStream("Describe the shrine.");
    await jest.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.mood).toBe("serene");
    expect(result.suggestions).toEqual([{ t: "kneel at the altar", w: 0.92 }]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
