import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const savesStore = require("../../functions/lib/saves-store.js");
const supabaseStore = require("../../functions/lib/supabase.js");

const originalSavesBackend = process.env.GAME_SAVES_STORAGE;
const originalGameBackend = process.env.GAME_DB_STORAGE;
const originalGetClient = supabaseStore.getSupabaseServiceClient;

function makeSelectLimitChain(rows) {
	const chain = {
		eq: jest.fn(() => chain),
		order: jest.fn(() => chain),
		limit: jest.fn(async () => ({ data: rows, error: null })),
	};
	return chain;
}

describe("saves-store supabase behavior", () => {
	beforeEach(() => {
		process.env.GAME_SAVES_STORAGE = "supabase";
		process.env.GAME_DB_STORAGE = "firestore";
	});

	afterEach(() => {
		if (originalSavesBackend === undefined) delete process.env.GAME_SAVES_STORAGE;
		else process.env.GAME_SAVES_STORAGE = originalSavesBackend;

		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;

		supabaseStore.getSupabaseServiceClient = originalGetClient;
		supabaseStore.resetSupabaseClientForTests();
	});

	it("lists save metadata via supabase", async () => {
		const selectChain = makeSelectLimitChain([
			{
				id: "00000000-0000-4000-8000-000000000001",
				save_name: "Newest",
				state_hash: "deadbeef",
				created_at: "2026-04-08T00:00:00.000Z",
				updated_at: "2026-04-08T00:00:01.000Z",
			},
		]);
		const client = {
			from: jest.fn(() => ({
				select: jest.fn(() => selectChain),
			})),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const rows = await savesStore.listSaves({ userId: "user-1", limit: 1 });

		expect(rows).toHaveLength(1);
		expect(rows[0].id).toBe("00000000-0000-4000-8000-000000000001");
		expect(rows[0].state_hash).toBe("deadbeef");
		expect(selectChain.eq).toHaveBeenCalledWith("user_id", "user-1");
		expect(selectChain.limit).toHaveBeenCalledWith(1);
	});

	it("loads a save row via supabase and normalizes jsonb state", async () => {
		const selectChain = makeSelectLimitChain([
			{
				id: "00000000-0000-4000-8000-000000000001",
				user_id: "user-1",
				save_name: "Traveler Save",
				game_state: {
					player: { name: "Traveler", level: 3 },
					world: { id: "world-1" },
				},
				state_hash: "cafebabe",
				created_at: "2026-04-08T00:00:00.000Z",
				updated_at: "2026-04-08T00:00:02.000Z",
			},
		]);
		const client = {
			from: jest.fn(() => ({
				select: jest.fn(() => selectChain),
			})),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const row = await savesStore.getSave({
			userId: "user-1",
			saveId: "00000000-0000-4000-8000-000000000001",
		});

		expect(row).not.toBeNull();
		expect(row.save_name).toBe("Traveler Save");
		expect(row.game_state).toContain("\"Traveler\"");
		expect(selectChain.eq).toHaveBeenCalledWith(
			"id",
			"00000000-0000-4000-8000-000000000001",
		);
		expect(selectChain.eq).toHaveBeenCalledWith("user_id", "user-1");
	});

	it("creates and updates save rows via supabase", async () => {
		const createSingle = jest.fn(async () => ({
			data: {
				id: "00000000-0000-4000-8000-000000000010",
				user_id: "user-1",
				save_name: "Created Save",
				game_state: {
					player: { name: "Traveler", level: 1 },
					world: { id: "world-1" },
				},
				state_hash: "hash-1",
				created_at: "2026-04-08T00:00:00.000Z",
				updated_at: "2026-04-08T00:00:00.000Z",
			},
			error: null,
		}));
		const insert = jest.fn(() => ({
			select: jest.fn(() => ({
				single: createSingle,
			})),
		}));
		const updateSelect = jest.fn(async () => ({
			data: [
				{
					id: "00000000-0000-4000-8000-000000000010",
					user_id: "user-1",
					save_name: "Updated Save",
					game_state: {
						player: { name: "Traveler", level: 2 },
						world: { id: "world-1" },
					},
					state_hash: "hash-2",
					created_at: "2026-04-08T00:00:00.000Z",
					updated_at: "2026-04-08T00:05:00.000Z",
				},
			],
			error: null,
		}));
		const updateEqChain = {
			eq: jest.fn(() => updateEqChain),
			select: updateSelect,
		};
		const update = jest.fn(() => updateEqChain);
		const client = {
			from: jest.fn(() => ({
				insert,
				update,
			})),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const created = await savesStore.createSave({
			saveId: "00000000-0000-4000-8000-000000000010",
			userId: "user-1",
			saveName: "Created Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", level: 1 },
				world: { id: "world-1" },
			}),
			now: "2026-04-08T00:00:00.000Z",
		});
		const updated = await savesStore.updateSave({
			userId: "user-1",
			saveId: "00000000-0000-4000-8000-000000000010",
			saveName: "Updated Save",
			gameState: JSON.stringify({
				player: { name: "Traveler", level: 2 },
				world: { id: "world-1" },
			}),
			now: "2026-04-08T00:05:00.000Z",
		});

		expect(created.id).toBe("00000000-0000-4000-8000-000000000010");
		expect(updated.save_name).toBe("Updated Save");
		expect(insert).toHaveBeenCalledTimes(1);
		expect(update).toHaveBeenCalledTimes(1);
		expect(updateEqChain.eq).toHaveBeenCalledWith(
			"id",
			"00000000-0000-4000-8000-000000000010",
		);
		expect(updateEqChain.eq).toHaveBeenCalledWith("user_id", "user-1");
	});

	it("deletes and purges save rows via supabase", async () => {
		const deleteSelect = jest.fn(async () => ({
			data: [{ id: "00000000-0000-4000-8000-000000000001" }],
			error: null,
		}));
		const deleteEqChain = {
			eq: jest.fn(() => deleteEqChain),
			select: deleteSelect,
		};
		const deleteWithSelect = jest.fn(() => deleteEqChain);
		const deleteWithCountEq = jest.fn(async () => ({ error: null, count: 3 }));
		const deleteWithCount = jest.fn(() => ({
			eq: deleteWithCountEq,
		}));
		const client = {
			from: jest
				.fn()
				.mockImplementationOnce(() => ({
					delete: jest.fn(deleteWithSelect),
				}))
				.mockImplementationOnce(() => ({
					delete: jest.fn(deleteWithCount),
				})),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const removed = await savesStore.deleteSave({
			userId: "user-1",
			saveId: "00000000-0000-4000-8000-000000000001",
		});
		const purge = await savesStore.purgeUserProgress({ ownerId: "user-1" });

		expect(removed).toBe(true);
		expect(purge.deletedSaveCount).toBe(3);
		expect(deleteEqChain.eq).toHaveBeenCalledWith(
			"id",
			"00000000-0000-4000-8000-000000000001",
		);
		expect(deleteEqChain.eq).toHaveBeenCalledWith("user_id", "user-1");
		expect(deleteWithCountEq).toHaveBeenCalledWith("user_id", "user-1");
	});
});
