import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const functionsRequire = createRequire(
	new URL("../../functions/lib/sync-dataconnect-store.js", import.meta.url),
);

const dataconnectStore = require("../../functions/lib/sync-dataconnect-store.js");
const dataconnectGenerated = require("../../functions/src/dataconnect-admin-generated/index.cjs.js");
const firebaseAdminDataConnect = functionsRequire("firebase-admin/data-connect");

describe("sync-dataconnect-store", () => {
	const originalGetDataConnect = firebaseAdminDataConnect.getDataConnect;
	const originalGetMyRunSessionByRunId =
		dataconnectGenerated.getMyRunSessionByRunId;
	const originalGetMyProfile = dataconnectGenerated.getMyProfile;
	const originalMarkMyProfileMigration =
		dataconnectGenerated.markMyProfileMigration;
	const originalUpsertRunSession = dataconnectGenerated.upsertRunSession;
	const originalGetMyRunEventByCommitId =
		dataconnectGenerated.getMyRunEventByCommitId;
	const originalCreateRunEvent = dataconnectGenerated.createRunEvent;
	const originalListMyRunEventsSince = dataconnectGenerated.listMyRunEventsSince;

	beforeEach(() => {
		firebaseAdminDataConnect.getDataConnect = jest.fn(() => ({ mockDc: true }));
	});

	afterEach(() => {
		firebaseAdminDataConnect.getDataConnect = originalGetDataConnect;
		dataconnectGenerated.getMyRunSessionByRunId = originalGetMyRunSessionByRunId;
		dataconnectGenerated.getMyProfile = originalGetMyProfile;
		dataconnectGenerated.markMyProfileMigration =
			originalMarkMyProfileMigration;
		dataconnectGenerated.upsertRunSession = originalUpsertRunSession;
		dataconnectGenerated.getMyRunEventByCommitId = originalGetMyRunEventByCommitId;
		dataconnectGenerated.createRunEvent = originalCreateRunEvent;
		dataconnectGenerated.listMyRunEventsSince = originalListMyRunEventsSince;
	});

	it("reads migration version from user profile", async () => {
		dataconnectGenerated.getMyProfile = jest.fn(async () => ({
			data: {
				userProfile: {
					id: "user-1",
					displayName: "Traveler",
					migrationVersion: 3,
				},
			},
		}));

		const version = await dataconnectStore.getMigrationVersion({
			ownerId: "user-1",
		});

		expect(dataconnectGenerated.getMyProfile).toHaveBeenCalledTimes(1);
		expect(version).toBe(3);
	});

	it("marks migration version using existing profile display name", async () => {
		dataconnectGenerated.getMyProfile = jest.fn(async () => ({
			data: {
				userProfile: {
					id: "user-2",
					displayName: "Aria",
					migrationVersion: null,
				},
			},
		}));
		dataconnectGenerated.markMyProfileMigration = jest.fn(async () => ({
			data: {
				userProfile_upsert: {
					id: "user-2",
				},
			},
		}));

		const marked = await dataconnectStore.markMigrationVersion({
			ownerId: "user-2",
			version: 1,
			displayName: "",
		});

		expect(marked).toBe(true);
		expect(dataconnectGenerated.markMyProfileMigration).toHaveBeenCalledTimes(1);
		const callArgs = dataconnectGenerated.markMyProfileMigration.mock.calls[0][1];
		expect(callArgs.migrationVersion).toBe(1);
		expect(callArgs.displayName).toBe("Aria");
	});

	it("maps run sessions to sync run state", async () => {
		dataconnectGenerated.getMyRunSessionByRunId = jest.fn(async () => ({
			data: {
				userProfile: {
					runSessions: [
						{
							id: "session-1",
							runId: "run-1",
							worldId: "w1",
							mapId: "m1",
							playerPosJson: "{\"x\":1,\"y\":2}",
							entityStatesJson: "{\"npc\":{\"hp\":10}}",
							questFlagsJson: "{\"quest_started\":true}",
							seq: 2,
							tick: 2,
							stateHash: "hash-1",
							contentVersion: "cv-1",
							stateVersion: 1,
							runSeed: "seed-1",
							createdAt: "2026-02-23T00:00:00.000Z",
							updatedAt: "2026-02-23T00:00:01.000Z",
						},
					],
				},
			},
		}));

		const row = await dataconnectStore.getRun({
			ownerId: "user-1",
			runId: "run-1",
		});

		expect(dataconnectGenerated.getMyRunSessionByRunId).toHaveBeenCalledTimes(1);
		expect(row.run_id).toBe("run-1");
		expect(row.state.mapId).toBe("m1");
		expect(row.state.playerPos.x).toBe(1);
		expect(row.state.entityStates.npc.hp).toBe(10);
		expect(row.state.questFlags.quest_started).toBe(true);
	});

	it("upserts run session with canonical sync fields", async () => {
		dataconnectGenerated.getMyRunSessionByRunId = jest
			.fn()
			.mockResolvedValueOnce({
				data: {
					userProfile: {
						runSessions: [],
					},
				},
			})
			.mockResolvedValueOnce({
				data: {
					userProfile: {
						runSessions: [
							{
								id: "00000000-0000-4000-8000-000000000123",
								runId: "run-2",
								worldId: "w2",
								mapId: "m2",
								playerPosJson: "{\"x\":3,\"y\":4}",
								entityStatesJson: "{}",
								questFlagsJson: "{}",
								seq: 9,
								tick: 9,
								stateHash: "hash-2",
								contentVersion: "cv-2",
								stateVersion: 1,
								saveSlotId: "00000000-0000-4000-8000-000000000999",
								runSeed: "seed-2",
								createdAt: "2026-02-23T00:00:00.000Z",
								updatedAt: "2026-02-23T00:00:01.000Z",
							},
						],
					},
				},
			});
		dataconnectGenerated.upsertRunSession = jest.fn(async () => ({
			data: { runSession_upsert: { id: "00000000-0000-4000-8000-000000000123" } },
		}));

		const result = await dataconnectStore.putRun({
			ownerId: "user-2",
			runId: "run-2",
			saveSlotId: "00000000-0000-4000-8000-000000000999",
			state: {
				worldId: "w2",
				mapId: "m2",
				playerPos: { x: 3, y: 4 },
				entityStates: {},
				questFlags: {},
				seq: 9,
				tick: 9,
				stateHash: "hash-2",
				contentVersion: "cv-2",
				stateVersion: 1,
				runSeed: "seed-2",
				lastCommitId: "c9",
				lastClientId: "godot-a",
			},
		});

		expect(dataconnectGenerated.upsertRunSession).toHaveBeenCalledTimes(1);
		const callArgs = dataconnectGenerated.upsertRunSession.mock.calls[0][1];
		expect(callArgs.runId).toBe("run-2");
		expect(callArgs.seq).toBe(9);
		expect(callArgs.tick).toBe(9);
		expect(callArgs.stateHash).toBe("hash-2");
		expect(callArgs.saveSlotId).toBe("00000000-0000-4000-8000-000000000999");
		expect(result.run_id).toBe("run-2");
		expect(result.state.seq).toBe(9);
	});

	it("creates and reads back run event records", async () => {
		dataconnectGenerated.createRunEvent = jest.fn(async () => ({
			data: { runEvent_insert: { id: "event-1" } },
		}));
		dataconnectGenerated.getMyRunEventByCommitId = jest.fn(async () => ({
			data: {
				userProfile: {
					events: [
						{
							id: "event-1",
							runId: "run-3",
							commitId: "c10",
							clientId: "godot-a",
							clientSeq: 10,
							triggerType: "INTERACT",
							triggerPayloadJson: "{\"triggerType\":\"INTERACT\"}",
							accepted: true,
							errorCode: null,
							message: null,
							seq: 10,
							tick: 10,
							stateHash: "hash-10",
							contentVersion: "cv-10",
							createdAt: "2026-02-23T00:00:02.000Z",
						},
					],
				},
			},
		}));

		const row = await dataconnectStore.appendEvent({
			ownerId: "user-3",
			runId: "run-3",
			event: {
				commit_id: "c10",
				client_seq: 10,
				accepted: true,
				error_code: null,
				message: null,
				seq: 10,
				tick: 10,
				state_hash: "hash-10",
				commit: {
					clientId: "godot-a",
					triggerType: "INTERACT",
					contentVersion: "cv-10",
				},
			},
		});

		expect(dataconnectGenerated.createRunEvent).toHaveBeenCalledTimes(1);
		const callArgs = dataconnectGenerated.createRunEvent.mock.calls[0][1];
		expect(callArgs.seq).toBe(10);
		expect(callArgs.tick).toBe(10);
		expect(callArgs.stateHash).toBe("hash-10");
		expect(row.commit_id).toBe("c10");
		expect(row.accepted).toBe(true);
	});

	it("lists events sorted by client seq with limit", async () => {
		dataconnectGenerated.listMyRunEventsSince = jest.fn(async () => ({
			data: {
				userProfile: {
					events: [
						{
							id: "e2",
							runId: "run-4",
							commitId: "c2",
							clientSeq: 2,
							triggerPayloadJson: "{}",
							accepted: true,
							createdAt: "2026-02-23T00:00:02.000Z",
						},
						{
							id: "e1",
							runId: "run-4",
							commitId: "c1",
							clientSeq: 1,
							triggerPayloadJson: "{}",
							accepted: true,
							createdAt: "2026-02-23T00:00:01.000Z",
						},
					],
				},
			},
		}));

		const rows = await dataconnectStore.listEvents({
			ownerId: "user-4",
			runId: "run-4",
			afterSeq: 0,
			limit: 1,
		});

		expect(dataconnectGenerated.listMyRunEventsSince).toHaveBeenCalledTimes(1);
		expect(rows).toHaveLength(1);
		expect(rows[0].client_seq).toBe(1);
		expect(rows[0]._dc_id).toBeUndefined();
	});
});
