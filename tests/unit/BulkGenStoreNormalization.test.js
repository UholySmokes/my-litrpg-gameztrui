import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bulkGenStoreNormalization = require("../../functions/lib/bulk-gen-store-normalization.js");

describe("bulk generation store normalization", () => {
  it("creates the empty file-db shape expected by the file backend", () => {
    expect(bulkGenStoreNormalization.createEmptyFileDb()).toEqual({
      runs: [],
      tasks: [],
      outputs: [],
      styles: [],
      spendEvents: [],
    });
  });

  it("normalizes task defaults and payload structure", () => {
    const task = bulkGenStoreNormalization.normalizeTask(
      {
        run_id: "run-1",
        kind: "asset2d",
        payload: { asset_type: "item_icon" },
      },
      "run-1",
    );

    expect(task).toEqual(
      expect.objectContaining({
        run_id: "run-1",
        kind: "asset2d",
        zone_id: "global",
        status: "pending",
        payload: { asset_type: "item_icon" },
      }),
    );
    expect(typeof task.task_id).toBe("string");
    expect(task.task_id.length).toBeGreaterThan(0);
  });

  it("maps firestore task snapshots back into stable normalized records", () => {
    const task = bulkGenStoreNormalization.mapFirestoreTask({
      id: "task-1",
      data() {
        return {
          run_id: "run-1",
          status: "running",
          payload: { prompt: "hello" },
          created_at: { toDate: () => new Date("2026-03-10T00:00:00.000Z") },
          updated_at: { toDate: () => new Date("2026-03-10T00:05:00.000Z") },
          claimed_at: { toDate: () => new Date("2026-03-10T00:05:10.000Z") },
        };
      },
    });

    expect(task).toEqual(
      expect.objectContaining({
        task_id: "task-1",
        run_id: "run-1",
        status: "running",
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-10T00:05:00.000Z",
        claimed_at: "2026-03-10T00:05:10.000Z",
      }),
    );
  });
});
