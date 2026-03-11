const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { getUserFromRequest } = require("./auth");
const { enforceProgressReset } = require("./save-reset.cjs");
const {
	BATCHABLE_TRIGGER_TYPE,
	IMMEDIATE_TRIGGER_TYPES,
	MAX_ENTER_TILE_BATCH_ITEMS,
	MAX_ENTER_TILE_BATCH_WINDOW_MS,
	getWorldManifest,
	normalizeCommitEnvelope,
	normalizeCommitBatchRequest,
	buildInitialGameplayState,
	validateCommitAgainstState,
	applyCommitToState,
	toPublicState,
	hashCanonicalState,
} = require("./sync-core");
const {
	SYNC_COMMAND_TYPES_V1,
	getSupportedCommandVerbs,
	normalizeSyncCommandType,
	normalizeSyncCommandVerb,
} = require("./sync-command-contract");
const syncStore = require("./sync-store");
const { persistRunSnapshot } = require("./sync-snapshots");
const { withRouteLatency } = require("./route-latency");

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
}

function parseBoolean(value, fallback = false) {
	const normalized = normalizeString(value).toLowerCase();
	if (!normalized) return fallback;
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return fallback;
}

function parseCommaSeparatedSet(value) {
	return new Set(
		normalizeString(value)
			.split(",")
			.map((item) => normalizeString(item).toLowerCase())
			.filter(Boolean),
	);
}

function estimateJsonBytes(value) {
	if (value === undefined) return 0;
	try {
		return Buffer.byteLength(JSON.stringify(value), "utf8");
	} catch {
		return 0;
	}
}

function buildSyncRouteLatencyMeta(route, req) {
	const body = req?.body && typeof req.body === "object" ? req.body : null;
	const runId = normalizeString(req?.query?.runId || body?.runId);
	const meta = {
		route,
		runId: runId || undefined,
		payloadBytes: estimateJsonBytes(body) || undefined,
	};

	if (Array.isArray(body?.commits)) {
		meta.commitCount = body.commits.length;
	} else if (body) {
		meta.commitCount = 1;
	}

	if (req?.query) {
		if (Number.isFinite(Number(req.query.afterSeq))) {
			meta.afterSeq = parseInteger(req.query.afterSeq, 0);
		}
		if (Number.isFinite(Number(req.query.limit))) {
			meta.limit = parseInteger(req.query.limit, 0);
		}
		const includeRejected = normalizeString(req.query.includeRejected).toLowerCase();
		if (includeRejected) {
			meta.includeRejected = includeRejected === "true";
		}
	}

	return meta;
}

async function runSyncRoute({ route, req, res }, work) {
	return withRouteLatency(
		{
			scope: "sync",
			route,
			req,
			res,
			meta: () => buildSyncRouteLatencyMeta(route, req),
		},
		work,
	);
}

function resolveCanaryPolicy() {
	const rolloutStage =
		normalizeString(process.env.RUNTIME_ROLLOUT_STAGE || process.env.ROLLOUT_STAGE) ||
		"unknown";
	const requestedMode = normalizeString(process.env.INTERNAL_CANARY_MODE).toLowerCase();
	const inferredMode = rolloutStage.toLowerCase() === "m11_canary" ? "enforce" : "off";
	const mode = ["off", "monitor", "enforce"].includes(requestedMode)
		? requestedMode
		: inferredMode;
	return {
		rolloutStage,
		mode,
		allowlist: parseCommaSeparatedSet(process.env.INTERNAL_CANARY_ALLOWLIST),
	};
}

function canaryPrincipals(user) {
	return [
		normalizeString(user?.id).toLowerCase(),
		normalizeString(user?.email).toLowerCase(),
	].filter(Boolean);
}

function enforceCanaryAccess(res, user) {
	const policy = resolveCanaryPolicy();
	if (policy.mode !== "enforce") {
		return true;
	}

	if (policy.allowlist.size === 0) {
		json(res, 503, {
			ok: false,
			errorCode: "CANARY_ALLOWLIST_EMPTY",
			message:
				"Internal canary mode is enabled but INTERNAL_CANARY_ALLOWLIST is empty.",
			rolloutStage: policy.rolloutStage,
			canaryMode: policy.mode,
		});
		return false;
	}

	const principalMatch = canaryPrincipals(user).some((principal) =>
		policy.allowlist.has(principal),
	);
	if (!principalMatch) {
		json(res, 403, {
			ok: false,
			errorCode: "CANARY_ACCESS_DENIED",
			message: "User is not allowlisted for internal canary access.",
			rolloutStage: policy.rolloutStage,
			canaryMode: policy.mode,
		});
		return false;
	}

	return true;
}

function parsePercentage(value) {
	const raw = normalizeString(value);
	if (!raw) return null;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return null;
	return Math.max(0, Math.min(100, Math.floor(parsed)));
}

