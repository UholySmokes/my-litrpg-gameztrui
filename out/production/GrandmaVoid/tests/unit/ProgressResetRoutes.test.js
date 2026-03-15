import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

import apiRouter from "../../functions/lib/api-router.js";

const require = createRequire(import.meta.url);
const savesStore = require("../../functions/lib/saves-store.js");
const syncStore = require("../../functions/lib/sync-store.js");

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

describe("progress reset routes", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalGamePath = process.env.GAME_DB_PATH;
	const originalSavesBackend = process.env.GAME_SAVES_STORAGE;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = tempPath("progress-reset-sync-db");
		gameDbPath = tempPath("progress-reset-game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
		process.env.GAME_SAVES_STORAGE = "file";
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
		if (originalSavesBackend === undefined) delete process.env.GAME_SAVES_STORAGE;
		else process.env.GAME_SAVES_STORAGE = originalSavesBackend;

		if (syncDbPath && fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (gameDbPath && fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("blocks save and sync routes until reset completes, then purges persisted progress", async () => {
		const ownerId = "user-reset-1";
		const runId = "run-reset-1";

		await savesStore.createSave({
			saveId: "00000000-0000-4000-8000-000000000111",
			userId: ownerId,
			saveName: "Legacy Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", origin: null },
				world: { id: "world-1", location: { current: "map-1" } },
			}),
			now: "2026-03-06T00:00:00.000Z",
		});
		await syncStore.putRun({
			ownerId,
			runId,
			state: {
				worldId: "world-1",
				mapId: "map-1",
				playerPos: { x: 1, y: 2 },
				entityStates: {},
				questFlags: {},
				runId,
				seq: 1,
				tick: 1,
				stateHash: "hash-1",
				contentVersion: "cv-1",
				stateVersion: 1,
				runSeed: "seed-1",
			},
		});
		await syncStore.appendEvent({
			ownerId,
			runId,
			event: {
				commit_id: "commit-1",
				client_seq: 1,
				accepted: true,
				seq: 1,
				tick: 1,
				state_hash: "hash-1",
				commit: {
					clientId: "client-1",
					triggerType: "ENTER_TILE",
					contentVersion: "cv-1",
				},
			},
		});

		const gatedSavesReq = {
			method: "GET",
			url: "/api/saves",
			headers: { "x-dev-user-id": ownerId },
		};
		const gatedSavesRes = createRes();
		await handleApiRequest(gatedSavesReq, gatedSavesRes);
		expect(gatedSavesRes.statusCode).toBe(409);
		expect(gatedSavesRes.body.errorCode).toBe("PROGRESS_RESET_REQUIRED");

		const gatedSyncReq = {
			method: "GET",
			url: `/api/sync/pull?runId=${runId}`,
			headers: { "x-dev-user-id": ownerId },
			query: { runId },
		};
		const gatedSyncRes = createRes();
		await handleApiRequest(gatedSyncReq, gatedSyncRes);
		expect(gatedSyncRes.statusCode).toBe(409);
		expect(gatedSyncRes.body.errorCode).toBe("PROGRESS_RESET_REQUIRED");

		const resetReq = {
			method: "POST",
			url: "/api/saves/reset-legacy",
			headers: { "x-dev-user-id": ownerId },
		};
		const resetRes = createRes();
		await handleApiRequest(resetReq, resetRes);
		expect(resetRes.statusCode).toBe(200);
		expect(resetRes.body.ok).toBe(true);
		expect(resetRes.body.deletedSaveCount).toBe(1);
		expect(resetRes.body.deletedRunCount).toBe(1);
		expect(resetRes.body.deletedEventCount).toBe(1);

		const savesAfterResetReq = {
			method: "GET",
			url: "/api/saves",
			headers: { "x-dev-user-id": ownerId },
		};
		const savesAfterResetRes = createRes();
		await handleApiRequest(savesAfterResetReq, savesAfterResetRes);
		expect(savesAfterResetRes.statusCode).toBe(200);
		expect(savesAfterResetRes.body.saves).toEqual([]);

		await expect(syncStore.getMigrationVersion({ ownerId })).resolves.toBe(2);
		await expect(syncStore.getRun({ ownerId, runId })).resolves.toBeNull();
		await expect(syncStore.listEvents({ ownerId, runId })).resolves.toEqual([]);
	});
});
