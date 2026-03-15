import { afterEach, describe, expect, it, jest } from "@jest/globals";
import apiRouter from "../../functions/lib/api-router.js";
import sync from "../../functions/lib/sync.js";

const { handleApiRequest } = apiRouter;

function createRes() {
	const res = {
		statusCode: 0,
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

describe("api router sync routes", () => {
	const originalCommit = sync.commit;
	const originalAction = sync.action;
	const originalCommand = sync.command;
	const originalReplay = sync.replay;

	afterEach(() => {
		sync.commit = originalCommit;
		sync.action = originalAction;
		sync.command = originalCommand;
		sync.replay = originalReplay;
	});

	it("routes /api/sync/commit to canonical commit handler", async () => {
		sync.commit = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});
		const req = { method: "POST", url: "/api/sync/commit", headers: {} };
		const res = createRes();
		await handleApiRequest(req, res);
		expect(sync.commit).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
	});

	it("routes /api/sync/action with deprecation headers", async () => {
		sync.action = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});
		const req = { method: "POST", url: "/api/sync/action", headers: {} };
		const res = createRes();
		await handleApiRequest(req, res);
		expect(sync.action).toHaveBeenCalledTimes(1);
		expect(res.headers.Deprecation).toBe("true");
		expect(res.headers.Link).toContain("/api/sync/commit");
	});

	it("routes /api/sync/command to command handler", async () => {
		sync.command = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});
		const req = { method: "POST", url: "/api/sync/command", headers: {} };
		const res = createRes();
		await handleApiRequest(req, res);
		expect(sync.command).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
	});

	it("routes /api/sync/replay to replay handler", async () => {
		sync.replay = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});
		const req = { method: "GET", url: "/api/sync/replay?runId=run-1", headers: {} };
		const res = createRes();
		await handleApiRequest(req, res);
		expect(sync.replay).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
	});
});
