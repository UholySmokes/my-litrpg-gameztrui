const crypto = require("crypto");
const firebaseAdminDataConnect = require("firebase-admin/data-connect");
const dataconnectGenerated = require("../src/dataconnect-admin-generated");

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function toInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
}

function safeParseJson(value, fallback) {
	if (value === null || value === undefined) return fallback;
	if (typeof value !== "string") return fallback;
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" ? parsed : fallback;
	} catch {
		return fallback;
	}
}

function toIso(value) {
	if (!value) return null;
	if (typeof value === "string") return value;
	if (value instanceof Date) return value.toISOString();
	if (typeof value.toDate === "function") {
		try {
			return value.toDate().toISOString();
		} catch {
			return null;
		}
	}
	return null;
}

function toArray(value) {
	return Array.isArray(value) ? value : [];
}

function getDc() {
	return firebaseAdminDataConnect.getDataConnect(dataconnectGenerated.connectorConfig);
}

function buildOptions(ownerId) {
	const uid = normalizeString(ownerId);
	return {
		impersonate: {
			authClaims: {
				sub: uid,
				uid,
				user_id: uid,
				email_verified: false,
			},
		},
	};
}

function ensureUuidOrCreate(value) {
	const raw = normalizeString(value);
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (uuidRegex.test(raw)) return raw.toLowerCase();
	return crypto.randomUUID();
}

function toNullableUuid(value) {
	const raw = normalizeString(value);
	if (!raw) return null;
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(raw) ? raw.toLowerCase() : null;
}

function mapRunSessionToRow(ownerId, session) {
	if (!session || typeof session !== "object") return null;
	return {
		owner_id: normalizeString(ownerId),
		run_id: normalizeString(session.runId),
		save_slot_id: normalizeString(session.saveSlotId),
		state: {
			worldId: normalizeString(session.worldId),
			mapId: normalizeString(session.mapId),
			playerPos: safeParseJson(session.playerPosJson, { x: 0, y: 0 }),
			entityStates: safeParseJson(session.entityStatesJson, {}),
			questFlags: safeParseJson(session.questFlagsJson, {}),
			runId: normalizeString(session.runId),
			seq: toInteger(session.seq, 0),
			tick: toInteger(session.tick, 0),
			stateHash: normalizeString(session.stateHash),
			contentVersion: normalizeString(session.contentVersion),
			stateVersion: toInteger(session.stateVersion, 1),
			runSeed: normalizeString(session.runSeed),
			cooldowns: {},
		},
		created_at: toIso(session.createdAt),
		updated_at: toIso(session.updatedAt),
		_dc_id: normalizeString(session.id),
	};
}

function mapRunEventToRow(ownerId, event) {
	if (!event || typeof event !== "object") return null;
	return {
		owner_id: normalizeString(ownerId),
		run_id: normalizeString(event.runId),
		commit_id: normalizeString(event.commitId),
		client_seq: toInteger(event.clientSeq, 0),
		accepted: Boolean(event.accepted),
		error_code: normalizeString(event.errorCode) || null,
		message: normalizeString(event.message) || null,
		state_hash: normalizeString(event.stateHash) || null,
		commit: safeParseJson(event.triggerPayloadJson, null),
		created_at: toIso(event.createdAt),
		_dc_id: normalizeString(event.id),
	};
}

function pickLatestByUpdatedAt(rows) {
	if (!rows.length) return null;
	return rows
		.slice()
		.sort((a, b) =>
			String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
		)[0];
}

async function getRun({ ownerId, runId }) {
	const options = buildOptions(ownerId);
	const dc = getDc();
	const response = await dataconnectGenerated.getMyRunSessionByRunId(
		dc,
		{ runId: String(runId) },
		options,
	);
	const sessions = toArray(response?.data?.userProfile?.runSessions)
		.map((session) => mapRunSessionToRow(ownerId, session))
		.filter(Boolean)
		.filter((row) => row.run_id === String(runId));
	return pickLatestByUpdatedAt(sessions);
}

