import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const functionsRequire = createRequire(
	new URL("../../functions/lib/saves-store.js", import.meta.url),
);

const savesStore = require("../../functions/lib/saves-store.js");
const dataconnectGenerated = require("../../functions/src/dataconnect-admin-generated/index.cjs.js");
const firebaseAdminDataConnect = functionsRequire("firebase-admin/data-connect");
const firebaseAdminApp = functionsRequire("firebase-admin/app");
const firebaseAdminFirestore = functionsRequire("firebase-admin/firestore");

function makeFirestoreListDb(rows) {
	return {
		collection: () => ({
			where: () => ({
				orderBy: () => ({
					limit: () => ({
						get: async () => ({
							docs: rows.map((row) => ({
								id: row.id,
								data: () => row,
							})),
						}),
					}),
				}),
			}),
		}),
	};
}

describe("saves-store dataconnect behavior", () => {
	const originalSavesBackend = process.env.GAME_SAVES_STORAGE;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalStrict = process.env.SAVES_DATACONNECT_STRICT;
	const originalGameStrict = process.env.GAME_DATACONNECT_STRICT;

	const originalGetDataConnect = Object.getOwnPropertyDescriptor(
		firebaseAdminDataConnect,
		"getDataConnect",
	);
	const originalGetApps = Object.getOwnPropertyDescriptor(
		firebaseAdminApp,
		"getApps",
	);
	const originalInitializeApp = Object.getOwnPropertyDescriptor(
		firebaseAdminApp,
		"initializeApp",
	);
	const originalGetFirestore = Object.getOwnPropertyDescriptor(
		firebaseAdminFirestore,
		"getFirestore",
	);
	const originalTimestamp = Object.getOwnPropertyDescriptor(
		firebaseAdminFirestore,
		"Timestamp",
	);

	const originalUpsertMyProfile = dataconnectGenerated.upsertMyProfile;
	const originalListMySaveSlots = dataconnectGenerated.listMySaveSlots;
	const originalGetMySaveSlot = dataconnectGenerated.getMySaveSlot;
	const originalUpsertSaveSlot = dataconnectGenerated.upsertSaveSlot;
	const originalDeleteSaveSlot = dataconnectGenerated.deleteSaveSlot;

	beforeEach(() => {
		process.env.GAME_SAVES_STORAGE = "dataconnect";
		process.env.GAME_DB_STORAGE = "firestore";
		delete process.env.SAVES_DATACONNECT_STRICT;
		delete process.env.GAME_DATACONNECT_STRICT;

		Object.defineProperty(firebaseAdminDataConnect, "getDataConnect", {
			value: jest.fn(() => ({ mockDc: true })),
			configurable: true,
		});
		Object.defineProperty(firebaseAdminApp, "getApps", {
			value: jest.fn(() => [{ name: "app" }]),
			configurable: true,
		});
		Object.defineProperty(firebaseAdminApp, "initializeApp", {
			value: jest.fn(() => ({})),
			configurable: true,
		});
		Object.defineProperty(firebaseAdminFirestore, "getFirestore", {
			value: jest.fn(() => makeFirestoreListDb([])),
			configurable: true,
		});
		Object.defineProperty(firebaseAdminFirestore, "Timestamp", {
			value: {
				fromDate: (date) => ({
					toDate: () => date,
				}),
			},
			configurable: true,
		});
	});

	afterEach(() => {
		if (originalSavesBackend === undefined) delete process.env.GAME_SAVES_STORAGE;
		else process.env.GAME_SAVES_STORAGE = originalSavesBackend;
		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;
		if (originalStrict === undefined) delete process.env.SAVES_DATACONNECT_STRICT;
		else process.env.SAVES_DATACONNECT_STRICT = originalStrict;
		if (originalGameStrict === undefined)
			delete process.env.GAME_DATACONNECT_STRICT;
		else process.env.GAME_DATACONNECT_STRICT = originalGameStrict;

		Object.defineProperty(
			firebaseAdminDataConnect,
			"getDataConnect",
			originalGetDataConnect,
		);
		Object.defineProperty(firebaseAdminApp, "getApps", originalGetApps);
		Object.defineProperty(
			firebaseAdminApp,
			"initializeApp",
			originalInitializeApp,
		);
		Object.defineProperty(
			firebaseAdminFirestore,
			"getFirestore",
			originalGetFirestore,
		);
		Object.defineProperty(
			firebaseAdminFirestore,
			"Timestamp",
			originalTimestamp,
		);

		dataconnectGenerated.upsertMyProfile = originalUpsertMyProfile;
		dataconnectGenerated.listMySaveSlots = originalListMySaveSlots;
		dataconnectGenerated.getMySaveSlot = originalGetMySaveSlot;
		dataconnectGenerated.upsertSaveSlot = originalUpsertSaveSlot;
		dataconnectGenerated.deleteSaveSlot = originalDeleteSaveSlot;
	});

	it("purges dataconnect save slots for a user", async () => {
		dataconnectGenerated.listMySaveSlots = jest.fn(async () => ({
			data: {
				userProfile: {
					saveSlots: [
						{
							id: "00000000-0000-4000-8000-000000000001",
							saveName: "A",
							updatedAt: "2026-03-06T00:00:00.000Z",
						},
						{
							id: "00000000-0000-4000-8000-000000000002",
							saveName: "B",
							updatedAt: "2026-03-06T00:00:01.000Z",
						},
					],
				},
			},
		}));
		dataconnectGenerated.deleteSaveSlot = jest.fn(async () => ({
			data: { saveSlot_delete: { id: "deleted" } },
		}));

		const result = await savesStore.purgeUserProgress({ ownerId: "user-1" });

		expect(result.deletedSaveCount).toBe(2);
		expect(dataconnectGenerated.deleteSaveSlot).toHaveBeenCalledTimes(2);
	});

	it("lists save slots via dataconnect with descending updated_at ordering", async () => {
		dataconnectGenerated.listMySaveSlots = jest.fn(async () => ({
			data: {
				userProfile: {
					saveSlots: [
						{
							id: "s1",
							saveName: "Older",
							gameStateJson: "{}",
							createdAt: "2026-02-23T00:00:00.000Z",
							updatedAt: "2026-02-23T00:00:01.000Z",
						},
						{
							id: "s2",
							saveName: "Newer",
							gameStateJson: "{}",
							createdAt: "2026-02-23T00:00:00.000Z",
							updatedAt: "2026-02-23T00:00:02.000Z",
						},
					],
				},
			},
		}));

		const rows = await savesStore.listSaves({ userId: "user-1", limit: 1 });
		expect(dataconnectGenerated.listMySaveSlots).toHaveBeenCalledTimes(1);
		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("s2");
	});

	it("creates save via dataconnect and maps metadata fields", async () => {
		dataconnectGenerated.upsertMyProfile = jest.fn(async () => ({
			data: { userProfile_upsert: { id: "user-1" } },
		}));
		dataconnectGenerated.upsertSaveSlot = jest.fn(async () => ({
			data: { saveSlot_upsert: { id: "00000000-0000-4000-8000-000000000010" } },
		}));
		dataconnectGenerated.getMySaveSlot = jest.fn(async () => ({
			data: {
				saveSlot: {
					id: "00000000-0000-4000-8000-000000000010",
					saveName: "Slice Save",
					gameStateJson:
						'{"player":{"name":"Traveler","level":4},"world":{"id":"w1","location":{"current":"map_a"},"turnCount":7},"runId":"run-10","seq":7,"tick":7}',
					createdAt: "2026-02-23T00:00:00.000Z",
					updatedAt: "2026-02-23T00:00:01.000Z",
				},
			},
		}));

		const row = await savesStore.createSave({
			saveId: "00000000-0000-4000-8000-000000000010",
			userId: "user-1",
			saveName: "Slice Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", level: 4 },
				world: { id: "w1", location: { current: "map_a" }, turnCount: 7 },
				runId: "run-10",
				seq: 7,
				tick: 7,
			}),
			now: "2026-02-23T00:00:00.000Z",
		});

		expect(dataconnectGenerated.upsertMyProfile).toHaveBeenCalledTimes(1);
		expect(dataconnectGenerated.upsertSaveSlot).toHaveBeenCalledTimes(1);
		const vars = dataconnectGenerated.upsertSaveSlot.mock.calls[0][1];
		expect(vars.worldId).toBe("w1");
		expect(vars.mapId).toBe("map_a");
		expect(vars.playerLevel).toBe(4);
		expect(vars.runId).toBe("run-10");
		expect(vars.seq).toBe(7);
		expect(row.id).toBe("00000000-0000-4000-8000-000000000010");
	});

	it("respects strict mode by throwing on dataconnect failures", async () => {
		process.env.SAVES_DATACONNECT_STRICT = "true";
		dataconnectGenerated.listMySaveSlots = jest.fn(async () => {
			throw new Error("dataconnect unavailable");
		});

		await expect(
			savesStore.listSaves({ userId: "user-strict", limit: 10 }),
		).rejects.toThrow("dataconnect unavailable");
	});

	it("falls back to firestore when dataconnect fails and strict mode is off", async () => {
		dataconnectGenerated.listMySaveSlots = jest.fn(async () => {
			throw new Error("dataconnect unavailable");
		});
		Object.defineProperty(firebaseAdminFirestore, "getFirestore", {
			value: jest.fn(() =>
				makeFirestoreListDb([
					{
						id: "fire-1",
						user_id: "user-fallback",
						save_name: "Firestore Save",
						game_state: "{}",
						created_at: "2026-02-23T00:00:00.000Z",
						updated_at: "2026-02-23T00:00:03.000Z",
					},
				]),
			),
			configurable: true,
		});

		const rows = await savesStore.listSaves({ userId: "user-fallback", limit: 10 });
		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("fire-1");
		expect(rows[0].save_name).toBe("Firestore Save");
	});
});
