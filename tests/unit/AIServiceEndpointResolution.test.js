import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { generateNarrative } from "../../src/core/AIService.js";

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.window;
  delete globalThis.__RUNTIME_CONFIG__;
});

describe("AIService endpoint resolution", () => {
  it("does not call the same narrate endpoint twice", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
      VITE_API_BASE_URL: "/",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(generateNarrative("test prompt")).rejects.toThrow(
      "Narrator endpoint not found.",
    );
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/narrate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("retries with alternate auth headers when dev headers are rejected", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
      VITE_DEV_USER_ID: "local",
      VITE_DEV_USER_EMAIL: "local@game.dev",
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            narrative: "A warding sigil flares and then settles.",
            mood: "focused",
            suggestions: ["Inspect the sigil"],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const result = await generateNarrative("test prompt");
    expect(result.narrative).toContain("warding sigil");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    const firstHeaders = globalThis.fetch.mock.calls[0][1]?.headers || {};
    const secondHeaders = globalThis.fetch.mock.calls[1][1]?.headers || {};
    expect(firstHeaders["x-dev-user-id"]).toBe("local");
    expect(secondHeaders["x-dev-user-id"]).toBeUndefined();
  });
});