async function putRun({ ownerId, runId, state, saveSlotId = "" }) {
	const existing = await getRun({ ownerId, runId });
	const runSessionId = ensureUuidOrCreate(existing?._dc_id);
	const entityStatesJson = JSON.stringify(
		state?.entityStates && typeof state.entityStates === "object"
			? state.entityStates
			: {},
	);
	const questFlagsJson = JSON.stringify(
		state?.questFlags && typeof state.questFlags === "object" ? state.questFlags : {},
	);
	const playerPosJson = JSON.stringify(
		state?.playerPos && typeof state.playerPos === "object"
			? state.playerPos
			: { x: 0, y: 0 },
	);

	const dc = getDc();
	await dataconnectGenerated.upsertRunSession(
		dc,
		{
			id: runSessionId,
			runId: String(runId),
			worldId: normalizeString(state?.worldId) || "voidverse_slice_world_001",
			mapId: normalizeString(state?.mapId) || "map_village_square",
			playerPosJson,
			entityStatesJson,
			questFlagsJson,
			seq: toInteger(state?.seq, 0),
			tick: toInteger(state?.tick, 0),
			stateHash: normalizeString(state?.stateHash),
			contentVersion: normalizeString(state?.contentVersion),
			stateVersion: toInteger(state?.stateVersion, 1),
			saveSlotId: toNullableUuid(saveSlotId),
			runSeed: normalizeString(state?.runSeed) || null,
			lastCommitId: normalizeString(state?.lastCommitId) || null,
			lastClientId: normalizeString(state?.lastClientId) || null,
		},
		buildOptions(ownerId),
	);

	const fresh = await getRun({ ownerId, runId });
	if (!fresh) {
		throw new Error("Data Connect upsert succeeded but run session was not readable.");
	}
	return fresh;
}

async function getEventByCommitId({ ownerId, runId, commitId }) {
	const dc = getDc();
	const response = await dataconnectGenerated.getMyRunEventByCommitId(
		dc,
		{
			runId: String(runId),
			commitId: String(commitId),
		},
		buildOptions(ownerId),
	);
	const events = toArray(response?.data?.userProfile?.events)
		.map((event) => mapRunEventToRow(ownerId, event))
		.filter(Boolean);
	if (!events.length) return null;
	events.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
	const { _dc_id, ...row } = events[0];
	return row;
}

async function appendEvent({ ownerId, runId, event }) {
	const dc = getDc();
	await dataconnectGenerated.createRunEvent(
		dc,
		{
			runId: String(runId),
			commitId: normalizeString(event.commit_id || event.commitId),
			clientId: normalizeString(event?.commit?.clientId) || "sync-client",
			clientSeq: toInteger(event.client_seq, 0),
			triggerType: normalizeString(event?.commit?.triggerType) || "UNKNOWN",
			triggerPayloadJson: JSON.stringify(
				event?.commit && typeof event.commit === "object" ? event.commit : {},
			),
			accepted: Boolean(event.accepted),
			errorCode: normalizeString(event.error_code) || null,
			message: normalizeString(event.message) || null,
			seq: Number.isFinite(Number(event?.seq)) ? Number(event.seq) : null,
			tick: Number.isFinite(Number(event?.tick)) ? Number(event.tick) : null,
			stateHash: normalizeString(event.state_hash) || null,
			contentVersion: normalizeString(event?.commit?.contentVersion) || null,
		},
		buildOptions(ownerId),
	);

	const fresh = await getEventByCommitId({
		ownerId,
		runId,
		commitId: normalizeString(event.commit_id || event.commitId),
	});
	return (
		fresh || {
			owner_id: String(ownerId),
			run_id: String(runId),
			commit_id: normalizeString(event.commit_id || event.commitId),
			client_seq: toInteger(event.client_seq, 0),
			accepted: Boolean(event.accepted),
			error_code: normalizeString(event.error_code) || null,
			message: normalizeString(event.message) || null,
			state_hash: normalizeString(event.state_hash) || null,
			commit: event?.commit || null,
			created_at: new Date().toISOString(),
		}
	);
}

async function listEvents({ ownerId, runId, afterSeq = 0, limit = 100 }) {
	const dc = getDc();
	const response = await dataconnectGenerated.listMyRunEventsSince(
		dc,
		{
			runId: String(runId),
			afterSeq: toInteger(afterSeq, 0),
		},
		buildOptions(ownerId),
	);
	const cappedLimit = Math.max(1, Math.min(500, Number(limit) || 100));
	return toArray(response?.data?.userProfile?.events)
		.map((event) => mapRunEventToRow(ownerId, event))
		.filter(Boolean)
		.sort((a, b) => Number(a.client_seq) - Number(b.client_seq))
		.slice(0, cappedLimit)
		.map((row) => {
			const clean = { ...row };
			delete clean._dc_id;
			return clean;
		});
}

module.exports = {
	getRun,
	putRun,
	getEventByCommitId,
	appendEvent,
	listEvents,
};
