import { afterEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncStore = require("../../functions/lib/sync-store.js");

describe("sync-store backend resolution", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalGameBackend = process.env.GAME_DB_STORAGE;

	afterEach(() => {
		if (originalSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncBackend;

		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;
	});

	it("resolves explicit sync backend overrides", () => {
		process.env.SYNC_DB_STORAGE = "file";
		expect(syncStore.resolveSyncBackend()).toBe("file");

		process.env.SYNC_DB_STORAGE = "firestore";
		expect(syncStore.resolveSyncBackend()).toBe("firestore");

		process.env.SYNC_DB_STORAGE = "dataconnect";
		expect(syncStore.resolveSyncBackend()).toBe("dataconnect");
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
});
