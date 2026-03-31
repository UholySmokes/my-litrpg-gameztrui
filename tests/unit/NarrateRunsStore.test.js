import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const narrateRunsStore = require("../../functions/lib/narrate-runs-store.js");

function makeTempPath() {
  const unique = `narrate-runs-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
  return path.join(os.tmpdir(), unique);
}

describe("narrate-runs-store file backend", () => {
  const originalBackend = process.env.GAME_DB_STORAGE;
  const originalFilePath = process.env.NARRATE_RUNS_FILE_PATH;

  beforeEach(() => {
    process.env.GAME_DB_STORAGE = "file";
  });

  afterEach(() => {
    if (typeof originalBackend === "string") {
      process.env.GAME_DB_STORAGE = originalBackend;
    } else {
      delete process.env.GAME_DB_STORAGE;
    }

    if (typeof originalFilePath === "string") {
      process.env.NARRATE_RUNS_FILE_PATH = originalFilePath;
    } else {
      delete process.env.NARRATE_RUNS_FILE_PATH;
    }
  });

  it("creates, updates, and reads a run using a custom file path", async () => {
    const filePath = makeTempPath();
    process.env.NARRATE_RUNS_FILE_PATH = filePath;

    await narrateRunsStore.createNarrateRun({
      threadId: "thread-1",
      runId: "run-1",
      ownerId: "user-1",
      mode: "exploration",
    });

    const created = await narrateRunsStore.getNarrateRun({
      threadId: "thread-1",
      runId: "run-1",
      ownerId: "user-1",
    });
    expect(created).toBeTruthy();
    expect(created.status).toBe("running");
    expect(created.done).toBe(false);

    const updated = await narrateRunsStore.updateNarrateRun({
      threadId: "thread-1",
      runId: "run-1",
      ownerId: "user-1",
      patch: {
        status: "completed",
        done: true,
        ok: true,
        narrative: "The gate opens with a low metallic hum.",
        mood: "mysterious",
        suggestions: ["Step through carefully."],
        sceneMemory: {
          locationLabel: "Gate Antechamber",
          zoneLabel: "Lower Vault",
          immediateObjective: "Reach the inner vault.",
          presentEntities: ["Gate Warden"],
          activeThreats: [],
          unresolvedHooks: ["Inner vault"],
          lastConsequence: "The gate unlocked.",
        },
        choiceMeta: [
          {
            intent: "Advance while the mechanism remains open.",
            category: "progress",
            urgency: 0.8,
            groundedInState: true,
          },
        ],
        outputHash: "hash-1",
      },
    });
    expect(updated).toBeTruthy();
    expect(updated.status).toBe("completed");
    expect(updated.done).toBe(true);
    expect(updated.ok).toBe(true);
    expect(updated.output_hash).toBe("hash-1");

    const readBack = await narrateRunsStore.getNarrateRun({
      threadId: "thread-1",
      runId: "run-1",
      ownerId: "user-1",
    });
    expect(readBack.narrative).toContain("gate opens");
    expect(Array.isArray(readBack.suggestions)).toBe(true);
    expect(readBack.scene_memory?.locationLabel).toBe("Gate Antechamber");
    expect(readBack.choice_meta?.[0]?.category).toBe("progress");

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    expect(Array.isArray(raw.runs)).toBe(true);
    expect(raw.runs).toHaveLength(1);

    fs.unlinkSync(filePath);
  });

  it("enforces owner isolation for get and update", async () => {
    const filePath = makeTempPath();
    process.env.NARRATE_RUNS_FILE_PATH = filePath;

    await narrateRunsStore.createNarrateRun({
      threadId: "thread-2",
      runId: "run-2",
      ownerId: "user-owner",
      mode: "combat",
    });

    const wrongOwnerRead = await narrateRunsStore.getNarrateRun({
      threadId: "thread-2",
      runId: "run-2",
      ownerId: "user-other",
    });
    expect(wrongOwnerRead).toBeNull();

    const wrongOwnerUpdate = await narrateRunsStore.updateNarrateRun({
      threadId: "thread-2",
      runId: "run-2",
      ownerId: "user-other",
      patch: { status: "completed", done: true, ok: true },
    });
    expect(wrongOwnerUpdate).toBeNull();

    fs.unlinkSync(filePath);
  });

  it("purges expired runs", async () => {
    const filePath = makeTempPath();
    process.env.NARRATE_RUNS_FILE_PATH = filePath;

    await narrateRunsStore.createNarrateRun({
      threadId: "thread-3",
      runId: "run-3",
      ownerId: "user-3",
      mode: "exploration",
    });

    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    raw.runs[0].expires_at_ms = Date.now() - 1000;
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), "utf8");

    const purged = await narrateRunsStore.purgeExpiredNarrateRuns();
    expect(purged).toBe(1);

    const after = await narrateRunsStore.getNarrateRun({
      threadId: "thread-3",
      runId: "run-3",
      ownerId: "user-3",
    });
    expect(after).toBeNull();

    fs.unlinkSync(filePath);
  });
});
