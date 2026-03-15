import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../../functions/lib/api-router.js");
const syncCore = require("../../functions/lib/sync-core.js");
const syncStore = require("../../functions/lib/sync-store.js");
const { SAVE_RESET_EPOCH } = require("../../shared/save-cutover.cjs");

function tempPath(prefix) {
	return path.join(
		os.tmpdir(),
		`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
	);
}

function createRes() {
	const res = {
		statusCode: 0,
		headers: {},
		body: null,
	};
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.set = (key, value) => {
		res.headers[key] = value;
		return res;
	};
	res.json = (value) => {
		res.body = value;
		return res;
	};
	return res;
}

function createCommandEnvelope({
	id,
	runId,
	clientSeq,
	contentVersion,
	verb = "ENTER_TILE",
	createdAt = "2026-02-23T10:00:00.000Z",
}) {
	return {
		id,
		runId,
		clientId: "godot-client-test",
		clientSeq,
		createdAt,
		contentVersion,
		command: {
			type: "TRIGGER",
			verb,
			triggerType: verb,
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		},
	};
}

function createCharacterCommandEnvelope({
	id,
	runId,
	clientSeq,
	contentVersion,
	createdAt = "2026-03-10T10:00:00.000Z",
	character,
}) {
	return {
		id,
		runId,
		clientId: "godot-client-test",
		clientSeq,
		createdAt,
		contentVersion,
		command: {
			type: "CHARACTER",
			verb: "CREATE",
			character: {
				name: "Aela",
				mode: "basic",
				race: { id: "pure_human", name: "Pure Human" },
				class: { id: "warrior", name: "Warrior" },
				origin: { id: "street_urchin", name: "Street Urchin" },
				alignment: { id: "neutral_good", name: "Neutral Good" },
				archetype: { id: "balanced", name: "Balanced" },
				attributes: {
					str: 5,
					agi: 5,
					dex: 5,
					int: 5,
				},
				activeSkills: ["slash"],
				passiveSkills: ["toughness"],
				perks: ["battle_focus"],
				...(character && typeof character === "object" ? character : {}),
			},
		},
	};
}

async function allowSyncForUser(ownerId) {
	await syncStore.markMigrationVersion({
		ownerId,
		version: SAVE_RESET_EPOCH,
		displayName: "Sync Command Route Test",
	});
}

describe("/api/sync/command route", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalGamePath = process.env.GAME_DB_PATH;
	const originalCanaryMode = process.env.INTERNAL_CANARY_MODE;
	const originalCanaryAllowlist = process.env.INTERNAL_CANARY_ALLOWLIST;
	const originalRolloutStage = process.env.RUNTIME_ROLLOUT_STAGE;
	const originalLimitedRolloutMode = process.env.LIMITED_ROLLOUT_MODE;
	const originalLimitedRolloutPercentage = process.env.LIMITED_ROLLOUT_PERCENTAGE;
	const originalLimitedRolloutAllowlist = process.env.LIMITED_ROLLOUT_ALLOWLIST;
	const originalLimitedRolloutSalt = process.env.LIMITED_ROLLOUT_SALT;
	const originalRolloutPercentage = process.env.ROLLOUT_PERCENTAGE;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = tempPath("sync-command-db");
		gameDbPath = tempPath("sync-command-game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
		delete process.env.INTERNAL_CANARY_MODE;
		delete process.env.INTERNAL_CANARY_ALLOWLIST;
		delete process.env.RUNTIME_ROLLOUT_STAGE;
		delete process.env.LIMITED_ROLLOUT_MODE;
		delete process.env.LIMITED_ROLLOUT_PERCENTAGE;
		delete process.env.LIMITED_ROLLOUT_ALLOWLIST;
		delete process.env.LIMITED_ROLLOUT_SALT;
		delete process.env.ROLLOUT_PERCENTAGE;
	});

	afterEach(() => {
		if (originalSyncBackend === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncBackend;
		if (originalSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = originalSyncPath;
		if (originalGameBackend === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = originalGameBackend;
		if (originalGamePath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = originalGamePath;
		if (originalCanaryMode === undefined) delete process.env.INTERNAL_CANARY_MODE;
		else process.env.INTERNAL_CANARY_MODE = originalCanaryMode;
		if (originalCanaryAllowlist === undefined) delete process.env.INTERNAL_CANARY_ALLOWLIST;
		else process.env.INTERNAL_CANARY_ALLOWLIST = originalCanaryAllowlist;
		if (originalRolloutStage === undefined) delete process.env.RUNTIME_ROLLOUT_STAGE;
		else process.env.RUNTIME_ROLLOUT_STAGE = originalRolloutStage;
		if (originalLimitedRolloutMode === undefined) delete process.env.LIMITED_ROLLOUT_MODE;
		else process.env.LIMITED_ROLLOUT_MODE = originalLimitedRolloutMode;
		if (originalLimitedRolloutPercentage === undefined) delete process.env.LIMITED_ROLLOUT_PERCENTAGE;
		else process.env.LIMITED_ROLLOUT_PERCENTAGE = originalLimitedRolloutPercentage;
		if (originalLimitedRolloutAllowlist === undefined) delete process.env.LIMITED_ROLLOUT_ALLOWLIST;
		else process.env.LIMITED_ROLLOUT_ALLOWLIST = originalLimitedRolloutAllowlist;
		if (originalLimitedRolloutSalt === undefined) delete process.env.LIMITED_ROLLOUT_SALT;
		else process.env.LIMITED_ROLLOUT_SALT = originalLimitedRolloutSalt;
		if (originalRolloutPercentage === undefined) delete process.env.ROLLOUT_PERCENTAGE;
		else process.env.ROLLOUT_PERCENTAGE = originalRolloutPercentage;

		if (syncDbPath && fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (gameDbPath && fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("rejects malformed command payload", async () => {
		await allowSyncForUser("user-command-1");
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-1" },
			body: {
				id: "missing-command",
				runId: "run-command-1",
				clientId: "godot-client-test",
				clientSeq: 1,
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("INVALID_COMMAND_ENVELOPE");
	});

	it("accepts character creation commands and mutates canonical roster state", async () => {
		await allowSyncForUser("user-command-character-create");
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-character-create" },
			body: createCharacterCommandEnvelope({
				id: "cmd-character-create-1",
				runId: "run-character-create-1",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
		expect(res.body.canonicalState.seq).toBe(1);
		expect(res.body.canonicalState.entityStates.playerProfile).toEqual({
			charactersCreated: 1,
			advancedCreationUnlocked: true,
			lastCreationMode: "basic",
		});
		expect(res.body.canonicalState.entityStates.activeCharacter).toEqual(
			expect.objectContaining({
				name: "Aela",
				raceId: "pure_human",
				classId: "warrior",
				originId: "street_urchin",
				alignmentId: "neutral_good",
				archetypeSystemId: "balanced",
			}),
		);
		expect(res.body.canonicalState.entityStates.characterRoster).toHaveLength(1);
	});

	it("requires authentication for command submission", async () => {
		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: {},
			body: createCommandEnvelope({
				id: "cmd-auth-required-1",
				runId: "run-command-auth-required",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(401);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("UNAUTHENTICATED");
	});

	it("blocks command path if canary enforce mode is active with no allowlist", async () => {
		process.env.INTERNAL_CANARY_MODE = "enforce";
		delete process.env.INTERNAL_CANARY_ALLOWLIST;

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-canary-empty" },
			body: createCommandEnvelope({
				id: "cmd-canary-empty-1",
				runId: "run-command-canary-empty",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(503);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("CANARY_ALLOWLIST_EMPTY");
	});

	it("blocks non-allowlisted users when canary enforce mode is active", async () => {
		process.env.INTERNAL_CANARY_MODE = "enforce";
		process.env.INTERNAL_CANARY_ALLOWLIST = "allowed-user@example.test,allowed-user-id";
		process.env.RUNTIME_ROLLOUT_STAGE = "m11_canary";

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: {
				"x-dev-user-id": "non-allowlisted-user",
				"x-dev-user-email": "outsider@example.test",
			},
			body: createCommandEnvelope({
				id: "cmd-canary-denied-1",
				runId: "run-command-canary-denied",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(403);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("CANARY_ACCESS_DENIED");
		expect(res.body.rolloutStage).toBe("m11_canary");
	});

	it("allows allowlisted users when canary enforce mode is active", async () => {
		process.env.INTERNAL_CANARY_MODE = "enforce";
		process.env.INTERNAL_CANARY_ALLOWLIST = "allowlisted-user";
		process.env.RUNTIME_ROLLOUT_STAGE = "m11_canary";
		await allowSyncForUser("allowlisted-user");

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "allowlisted-user" },
			body: createCommandEnvelope({
				id: "cmd-canary-allow-1",
				runId: "run-command-canary-allow",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
	});

	it("blocks commands when limited rollout enforce mode has invalid percentage", async () => {
		process.env.LIMITED_ROLLOUT_MODE = "enforce";
		delete process.env.LIMITED_ROLLOUT_PERCENTAGE;
		delete process.env.ROLLOUT_PERCENTAGE;
		process.env.RUNTIME_ROLLOUT_STAGE = "m12_limited";

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-rollout-invalid-percent" },
			body: createCommandEnvelope({
				id: "cmd-rollout-invalid-1",
				runId: "run-command-rollout-invalid",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(503);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("LIMITED_ROLLOUT_PERCENTAGE_INVALID");
	});

	it("blocks non-allowlisted users when limited rollout percentage is 0", async () => {
		process.env.LIMITED_ROLLOUT_MODE = "enforce";
		process.env.LIMITED_ROLLOUT_PERCENTAGE = "0";
		process.env.RUNTIME_ROLLOUT_STAGE = "m12_limited";

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-rollout-zero" },
			body: createCommandEnvelope({
				id: "cmd-rollout-zero-1",
				runId: "run-command-rollout-zero",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(403);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("LIMITED_ROLLOUT_DENIED");
		expect(res.body.rolloutPercentage).toBe(0);
	});

	it("allows users when limited rollout percentage is 100", async () => {
		process.env.LIMITED_ROLLOUT_MODE = "enforce";
		process.env.LIMITED_ROLLOUT_PERCENTAGE = "100";
		process.env.RUNTIME_ROLLOUT_STAGE = "m12_limited";
		await allowSyncForUser("user-rollout-full");

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-rollout-full" },
			body: createCommandEnvelope({
				id: "cmd-rollout-full-1",
				runId: "run-command-rollout-full",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
	});

	it("allows allowlisted users even when rollout percentage is 0", async () => {
		process.env.LIMITED_ROLLOUT_MODE = "enforce";
		process.env.LIMITED_ROLLOUT_PERCENTAGE = "0";
		process.env.LIMITED_ROLLOUT_ALLOWLIST = "rollout-allowlisted-user";
		process.env.RUNTIME_ROLLOUT_STAGE = "m12_limited";
		await allowSyncForUser("rollout-allowlisted-user");

		const manifest = syncCore.getWorldManifest();
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "rollout-allowlisted-user" },
			body: createCommandEnvelope({
				id: "cmd-rollout-allowlist-1",
				runId: "run-command-rollout-allowlist",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
	});

	it("accepts a valid command envelope", async () => {
		const manifest = syncCore.getWorldManifest();
		await allowSyncForUser("user-command-2");
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-2" },
			body: createCommandEnvelope({
				id: "cmd-ok-1",
				runId: "run-command-ok",
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(200);
		expect(res.body.ok).toBe(true);
		expect(res.body.accepted).toHaveLength(1);
		expect(res.body.accepted[0].accepted).toBe(true);
	});

	it("returns reconcile on stale sequence", async () => {
		const manifest = syncCore.getWorldManifest();
		const user = "user-command-3";
		const runId = "run-command-stale";
		await allowSyncForUser(user);

		const firstReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "cmd-stale-1",
				runId,
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const firstRes = createRes();
		await handleApiRequest(firstReq, firstRes);
		expect(firstRes.statusCode).toBe(200);

		const staleReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: createCommandEnvelope({
				id: "cmd-stale-2",
				runId,
				clientSeq: 1,
				contentVersion: manifest.contentVersion,
			}),
		};
		const staleRes = createRes();
		await handleApiRequest(staleReq, staleRes);
		expect(staleRes.statusCode).toBe(409);
		expect(staleRes.body.reconcileRequired).toBe(true);
		expect(staleRes.body.rejected[0].errorCode).toBe("STALE_CLIENT_SEQ");
	});

	it("treats replayed idempotency key as duplicate success", async () => {
		const manifest = syncCore.getWorldManifest();
		const user = "user-command-4";
		const runId = "run-command-replay";
		await allowSyncForUser(user);
		const payload = createCommandEnvelope({
			id: "cmd-replay-1",
			runId,
			clientSeq: 1,
			contentVersion: manifest.contentVersion,
		});

		const firstReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: payload,
		};
		const firstRes = createRes();
		await handleApiRequest(firstReq, firstRes);
		expect(firstRes.statusCode).toBe(200);

		const replayReq = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": user },
			body: payload,
		};
		const replayRes = createRes();
		await handleApiRequest(replayReq, replayRes);
		expect(replayRes.statusCode).toBe(200);
		expect(replayRes.body.accepted[0].duplicate).toBe(true);
	});

	it("returns reconcile on content mismatch", async () => {
		await allowSyncForUser("user-command-5");
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-5" },
			body: createCommandEnvelope({
				id: "cmd-mismatch-1",
				runId: "run-command-mismatch",
				clientSeq: 1,
				contentVersion: "bad-content-version",
			}),
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(409);
		expect(res.body.reconcileRequired).toBe(true);
		expect(res.body.rejected[0].errorCode).toBe("CONTENT_VERSION_MISMATCH");
	});

	it("rejects unsupported command verb", async () => {
		const manifest = syncCore.getWorldManifest();
		await allowSyncForUser("user-command-6");
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-6" },
			body: {
				...createCommandEnvelope({
					id: "cmd-verb-bad-1",
					runId: "run-command-verb-bad",
					clientSeq: 1,
					contentVersion: manifest.contentVersion,
				}),
				command: {
					type: "TRIGGER",
					verb: "TELEPORT",
					triggerType: "TELEPORT",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("UNSUPPORTED_COMMAND_VERB");
	});

	it("rejects mismatched command verb and trigger type", async () => {
		const manifest = syncCore.getWorldManifest();
		await allowSyncForUser("user-command-7");
		const req = {
			method: "POST",
			url: "/api/sync/command",
			headers: { "x-dev-user-id": "user-command-7" },
			body: {
				...createCommandEnvelope({
					id: "cmd-verb-mismatch-1",
					runId: "run-command-verb-mismatch",
					clientSeq: 1,
					contentVersion: manifest.contentVersion,
				}),
				command: {
					type: "TRIGGER",
					verb: "INTERACT",
					triggerType: "ENTER_TILE",
					trigger: {
						triggerId: "tile_intro_square",
						mapId: "map_village_square",
						x: 6,
						y: 8,
					},
				},
			},
		};
		const res = createRes();
		await handleApiRequest(req, res);
		expect(res.statusCode).toBe(400);
		expect(res.body.ok).toBe(false);
		expect(res.body.errorCode).toBe("COMMAND_VERB_TRIGGER_MISMATCH");
	});
});
