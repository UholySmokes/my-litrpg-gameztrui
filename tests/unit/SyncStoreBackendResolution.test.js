import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncStore = require("../../functions/lib/sync-store.js");

function makeTempFile(name) {
	return path.join(
		os.tmpdir(),
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

describe("sync-store backend resolution", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	let syncDbPath = "";

	afterEach(() => {
		if (originalSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncBackend;

		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;

		if (originalSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = originalSyncPath;

		if (syncDbPath && fs.existsSync(syncDbPath)) {
			fs.unlinkSync(syncDbPath);
		}
	});

	it("resolves explicit sync backend overrides", () => {
		process.env.SYNC_DB_STORAGE = "file";
		expect(syncStore.resolveSyncBackend()).toBe("file");

		process.env.SYNC_DB_STORAGE = "firestore";
		expect(syncStore.resolveSyncBackend()).toBe("firestore");

		process.env.SYNC_DB_STORAGE = "dataconnect";
		expect(syncStore.resolveSyncBackend()).toBe("dataconnect");

		process.env.SYNC_DB_STORAGE = "supabase";
		expect(syncStore.resolveSyncBackend()).toBe("supabase");
	});

	it("falls back to file when game backend is file", () => {
		delete process.env.SYNC_DB_STORAGE;
		process.env.GAME_DB_STORAGE = "file";
		expect(syncStore.resolveSyncBackend()).toBe("file");
	});

	it("defaults to dataconnect when game backend is not file", () => {
		delete process.env.SYNC_DB_STORAGE;
		process.env.GAME_DB_STORAGE = "firestore";
		expect(syncStore.resolveSyncBackend()).toBe("dataconnect");
	});

	it("inherits supabase when the shared game backend is supabase", () => {
		delete process.env.SYNC_DB_STORAGE;
		process.env.GAME_DB_STORAGE = "supabase";
		expect(syncStore.resolveSyncBackend()).toBe("supabase");
	});

	it("persists migration metadata for file backend", async () => {
		syncDbPath = makeTempFile("sync-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		await expect(
			syncStore.getMigrationVersion({ ownerId: "user-1" }),
		).resolves.toBe(0);
		await expect(
			syncStore.markMigrationVersion({
				ownerId: "user-1",
				version: 1,
				displayName: "Traveler",
			}),
		).resolves.toBe(true);
		await expect(
			syncStore.getMigrationVersion({ ownerId: "user-1" }),
		).resolves.toBe(1);
	});
});
