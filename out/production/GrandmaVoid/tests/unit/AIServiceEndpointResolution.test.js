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
});