function resolveLimitedRolloutPolicy() {
	const rolloutStage =
		normalizeString(process.env.RUNTIME_ROLLOUT_STAGE || process.env.ROLLOUT_STAGE) ||
		"unknown";
	const stageLower = rolloutStage.toLowerCase();
	const requestedMode = normalizeString(process.env.LIMITED_ROLLOUT_MODE).toLowerCase();
	const inferredMode =
		stageLower === "m12_limited" || stageLower === "m12_percentage" ? "enforce" : "off";
	const mode = ["off", "monitor", "enforce"].includes(requestedMode)
		? requestedMode
		: inferredMode;
	return {
		rolloutStage,
		mode,
		percentage: parsePercentage(
			process.env.LIMITED_ROLLOUT_PERCENTAGE || process.env.ROLLOUT_PERCENTAGE || "",
		),
		allowlist: parseCommaSeparatedSet(process.env.LIMITED_ROLLOUT_ALLOWLIST),
		salt:
			normalizeString(process.env.LIMITED_ROLLOUT_SALT) ||
			normalizeString(process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID) ||
			"limited-rollout-default-salt",
	};
}

function stableRolloutBucket(principal, salt) {
	const digest = crypto
		.createHash("sha256")
		.update(`${salt}:${principal}`, "utf8")
		.digest("hex");
	return parseInt(digest.slice(0, 8), 16) % 100;
}

