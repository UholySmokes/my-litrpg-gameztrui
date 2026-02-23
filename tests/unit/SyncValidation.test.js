import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncCore = require("../../functions/lib/sync-core.js");

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
});
