const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { getUserFromRequest } = require("./auth");
const { listSaves, getSave } = require("./saves-store");
const {
	BATCHABLE_TRIGGER_TYPE,
	IMMEDIATE_TRIGGER_TYPES,
	MAX_ENTER_TILE_BATCH_ITEMS,
	MAX_ENTER_TILE_BATCH_WINDOW_MS,
	getWorldManifest,
	normalizeCommitEnvelope,
	normalizeCommitBatchRequest,
	buildInitialGameplayState,
	validateTriggerAgainstManifest,
	applyCommitToState,
	toPublicState,
	hashCanonicalState,
} = require("./sync-core");
const syncStore = require("./sync-store");
const { persistRunSnapshot } = require("./sync-snapshots");

const LEGACY_SAVE_MIGRATION_VERSION = 1;

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
}

function normalizeStoredState(state, { runId, manifest }) {
	const base = buildInitialGameplayState({
		runId,
		manifest,
		contentVersion: manifest.contentVersion,
	});
	if (!state || typeof state !== "object") return base;

	const normalized = {
		...base,
		...state,
		playerPos:
			state.playerPos && typeof state.playerPos === "object"
				? {
						x: Number.isFinite(Number(state.playerPos.x))
							? Number(state.playerPos.x)
							: base.playerPos.x,
						y: Number.isFinite(Number(state.playerPos.y))
							? Number(state.playerPos.y)
							: base.playerPos.y,
				  }
				: base.playerPos,
		entityStates:
			state.entityStates && typeof state.entityStates === "object"
				? state.entityStates
				: base.entityStates,
		questFlags:
			state.questFlags && typeof state.questFlags === "object"
				? state.questFlags
				: base.questFlags,
		cooldowns:
			state.cooldowns && typeof state.cooldowns === "object"
				? state.cooldowns
				: base.cooldowns,
		seq: Number.isInteger(state.seq) ? state.seq : base.seq,
		tick: Number.isInteger(state.tick) ? state.tick : base.tick,
		contentVersion: normalizeString(state.contentVersion) || base.contentVersion,
		runSeed: normalizeString(state.runSeed) || base.runSeed,
		stateVersion: Number.isInteger(state.stateVersion)
			? state.stateVersion
			: base.stateVersion,
	};

	normalized.stateHash = normalizeString(state.stateHash);
	if (!normalized.stateHash) {
		normalized.stateHash = hashCanonicalState({
			worldId: normalized.worldId,
			mapId: normalized.mapId,
			playerPos: normalized.playerPos,
			entityStates: normalized.entityStates,
			questFlags: normalized.questFlags,
			runId: normalized.runId,
			seq: normalized.seq,
			tick: normalized.tick,
			contentVersion: normalized.contentVersion,
			stateVersion: normalized.stateVersion,
			runSeed: normalized.runSeed,
		});
	}
	return normalized;
}

async function requireUser(req, res) {
	const user = await getUserFromRequest(req);
	if (user) return user;
	json(res, 401, {
		ok: false,
		errorCode: "UNAUTHENTICATED",
		message: "Sign in required.",
	});
	return null;
}

