import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  __resetNarratorAvailabilityStateForTests,
  generateNarrativeStream,
} from "../../src/core/AIService.js";

describe("AIService streaming narrative", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete globalThis.fetch;
    delete globalThis.window;
    delete globalThis.__RUNTIME_CONFIG__;
    __resetNarratorAvailabilityStateForTests();
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
            story: "A hush settles over the shrine courtyard.",
            mood: "serene",
            suggestions: [{ t: "kneel at the altar", w: 0.92 }],
            sceneMemory: {
              locationLabel: "Shrine Courtyard",
              zoneLabel: "Moonlit Rise",
              immediateObjective: "Learn why the altar awoke.",
              presentEntities: ["Shrine Caretaker"],
              activeThreats: [],
              unresolvedHooks: ["Awakened altar"],
              lastConsequence: "The courtyard fell silent.",
            },
            choiceMeta: [
              {
                intent: "Study the altar respectfully.",
                category: "observe",
                urgency: 0.92,
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

    const promise = generateNarrativeStream("Describe the shrine.");
    await jest.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.mood).toBe("serene");
    expect(result.suggestions).toEqual([
      expect.objectContaining({ t: "kneel at the altar", w: 0.92 }),
    ]);
    expect(result.sceneMemory?.locationLabel).toBe("Shrine Courtyard");
    expect(result.choiceMeta?.[0]?.category).toBe("observe");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("retries stream start with alternate auth headers after 401", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_DEV_USER_ID: "local",
      VITE_DEV_USER_EMAIL: "local@game.dev",
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            threadId: "thread-401",
            runId: "run-401",
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
            story: "The conduit stabilizes under your command.",
            mood: "steady",
            suggestions: [{ t: "Advance", w: 0.8 }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const promise = generateNarrativeStream("Stabilize the conduit.");
    await jest.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(typeof result.story).toBe("string");
    expect(result.story.length).toBeGreaterThan(0);
    expect(result.narrative).toBe(result.story);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    const firstHeaders = globalThis.fetch.mock.calls[0][1]?.headers || {};
    const secondHeaders = globalThis.fetch.mock.calls[1][1]?.headers || {};
    expect(firstHeaders["x-dev-user-id"]).toBe("local");
    expect(secondHeaders["x-dev-user-id"]).toBeUndefined();
  });

  it("falls back to sync narrate when stream poll stays unauthorized", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_DEV_USER_ID: "local",
      VITE_DEV_USER_EMAIL: "local@game.dev",
      VITE_NARRATE_ENDPOINT: "/api/narrate",
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            threadId: "thread-poll-auth",
            runId: "run-poll-auth",
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
        new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            story: "Fallback sync narration recovered the turn.",
            mood: "focused",
            suggestions: [{ t: "Continue", w: 0.8 }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const promise = generateNarrativeStream("Recover from auth mismatch.");
    await jest.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.story).toContain("Fallback sync narration recovered");
    expect(result.narrative).toBe(result.story);
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
    expect(globalThis.fetch.mock.calls[3][0]).toBe("/api/narrate");
  });

  it("sends npc context in the stream start request for dialogue turns", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            status: "completed",
            done: true,
            story: "The patrol leader finally answers.",
            mood: "mysterious",
            suggestions: [{ t: "Ask what they want", w: 0.82 }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const result = await generateNarrativeStream("Resolve the question.", {
      mode: "dialogue",
      npcContext: {
        targetLabel: "Spirit Beast Clan Patrol",
        spokenText: "Why are you all just watching me?",
        requiresResponse: true,
      },
      reactionContext: {
        focusEntity: "Spirit Beast Clan Patrol",
        pressure: "approach-or-assist",
      },
    });

    const startRequest = JSON.parse(globalThis.fetch.mock.calls[0][1]?.body || "{}");
    expect(startRequest.mode).toBe("dialogue");
    expect(startRequest.npcContext).toEqual(
      expect.objectContaining({
        targetLabel: "Spirit Beast Clan Patrol",
        requiresResponse: true,
      }),
    );
    expect(startRequest.reactionContext).toEqual(
      expect.objectContaining({
        focusEntity: "Spirit Beast Clan Patrol",
        pressure: "approach-or-assist",
      }),
    );
    expect(result.story).toContain("The patrol leader finally answers.");
  });

  it("falls back to a configured external API base when stream start is missing", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
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
            threadId: "thread-fallback",
            runId: "run-fallback",
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
            story: "The lantern-light steadies as the path appears.",
            mood: "serene",
            suggestions: [{ t: "Follow the path", w: 0.9 }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    const promise = generateNarrativeStream("Find the path.");
    await jest.advanceTimersByTimeAsync(1500);
    const result = await promise;

    expect(result.story).toContain("lantern-light steadies");
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/narrate-start");
    expect(globalThis.fetch.mock.calls[1][0]).toBe(
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate-start",
    );
    expect(globalThis.fetch.mock.calls[2][0]).toBe(
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate-poll?threadId=thread-fallback&runId=run-fallback",
    );
  });

  it("marks external stream fallback outages as unavailable without falling back to sync", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
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

    await expect(
      generateNarrativeStream("Recover the opening beat."),
    ).rejects.toMatchObject({
      code: "NARRATOR_SERVICE_UNREACHABLE",
    });

    await expect(
      generateNarrativeStream("Retry the opening beat."),
    ).rejects.toMatchObject({
      code: "NARRATOR_UNAVAILABLE_COOLDOWN",
      causeCode: "NARRATOR_SERVICE_UNREACHABLE",
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/narrate-start");
    expect(globalThis.fetch.mock.calls[1][0]).toBe(
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate-start",
    );
  });

  it("bubbles local same-origin narrator outages so the runtime can use offline fallback", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_API_BASE_URL: "/",
    };
    globalThis.window = { location: { hostname: "127.0.0.1" } };
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(null, {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    );

    await expect(
      generateNarrativeStream("Recover the opening beat."),
    ).rejects.toMatchObject({
      code: "NARRATOR_SERVICE_UNREACHABLE",
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/narrate-start");
  });
});
