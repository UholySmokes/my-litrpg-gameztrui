import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handlers = require("../../functions/lib/handlers.js");
const auth = require("../../functions/lib/auth.js");
const runtime = require("../../functions/lib/firebase-agents/runtime.js");
const narrateRunsStore = require("../../functions/lib/narrate-runs-store.js");

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

describe("handlers narrate endpoints", () => {
  const originalGetUserFromRequest = auth.getUserFromRequest;
  const originalRunFirebaseAgent = runtime.runFirebaseAgent;
  const originalCreateNarrateRun = narrateRunsStore.createNarrateRun;
  const originalUpdateNarrateRun = narrateRunsStore.updateNarrateRun;
  const originalGetNarrateRun = narrateRunsStore.getNarrateRun;
  const originalPurgeExpiredNarrateRuns = narrateRunsStore.purgeExpiredNarrateRuns;

  beforeEach(() => {
    auth.getUserFromRequest = jest.fn(async () => ({ id: "user-1" }));
    runtime.runFirebaseAgent = jest.fn(async () => ({
      text: JSON.stringify({
        narrative: "The market lights flicker as night falls.",
        mood: "mysterious",
        suggestions: ["Press deeper into the bazaar."],
        sceneMemory: {
          locationLabel: "Night Bazaar",
          zoneLabel: "Copper Ward",
          immediateObjective: "Find the veiled broker.",
          presentEntities: ["Veiled Broker"],
          activeThreats: [],
          unresolvedHooks: ["Broker bargain"],
          lastConsequence: "The lantern-row woke around you.",
        },
        choiceMeta: [
          {
            intent: "Continue deeper before the broker disappears.",
            category: "progress",
            urgency: 0.9,
            groundedInState: true,
          },
        ],
      }),
      backend: "firebase-genkit",
      model: "gemini-2.5-flash",
      temperature: 0.7,
    }));
    narrateRunsStore.createNarrateRun = jest.fn(async () => undefined);
    narrateRunsStore.updateNarrateRun = jest.fn(async () => undefined);
    narrateRunsStore.getNarrateRun = jest.fn(async () => null);
    narrateRunsStore.purgeExpiredNarrateRuns = jest.fn(async () => 0);
  });

  afterEach(() => {
    auth.getUserFromRequest = originalGetUserFromRequest;
    runtime.runFirebaseAgent = originalRunFirebaseAgent;
    narrateRunsStore.createNarrateRun = originalCreateNarrateRun;
    narrateRunsStore.updateNarrateRun = originalUpdateNarrateRun;
    narrateRunsStore.getNarrateRun = originalGetNarrateRun;
    narrateRunsStore.purgeExpiredNarrateRuns = originalPurgeExpiredNarrateRuns;
  });

  it("returns completed output and persists run state in narrateStart", async () => {
    const req = {
      method: "POST",
      body: {
        mode: "exploration",
        prompt: "Describe the next moment.",
      },
    };
    const res = createRes();

    await handlers.narrateStart(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe("completed");
    expect(res.body.done).toBe(true);
    expect(res.body.narrative).toContain("market lights");
    expect(typeof res.body.threadId).toBe("string");
    expect(typeof res.body.runId).toBe("string");
    expect(typeof res.body.outputHash).toBe("string");
    expect(res.body.outputHash).toHaveLength(64);
    expect(narrateRunsStore.createNarrateRun).toHaveBeenCalledTimes(1);
    expect(narrateRunsStore.updateNarrateRun).toHaveBeenCalledTimes(1);
    expect(runtime.runFirebaseAgent).toHaveBeenCalledTimes(1);
    // Generation trace fields
    expect(typeof res.body.agentId).toBe("string");
    expect(res.body.agentId).toBe("narrator");
    expect(typeof res.body.backend).toBe("string");
    expect(typeof res.body.provider).toBe("string");
    expect(typeof res.body.model).toBe("string");
    expect(res.body.sceneMemory?.locationLabel).toBe("Night Bazaar");
    expect(res.body.choiceMeta?.[0]?.category).toBe("progress");
  });

  it("persists failed run state and returns error details when narration fails", async () => {
    runtime.runFirebaseAgent = jest.fn(async () => {
      const err = new Error("Model returned empty output.");
      err.status = 502;
      err.code = "NON_TEXT_OUTPUT";
      throw err;
    });
    const req = {
      method: "POST",
      body: {
        mode: "combat",
        prompt: "Narrate a tense clash.",
      },
    };
    const res = createRes();

    await handlers.narrateStart(req, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.ok).toBe(false);
    expect(res.body.errorCode).toBe("NON_TEXT_OUTPUT");
    expect(res.body.status).toBe("failed");
    expect(res.body.done).toBe(true);
    expect(typeof res.body.threadId).toBe("string");
    expect(typeof res.body.runId).toBe("string");
    expect(narrateRunsStore.updateNarrateRun).toHaveBeenCalledTimes(1);
    const [callArg] = narrateRunsStore.updateNarrateRun.mock.calls[0];
    expect(callArg.patch.status).toBe("failed");
    expect(callArg.patch.ok).toBe(false);
    expect(callArg.patch.errorCode).toBe("NON_TEXT_OUTPUT");
  });

  it("returns completed response for narratePoll when run is done", async () => {
    narrateRunsStore.getNarrateRun = jest.fn(async () => ({
      thread_id: "t-1",
      run_id: "r-1",
      owner_id: "user-1",
      mode: "exploration",
      status: "completed",
      done: true,
      ok: true,
      narrative: "Dawn breaks over the copper roofs.",
      mood: "serene",
      suggestions: ["Head toward the eastern gate."],
      scene_memory: {
        locationLabel: "Copper Roofs",
        zoneLabel: "East Market",
        immediateObjective: "Reach the eastern gate.",
        presentEntities: ["Gate Warden"],
        activeThreats: [],
        unresolvedHooks: ["Eastern gate"],
        lastConsequence: "Dawn revealed the road.",
      },
      choice_meta: [
        {
          intent: "Move while the gate remains quiet.",
          category: "progress",
          urgency: 0.7,
          groundedInState: true,
        },
      ],
      output_hash: "abc123",
    }));
    const req = {
      method: "GET",
      query: { threadId: "t-1", runId: "r-1", mode: "exploration" },
    };
    const res = createRes();

    await handlers.narratePoll(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.done).toBe(true);
    expect(res.body.status).toBe("completed");
    expect(res.body.narrative).toContain("Dawn breaks");
    expect(res.body.outputHash).toBe("abc123");
    expect(res.body.provider).toBe("firebase-genkit");
    expect(res.body.sceneMemory?.locationLabel).toBe("Copper Roofs");
    expect(res.body.choiceMeta?.[0]?.category).toBe("progress");
  });

  it("returns not found in narratePoll when run does not exist", async () => {
    const req = {
      method: "GET",
      query: { threadId: "missing-thread", runId: "missing-run" },
    };
    const res = createRes();

    await handlers.narratePoll(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.errorCode).toBe("RUN_NOT_FOUND");
  });

  it("returns failed status in narratePoll when run finished with error", async () => {
    narrateRunsStore.getNarrateRun = jest.fn(async () => ({
      thread_id: "t-2",
      run_id: "r-2",
      owner_id: "user-1",
      mode: "combat",
      status: "failed",
      done: true,
      ok: false,
      error_code: "RUN_FAILED",
      message: "Narration backend timeout.",
    }));
    const req = {
      method: "GET",
      query: { threadId: "t-2", runId: "r-2", mode: "combat" },
    };
    const res = createRes();

    await handlers.narratePoll(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.status).toBe("failed");
    expect(res.body.errorCode).toBe("RUN_FAILED");
    expect(res.body.done).toBe(true);
  });

  it("returns generation trace metadata (agentId, backend, model) in narrate response", async () => {
    const req = {
      method: "POST",
      body: {
        mode: "combat",
        prompt: "Narrate the battle.",
      },
    };
    const res = createRes();

    await handlers.narrate(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.narrative).toContain("market lights");
    // Generation trace: which agent, backend, and model handled the request
    expect(res.body.agentId).toBe("combat");
    expect(typeof res.body.backend).toBe("string");
    expect(typeof res.body.provider).toBe("string");
    expect(typeof res.body.model).toBe("string");
    expect(res.body.mode).toBe("combat");
  });

  it("preserves backend and fallback metadata from the runtime result", async () => {
    runtime.runFirebaseAgent = jest.fn(async () => ({
      text: JSON.stringify({
        narrative: "The local emulator fills the silence.",
        mood: "neutral",
        suggestions: ["Continue"],
      }),
      backend: "local-emulator-fallback",
      model: "gpt-5.4-mini",
      temperature: 1,
      fallbackUsed: true,
      fallbackFrom: "google-ai-studio",
    }));

    const req = {
      method: "POST",
      body: {
        mode: "exploration",
        prompt: "Narrate the next step.",
      },
    };
    const res = createRes();

    await handlers.narrate(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.backend).toBe("local-emulator-fallback");
    expect(res.body.provider).toBe("local-emulator-fallback");
    expect(res.body.fallbackUsed).toBe(true);
    expect(res.body.fallbackFrom).toBe("google-ai-studio");
  });
});
