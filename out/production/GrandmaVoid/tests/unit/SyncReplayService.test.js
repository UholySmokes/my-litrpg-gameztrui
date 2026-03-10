import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { __testing, fetchSyncReplay } from "../../src/core/SyncReplayService.js";

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.__RUNTIME_CONFIG__;
});

describe("SyncReplayService", () => {
  it("deduplicates replay endpoints to avoid duplicate retries", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_SYNC_REPLAY_ENDPOINT: "/api/sync/replay",
      VITE_API_BASE_URL: "/",
      VITE_DEV_USER_ID: "dev-user",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Run not found." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchSyncReplay({ runId: "run-1" });
    expect(result.success).toBe(false);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe(
      "/api/sync/replay?runId=run-1&afterSeq=0&limit=200",
    );
  });

  it("builds query parameters and returns replay payload", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_API_BASE_URL: "/",
      VITE_DEV_USER_ID: "dev-user",
      VITE_DEV_USER_EMAIL: "dev@example.com",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          runId: "run-abc",
          canonicalState: { seq: 9, tick: 9, stateHash: "abc" },
          timeline: [],
          hashTimeline: [],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const result = await fetchSyncReplay({
      runId: "run-abc",
      afterSeq: 2,
      limit: 50,
      includeRejected: true,
    });
    expect(result.success).toBe(true);
    expect(result.data.runId).toBe("run-abc");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe(
      "/api/sync/replay?runId=run-abc&afterSeq=2&limit=50&includeRejected=true",
    );
    expect(globalThis.fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-dev-user-id": "dev-user",
          "x-dev-user-email": "dev@example.com",
        }),
      }),
    );
  });

  it("exposes helper query builder for deterministic contract tests", () => {
    const query = __testing.buildReplayQuery({
      runId: "run-xyz",
      afterSeq: 4,
      limit: 100,
      includeRejected: true,
    });
    expect(query).toBe(
      "runId=run-xyz&afterSeq=4&limit=100&includeRejected=true",
    );
  });
});
