import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bulkGenObservability = require("../../functions/lib/bulk-gen-observability.js");

afterEach(() => {
  delete process.env.BULK_GEN_STAGE_LOGGING;
});

describe("bulk generation observability", () => {
  it("builds stable route metadata for bulk generation handlers", () => {
    const meta = bulkGenObservability.buildBulkGenerationRouteMeta("start", {
      method: "POST",
      url: "/api/bulk-gen/run/start",
      body: {
        runId: "run-7",
        zoneIds: ["city", "wilds"],
        questCount: 12,
        loreCount: 4,
        assetCount: 9,
      },
    });

    expect(meta.route).toBe("start");
    expect(meta.runId).toBe("run-7");
    expect(meta.zoneCount).toBe(2);
    expect(meta.questCount).toBe(12);
    expect(meta.loreCount).toBe(4);
    expect(meta.assetCount).toBe(9);
    expect(meta.payloadBytes).toBeGreaterThan(0);
  });

  it("logs measured stage entries when stage logging is enabled", async () => {
    process.env.BULK_GEN_STAGE_LOGGING = "1";
    const logger = jest.fn();

    const result = await bulkGenObservability.measureBulkGenerationStage(
      {
        stage: "run.tick",
        logger,
        meta: ({ result: stageResult }) => ({
          runId: stageResult.runId,
          processed: stageResult.processed,
        }),
      },
      async () => ({ runId: "run-1", processed: 3 }),
    );

    expect(result).toEqual({ runId: "run-1", processed: 3 });
    expect(logger).toHaveBeenCalledTimes(1);
    expect(logger.mock.calls[0][0]).toContain('"stage":"run.tick"');
    expect(logger.mock.calls[0][0]).toContain('"processed":3');
  });
});
