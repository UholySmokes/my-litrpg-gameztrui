import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  __resetNarratorAvailabilityStateForTests,
  generateNarrative,
} from "../../src/core/AIService.js";

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.window;
  delete globalThis.__RUNTIME_CONFIG__;
  __resetNarratorAvailabilityStateForTests();
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

  it("short-circuits repeated missing-endpoint attempts during cooldown", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(generateNarrative("first prompt")).rejects.toMatchObject({
      code: "NARRATOR_ENDPOINT_MISSING",
    });

    await expect(generateNarrative("second prompt")).rejects.toMatchObject({
      code: "NARRATOR_UNAVAILABLE_COOLDOWN",
      causeCode: "NARRATOR_ENDPOINT_MISSING",
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
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
            sceneMemory: {
              locationLabel: "Warding Hall",
              zoneLabel: "Glass Ward",
              immediateObjective: "Understand the sigil.",
              presentEntities: ["Warding Sigil"],
              activeThreats: [],
              unresolvedHooks: ["Sigil source"],
              lastConsequence: "The sigil calmed.",
            },
            choiceMeta: [
              {
                intent: "Inspect the now-stable sigil.",
                category: "observe",
                urgency: 0.75,
                groundedInState: true,
              },
            ],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const result = await generateNarrative("test prompt");
    expect(result.narrative).toContain("warding sigil");
    expect(result.sceneMemory?.locationLabel).toBe("Warding Hall");
    expect(result.choiceMeta?.[0]?.category).toBe("observe");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    const firstHeaders = globalThis.fetch.mock.calls[0][1]?.headers || {};
    const secondHeaders = globalThis.fetch.mock.calls[1][1]?.headers || {};
    expect(firstHeaders["x-dev-user-id"]).toBe("local");
    expect(secondHeaders["x-dev-user-id"]).toBeUndefined();
  });

  it("falls back to a configured external API base when same-origin is missing", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
      VITE_API_BASE_URL: "/",
      VITE_ALLOW_EXTERNAL_API_BASE_URL: "true",
      VITE_API_FALLBACK_BASE_URL: "https://my-litrpg-gameztrui-3416-da75c.web.app",
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not Found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            story: "A bridge of frost spans the chasm.",
            mood: "focused",
            suggestions: ["Cross carefully"],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const result = await generateNarrative("test prompt");
    expect(result.story).toContain("bridge of frost");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/narrate");
    expect(globalThis.fetch.mock.calls[1][0]).toBe(
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate",
    );
  });

  it("marks external fallback outages as narrator-unavailable cooldown candidates", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
      VITE_API_BASE_URL: "/",
      VITE_ALLOW_EXTERNAL_API_BASE_URL: "true",
      VITE_API_FALLBACK_BASE_URL: "https://my-litrpg-gameztrui-3416-da75c.web.app",
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Not Found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response("Temporarily unavailable", {
          status: 503,
          headers: { "content-type": "text/plain" },
        }),
      );

    await expect(generateNarrative("test prompt")).rejects.toMatchObject({
      code: "NARRATOR_SERVICE_UNREACHABLE",
    });

    await expect(generateNarrative("retry prompt")).rejects.toMatchObject({
      code: "NARRATOR_UNAVAILABLE_COOLDOWN",
      causeCode: "NARRATOR_SERVICE_UNREACHABLE",
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/narrate");
    expect(globalThis.fetch.mock.calls[1][0]).toBe(
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate",
    );
  });

  it("treats local same-origin 500s as narrator-unavailable cooldown candidates", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_NARRATE_ENDPOINT: "/api/narrate",
    };
    globalThis.window = { location: { hostname: "127.0.0.1" } };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(null, {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    );

    await generateNarrative("test prompt")
      .then(() => {
        throw new Error("Expected generateNarrative to reject.");
      })
      .catch((error) => {
        expect(error.code).toBe("NARRATOR_SERVICE_UNREACHABLE");
      });

    await generateNarrative("retry prompt")
      .then(() => {
        throw new Error("Expected cooldown retry to reject.");
      })
      .catch((error) => {
        expect(error.code).toBe("NARRATOR_UNAVAILABLE_COOLDOWN");
        expect(error.causeCode).toBe("NARRATOR_SERVICE_UNREACHABLE");
      });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
