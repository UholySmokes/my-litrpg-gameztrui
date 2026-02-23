import { describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const syncCore = require("../../functions/lib/sync-core.js");

function makeCommit({
	id,
	runId,
	clientId = "godot-client-a",
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
		clientId,
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

describe("sync-core determinism", () => {
	it("hashCanonicalState is stable across object key order", () => {
		const a = {
			worldId: "w1",
			mapId: "m1",
			playerPos: { x: 1, y: 2 },
			questFlags: { b: true, a: false },
		};
		const b = {
			mapId: "m1",
			worldId: "w1",
			questFlags: { a: false, b: true },
			playerPos: { y: 2, x: 1 },
		};
		expect(syncCore.hashCanonicalState(a)).toBe(syncCore.hashCanonicalState(b));
	});

	it("replays identical commit log to identical seq/tick/stateHash", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-determinism-01";
		const commits = [
			makeCommit({
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
			makeCommit({
				id: "c2",
				runId,
				clientSeq: 2,
				createdAt: "2026-02-23T10:00:00.060Z",
				contentVersion: manifest.contentVersion,
				triggerType: "INTERACT",
				triggerId: "npc_guide_interact",
				mapId: "map_village_square",
				x: 10,
				y: 8,
				targetId: "npc_guide",
			}),
			makeCommit({
				id: "c3",
				runId,
				clientSeq: 3,
				createdAt: "2026-02-23T10:00:01.000Z",
				contentVersion: manifest.contentVersion,
				triggerType: "ENCOUNTER_GATE",
				triggerId: "encounter_gate_training",
				mapId: "map_village_square",
				x: 18,
				y: 8,
				targetId: "encounter_gate_training_01",
			}),
			makeCommit({
				id: "c4",
				runId,
				clientSeq: 4,
				createdAt: "2026-02-23T10:00:01.500Z",
				contentVersion: manifest.contentVersion,
				triggerType: "ZONE_EXIT",
				triggerId: "zone_exit_back_to_square",
				mapId: "map_training_glade",
				x: 0,
				y: 2,
			}),
		];

		const replayA = syncCore.replayCommitLog({ manifest, runId, commits });
		const replayB = syncCore.replayCommitLog({ manifest, runId, commits });

		expect(replayA.state.seq).toBe(4);
		expect(replayA.state.tick).toBe(4);
		expect(replayA.state.stateHash).toHaveLength(64);
		expect(replayA.state.stateHash).toBe(replayB.state.stateHash);
		expect(replayA.state.seq).toBe(replayB.state.seq);
		expect(replayA.state.tick).toBe(replayB.state.tick);
	});

	it("replays mixed trigger/command stream identically across 100 runs", () => {
		const manifest = syncCore.getWorldManifest();
		const runId = "run-determinism-100";
		const commits = [
			makeCommit({
				id: "m1",
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
			{
				...makeCommit({
					id: "m2",
					runId,
					clientSeq: 2,
					createdAt: "2026-02-23T10:00:00.200Z",
					contentVersion: manifest.contentVersion,
					triggerType: "INTERACT",
					triggerId: "npc_guide_interact",
					mapId: "map_village_square",
					x: 10,
					y: 8,
					targetId: "npc_guide",
				}),
				commandType: "TRIGGER",
				command: {
					type: "TRIGGER",
					triggerType: "INTERACT",
					trigger: {
						triggerId: "npc_guide_interact",
						mapId: "map_village_square",
						x: 10,
						y: 8,
						targetId: "npc_guide",
					},
				},
			},
			makeCommit({
				id: "m3",
				runId,
				clientSeq: 3,
				createdAt: "2026-02-23T10:00:00.400Z",
				contentVersion: manifest.contentVersion,
				triggerType: "ENCOUNTER_GATE",
				triggerId: "encounter_gate_training",
				mapId: "map_village_square",
				x: 18,
				y: 8,
				targetId: "encounter_gate_training_01",
			}),
			{
				...makeCommit({
					id: "m4",
					runId,
					clientSeq: 4,
					createdAt: "2026-02-23T10:00:00.600Z",
					contentVersion: manifest.contentVersion,
					triggerType: "ZONE_EXIT",
					triggerId: "zone_exit_back_to_square",
					mapId: "map_training_glade",
					x: 0,
					y: 2,
				}),
				commandType: "TRIGGER",
				command: {
					type: "TRIGGER",
					triggerType: "ZONE_EXIT",
					trigger: {
						triggerId: "zone_exit_back_to_square",
						mapId: "map_training_glade",
						x: 0,
						y: 2,
					},
				},
			},
			makeCommit({
				id: "m5",
				runId,
				clientSeq: 5,
				createdAt: "2026-02-23T10:00:00.800Z",
				contentVersion: manifest.contentVersion,
				triggerType: "SAVEPOINT",
				triggerId: "savepoint_square_crystal",
				mapId: "map_village_square",
				x: 4,
				y: 4,
				targetId: "save_crystal_square_01",
			}),
		];

		let baselineSignature = "";
		for (let i = 0; i < 100; i += 1) {
			const replay = syncCore.replayCommitLog({ manifest, runId, commits });
			expect(replay.timeline.every((entry) => entry.accepted)).toBe(true);
			const signature = `${replay.state.seq}:${replay.state.tick}:${replay.state.stateHash}`;
			if (!baselineSignature) {
				baselineSignature = signature;
			}
			expect(signature).toBe(baselineSignature);
		}
	});

	it("derives deterministic RNG seed by runSeed+seq+subsystemTag", () => {
		const seedA = syncCore.deriveRngSeed("run-seed", 10, "encounter");
		const seedB = syncCore.deriveRngSeed("run-seed", 10, "encounter");
		const seedC = syncCore.deriveRngSeed("run-seed", 11, "encounter");
		expect(seedA).toBe(seedB);
		expect(seedA).not.toBe(seedC);
	});

	it("normalizes mixed trigger/command stream records to explicit eventType", () => {
		const triggerEvent = syncCore.normalizeSyncEvent({
			commit: { triggerType: "INTERACT" },
		});
		expect(triggerEvent.eventType).toBe("TRIGGER");
		expect(triggerEvent.triggerType).toBe("INTERACT");

		const commandEvent = syncCore.normalizeSyncEvent({
			commit: {
				command: { type: "MOVE" },
			},
		});
		expect(commandEvent.eventType).toBe("COMMAND");

		const explicitWins = syncCore.normalizeSyncEvent({
			eventType: "command",
			commit: { triggerType: "ENTER_TILE" },
		});
		expect(explicitWins.eventType).toBe("COMMAND");
	});
});
