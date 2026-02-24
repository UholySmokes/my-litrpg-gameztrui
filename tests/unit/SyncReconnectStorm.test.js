import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../../functions/lib/api-router.js");
const syncCore = require("../../functions/lib/sync-core.js");

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

function createEnvelope({ id, runId, clientSeq, contentVersion }) {
	return {
		id,
		runId,
		clientId: "godot-client-reconnect",
		clientSeq,
		createdAt: new Date().toISOString(),
		contentVersion,
		command: {
			type: "TRIGGER",
			verb: "ENTER_TILE",
			triggerType: "ENTER_TILE",
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		},
	};
}

async function postCommand({ userId, envelope }) {
	const req = {
		method: "POST",
		url: "/api/sync/command",
		headers: { "x-dev-user-id": userId },
		body: envelope,
	};
	const res = createRes();
	await handleApiRequest(req, res);
	return res;
}

describe("sync reconnect storm integrity", () => {
	const originalSyncBackend = process.env.SYNC_DB_STORAGE;
	const originalSyncPath = process.env.SYNC_DB_PATH;
	const originalGameBackend = process.env.GAME_DB_STORAGE;
	const originalGamePath = process.env.GAME_DB_PATH;
	let syncDbPath = "";
	let gameDbPath = "";

	beforeEach(() => {
		syncDbPath = tempPath("sync-reconnect-storm-db");
		gameDbPath = tempPath("sync-reconnect-storm-game-db");
		process.env.SYNC_DB_STORAGE = "file";
		process.env.SYNC_DB_PATH = syncDbPath;
		process.env.GAME_DB_STORAGE = "file";
		process.env.GAME_DB_PATH = gameDbPath;
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

		if (syncDbPath && fs.existsSync(syncDbPath)) fs.unlinkSync(syncDbPath);
		if (gameDbPath && fs.existsSync(gameDbPath)) fs.unlinkSync(gameDbPath);
	});

	it("keeps canonical sequence monotonic across duplicate and stale reconnect bursts", async () => {
		const manifest = syncCore.getWorldManifest();
		const userId = "user-reconnect-storm";
		const runId = "run-reconnect-storm";
		const uniqueCommitTotal = 20;
		let nextSeq = 1;
		let lastAcceptedSeq = 0;

		for (let i = 0; i < uniqueCommitTotal; i += 1) {
			const primary = createEnvelope({
				id: `storm-primary-${i}`,
				runId,
				clientSeq: nextSeq,
				contentVersion: manifest.contentVersion,
			});
			const primaryRes = await postCommand({ userId, envelope: primary });
			expect(primaryRes.statusCode).toBe(200);
			expect(primaryRes.body.accepted[0].accepted).toBe(true);
			expect(primaryRes.body.accepted[0].duplicate).toBe(false);
			lastAcceptedSeq = nextSeq;
			expect(primaryRes.body.accepted[0].seq).toBe(lastAcceptedSeq);
			expect(primaryRes.body.canonicalState.seq).toBe(lastAcceptedSeq);

			const replayResA = await postCommand({ userId, envelope: primary });
			expect(replayResA.statusCode).toBe(200);
			expect(replayResA.body.accepted[0].duplicate).toBe(true);
			expect(replayResA.body.accepted[0].seq).toBe(lastAcceptedSeq);
			expect(replayResA.body.canonicalState.seq).toBe(lastAcceptedSeq);

			const replayResB = await postCommand({ userId, envelope: primary });
			expect(replayResB.statusCode).toBe(200);
			expect(replayResB.body.accepted[0].duplicate).toBe(true);
			expect(replayResB.body.accepted[0].seq).toBe(lastAcceptedSeq);
			expect(replayResB.body.canonicalState.seq).toBe(lastAcceptedSeq);

			if (i % 4 === 0) {
				const stale = createEnvelope({
					id: `storm-stale-${i}`,
					runId,
					clientSeq: nextSeq,
					contentVersion: manifest.contentVersion,
				});
				stale.clientSeq = Math.max(1, nextSeq - 1);
				const staleRes = await postCommand({ userId, envelope: stale });
				expect(staleRes.statusCode).toBe(409);
				expect(staleRes.body.reconcileRequired).toBe(true);
				expect(staleRes.body.rejected[0].errorCode).toBe("STALE_CLIENT_SEQ");
				expect(staleRes.body.canonicalState.seq).toBe(lastAcceptedSeq);
			}

			nextSeq += 1;
		}

		const finalEnvelope = createEnvelope({
			id: "storm-final-commit",
			runId,
			clientSeq: nextSeq,
			contentVersion: manifest.contentVersion,
		});
		const finalRes = await postCommand({ userId, envelope: finalEnvelope });
		expect(finalRes.statusCode).toBe(200);
		expect(finalRes.body.accepted[0].duplicate).toBe(false);
		expect(finalRes.body.accepted[0].seq).toBe(uniqueCommitTotal + 1);
		expect(finalRes.body.canonicalState.seq).toBe(uniqueCommitTotal + 1);
	});
});