function parseLegacySaveState(rawValue) {
	if (!rawValue) return null;
	let parsed = rawValue;
	if (typeof rawValue === "string") {
		try {
			parsed = JSON.parse(rawValue);
		} catch {
			return null;
		}
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
	return parsed;
}

function hydrateFromLegacySave(save, { runId, manifest }) {
	const parsed = parseLegacySaveState(save?.game_state);
	if (!parsed) return null;

	const world = parsed.world && typeof parsed.world === "object" ? parsed.world : {};
	const player = parsed.player && typeof parsed.player === "object" ? parsed.player : {};
	const location = world.location && typeof world.location === "object" ? world.location : {};
	const mapId = normalizeString(parsed.mapId || parsed.locationId || location.current);
	if (!mapId) return null;

	const seq = parseInteger(parsed.seq, 0);
	const tick = parseInteger(parsed.tick, parseInteger(world.turnCount, seq));
	const contentVersion =
		normalizeString(parsed.contentVersion) || manifest.contentVersion;
	const entityStates = {
		player: {
			name: normalizeString(player.name) || "Traveler",
			level: parseInteger(player.level, 1),
		},
	};

	const state = {
		worldId: normalizeString(parsed.worldId || world.id) || manifest.worldId,
		mapId,
		playerPos: {
			x: Number.isFinite(Number(parsed?.playerPos?.x))
				? Number(parsed.playerPos.x)
				: manifest.start.x,
			y: Number.isFinite(Number(parsed?.playerPos?.y))
				? Number(parsed.playerPos.y)
				: manifest.start.y,
		},
		entityStates,
		questFlags:
			parsed.questFlags && typeof parsed.questFlags === "object"
				? parsed.questFlags
				: world.flags && typeof world.flags === "object"
					? world.flags
					: {},
		runId,
		seq,
		tick,
		stateHash: normalizeString(parsed.stateHash),
		contentVersion,
		stateVersion: Number.isInteger(parsed.stateVersion) ? parsed.stateVersion : 1,
		runSeed: normalizeString(parsed.runSeed) || crypto.createHash("sha256").update(`run:${runId}`, "utf8").digest("hex").slice(0, 16),
		cooldowns:
			parsed.cooldowns && typeof parsed.cooldowns === "object" ? parsed.cooldowns : {},
	};

	if (!state.stateHash) {
		state.stateHash = hashCanonicalState({
			worldId: state.worldId,
			mapId: state.mapId,
			playerPos: state.playerPos,
			entityStates: state.entityStates,
			questFlags: state.questFlags,
			runId: state.runId,
			seq: state.seq,
			tick: state.tick,
			contentVersion: state.contentVersion,
			stateVersion: state.stateVersion,
			runSeed: state.runSeed,
		});
	}
	return state;
}

async function maybeMigrateLegacySave({ ownerId, runId, manifest }) {
	try {
		const migrationVersion = await syncStore.getMigrationVersion({ ownerId });
		if (
			Number.isFinite(Number(migrationVersion)) &&
			Number(migrationVersion) >= LEGACY_SAVE_MIGRATION_VERSION
		) {
			return null;
		}

		const summaries = await listSaves({ userId: ownerId, limit: 20 });
		for (const summary of summaries || []) {
			const row = await getSave({ userId: ownerId, saveId: summary.id });
			if (!row) continue;
			const legacyState = hydrateFromLegacySave(row, { runId, manifest });
			if (!legacyState) continue;
			const run = await syncStore.putRun({
				ownerId,
				runId,
				state: legacyState,
				saveSlotId: summary.id,
			});
			try {
				await syncStore.markMigrationVersion({
					ownerId,
					version: LEGACY_SAVE_MIGRATION_VERSION,
					displayName:
						normalizeString(legacyState?.entityStates?.player?.name) || "Traveler",
				});
			} catch {
				// Migration succeeded; marker write is best-effort only.
			}
			return run;
		}
		return null;
	} catch {
		return null;
	}
}

async function loadRunState({ ownerId, runId, manifest, allowCreate = false }) {
	const run = await syncStore.getRun({ ownerId, runId });
	if (run && run.state) {
		return {
			state: normalizeStoredState(run.state, { runId, manifest }),
			saveSlotId: normalizeString(run.save_slot_id),
		};
	}

	const migrated = await maybeMigrateLegacySave({ ownerId, runId, manifest });
	if (migrated && migrated.state) {
		return {
			state: normalizeStoredState(migrated.state, { runId, manifest }),
			saveSlotId: normalizeString(migrated.save_slot_id),
		};
	}

	if (!allowCreate) return null;
	const initial = buildInitialGameplayState({
		runId,
		manifest,
		contentVersion: manifest.contentVersion,
	});
	const stored = await syncStore.putRun({
		ownerId,
		runId,
		state: initial,
	});
	return {
		state: normalizeStoredState(stored.state, { runId, manifest }),
		saveSlotId: normalizeString(stored.save_slot_id),
	};
}

function buildRejectResult({ commit, errorCode, message }) {
	return {
		id: commit?.id || "",
		clientSeq: commit?.clientSeq || null,
		accepted: false,
		errorCode,
		message,
		reconcileRequired: true,
	};
}

function buildAcceptResult({ commit, state, duplicate = false }) {
	return {
		id: commit.id,
		clientSeq: commit.clientSeq,
		accepted: true,
		duplicate,
		seq: state.seq,
		tick: state.tick,
		stateHash: state.stateHash,
	};
}

async function processCommitStream({ ownerId, commits, manifest }) {
	if (!Array.isArray(commits) || commits.length === 0) {
		return {
			ok: false,
			errorCode: "NO_COMMITS",
			message: "No commits provided.",
		};
	}

	const runId = commits[0].runId;
	const loaded = await loadRunState({
		ownerId,
		runId,
		manifest,
		allowCreate: true,
	});
	let state = loaded.state;
	let saveSlotId = loaded.saveSlotId;
	const results = [];
	let reconcileRequired = false;

	for (let idx = 0; idx < commits.length; idx += 1) {
		const commit = commits[idx];
		if (commit.runId !== runId) {
			const reject = buildRejectResult({
				commit,
				errorCode: "RUN_ID_MISMATCH",
				message: "All commits in request must use the same runId.",
			});
			results.push(reject);
			reconcileRequired = true;
			break;
		}

		if (reconcileRequired) {
			results.push(
				buildRejectResult({
					commit,
					errorCode: "BATCH_ABORTED_AFTER_REJECT",
					message: "Batch aborted after prior rejection.",
				}),
			);
			continue;
		}

		const existingEvent = await syncStore.getEventByCommitId({
			ownerId,
			runId,
			commitId: commit.id,
		});
		if (existingEvent) {
			if (existingEvent.accepted) {
				results.push(buildAcceptResult({ commit, state, duplicate: true }));
			} else {
				results.push(
					buildRejectResult({
						commit,
						errorCode: existingEvent.error_code || "COMMIT_REJECTED",
						message: existingEvent.message || "Commit already rejected.",
					}),
				);
				reconcileRequired = true;
			}
			continue;
		}

		if (commit.clientSeq <= state.seq) {
			const reject = buildRejectResult({
				commit,
				errorCode: "STALE_CLIENT_SEQ",
				message: "clientSeq is stale for this run.",
			});
			await syncStore.appendEvent({
				ownerId,
				runId,
				event: {
					commit_id: commit.id,
					client_seq: commit.clientSeq,
					accepted: false,
					error_code: reject.errorCode,
					message: reject.message,
					seq: state.seq,
					tick: state.tick,
					commit,
				},
			});
			results.push(reject);
			reconcileRequired = true;
			continue;
		}

		if (commit.clientSeq !== state.seq + 1) {
			const reject = buildRejectResult({
				commit,
				errorCode: "OUT_OF_ORDER_CLIENT_SEQ",
				message: "Commit sequence must be exactly canonical seq + 1.",
			});
			await syncStore.appendEvent({
				ownerId,
				runId,
				event: {
					commit_id: commit.id,
					client_seq: commit.clientSeq,
					accepted: false,
					error_code: reject.errorCode,
					message: reject.message,
					seq: state.seq,
					tick: state.tick,
					commit,
				},
			});
			results.push(reject);
			reconcileRequired = true;
			continue;
		}

		const triggerValidation = validateTriggerAgainstManifest({
			manifest,
			state,
			commit,
		});
		if (!triggerValidation.ok) {
			const reject = buildRejectResult({
				commit,
				errorCode: triggerValidation.errorCode,
				message: triggerValidation.message,
			});
			await syncStore.appendEvent({
				ownerId,
				runId,
				event: {
					commit_id: commit.id,
					client_seq: commit.clientSeq,
					accepted: false,
					error_code: reject.errorCode,
					message: reject.message,
					seq: state.seq,
					tick: state.tick,
					commit,
				},
			});
			results.push(reject);
			reconcileRequired = true;
			continue;
		}

		state = applyCommitToState({
			state,
			commit,
			triggerDef: triggerValidation.triggerDef,
			resolvedTargetId: triggerValidation.resolvedTargetId,
		});

		await syncStore.putRun({
			ownerId,
			runId,
			state,
			saveSlotId,
		});
		await syncStore.appendEvent({
			ownerId,
			runId,
			event: {
				commit_id: commit.id,
				client_seq: commit.clientSeq,
				accepted: true,
				error_code: null,
				message: null,
				seq: state.seq,
				tick: state.tick,
				state_hash: state.stateHash,
				commit,
			},
		});

		if (commit.triggerType === "SAVEPOINT") {
			const snapshot = await persistRunSnapshot({
				ownerId,
				saveSlotId,
				runState: state,
			});
			saveSlotId = normalizeString(snapshot.saveSlotId);
			await syncStore.putRun({
				ownerId,
				runId,
				state,
				saveSlotId,
			});
		}

		results.push(buildAcceptResult({ commit, state }));
	}

	return {
		ok: true,
		runId,
		results,
		reconcileRequired,
		canonicalState: toPublicState(state),
		saveSlotId: saveSlotId || null,
	};
}

function buildSyncResponse({ result, manifest }) {
	const accepted = result.results.filter((entry) => entry.accepted);
	const rejected = result.results.filter((entry) => !entry.accepted);
	return {
		ok: !result.reconcileRequired,
		runId: result.runId,
		accepted,
		rejected,
		reconcileRequired: result.reconcileRequired,
		canonicalState: result.canonicalState,
		contentVersion: manifest.contentVersion,
		saveSlotId: result.saveSlotId,
		reconcile: result.reconcileRequired
			? {
					pullPath: `/api/sync/pull?runId=${encodeURIComponent(result.runId)}&afterSeq=${encodeURIComponent(
						String(result.canonicalState?.seq || 0),
					)}`,
			  }
			: null,
		policies: {
			batchableTriggerType: BATCHABLE_TRIGGER_TYPE,
			enterTileBatchWindowMs: MAX_ENTER_TILE_BATCH_WINDOW_MS,
			enterTileBatchMaxItems: MAX_ENTER_TILE_BATCH_ITEMS,
			immediateTriggerTypes: Array.from(IMMEDIATE_TRIGGER_TYPES),
		},
	};
}

async function commit(req, res) {
	try {
		const user = await requireUser(req, res);
		if (!user) return;

		const body = await readJsonBody(req);
		const normalized = normalizeCommitEnvelope(body);
		if (!normalized.ok) {
			return json(res, 400, {
				ok: false,
				errorCode: normalized.errorCode,
				message: normalized.message,
			});
		}

		const manifest = getWorldManifest();
		const result = await processCommitStream({
			ownerId: user.id,
			commits: [normalized.commit],
			manifest,
		});

		if (!result.ok) {
			return json(res, 500, {
				ok: false,
				errorCode: result.errorCode || "COMMIT_FAILED",
				message: result.message || "Commit processing failed.",
			});
		}

		const response = buildSyncResponse({ result, manifest });
		return json(res, response.ok ? 200 : 409, response);
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_SYNC_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

async function commitBatch(req, res) {
	try {
		const user = await requireUser(req, res);
		if (!user) return;

		const body = await readJsonBody(req);
		const normalized = normalizeCommitBatchRequest(body);
		if (!normalized.ok) {
			return json(res, 400, {
				ok: false,
				errorCode: normalized.errorCode,
				message: normalized.message,
			});
		}

		const manifest = getWorldManifest();
		const result = await processCommitStream({
			ownerId: user.id,
			commits: normalized.commits,
			manifest,
		});

		if (!result.ok) {
			return json(res, 500, {
				ok: false,
				errorCode: result.errorCode || "COMMIT_BATCH_FAILED",
				message: result.message || "Commit batch processing failed.",
			});
		}

		const response = buildSyncResponse({ result, manifest });
		return json(res, response.ok ? 200 : 409, response);
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_SYNC_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

function normalizeLegacyActionBody(rawBody, manifest) {
	const body = rawBody && typeof rawBody === "object" ? rawBody : {};
	const action = body.action && typeof body.action === "object" ? body.action : {};
	const trigger = action.trigger && typeof action.trigger === "object" ? action.trigger : body.trigger;
	return {
		id: normalizeString(body.id || action.id) || crypto.randomUUID(),
		runId: normalizeString(body.runId || action.runId),
		clientId: normalizeString(body.clientId || action.clientId || "legacy-client"),
		clientSeq: parseInteger(body.clientSeq ?? action.clientSeq ?? action.seq, Number.NaN),
		createdAt: normalizeString(body.createdAt || action.createdAt) || new Date().toISOString(),
		contentVersion:
			normalizeString(body.contentVersion || action.contentVersion) ||
			manifest.contentVersion,
		triggerType: normalizeString(body.triggerType || action.triggerType || action.type),
		trigger: {
			triggerId: normalizeString(body?.trigger?.triggerId || action?.trigger?.triggerId || trigger?.triggerId),
			mapId: normalizeString(body?.trigger?.mapId || action?.trigger?.mapId || trigger?.mapId),
			x: parseInteger(body?.trigger?.x ?? action?.trigger?.x ?? trigger?.x, Number.NaN),
			y: parseInteger(body?.trigger?.y ?? action?.trigger?.y ?? trigger?.y, Number.NaN),
			targetId: normalizeString(body?.trigger?.targetId || action?.trigger?.targetId || trigger?.targetId) || undefined,
		},
	};
}

async function action(req, res) {
	try {
		const user = await requireUser(req, res);
		if (!user) return;

		const manifest = getWorldManifest();
		const body = await readJsonBody(req);
		const commitEnvelope = normalizeLegacyActionBody(body, manifest);
		const normalized = normalizeCommitEnvelope(commitEnvelope);
		if (!normalized.ok) {
			return json(res, 400, {
				ok: false,
				errorCode: normalized.errorCode,
				message: normalized.message,
			});
		}

		const result = await processCommitStream({
			ownerId: user.id,
			commits: [normalized.commit],
			manifest,
		});
		if (!result.ok) {
			return json(res, 500, {
				ok: false,
				errorCode: result.errorCode || "COMMIT_FAILED",
				message: result.message || "Commit processing failed.",
			});
		}

		const response = buildSyncResponse({ result, manifest });
		return json(res, response.ok ? 200 : 409, response);
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_SYNC_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

async function pull(req, res) {
	try {
		const user = await requireUser(req, res);
		if (!user) return;

		const runId = normalizeString(req?.query?.runId);
		if (!runId) {
			return json(res, 400, {
				ok: false,
				errorCode: "MISSING_RUN_ID",
				message: "runId query parameter is required.",
			});
		}

		const manifest = getWorldManifest();
		const loaded = await loadRunState({
			ownerId: user.id,
			runId,
			manifest,
			allowCreate: false,
		});
		if (!loaded) {
			return json(res, 404, {
				ok: false,
				errorCode: "RUN_NOT_FOUND",
				message: "Run not found.",
			});
		}

		const afterSeq = parseInteger(req?.query?.afterSeq, 0);
		const limit = parseInteger(req?.query?.limit, 100);
		const events = await syncStore.listEvents({
			ownerId: user.id,
			runId,
			afterSeq,
			limit,
		});
		return json(res, 200, {
			ok: true,
			runId,
			contentVersion: manifest.contentVersion,
			canonicalState: toPublicState(loaded.state),
			events: events.map((event) => ({
				commitId: event.commit_id,
				clientSeq: event.client_seq,
				eventType: event.event_type || event.eventType || "TRIGGER",
				triggerType: event.trigger_type || event.triggerType || null,
				accepted: event.accepted,
				errorCode: event.error_code,
				message: event.message,
				stateHash: event.state_hash,
				createdAt: event.created_at,
			})),
		});
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_SYNC_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

module.exports = {
	commit,
	commitBatch,
	action,
	pull,
	processCommitStream,
	loadRunState,
};
