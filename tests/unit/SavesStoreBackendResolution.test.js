import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const savesStore = require("../../functions/lib/saves-store.js");

function makeTempFile(name) {
	return path.join(
		os.tmpdir(),
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

describe("saves-store backend resolution", () => {
	const oldSavesBackend = process.env.GAME_SAVES_STORAGE;
	const oldGameBackend = process.env.GAME_DB_STORAGE;
	const oldGameDbPath = process.env.GAME_DB_PATH;

	afterEach(() => {
		if (oldSavesBackend === undefined) delete process.env.GAME_SAVES_STORAGE;
		else process.env.GAME_SAVES_STORAGE = oldSavesBackend;

		if (oldGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = oldGameBackend;

		if (oldGameDbPath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = oldGameDbPath;
	});

	it("resolves explicit save backend overrides", () => {
		process.env.GAME_SAVES_STORAGE = "file";
		expect(savesStore.resolveSavesBackend()).toBe("file");

		process.env.GAME_SAVES_STORAGE = "firestore";
		expect(savesStore.resolveSavesBackend()).toBe("firestore");

		process.env.GAME_SAVES_STORAGE = "dataconnect";
		expect(savesStore.resolveSavesBackend()).toBe("dataconnect");

		process.env.GAME_SAVES_STORAGE = "supabase";
		expect(savesStore.resolveSavesBackend()).toBe("supabase");
	});

	it("falls back to file when game backend is file", () => {
		delete process.env.GAME_SAVES_STORAGE;
		process.env.GAME_DB_STORAGE = "file";
		expect(savesStore.resolveSavesBackend()).toBe("file");
	});

	it("falls back to file when the shared game backend is a legacy non-supabase backend", () => {
		delete process.env.GAME_SAVES_STORAGE;
		process.env.GAME_DB_STORAGE = "firestore";
		expect(savesStore.resolveSavesBackend()).toBe("file");
	});

	it("inherits supabase when the shared game backend is supabase", () => {
		delete process.env.GAME_SAVES_STORAGE;
		process.env.GAME_DB_STORAGE = "supabase";
		expect(savesStore.resolveSavesBackend()).toBe("supabase");
	});

	it("supports create/get/update/delete in file mode", async () => {
		const dbPath = makeTempFile("game-db");
		process.env.GAME_SAVES_STORAGE = "file";
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = dbPath;

		const saveId = "00000000-0000-4000-8000-000000000001";
		const created = await savesStore.createSave({
			saveId,
			userId: "user-1",
			saveName: "First Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", level: 1 },
				world: { id: "world-1", location: { current: "map-1" } },
			}),
			now: "2026-02-23T00:00:00.000Z",
		});
		expect(created.id).toBe(saveId);

		const listed = await savesStore.listSaves({ userId: "user-1", limit: 10 });
		expect(listed).toHaveLength(1);
		expect(listed[0].id).toBe(saveId);

		const fetched = await savesStore.getSave({ userId: "user-1", saveId });
		expect(fetched).not.toBeNull();
		expect(fetched.save_name).toBe("First Save");

		const updated = await savesStore.updateSave({
			userId: "user-1",
			saveId,
			saveName: "Updated Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", level: 2 },
				world: { id: "world-1", location: { current: "map-1" }, turnCount: 2 },
			}),
			now: "2026-02-23T00:01:00.000Z",
		});
		expect(updated).not.toBeNull();
		expect(updated.save_name).toBe("Updated Save");

		const deleted = await savesStore.deleteSave({ userId: "user-1", saveId });
		expect(deleted).toBe(true);

		if (fs.existsSync(dbPath)) {
			fs.unlinkSync(dbPath);
		}
	});
});
