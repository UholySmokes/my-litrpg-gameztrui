import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
	runTutorialProgressionScenario,
	createScenarioSkeleton,
} = require("../helpers/syncProgressionHarness.cjs");
const {
	SYNC_COMMAND_VERBS_V1,
} = require("../../functions/lib/sync-command-contract.js");
const savesStore = require("../../functions/lib/saves-store.js");

function makeTempFile(name) {
	return path.join(
		os.tmpdir(),
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

describe("M7 progression scenario harness", () => {
	const oldSyncBackend = process.env.SYNC_DB_STORAGE;
	const oldSyncPath = process.env.SYNC_DB_PATH;
	const oldGameBackend = process.env.GAME_DB_STORAGE;
	const oldGamePath = process.env.GAME_DB_PATH;
	const oldCanonicalPersistence = process.env.SYNC_CANONICAL_PERSISTENCE;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = makeTempFile("sync-db-m7-harness");
		gameDbPath = makeTempFile("game-db-m7-harness");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
		process.env.SYNC_CANONICAL_PERSISTENCE = "fallback";
	});

	afterEach(() => {
		if (oldSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = oldSyncBackend;
		if (oldSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = oldSyncPath;
		if (oldGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = oldGameBackend;
		if (oldGamePath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = oldGamePath;
		if (oldCanonicalPersistence === undefined)
			delete process.env.SYNC_CANONICAL_PERSISTENCE;
		else process.env.SYNC_CANONICAL_PERSISTENCE = oldCanonicalPersistence;

		if (syncDbPath && fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (gameDbPath && fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("locks initial command verb set in the progression skeleton", () => {
		const skeleton = createScenarioSkeleton();
		expect(skeleton.version).toBe("m7-start-v1");
		expect(skeleton.supportedVerbs).toEqual([...SYNC_COMMAND_VERBS_V1]);
		expect(skeleton.phases).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "combat_depth", status: "pending" }),
				expect.objectContaining({ id: "inventory_depth", status: "pending" }),
				expect.objectContaining({ id: "quest_depth", status: "pending" }),
			]),
		);
	});

	it("executes tutorial progression scenario with replay parity", async () => {
		const { commits, processResult, replayResult, skeleton } =
			await runTutorialProgressionScenario({
				ownerId: "m7-harness-owner",
				runId: "m7-harness-run",
			});

		expect(commits).toHaveLength(5);
		expect(processResult.ok).toBe(true);
		expect(processResult.reconcileRequired).toBe(false);
		expect(processResult.results).toHaveLength(5);
		expect(processResult.results.every((entry) => entry.accepted)).toBe(true);
		expect(processResult.canonicalState.seq).toBe(5);
		expect(processResult.canonicalState.tick).toBe(5);
		expect(processResult.canonicalState.questFlags.quest_tutorial_combat_resolved).toBe(
			true,
		);
		expect(processResult.canonicalState.questFlags.quest_tutorial_savepoint_bound).toBe(
			true,
		);
		expect(
			processResult.canonicalState.entityStates.progression,
		).toEqual(
			expect.objectContaining({
				level: expect.any(Number),
				xp: expect.any(Number),
				gold: expect.any(Number),
				inventory: expect.any(Array),
			}),
		);
		expect(processResult.canonicalState.entityStates.progression.inventory.length).toBeGreaterThan(
			0,
		);
		expect(processResult.canonicalState.entityStates.combat).toEqual(
			expect.objectContaining({
				status: "resolved",
				outcome: expect.stringMatching(/victory|setback/),
				rewards: expect.objectContaining({
					xp: expect.any(Number),
					gold: expect.any(Number),
					itemId: expect.any(String),
					quantity: expect.any(Number),
				}),
			}),
		);
		expect(
			processResult.canonicalState.entityStates.lastSavepoint.progression,
		).toEqual(
			expect.objectContaining({
				level: expect.any(Number),
				xp: expect.any(Number),
				gold: expect.any(Number),
				inventoryUnitCount: expect.any(Number),
			}),
		);

		expect(replayResult.timeline).toHaveLength(5);
		expect(replayResult.timeline.every((entry) => entry.accepted)).toBe(true);
		expect(replayResult.state.seq).toBe(processResult.canonicalState.seq);
		expect(replayResult.state.tick).toBe(processResult.canonicalState.tick);
		expect(replayResult.state.stateHash).toBe(
			processResult.canonicalState.stateHash,
		);
		expect(replayResult.state.entityStates.progression).toEqual(
			processResult.canonicalState.entityStates.progression,
		);
		expect(replayResult.state.entityStates.combat).toEqual(
			processResult.canonicalState.entityStates.combat,
		);

		expect(processResult.saveSlotId).toEqual(expect.any(String));
		const saveRow = await savesStore.getSave({
			userId: "m7-harness-owner",
			saveId: processResult.saveSlotId,
		});
		expect(saveRow).not.toBeNull();
		const savedState = JSON.parse(saveRow.game_state);
		expect(savedState.player.level).toBe(
			processResult.canonicalState.entityStates.progression.level,
		);
		expect(savedState.player.gold).toBe(
			processResult.canonicalState.entityStates.progression.gold,
		);
		expect(savedState.player.inventory).toEqual(
			processResult.canonicalState.entityStates.progression.inventory,
		);
		expect(savedState.combat).toEqual(
			processResult.canonicalState.entityStates.combat,
		);
		expect(savedState.world.flags.quest_tutorial_savepoint_bound).toBe(true);

		expect(skeleton.phases).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "exploration", status: "implemented" }),
				expect.objectContaining({
					id: "encounter_transition",
					status: "implemented",
				}),
				expect.objectContaining({ id: "save_load_parity", status: "implemented" }),
			]),
		);
	});

	it("keeps setback branch deterministic for encounter rewards and quest flags", async () => {
		const { processResult, replayResult } = await runTutorialProgressionScenario({
			ownerId: "m7-harness-owner",
			runId: "m7-setback-2",
		});

		expect(processResult.ok).toBe(true);
		expect(processResult.reconcileRequired).toBe(false);
		expect(processResult.canonicalState.entityStates.combat).toEqual(
			expect.objectContaining({
				outcome: "setback",
				roll: 28,
				rewards: expect.objectContaining({
					xp: 20,
					gold: 4,
					itemId: "field_bandage",
					quantity: 1,
				}),
			}),
		);
		expect(processResult.canonicalState.entityStates.progression).toEqual({
			level: 1,
			xp: 20,
			gold: 4,
			inventory: [{ id: "field_bandage", quantity: 1 }],
		});
		expect(
			processResult.canonicalState.questFlags.quest_tutorial_combat_victory,
		).toBe(false);
		expect(
			processResult.canonicalState.questFlags.quest_tutorial_combat_setback,
		).toBe(true);

		expect(replayResult.state.stateHash).toBe(
			processResult.canonicalState.stateHash,
		);
	});
});
