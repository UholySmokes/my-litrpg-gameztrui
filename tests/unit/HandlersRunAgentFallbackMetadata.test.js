import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handlers = require("../../functions/lib/handlers.js");
const auth = require("../../functions/lib/auth.js");
const runtime = require("../../functions/lib/firebase-agents/runtime.js");

function createRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
  };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.set = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });
  res.json = jest.fn((value) => {
    res.body = value;
    return res;
  });
  return res;
}

describe("handlers runAgent fallback metadata", () => {
  const originalGetUserFromRequest = auth.getUserFromRequest;
  const originalRunFirebaseAgent = runtime.runFirebaseAgent;

  beforeEach(() => {
    auth.getUserFromRequest = jest.fn(async () => ({ id: "user-1" }));
    runtime.runFirebaseAgent = jest.fn(async () => ({
      agent: "narrator",
      agentName: "NarratorAgent",
      backend: "google-ai-studio",
      model: "gemini-2.5-flash",
      temperature: 0.8,
      text: "The gate groans open.",
      fallbackUsed: true,
      fallbackFrom: "openai-responses",
    }));
  });

  afterEach(() => {
    auth.getUserFromRequest = originalGetUserFromRequest;
    runtime.runFirebaseAgent = originalRunFirebaseAgent;
  });

  it("returns fallback metadata when failover is used", async () => {
    const req = {
      method: "POST",
      body: {
        agent: "narrator",
        input: { game_state: { location: "Ashen Gate" } },
      },
    };
    const res = createRes();

    await handlers.runAgent(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.backend).toBe("google-ai-studio");
    expect(res.body.fallbackUsed).toBe(true);
    expect(res.body.fallbackFrom).toBe("openai-responses");
    expect(res.body.agent).toBe("narrator");
  });
});
