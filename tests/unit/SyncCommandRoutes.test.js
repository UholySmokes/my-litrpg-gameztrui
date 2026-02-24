import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../../functions/lib/api-router.js");
const syncCore = require("../../functions/lib/sync-core.js");

function tempPath(prefix) {
	return path.join(
		os.tmpdir(),
		`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

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

function createCommandEnvelope({
	id,
	runId,
	clientSeq,
	contentVersion,
	verb = "ENTER_TILE",
	createdAt = "2026-02-23T10:00:00.000Z",
}) {
	return {
		id,
		runId,
		clientId: "godot-client-test",
		clientSeq,
		createdAt,
		contentVersion,
		command: {
			type: "TRIGGER",
			verb,
			triggerType: verb,
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		},
	};
}

describe("/api/sync/command route", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalGamePath = process.env.GAME_DB_PATH;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = tempPath("sync-command-db");
		gameDbPath = tempPath("sync-command-game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
	});

	afterEach(() => {
		if (originalSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncBackend;
		if (originalSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = originalSyncPath;
		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;
		if (originalGamePath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = originalGamePath;

		if (syncDbPath && fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (gameDbPath && fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("rejects malformed command payload", async () => {
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-1" },
			body: {
				id: "missing-command",
				runId: "run-command-1",
				clientId: "godot-client-test",
				clientSeq: 1,
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("INVALID_COMMAND_ENVELOPE");
	});

	it("requires authentication for command submission", async () => {
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: {},
			body: createCommandEnvelope({
				id: "cmd-auth-required-1",
				runId: "run-command-auth-required",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(401);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("UNAUTHENTICATED");
	});

	it("accepts a valid command envelope", async () => {
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-2" },
			body: createCommandEnvelope({
				id: "cmd-ok-1",
				runId: "run-command-ok",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
		expect(res.body.accepted[0].accepted).toBe(true);
	});

	it("returns reconcile on stale sequence", async () => {
		const manifest = syncCore.getWorldManifest();
		const user = "user-command-3";
		const runId = "run-command-stale";

		const firstReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "cmd-stale-1",
				runId,
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const firstRes = createRes();
		await handleApiRequest(firstReq, firstRes);
		expect(firstRes.statusCode).toBe(200);

		const staleReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "cmd-stale-2",
				runId,
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const staleRes = createRes();
		await handleApiRequest(staleReq, staleRes);
		expect(staleRes.statusCode).toBe(409);
		expect(staleRes.body.reconcileRequired).toBe(true);
		expect(staleRes.body.rejected[0].errorCode).toBe("STALE_CLIENT_SEQ");
	});

	it("treats replayed idempotency key as duplicate success", async () => {
		const manifest = syncCore.getWorldManifest();
		const user = "user-command-4";
		const runId = "run-command-replay";
		const payload = createCommandEnvelope({
			id: "cmd-replay-1",
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
		});

		const firstReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: payload,
		};
		const firstRes = createRes();
		await handleApiRequest(firstReq, firstRes);
		expect(firstRes.statusCode).toBe(200);

		const replayReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: payload,
		};
		const replayRes = createRes();
		await handleApiRequest(replayReq, replayRes);
		expect(replayRes.statusCode).toBe(200);
		expect(replayRes.body.accepted[0].duplicate).toBe(true);
	});

	it("returns reconcile on content mismatch", async () => {
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-5" },
			body: createCommandEnvelope({
				id: "cmd-mismatch-1",
				runId: "run-command-mismatch",
				clientSeq: 1,
				contentVersion: "bad-content-version",
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(409);
		expect(res.body.reconcileRequired).toBe(true);
		expect(res.body.rejected[0].errorCode).toBe("CONTENT_VERSION_MISMATCH");
	});

	it("rejects unsupported command verb", async () => {
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-6" },
			body: {
				...createCommandEnvelope({
					id: "cmd-verb-bad-1",
					runId: "run-command-verb-bad",
					clientSeq: 1,
					contentVersion: manifest.contentVersion,
				}),
				command: {
					type: "TRIGGER",
					verb: "TELEPORT",
					triggerType: "TELEPORT",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("UNSUPPORTED_COMMAND_VERB");
	});

	it("rejects mismatched command verb and trigger type", async () => {
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-7" },
			body: {
				...createCommandEnvelope({
					id: "cmd-verb-mismatch-1",
					runId: "run-command-verb-mismatch",
					clientSeq: 1,
					contentVersion: manifest.contentVersion,
				}),
				command: {
					type: "TRIGGER",
					verb: "INTERACT",
					triggerType: "ENTER_TILE",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("COMMAND_VERB_TRIGGER_MISMATCH");
	});
});
