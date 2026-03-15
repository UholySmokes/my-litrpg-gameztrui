import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const routeLatency = require("../../functions/lib/route-latency.js");

afterEach(() => {
	delete process.env.SYNC_ROUTE_LATENCY_LOGGING;
});

describe("route latency logging", () => {
	it("builds a stable log payload", () => {
		const entry = routeLatency.buildRouteLatencyLogEntry({
			scope: "sync",
			route: "replay",
			req: { method: "GET", url: "/api/sync/replay?runId=run-1" },
			res: { statusCode: 200 },
			durationMs: 12.345,
			meta: { runId: "run-1", limit: 200 },
		});

		expect(entry).toEqual({
			scope: "sync",
			route: "replay",
			method: "GET",
			path: "/api/sync/replay",
			statusCode: 200,
			durationMs: 12.35,
			runId: "run-1",
			limit: 200,
		});
	});

	it("logs when the sync latency flag is enabled", async () => {
		process.env.SYNC_ROUTE_LATENCY_LOGGING = "1";
		const logger = jest.fn();

		await routeLatency.withRouteLatency(
			{
				scope: "sync",
				route: "command",
				req: { method: "POST", url: "/api/sync/command", body: { runId: "run-1" } },
				res: { statusCode: 200 },
				meta: { runId: "run-1", payloadBytes: 18 },
				logger,
			},
			async () => "ok",
		);

		expect(logger).toHaveBeenCalledTimes(1);
		expect(logger.mock.calls[0][0]).toContain('"route":"command"');
		expect(logger.mock.calls[0][0]).toContain('"runId":"run-1"');
	});
});
