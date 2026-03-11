import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../../functions/lib/api-router.js");

function createRes() {
	const res = {
		statusCode: 0,
		headers: {},
		body: null,
	};
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.set = (key, value) => {
		res.headers[key] = value;
		return res;
	};
	res.json = (value) => {
		res.body = value;
		return res;
	};
	return res;
}

describe("/api/telemetry route", () => {
	let consoleSpy;

	beforeEach(() => {
		consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("requires authentication", async () => {
		const req = {
			method: "POST",
			url: "/api/telemetry",
			headers: {},
			body: {
				source: "web",
				events: [{ type: "hud_loaded" }],
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(401);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("UNAUTHENTICATED");
	});

	it("rejects invalid telemetry batch payloads", async () => {
		const req = {
			method: "POST",
			url: "/api/telemetry",
			headers: { "x-dev-user-id": "telemetry-user-1" },
			body: {
				source: "web",
				events: [],
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("INVALID_TELEMETRY_BATCH");
	});

	it("accepts valid telemetry batches", async () => {
		const req = {
			method: "POST",
			url: "/api/telemetry",
			headers: {
				"x-dev-user-id": "telemetry-user-2",
				"x-dev-user-email": "telemetry-user-2@example.test",
			},
			body: {
				source: "godot",
				sessionId: "session-1",
				build: "godot-4.6.1",
				clientTime: "2026-02-24T16:01:00.000Z",
				tags: {
					client: "godot",
					platform: "windows",
				},
				events: [
					{
						type: "sync_pull",
						level: "info",
						ts: "2026-02-24T16:00:00.000Z",
						message: "pull success",
						data: { seq: 12, tick: 12 },
					},
					{
						type: "sync_command_reconcile",
						level: "warn",
						ts: "2026-02-24T16:00:01.000Z",
						message: "reconcile required",
						data: { errorCode: "STALE_CLIENT_SEQ" },
					},
				],
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(202);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toBe(2);
		expect(res.body.dropped).toBe(0);
		expect(typeof res.body.requestId).toBe("string");
		expect(res.body.requestId.length).toBeGreaterThan(0);
	});
});
