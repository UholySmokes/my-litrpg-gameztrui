import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncCore = require("../../functions/lib/sync-core.js");

function makeCommit({
	runId,
	clientSeq,
	contentVersion,
	triggerType,
	triggerId,
	mapId,
	x,
	y,
	targetId,
}) {
	return {
		id: `commit-${triggerType.toLowerCase()}-${clientSeq}`,
		runId,
		clientId: "client-1",
		clientSeq,
		createdAt: "2026-02-23T10:00:00.000Z",
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

describe("sync-core validation", () => {
	it("validates single commit envelope shape", () => {
		const manifest = syncCore.getWorldManifest();
		const normalized = syncCore.normalizeCommitEnvelope({
			id: "commit-1",
			runId: "run-1",
			clientId: "client-1",
			clientSeq: 1,
			createdAt: "2026-02-23T10:00:00.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "ENTER_TILE",
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		});
		expect(normalized.ok).toBe(true);
	});

	it("rejects invalid commit envelope", () => {
		const normalized = syncCore.normalizeCommitEnvelope({
			id: "",
		});
		expect(normalized.ok).toBe(false);
		expect(normalized.errorCode).toBe("INVALID_COMMIT_ID");
	});

	it("validates ENTER_TILE batch policy", () => {
		const manifest = syncCore.getWorldManifest();
		const normalized = syncCore.normalizeCommitBatchRequest({
			commits: [
				{
					id: "batch-1",
					runId: "run-batch",
					clientId: "client-1",
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
				{
					id: "batch-2",
					runId: "run-batch",
					clientId: "client-1",
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:00.090Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ENTER_TILE",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
			],
		});
		expect(normalized.ok).toBe(true);
	});

	it("rejects non-batchable triggers in batch endpoint", () => {
		const manifest = syncCore.getWorldManifest();
		const normalized = syncCore.normalizeCommitBatchRequest({
			commits: [
				{
					id: "batch-1",
					runId: "run-batch",
					clientId: "client-1",
					clientSeq: 1,
					createdAt: "2026-02-23T10:00:00.000Z",
					contentVersion: manifest.contentVersion,
					triggerType: "INTERACT",
					trigger: {
						triggerId: "npc_guide_interact",
						mapId: "map_village_square",
						x: 10,
						y: 8,
						targetId: "npc_guide",
					},
				},
			],
		});
		expect(normalized.ok).toBe(false);
		expect(normalized.errorCode).toBe("NON_BATCHABLE_TRIGGER");
	});

	it("enforces contentVersion and trigger manifest checks", () => {
		const manifest = syncCore.getWorldManifest();
		const state = syncCore.buildInitialGameplayState({
			runId: "run-validate",
			manifest,
			contentVersion: manifest.contentVersion,
		});
		const normalized = syncCore.normalizeCommitEnvelope({
			id: "commit-x",
			runId: "run-validate",
			clientId: "client-1",
			clientSeq: 1,
			createdAt: "2026-02-23T10:00:00.000Z",
			contentVersion: "bad-version",
			triggerType: "ENTER_TILE",
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		});
		expect(normalized.ok).toBe(true);
		const validation = syncCore.validateTriggerAgainstManifest({
			manifest,
			state,
			commit: normalized.commit,
		});
		expect(validation.ok).toBe(false);
		expect(validation.errorCode).toBe("CONTENT_VERSION_MISMATCH");
	});

	it("validates and rejects INTERACT trigger prerequisites/target", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-interact";
		const validState = syncCore.buildInitialGameplayState({
			runId,
			manifest,
			contentVersion: manifest.contentVersion,
		});
		validState.mapId = "map_village_square";
		validState.questFlags.slice_intro_seen = true;

		const valid = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
			triggerType: "INTERACT",
			triggerId: "npc_guide_interact",
			mapId: "map_village_square",
			x: 10,
			y: 8,
			targetId: "npc_guide",
		});
		const normalizedValid = syncCore.normalizeCommitEnvelope(valid);
		expect(normalizedValid.ok).toBe(true);
		const interactValidation = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: validState,
			commit: normalizedValid.commit,
		});
		expect(interactValidation.ok).toBe(true);

		const invalidTarget = makeCommit({
			runId,
			clientSeq: 2,
			contentVersion: manifest.contentVersion,
			triggerType: "INTERACT",
			triggerId: "npc_guide_interact",
			mapId: "map_village_square",
			x: 10,
			y: 8,
			targetId: "npc_unknown",
		});
		const normalizedBadTarget = syncCore.normalizeCommitEnvelope(invalidTarget);
		const badTargetValidation = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: validState,
			commit: normalizedBadTarget.commit,
		});
		expect(badTargetValidation.ok).toBe(false);
		expect(badTargetValidation.errorCode).toBe("TRIGGER_TARGET_MISMATCH");
	});

	it("validates and rejects ENCOUNTER_GATE with prereq and state-map mismatch", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-encounter";
		const validState = syncCore.buildInitialGameplayState({
			runId,
			manifest,
			contentVersion: manifest.contentVersion,
		});
		validState.mapId = "map_village_square";
		validState.questFlags.quest_tutorial_started = true;

		const valid = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
			triggerType: "ENCOUNTER_GATE",
			triggerId: "encounter_gate_training",
			mapId: "map_village_square",
			x: 18,
			y: 8,
			targetId: "encounter_gate_training_01",
		});
		const normalizedValid = syncCore.normalizeCommitEnvelope(valid);
		const validCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: validState,
			commit: normalizedValid.commit,
		});
		expect(validCheck.ok).toBe(true);

		const wrongMapState = {
			...validState,
			mapId: "map_training_glade",
		};
		const wrongMapCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: wrongMapState,
			commit: normalizedValid.commit,
		});
		expect(wrongMapCheck.ok).toBe(false);
		expect(wrongMapCheck.errorCode).toBe("STATE_MAP_MISMATCH");
	});

	it("validates and rejects ZONE_EXIT based on canonical state map", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-zone-exit";
		const validState = syncCore.buildInitialGameplayState({
			runId,
			manifest,
			contentVersion: manifest.contentVersion,
		});
		validState.mapId = "map_training_glade";

		const valid = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
			triggerType: "ZONE_EXIT",
			triggerId: "zone_exit_back_to_square",
			mapId: "map_training_glade",
			x: 0,
			y: 2,
		});
		const normalized = syncCore.normalizeCommitEnvelope(valid);
		const validCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: validState,
			commit: normalized.commit,
		});
		expect(validCheck.ok).toBe(true);

		const invalidState = {
			...validState,
			mapId: "map_village_square",
		};
		const invalidCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state: invalidState,
			commit: normalized.commit,
		});
		expect(invalidCheck.ok).toBe(false);
		expect(invalidCheck.errorCode).toBe("STATE_MAP_MISMATCH");
	});

	it("validates and rejects SAVEPOINT target mismatch", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-savepoint";
		const state = syncCore.buildInitialGameplayState({
			runId,
			manifest,
			contentVersion: manifest.contentVersion,
		});
		state.mapId = "map_village_square";

		const valid = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
			triggerType: "SAVEPOINT",
			triggerId: "savepoint_square_crystal",
			mapId: "map_village_square",
			x: 4,
			y: 4,
			targetId: "save_crystal_square_01",
		});
		const normalizedValid = syncCore.normalizeCommitEnvelope(valid);
		const validCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state,
			commit: normalizedValid.commit,
		});
		expect(validCheck.ok).toBe(true);

		const invalid = makeCommit({
			runId,
			clientSeq: 2,
			contentVersion: manifest.contentVersion,
			triggerType: "SAVEPOINT",
			triggerId: "savepoint_square_crystal",
			mapId: "map_village_square",
			x: 4,
			y: 4,
			targetId: "save_crystal_square_x",
		});
		const normalizedInvalid = syncCore.normalizeCommitEnvelope(invalid);
		const invalidCheck = syncCore.validateTriggerAgainstManifest({
			manifest,
			state,
			commit: normalizedInvalid.commit,
		});
		expect(invalidCheck.ok).toBe(false);
		expect(invalidCheck.errorCode).toBe("TRIGGER_TARGET_MISMATCH");
	});

	it("rejects unknown NPC ids when manifest target is not approved", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-unknown-npc";
		const mutatedManifest = {
			...manifest,
			triggers: {
				...manifest.triggers,
				npc_guide_interact: {
					...manifest.triggers.npc_guide_interact,
					targetId: "npc_missing",
				},
			},
			approvedNpcIds: new Set(manifest.approvedNpcIds),
		};
		const state = syncCore.buildInitialGameplayState({
			runId,
			manifest: mutatedManifest,
			contentVersion: mutatedManifest.contentVersion,
		});
		state.mapId = "map_village_square";
		state.questFlags.slice_intro_seen = true;

		const commit = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: mutatedManifest.contentVersion,
			triggerType: "INTERACT",
			triggerId: "npc_guide_interact",
			mapId: "map_village_square",
			x: 10,
			y: 8,
		});
		const normalized = syncCore.normalizeCommitEnvelope(commit);
		expect(normalized.ok).toBe(true);

		const validation = syncCore.validateTriggerAgainstManifest({
			manifest: mutatedManifest,
			state,
			commit: normalized.commit,
		});
		expect(validation.ok).toBe(false);
		expect(validation.errorCode).toBe("UNKNOWN_NPC_ID");
	});

	it("rejects unknown object ids when manifest target is not approved", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-unknown-object";
		const mutatedManifest = {
			...manifest,
			triggers: {
				...manifest.triggers,
				savepoint_square_crystal: {
					...manifest.triggers.savepoint_square_crystal,
					targetId: "object_missing",
				},
			},
			approvedObjectIds: new Set(manifest.approvedObjectIds),
		};
		const state = syncCore.buildInitialGameplayState({
			runId,
			manifest: mutatedManifest,
			contentVersion: mutatedManifest.contentVersion,
		});
		state.mapId = "map_village_square";

		const commit = makeCommit({
			runId,
			clientSeq: 1,
			contentVersion: mutatedManifest.contentVersion,
			triggerType: "SAVEPOINT",
			triggerId: "savepoint_square_crystal",
			mapId: "map_village_square",
			x: 4,
			y: 4,
		});
		const normalized = syncCore.normalizeCommitEnvelope(commit);
		expect(normalized.ok).toBe(true);

		const validation = syncCore.validateTriggerAgainstManifest({
			manifest: mutatedManifest,
			state,
			commit: normalized.commit,
		});
		expect(validation.ok).toBe(false);
		expect(validation.errorCode).toBe("UNKNOWN_OBJECT_ID");
	});
});
