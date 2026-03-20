import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handlers = require("../../functions/lib/bulk-generation-handlers.js");
const auth = require("../../functions/lib/auth.js");
const bulkService = require("../../functions/lib/bulk-generation-service.js");

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

describe("bulk generation handlers auth", () => {
	const originalGetUserFromRequest = auth.getUserFromRequest;
	const originalStartBulkGenerationRun = bulkService.startBulkGenerationRun;
	const originalAllowedUserIds = process.env.BULK_GEN_ALLOWED_USER_IDS;
	const originalInternalToken = process.env.BULK_GEN_INTERNAL_TOKEN;

	beforeEach(() => {
		auth.getUserFromRequest = jest.fn(async () => ({ id: "user-1" }));
		bulkService.startBulkGenerationRun = jest.fn(async () => ({
			run_id: "run-1",
			status: "queued",
			max_tasks: 4,
			max_estimated_eur: 12,
			expires_at: "2026-03-20T00:00:00.000Z",
		}));
		delete process.env.BULK_GEN_ALLOWED_USER_IDS;
		delete process.env.BULK_GEN_INTERNAL_TOKEN;
	});

	afterEach(() => {
		auth.getUserFromRequest = originalGetUserFromRequest;
		bulkService.startBulkGenerationRun = originalStartBulkGenerationRun;

		if (originalAllowedUserIds === undefined) {
			delete process.env.BULK_GEN_ALLOWED_USER_IDS;
		} else {
			process.env.BULK_GEN_ALLOWED_USER_IDS = originalAllowedUserIds;
		}

		if (originalInternalToken === undefined) {
			delete process.env.BULK_GEN_INTERNAL_TOKEN;
		} else {
			process.env.BULK_GEN_INTERNAL_TOKEN = originalInternalToken;
		}
	});

	it("returns 403 for authenticated users when no operator allowlist is configured", async () => {
		const req = {
			method: "POST",
			headers: {},
			body: { zoneIds: ["zone-a"] },
		};
		const res = createRes();

		await handlers.startRun(req, res);

		expect(res.statusCode).toBe(403);
		expect(res.body.errorCode).toBe("FORBIDDEN");
		expect(bulkService.startBulkGenerationRun).not.toHaveBeenCalled();
	});

	it("allows internal-token callers even without an operator allowlist", async () => {
		process.env.BULK_GEN_INTERNAL_TOKEN = "top-secret-token";
		const req = {
			method: "POST",
			headers: {
				"x-bulk-gen-token": "top-secret-token",
			},
			body: { zoneIds: ["zone-a"] },
		};
		const res = createRes();

		await handlers.startRun(req, res);

		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(bulkService.startBulkGenerationRun).toHaveBeenCalledWith(
			expect.objectContaining({
				ownerId: "internal-bulk-operator",
			}),
		);
	});

	it("allows explicitly listed operators and rejects other signed-in users", async () => {
		process.env.BULK_GEN_ALLOWED_USER_IDS = "operator-1,operator-2";
		auth.getUserFromRequest = jest.fn(async () => ({ id: "operator-2" }));
		const req = {
			method: "POST",
			headers: {},
			body: { zoneIds: ["zone-a"] },
		};
		const res = createRes();

		await handlers.startRun(req, res);

		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(bulkService.startBulkGenerationRun).toHaveBeenCalledWith(
			expect.objectContaining({
				ownerId: "operator-2",
			}),
		);

		auth.getUserFromRequest = jest.fn(async () => ({ id: "user-9" }));
		const forbiddenRes = createRes();
		await handlers.startRun(req, forbiddenRes);

		expect(forbiddenRes.statusCode).toBe(403);
		expect(forbiddenRes.body.errorCode).toBe("FORBIDDEN");
	});
});
