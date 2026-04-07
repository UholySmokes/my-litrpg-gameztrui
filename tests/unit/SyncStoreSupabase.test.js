import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncStore = require("../../functions/lib/sync-store.js");
const supabaseStore = require("../../functions/lib/supabase.js");

const originalSyncBackend = process.env.SYNC_DB_STORAGE;
const originalGameBackend = process.env.GAME_DB_STORAGE;
const originalGetClient = supabaseStore.getSupabaseServiceClient;

function makeSelectLimitChain(rows) {
	const chain = {
		eq: jest.fn(() => chain),
		gt: jest.fn(() => chain),
		order: jest.fn(() => chain),
		limit: jest.fn(async () => ({ data: rows, error: null })),
	};
	return chain;
}

describe("sync-store supabase behavior", () => {
	beforeEach(() => {
		process.env.SYNC_DB_STORAGE = "supabase";
		process.env.GAME_DB_STORAGE = "firestore";
	});

	afterEach(() => {
		if (originalSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncBackend;

		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;

		supabaseStore.getSupabaseServiceClient = originalGetClient;
		supabaseStore.resetSupabaseClientForTests();
	});

	it("marks and reads migration version via supabase", async () => {
		const upsert = jest.fn(async () => ({ error: null }));
		const selectChain = makeSelectLimitChain([{ migration_version: 7 }]);
		const client = {
			from: jest.fn((table) => {
				if (table === "sync_profiles") {
					return {
						upsert,
						select: jest.fn(() => selectChain),
					};
				}
				throw new Error(`Unexpected table: ${table}`);
			}),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const marked = await syncStore.markMigrationVersion({
			ownerId: "user-1",
			version: 7,
			displayName: "Traveler",
		});
		const version = await syncStore.getMigrationVersion({ ownerId: "user-1" });

		expect(marked).toBe(true);
		expect(version).toBe(7);
		expect(upsert).toHaveBeenCalledTimes(1);
		expect(selectChain.eq).toHaveBeenCalledWith("owner_id", "user-1");
	});

	it("stores and reads run state via supabase", async () => {
		const single = jest.fn(async () => ({
			data: {
				owner_id: "user-1",
				run_id: "run-1",
				state: { runId: "run-1", seq: 1, tick: 1 },
				save_slot_id: "slot-1",
				created_at: "2026-04-08T00:00:00.000Z",
				updated_at: "2026-04-08T00:00:01.000Z",
			},
			error: null,
		}));
		const upsert = jest.fn(() => ({
			select: jest.fn(() => ({
				single,
			})),
		}));
		const selectChain = makeSelectLimitChain([
			{
				owner_id: "user-1",
				run_id: "run-1",
				state: { runId: "run-1", seq: 1, tick: 1 },
				save_slot_id: "slot-1",
				created_at: "2026-04-08T00:00:00.000Z",
				updated_at: "2026-04-08T00:00:01.000Z",
			},
		]);
		const client = {
			from: jest.fn((table) => {
				if (table === "sync_runs") {
					return {
						upsert,
						select: jest.fn(() => selectChain),
					};
				}
				throw new Error(`Unexpected table: ${table}`);
			}),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const stored = await syncStore.putRun({
			ownerId: "user-1",
			runId: "run-1",
			state: { runId: "run-1", seq: 1, tick: 1 },
			saveSlotId: "slot-1",
		});
		const loaded = await syncStore.getRun({ ownerId: "user-1", runId: "run-1" });

		expect(stored.run_id).toBe("run-1");
		expect(loaded.state.seq).toBe(1);
		expect(upsert).toHaveBeenCalledTimes(1);
		expect(selectChain.eq).toHaveBeenCalledWith("owner_id", "user-1");
		expect(selectChain.eq).toHaveBeenCalledWith("run_id", "run-1");
	});

	it("appends and lists sync events via supabase", async () => {
		const single = jest.fn(async () => ({
			data: {
				owner_id: "user-1",
				run_id: "run-1",
				commit_id: "commit-1",
				client_seq: 1,
				accepted: true,
				state_hash: "hash-1",
				seq: 1,
				tick: 1,
				event_type: "TRIGGER",
				trigger_type: "ENTER_TILE",
				commit: { id: "commit-1" },
				created_at: "2026-04-08T00:00:01.000Z",
			},
			error: null,
		}));
		const upsert = jest.fn(() => ({
			select: jest.fn(() => ({
				single,
			})),
		}));
		const selectChain = makeSelectLimitChain([
			{
				owner_id: "user-1",
				run_id: "run-1",
				commit_id: "commit-1",
				client_seq: 1,
				accepted: true,
				state_hash: "hash-1",
				seq: 1,
				tick: 1,
				event_type: "TRIGGER",
				trigger_type: "ENTER_TILE",
				commit: { id: "commit-1" },
				created_at: "2026-04-08T00:00:01.000Z",
			},
		]);
		const client = {
			from: jest.fn((table) => {
				if (table === "run_events") {
					return {
						upsert,
						select: jest.fn(() => selectChain),
					};
				}
				throw new Error(`Unexpected table: ${table}`);
			}),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const appended = await syncStore.appendEvent({
			ownerId: "user-1",
			runId: "run-1",
			event: {
				commit_id: "commit-1",
				client_seq: 1,
				accepted: true,
				state_hash: "hash-1",
				seq: 1,
				tick: 1,
				commit: { id: "commit-1", triggerType: "ENTER_TILE" },
			},
		});
		const listed = await syncStore.listEvents({
			ownerId: "user-1",
			runId: "run-1",
			afterSeq: 0,
			limit: 10,
		});

		expect(appended.commit_id).toBe("commit-1");
		expect(listed).toHaveLength(1);
		expect(listed[0].state_hash).toBe("hash-1");
		expect(selectChain.eq).toHaveBeenCalledWith("owner_id", "user-1");
		expect(selectChain.eq).toHaveBeenCalledWith("run_id", "run-1");
		expect(selectChain.gt).toHaveBeenCalledWith("client_seq", 0);
	});

	it("purges run and event data via supabase", async () => {
		const eventEq = jest.fn(async () => ({ error: null, count: 4 }));
		const runEq = jest.fn(async () => ({ error: null, count: 2 }));
		const client = {
			from: jest.fn((table) => {
				if (table === "run_events") {
					return {
						delete: jest.fn(() => ({
							eq: eventEq,
						})),
					};
				}
				if (table === "sync_runs") {
					return {
						delete: jest.fn(() => ({
							eq: runEq,
						})),
					};
				}
				throw new Error(`Unexpected table: ${table}`);
			}),
		};
		supabaseStore.getSupabaseServiceClient = jest.fn(() => client);

		const result = await syncStore.purgeUserProgress({ ownerId: "user-1" });

		expect(result.deletedEventCount).toBe(4);
		expect(result.deletedRunCount).toBe(2);
		expect(eventEq).toHaveBeenCalledWith("owner_id", "user-1");
		expect(runEq).toHaveBeenCalledWith("owner_id", "user-1");
	});
});
