import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../../functions/lib/api-router.js");
const { SAVE_RESET_EPOCH } = require("../../shared/save-cutover.cjs");

function makeTempFile(name) {
	return path.join(
		os.tmpdir(),
		`${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
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

function createReq({ method, url, body, userId = "user-1" }) {
	return {
		method,
		url,
		body,
		headers: {
			"x-dev-user-id": userId,
			"x-dev-user-email": `${userId}@example.test`,
		},
	};
}

describe("api router saves routes", () => {
	const originalSyncStorage = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const oldGameDbStorage = process.env.GAME_DB_STORAGE;
	const oldGameSavesStorage = process.env.GAME_SAVES_STORAGE;
	const oldGameDbPath = process.env.GAME_DB_PATH;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = makeTempFile("sync-db");
		gameDbPath = makeTempFile("game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_SAVES_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
		fs.writeFileSync(
			syncDbPath,
			JSON.stringify(
				{
					version: 1,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					runs: [],
					events: [],
					migration_versions: {
						"user-1": SAVE_RESET_EPOCH,
						"owner-1": SAVE_RESET_EPOCH,
						"intruder-1": SAVE_RESET_EPOCH,
					},
				},
				null,
				2,
			),
			"utf8",
		);
	});

	afterEach(() => {
		if (originalSyncStorage === undefined) delete process.env.SYNC_DB_STORAGE;
		else process.env.SYNC_DB_STORAGE = originalSyncStorage;

		if (originalSyncPath === undefined) delete process.env.SYNC_DB_PATH;
		else process.env.SYNC_DB_PATH = originalSyncPath;

		if (oldGameDbStorage === undefined) delete process.env.GAME_DB_STORAGE;
		else process.env.GAME_DB_STORAGE = oldGameDbStorage;

		if (oldGameSavesStorage === undefined) delete process.env.GAME_SAVES_STORAGE;
		else process.env.GAME_SAVES_STORAGE = oldGameSavesStorage;

		if (oldGameDbPath === undefined) delete process.env.GAME_DB_PATH;
		else process.env.GAME_DB_PATH = oldGameDbPath;

		if (gameDbPath && fs.existsSync(gameDbPath)) {
			fs.unlinkSync(gameDbPath);
		}
		if (syncDbPath && fs.existsSync(syncDbPath)) {
			fs.unlinkSync(syncDbPath);
		}
	});

	it("creates, reads, updates, lists, and deletes saves through /api/saves*", async () => {
		const createResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "POST",
				url: "/api/saves",
				body: {
					saveName: "Starter",
					gameState: {
						player: { name: "Traveler", level: 1 },
						world: { id: "world-1", location: { current: "map-1" }, turnCount: 1 },
					},
				},
			}),
			createResObj,
		);
		expect(createResObj.statusCode).toBe(200);
		expect(createResObj.body.ok).toBe(true);
		const saveId = String(createResObj.body?.save?.id || "");
		const stateHash = String(createResObj.body?.save?.state_hash || "");
		expect(saveId).toHaveLength(36);
    expect(stateHash).toHaveLength(8);

		const getResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "GET",
				url: `/api/saves/${saveId}`,
			}),
			getResObj,
		);
		expect(getResObj.statusCode).toBe(200);
		expect(getResObj.body.ok).toBe(true);
		expect(getResObj.body.save.id).toBe(saveId);
		expect(getResObj.body.save.game_state.player.name).toBe("Traveler");
    expect(getResObj.body.save.state_hash).toBe(stateHash);

		const listResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "GET",
				url: "/api/saves",
			}),
			listResObj,
		);
		expect(listResObj.statusCode).toBe(200);
		expect(listResObj.body.ok).toBe(true);
		expect(listResObj.body.saves).toHaveLength(1);
		expect(listResObj.body.saves[0].id).toBe(saveId);
    expect(listResObj.body.saves[0].state_hash).toBe(stateHash);

		const updateResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "PUT",
				url: `/api/saves/${saveId}`,
				body: {
					saveName: "Starter v2",
          expectedStateHash: stateHash,
					gameState: {
						player: { name: "Traveler", level: 2 },
						world: { id: "world-1", location: { current: "map-1" }, turnCount: 2 },
					},
				},
			}),
			updateResObj,
		);
		expect(updateResObj.statusCode).toBe(200);
		expect(updateResObj.body.ok).toBe(true);
		expect(updateResObj.body.save.id).toBe(saveId);
    expect(updateResObj.body.save.state_hash).not.toBe(stateHash);

		const deleteResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "DELETE",
				url: `/api/saves/${saveId}`,
			}),
			deleteResObj,
		);
		expect(deleteResObj.statusCode).toBe(200);
		expect(deleteResObj.body.ok).toBe(true);

		const missingResObj = createRes();
		await handleApiRequest(
			createReq({
				method: "GET",
				url: `/api/saves/${saveId}`,
			}),
			missingResObj,
		);
		expect(missingResObj.statusCode).toBe(404);
		expect(missingResObj.body.errorCode).toBe("SAVE_NOT_FOUND");
	});

	it("enforces owner scoping on /api/saves/:id", async () => {
		const created = createRes();
		await handleApiRequest(
			createReq({
				method: "POST",
				url: "/api/saves",
				userId: "owner-1",
				body: {
					saveName: "Owner Save",
					gameState: {
						player: { name: "Owner", level: 5 },
						world: { id: "world-1", location: { current: "map-1" } },
					},
				},
			}),
			created,
		);
		const saveId = String(created.body?.save?.id || "");

		const denied = createRes();
		await handleApiRequest(
			createReq({
				method: "GET",
				url: `/api/saves/${saveId}`,
				userId: "intruder-1",
			}),
			denied,
		);
		expect(denied.statusCode).toBe(404);
		expect(denied.body.errorCode).toBe("SAVE_NOT_FOUND");
	});

  it("rejects stale cloud-save updates with a conflict payload", async () => {
    const created = createRes();
    await handleApiRequest(
      createReq({
        method: "POST",
        url: "/api/saves",
        body: {
          saveName: "Conflict Save",
          gameState: {
            player: { name: "Traveler", level: 1 },
            world: { id: "world-1", location: { current: "map-1" } },
          },
        },
      }),
      created,
    );

    const saveId = String(created.body?.save?.id || "");
    const stateHash = String(created.body?.save?.state_hash || "");

    const firstUpdate = createRes();
    await handleApiRequest(
      createReq({
        method: "PUT",
        url: `/api/saves/${saveId}`,
        body: {
          saveName: "Conflict Save v2",
          expectedStateHash: stateHash,
          gameState: {
            player: { name: "Traveler", level: 2 },
            world: { id: "world-1", location: { current: "map-2" } },
          },
        },
      }),
      firstUpdate,
    );
    expect(firstUpdate.statusCode).toBe(200);

    const staleUpdate = createRes();
    await handleApiRequest(
      createReq({
        method: "PUT",
        url: `/api/saves/${saveId}`,
        body: {
          saveName: "Conflict Save stale",
          expectedStateHash: stateHash,
          gameState: {
            player: { name: "Traveler", level: 3 },
            world: { id: "world-1", location: { current: "map-3" } },
          },
        },
      }),
      staleUpdate,
    );

    expect(staleUpdate.statusCode).toBe(409);
    expect(staleUpdate.body.errorCode).toBe("SAVE_CONFLICT");
    expect(staleUpdate.body.conflict.expectedStateHash).toBe(stateHash);
    expect(staleUpdate.body.conflict.currentStateHash).toBe(
      firstUpdate.body.save.state_hash,
    );
  });

	it("rejects invalid game state payloads", async () => {
		const res = createRes();
		await handleApiRequest(
			createReq({
				method: "POST",
				url: "/api/saves",
				body: {
					saveName: "Bad",
					gameState: { player: { name: "Traveler" } },
				},
			}),
			res,
		);
		expect(res.statusCode).toBe(400);
		expect(res.body.errorCode).toBe("INVALID_GAME_STATE");
	});
});

