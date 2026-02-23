import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sync = require("../../functions/lib/sync.js");
const syncCore = require("../../functions/lib/sync-core.js");

function makeTempFile(name) {
	return path.join(
		os.tmpdir(),
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

function commit({
	id,
	runId,
	clientSeq,
	createdAt,
	contentVersion,
	triggerType,
	triggerId,
	mapId,
	x,
	y,
	targetId,
}) {
	return {
		id,
		runId,
		clientId: "godot-client-1",
		clientSeq,
		createdAt,
		contentVersion,
		triggerType,
		trigger: {
			triggerId,
			mapId,
			x,
			y,
			targetId,
		},
	};
}

describe("sync process commit stream", () => {
	const oldSyncBackend = process.env.SYNC_DB_STORAGE;
	const oldSyncPath = process.env.SYNC_DB_PATH;
	const oldGameBackend = process.env.GAME_DB_STORAGE;
	const oldGamePath = process.env.GAME_DB_PATH;
	const oldCanonicalPersistence = process.env.SYNC_CANONICAL_PERSISTENCE;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = makeTempFile("sync-db");
		gameDbPath = makeTempFile("game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
		process.env.SYNC_CANONICAL_PERSISTENCE = "fallback";
	});

	afterEach(() => {
		if (oldSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = oldSyncBackend;
		if (oldSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = oldSyncPath;
		if (oldGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = oldGameBackend;
		if (oldGamePath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = oldGamePath;
		if (oldCanonicalPersistence === undefined)
			delete process.env.SYNC_CANONICAL_PERSISTENCE;
		else process.env.SYNC_CANONICAL_PERSISTENCE = oldCanonicalPersistence;

		if (fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("accepts ordered ENTER_TILE commit batches and keeps idempotency by commit id", async () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-batch-1";

		const first = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "batch-commit-1",
					runId,
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
				commit({
					id: "batch-commit-2",
					runId,
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:00.050Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
			],
		});

		expect(first.ok).toBe(true);
		expect(first.reconcileRequired).toBe(false);
		expect(first.results.filter((x) => x.accepted)).toHaveLength(2);
		expect(first.canonicalState.seq).toBe(2);

		const duplicate = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "batch-commit-2",
					runId,
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:00.050Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
			],
		});
		expect(duplicate.ok).toBe(true);
		expect(duplicate.results[0].accepted).toBe(true);
		expect(duplicate.results[0].duplicate).toBe(true);
	});

	it("accepts immediate triggers and updates canonical state", async () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-immediate-1";

		const result = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "c1",
					runId,
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
				commit({
					id: "c2",
					runId,
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:01.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "INTERACT",
					triggerId: "npc_guide_interact",
					mapId: "map_village_square",
					x: 10,
					y: 8,
					targetId: "npc_guide",
				}),
				commit({
					id: "c3",
					runId,
					clientSeq: 3,
					createdAt: "2026-02-23T10:00:02.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENCOUNTER_GATE",
					triggerId: "encounter_gate_training",
					mapId: "map_village_square",
					x: 18,
					y: 8,
					targetId: "encounter_gate_training_01",
				}),
				commit({
					id: "c4",
					runId,
					clientSeq: 4,
					createdAt: "2026-02-23T10:00:03.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ZONE_EXIT",
					triggerId: "zone_exit_back_to_square",
					mapId: "map_training_glade",
					x: 0,
					y: 2,
				}),
				commit({
					id: "c5",
					runId,
					clientSeq: 5,
					createdAt: "2026-02-23T10:00:04.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "SAVEPOINT",
					triggerId: "savepoint_square_crystal",
					mapId: "map_village_square",
					x: 4,
					y: 4,
					targetId: "save_crystal_square_01",
				}),
			],
		});

		expect(result.ok).toBe(true);
		expect(result.reconcileRequired).toBe(false);
		expect(result.results.every((entry) => entry.accepted)).toBe(true);
		expect(result.canonicalState.seq).toBe(5);
		expect(result.canonicalState.mapId).toBe("map_village_square");
	});

	it("returns reject-and-reconcile for invalid trigger and keeps canonical tip", async () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-reconcile-1";

		const first = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "ok-1",
					runId,
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
			],
		});
		expect(first.ok).toBe(true);

		const rejected = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "bad-2",
					runId,
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:01.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "INTERACT",
					triggerId: "npc_guide_interact",
					mapId: "map_village_square",
					x: 11,
					y: 8,
					targetId: "npc_guide",
				}),
			],
		});
		expect(rejected.ok).toBe(true);
		expect(rejected.reconcileRequired).toBe(true);
		expect(rejected.results[0].accepted).toBe(false);
		expect(rejected.results[0].errorCode).toBe("TRIGGER_COORDINATES_MISMATCH");

		const loaded = await sync.loadRunState({
			ownerId: "user-1",
			runId,
			manifest,
			allowCreate: false,
		});
		expect(loaded.state.seq).toBe(1);
		expect(loaded.state.tick).toBe(1);
	});

	it("rejects contentVersion mismatch", async () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-content-version-1";
		const result = await sync.processCommitStream({
			ownerId: "user-1",
			manifest,
			commits: [
				commit({
					id: "bad-content-1",
					runId,
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: "deadbeef",
					triggerType: "ENTER_TILE",
					triggerId: "tile_intro_square",
					mapId: "map_village_square",
					x: 6,
					y: 8,
				}),
			],
		});
		expect(result.reconcileRequired).toBe(true);
		expect(result.results[0].accepted).toBe(false);
		expect(result.results[0].errorCode).toBe("CONTENT_VERSION_MISMATCH");
	});
});
