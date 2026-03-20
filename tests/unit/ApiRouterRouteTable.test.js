import { describe, expect, it, jest, afterEach } from "@jest/globals";
import apiRouter from "../../functions/lib/api-router.js";
import sync from "../../functions/lib/sync.js";
import { findApiRoute, normalizePath } from "../../functions/lib/api-route-table.js";

const { handleApiRequest, MAX_BODY_SIZE } = apiRouter;

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

describe("api router route table", () => {
	const originalSyncAction = sync.action;

	afterEach(() => {
		sync.action = originalSyncAction;
	});

	it("normalizes paths before route lookup", () => {
		expect(normalizePath("/api//sync/action?runId=abc")).toBe("/api/sync/action");
	});

	it("dispatches duplicated slash paths through the normalized router path", async () => {
		sync.action = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});

		const req = { method: "POST", url: "///api//sync//action?runId=abc", headers: {} };
		const res = createRes();

		await handleApiRequest(req, res);

		expect(sync.action).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
	});

	it("uses originalUrl when a scoped function sits behind hosting rewrites", async () => {
		sync.action = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});

		const req = {
			method: "POST",
			url: "/sync/action",
			originalUrl: "/api/sync/action",
			headers: {},
		};
		const res = createRes();

		await handleApiRequest(req, res, {
			allowedRouteNames: new Set(["sync-action"]),
		});

		expect(sync.action).toHaveBeenCalledTimes(1);
		expect(res.statusCode).toBe(200);
	});

	it("honors method restrictions during route lookup", () => {
		expect(findApiRoute("/api/sync/commit", "GET")).toBeNull();
		expect(findApiRoute("/api/sync/commit", "POST")?.route.name).toBe("sync-commit");
	});

	it("keeps reset-legacy ahead of the generic saves route", () => {
		expect(findApiRoute("/api/saves/reset-legacy", "POST")?.route.name).toBe(
			"saves-reset-legacy",
		);
		expect(findApiRoute("/api/saves/abc123", "GET")?.route.name).toBe("saves");
	});

	it("dispatches sync action through the table and preserves deprecation headers", async () => {
		sync.action = jest.fn(async (_req, res) => {
			res.status(200).set("Content-Type", "application/json").json({ ok: true });
		});

		const req = { method: "POST", url: "/api/sync/action", headers: {} };
		const res = createRes();

		await handleApiRequest(req, res);

		expect(sync.action).toHaveBeenCalledTimes(1);
		expect(res.headers.Deprecation).toBe("true");
		expect(res.headers.Sunset).toBe("Wed, 01 Jul 2026 00:00:00 GMT");
		expect(res.headers.Link).toContain("/api/sync/commit");
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
	});

	it("returns 404 for unmatched routes after table lookup fails", async () => {
		const req = { method: "GET", url: "/api/nope", headers: {} };
		const res = createRes();

		await handleApiRequest(req, res);

		expect(res.statusCode).toBe(404);
		expect(res.body.errorCode).toBe("NOT_FOUND");
	});

	it("returns 404 when a scoped function receives a route outside its allowlist", async () => {
		const req = { method: "POST", url: "/api/narrate", headers: {} };
		const res = createRes();

		await handleApiRequest(req, res, {
			allowedRouteNames: new Set(["sync-commit"]),
		});

		expect(res.statusCode).toBe(404);
		expect(res.body.errorCode).toBe("NOT_FOUND");
	});

	it("rejects oversized bodies before route dispatch", async () => {
		const req = {
			method: "POST",
			url: "/api/narrate",
			headers: {
				"content-length": String(MAX_BODY_SIZE + 1),
			},
			body: "x",
		};
		const res = createRes();

		await handleApiRequest(req, res);

		expect(res.statusCode).toBe(413);
		expect(res.body.errorCode).toBe("PAYLOAD_TOO_LARGE");
	});
});
