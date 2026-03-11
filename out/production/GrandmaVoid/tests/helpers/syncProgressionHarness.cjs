const sync = require("../../functions/lib/sync.js");
const syncCore = require("../../functions/lib/sync-core.js");
const {
	SYNC_COMMAND_VERBS_V1,
} = require("../../functions/lib/sync-command-contract.js");

const M7_PROGRESSION_PHASES = Object.freeze([
	{ id: "exploration", status: "implemented" },
	{ id: "encounter_transition", status: "implemented" },
	{ id: "combat_depth", status: "pending" },
	{ id: "inventory_depth", status: "pending" },
	{ id: "quest_depth", status: "pending" },
	{ id: "save_load_parity", status: "implemented" },
]);

function buildTriggerCommit({
	id,
	runId,
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
		clientId: "scenario-harness",
		clientSeq,
		createdAt,
		contentVersion,
		triggerType,
		trigger: {
			triggerId,
			mapId,
			x,
			y,
			targetId: targetId || null,
		},
		commandType: "TRIGGER",
		command: {
			type: "TRIGGER",
			verb: triggerType,
			triggerType,
		},
	};
}

function createScenarioSkeleton() {
	return {
		version: "m7-start-v1",
		supportedVerbs: [...SYNC_COMMAND_VERBS_V1],
		phases: M7_PROGRESSION_PHASES.map((phase) => ({ ...phase })),
	};
}

async function runTutorialProgressionScenario({
	ownerId = "scenario-owner",
	runId = "scenario-run-1",
} = {}) {
	const manifest = syncCore.getWorldManifest();
	const commits = [
		buildTriggerCommit({
			id: `${runId}-c1`,
			runId,
			clientSeq: 1,
			createdAt: "2026-02-24T10:00:00.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "ENTER_TILE",
			triggerId: "tile_intro_square",
			mapId: "map_village_square",
			x: 6,
			y: 8,
		}),
		buildTriggerCommit({
			id: `${runId}-c2`,
			runId,
			clientSeq: 2,
			createdAt: "2026-02-24T10:00:01.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "INTERACT",
			triggerId: "npc_guide_interact",
			mapId: "map_village_square",
			x: 10,
			y: 8,
			targetId: "npc_guide",
		}),
		buildTriggerCommit({
			id: `${runId}-c3`,
			runId,
			clientSeq: 3,
			createdAt: "2026-02-24T10:00:02.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "ENCOUNTER_GATE",
			triggerId: "encounter_gate_training",
			mapId: "map_village_square",
			x: 18,
			y: 8,
			targetId: "encounter_gate_training_01",
		}),
		buildTriggerCommit({
			id: `${runId}-c4`,
			runId,
			clientSeq: 4,
			createdAt: "2026-02-24T10:00:03.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "ZONE_EXIT",
			triggerId: "zone_exit_back_to_square",
			mapId: "map_training_glade",
			x: 0,
			y: 2,
		}),
		buildTriggerCommit({
			id: `${runId}-c5`,
			runId,
			clientSeq: 5,
			createdAt: "2026-02-24T10:00:04.000Z",
			contentVersion: manifest.contentVersion,
			triggerType: "SAVEPOINT",
			triggerId: "savepoint_square_crystal",
			mapId: "map_village_square",
			x: 4,
			y: 4,
			targetId: "save_crystal_square_01",
		}),
	];

	const processResult = await sync.processCommitStream({
		ownerId,
		commits,
		manifest,
	});
	const replayResult = syncCore.replayCommitLog({
		manifest,
		runId,
		commits,
	});

	return {
		manifest,
		commits,
		processResult,
		replayResult,
		skeleton: createScenarioSkeleton(),
	};
}

module.exports = {
	M7_PROGRESSION_PHASES,
	createScenarioSkeleton,
	runTutorialProgressionScenario,
};
