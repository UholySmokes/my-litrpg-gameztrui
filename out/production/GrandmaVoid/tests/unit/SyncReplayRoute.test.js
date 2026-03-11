import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

import apiRouter from "../../functions/lib/api-router.js";
import syncCore from "../../functions/lib/sync-core.js";

const require = createRequire(import.meta.url);
const syncStore = require("../../functions/lib/sync-store.js");
const { SAVE_RESET_EPOCH } = require("../../shared/save-cutover.cjs");

const { handleApiRequest } = apiRouter;

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
	verb,
	triggerId,
	mapId,
	x,
	y,
	targetId,
	createdAt,
}) {
	return {
		id,
		runId,
		clientId: "replay-test-client",
		clientSeq,
		createdAt,
		contentVersion,
		command: {
			type: "TRIGGER",
			verb,
			triggerType: verb,
			trigger: {
				triggerId,
				mapId,
				x,
				y,
				targetId,
			},
		},
	};
}

async function allowSyncForUser(ownerId) {
	await syncStore.markMigrationVersion({
		ownerId,
		version: SAVE_RESET_EPOCH,
		displayName: "Sync Replay Route Test",
	});
}

describe("/api/sync/replay route", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalGamePath = process.env.GAME_DB_PATH;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = tempPath("sync-replay-db");
		gameDbPath = tempPath("sync-replay-game-db");
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

	it("rejects replay requests without runId", async () => {
		await allowSyncForUser("user-replay-0");
		const req = {
			method: "GET",
			url: "/api/sync/replay",
			headers: { "x-dev-user-id": "user-replay-0" },
			query: {},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("MISSING_RUN_ID");
	});

	it("returns 404 when replay run does not exist", async () => {
		await allowSyncForUser("user-replay-0");
		const req = {
			method: "GET",
			url: "/api/sync/replay",
			headers: { "x-dev-user-id": "user-replay-0" },
			query: { runId: "run-missing" },
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(404);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("RUN_NOT_FOUND");
	});

	it("returns replay timeline and hash checkpoints with optional rejected events", async () => {
		const manifest = syncCore.getWorldManifest();
		const user = "user-replay-1";
		const runId = "run-replay-1";
		await allowSyncForUser(user);

		const firstReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "replay-c1",
				runId,
				clientSeq: 1,
				createdAt: "2026-02-24T12:00:00.000Z",
				contentVersion: manifest.contentVersion,
				verb: "ENTER_TILE",
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			}),
		};
		const firstRes = createRes();
		await handleApiRequest(firstReq, firstRes);
		expect(firstRes.statusCode).toBe(200);

		const secondReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "replay-c2",
				runId,
				clientSeq: 2,
				createdAt: "2026-02-24T12:00:01.000Z",
				contentVersion: manifest.contentVersion,
				verb: "INTERACT",
				triggerId: "npc_guide_interact",
				mapId: "map_village_square",
				x: 10,
				y: 8,
				targetId: "npc_guide",
			}),
		};
		const secondRes = createRes();
		await handleApiRequest(secondReq, secondRes);
		expect(secondRes.statusCode).toBe(200);

		const staleReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "replay-c3-stale",
				runId,
				clientSeq: 2,
				createdAt: "2026-02-24T12:00:02.000Z",
				contentVersion: manifest.contentVersion,
				verb: "INTERACT",
				triggerId: "npc_guide_interact",
				mapId: "map_village_square",
				x: 10,
				y: 8,
				targetId: "npc_guide",
			}),
		};
		const staleRes = createRes();
		await handleApiRequest(staleReq, staleRes);
		expect(staleRes.statusCode).toBe(409);

		const replayReq = {
			method: "GET",
			url: "/api/sync/replay",
			headers: { "x-dev-user-id": user },
			query: { runId, limit: "10" },
		};
		const replayRes = createRes();
		await handleApiRequest(replayReq, replayRes);
		expect(replayRes.statusCode).toBe(200);
		expect(replayRes.body.ok).toBe(true);
		expect(replayRes.body.timeline).toHaveLength(2);
		expect(replayRes.body.timeline.every((entry) => entry.accepted)).toBe(true);
		expect(replayRes.body.hashTimeline).toHaveLength(2);
		expect(replayRes.body.hashTimeline[1].stateHash).toBe(
			replayRes.body.canonicalState.stateHash,
		);

		const replayWithRejectedReq = {
			method: "GET",
			url: "/api/sync/replay",
			headers: { "x-dev-user-id": user },
			query: { runId, includeRejected: "true", limit: "10" },
		};
		const replayWithRejectedRes = createRes();
		await handleApiRequest(replayWithRejectedReq, replayWithRejectedRes);
		expect(replayWithRejectedRes.statusCode).toBe(200);
		expect(replayWithRejectedRes.body.timeline).toHaveLength(3);
		expect(
			replayWithRejectedRes.body.timeline.some(
				(entry) => !entry.accepted && entry.errorCode === "STALE_CLIENT_SEQ",
			),
		).toBe(true);
	});
});
