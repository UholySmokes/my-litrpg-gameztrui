import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { __testing, listAgents, runAgent } from "../../src/core/AgentService.js";

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.__RUNTIME_CONFIG__;
});

describe("AgentService", () => {
  it("resolves agent endpoints from same-origin api base", () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_API_BASE_URL: "/",
    };

    const resolved = __testing.resolveAgentEndpoints();
    expect(resolved.listEndpoints[0]).toBe("/api/agents");
    expect(resolved.runEndpoints[0]).toBe("/api/agents/run");
  });

  it("lists agents through /api/agents", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_API_BASE_URL: "/",
      VITE_DEV_USER_ID: "dev-user",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          agents: [{ name: "narrator" }, { name: "quest" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const result = await listAgents();
    expect(result.success).toBe(true);
    expect(result.agents).toHaveLength(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/agents");
  });

  it("runs an agent through /api/agents/run", async () => {
    globalThis.__RUNTIME_CONFIG__ = {
      VITE_API_BASE_URL: "/",
      VITE_DEV_USER_ID: "dev-user",
      VITE_DEV_USER_EMAIL: "dev@example.com",
    };

    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          output: { narrative: "ok" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const payload = {
      agent: "narrator",
      input: { game_state: { location: "Ashen Gate" } },
      model: "gemini-2.5-flash",
      temperature: 0.7,
    };

    const result = await runAgent(payload);
    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch.mock.calls[0][0]).toBe("/api/agents/run");
    expect(globalThis.fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-dev-user-id": "dev-user",
          "x-dev-user-email": "dev@example.com",
        }),
      }),
    );
  });
});