function enforceLimitedRolloutAccess(res, user) {
	const policy = resolveLimitedRolloutPolicy();
	if (policy.mode !== "enforce") {
		return true;
	}

	if (policy.percentage === null) {
		json(res, 503, {
			ok: false,
			errorCode: "LIMITED_ROLLOUT_PERCENTAGE_INVALID",
			message:
				"Limited rollout mode is enabled but LIMITED_ROLLOUT_PERCENTAGE/ROLLOUT_PERCENTAGE is missing or invalid.",
			rolloutStage: policy.rolloutStage,
			rolloutMode: policy.mode,
		});
		return false;
	}

	const principals = canaryPrincipals(user);
	const principalMatch = principals.some((principal) => policy.allowlist.has(principal));
	if (principalMatch || policy.percentage >= 100) {
		return true;
	}

	if (policy.percentage <= 0) {
		json(res, 403, {
			ok: false,
			errorCode: "LIMITED_ROLLOUT_DENIED",
			message: "Limited rollout percentage is 0; access denied.",
			rolloutStage: policy.rolloutStage,
			rolloutMode: policy.mode,
			rolloutPercentage: policy.percentage,
			rolloutBucket: 99,
		});
		return false;
	}

	const principal = principals[0] || "anonymous";
	const bucket = stableRolloutBucket(principal, policy.salt);
	if (bucket >= policy.percentage) {
		json(res, 403, {
			ok: false,
			errorCode: "LIMITED_ROLLOUT_DENIED",
			message: "User is outside current limited rollout percentage window.",
			rolloutStage: policy.rolloutStage,
			rolloutMode: policy.mode,
			rolloutPercentage: policy.percentage,
			rolloutBucket: bucket,
		});
		return false;
	}

	return true;
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

async function loadRunState({ ownerId, runId, manifest, allowCreate = false }) {
	const run = await syncStore.getRun({ ownerId, runId });
	if (run && run.state) {
		return {
			state: normalizeStoredState(run.state, { runId, manifest }),
			saveSlotId: normalizeString(run.save_slot_id),
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

		const commitValidation = validateCommitAgainstState({
			manifest,
			state,
			commit,
		});
		if (!commitValidation.ok) {
			const reject = buildRejectResult({
				commit,
				errorCode: commitValidation.errorCode,
				message: commitValidation.message,
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
			triggerDef: commitValidation.triggerDef,
			resolvedTargetId: commitValidation.resolvedTargetId,
			character: commitValidation.character,
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
	return runSyncRoute({ route: "commit", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

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
	});
}

async function commitBatch(req, res) {
	return runSyncRoute({ route: "commit-batch", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

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
	});
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

function normalizeCommandBody(rawBody, manifest) {
	const body = rawBody && typeof rawBody === "object" ? rawBody : {};
	const command =
		body.command && typeof body.command === "object" ? body.command : null;
	if (!command) {
		return {
			ok: false,
			errorCode: "INVALID_COMMAND_ENVELOPE",
			message: "command object is required.",
		};
	}

	const commandType = normalizeSyncCommandType(command.type);
	if (!commandType) {
		return {
			ok: false,
			errorCode: "UNSUPPORTED_COMMAND_TYPE",
			message: `Supported command types: ${SYNC_COMMAND_TYPES_V1.join(", ")}.`,
		};
	}

	const rawCommandVerb =
		normalizeString(command.verb) ||
		normalizeString(command.triggerType) ||
		normalizeString(body.triggerType);
	const commandVerb = normalizeSyncCommandVerb(rawCommandVerb, commandType);
	if (!commandVerb) {
		return {
			ok: false,
			errorCode: "UNSUPPORTED_COMMAND_VERB",
			message: `Supported command verbs: ${getSupportedCommandVerbs(commandType).join(", ")}.`,
		};
	}

	const envelope = {
		id: body.id,
		runId: body.runId,
		clientId: body.clientId,
		clientSeq: body.clientSeq,
		createdAt: body.createdAt,
		contentVersion:
			normalizeString(body.contentVersion) || manifest.contentVersion,
		commandType,
		command: {
			...command,
			type: commandType,
			verb: commandVerb,
		},
	};

	if (commandType === "TRIGGER") {
		const explicitTriggerType = normalizeString(command.triggerType).toUpperCase();
		if (explicitTriggerType && explicitTriggerType !== commandVerb) {
			return {
				ok: false,
				errorCode: "COMMAND_VERB_TRIGGER_MISMATCH",
				message: "command.verb must match command.triggerType for TRIGGER commands.",
			};
		}

		const bodyTriggerType = normalizeString(body.triggerType).toUpperCase();
		if (bodyTriggerType && bodyTriggerType !== commandVerb) {
			return {
				ok: false,
				errorCode: "COMMAND_VERB_TRIGGER_MISMATCH",
				message: "command.verb must match triggerType envelope value.",
			};
		}

		const trigger =
			command.trigger && typeof command.trigger === "object"
				? command.trigger
				: body.trigger && typeof body.trigger === "object"
					? body.trigger
					: null;
		envelope.triggerType = commandVerb;
		envelope.trigger = trigger;
		envelope.command.triggerType = commandVerb;
		return normalizeCommitEnvelope(envelope);
	}

	if (commandType === "CHARACTER") {
		const character =
			command.character && typeof command.character === "object"
				? command.character
				: body.character && typeof body.character === "object"
					? body.character
					: null;
		if (!character) {
			return {
				ok: false,
				errorCode: "INVALID_CHARACTER_PAYLOAD",
				message: "command.character object is required for CHARACTER commands.",
			};
		}
		envelope.command.character = character;
		return normalizeCommitEnvelope(envelope);
	}

	return normalizeCommitEnvelope(envelope);
}

async function action(req, res) {
	return runSyncRoute({ route: "action", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

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
	});
}

async function command(req, res) {
	return runSyncRoute({ route: "command", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

			const manifest = getWorldManifest();
			const body = await readJsonBody(req);
			const normalized = normalizeCommandBody(body, manifest);
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
					errorCode: result.errorCode || "COMMAND_FAILED",
					message: result.message || "Command processing failed.",
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
	});
}

async function pull(req, res) {
	return runSyncRoute({ route: "pull", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

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
	});
}

async function replay(req, res) {
	return runSyncRoute({ route: "replay", req, res }, async () => {
		try {
			const user = await requireUser(req, res);
			if (!user) return;
			if (!enforceCanaryAccess(res, user)) return;
			if (!enforceLimitedRolloutAccess(res, user)) return;
			const gate = await enforceProgressReset(res, { ownerId: user.id });
			if (!gate.ok) return;

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

			const afterSeq = Math.max(0, parseInteger(req?.query?.afterSeq, 0));
			const limit = Math.max(1, Math.min(500, parseInteger(req?.query?.limit, 200)));
			const includeRejected = parseBoolean(req?.query?.includeRejected, false);
			const events = await syncStore.listEvents({
				ownerId: user.id,
				runId,
				afterSeq,
				limit,
			});
			const timeline = events
				.map((event) => ({
					commitId: event.commit_id,
					clientSeq: event.client_seq,
					seq: Number.isFinite(Number(event.seq)) ? Number(event.seq) : null,
					tick: Number.isFinite(Number(event.tick)) ? Number(event.tick) : null,
					eventType: event.event_type || event.eventType || "TRIGGER",
					triggerType: event.trigger_type || event.triggerType || null,
					accepted: event.accepted,
					errorCode: event.error_code || null,
					message: event.message || null,
					stateHash: event.state_hash || null,
					createdAt: event.created_at || null,
				}))
				.filter((event) => includeRejected || event.accepted);
			const hashTimeline = timeline
				.filter((event) => event.accepted && normalizeString(event.stateHash))
				.map((event) => ({
					seq: Number.isFinite(Number(event.seq))
						? Number(event.seq)
						: Number(event.clientSeq) || null,
					tick: Number.isFinite(Number(event.tick))
						? Number(event.tick)
						: Number(event.clientSeq) || null,
					stateHash: event.stateHash,
				}))
				.filter((event) => Number.isFinite(Number(event.seq)));

			return json(res, 200, {
				ok: true,
				runId,
				contentVersion: manifest.contentVersion,
				canonicalState: toPublicState(loaded.state),
				timeline,
				hashTimeline,
			});
		} catch (error) {
			return json(res, 500, {
				ok: false,
				errorCode: "UNEXPECTED_SYNC_ERROR",
				message: String(error?.message || error || "Unknown error"),
			});
		}
	});
}

module.exports = {
	commit,
	commitBatch,
	action,
	command,
	pull,
	replay,
	processCommitStream,
	loadRunState,
};
