const fs = require("fs");
const path = require("path");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { resolveGameDbBackend } = require("./game-db");

const DEFAULT_FILE_PATH = path.resolve(__dirname, "..", ".data", "sync-db.json");
const DEFAULT_RUNS_COLLECTION = "sync_runs";
const DEFAULT_EVENTS_COLLECTION = "run_events";
const DEFAULT_PULL_EVENT_LIMIT = 100;

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function nowIso() {
	return new Date().toISOString();
}

function nowTimestamp() {
	return Timestamp.fromDate(new Date());
}

function resolveSyncBackend() {
	const raw = getOptionalEnv("SYNC_DB_STORAGE").toLowerCase();
	if (["file", "filesystem", "fs", "json", "local"].includes(raw)) return "file";
	if (["firestore", "firebase", "cloud-firestore"].includes(raw)) return "firestore";
	return resolveGameDbBackend();
}

function normalizeRunKey(ownerId, runId) {
	return `${String(ownerId || "").trim()}:${String(runId || "").trim()}`;
}

function getRunsCollectionName() {
	return getOptionalEnv("SYNC_RUNS_COLLECTION") || DEFAULT_RUNS_COLLECTION;
}

function getEventsCollectionName() {
	return getOptionalEnv("SYNC_EVENTS_COLLECTION") || DEFAULT_EVENTS_COLLECTION;
}

function getFilePath() {
	const configured = getOptionalEnv("SYNC_DB_PATH") || getOptionalEnv("SYNC_DB_FILE_PATH");
	if (!configured) return DEFAULT_FILE_PATH;
	if (path.isAbsolute(configured)) return configured;
	return path.resolve(__dirname, "..", configured);
}

function createEmptyDb() {
	return {
		version: 1,
		created_at: nowIso(),
		updated_at: nowIso(),
		runs: [],
		events: [],
	};
}

function normalizeDb(value) {
	const base = createEmptyDb();
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return base;
	}

	return {
		...base,
		version: Number.isFinite(Number(value.version)) ? Number(value.version) : 1,
		created_at:
			typeof value.created_at === "string" ? value.created_at : base.created_at,
		updated_at:
			typeof value.updated_at === "string" ? value.updated_at : base.updated_at,
		runs: Array.isArray(value.runs) ? value.runs : [],
		events: Array.isArray(value.events) ? value.events : [],
	};
}

function readDb() {
	const filePath = getFilePath();
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		return normalizeDb(JSON.parse(raw));
	} catch {
		return createEmptyDb();
	}
}

function writeDb(db) {
	const filePath = getFilePath();
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	const tmpPath = `${filePath}.tmp`;
	db.updated_at = nowIso();
	fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
	try {
		fs.renameSync(tmpPath, filePath);
	} catch {
		fs.copyFileSync(tmpPath, filePath);
		fs.unlinkSync(tmpPath);
	}
}

function ensureFirestore() {
	if (getApps().length === 0) {
		initializeApp();
	}
	return getFirestore();
}

async function withBackend({ firestoreFn, fileFn }) {
	const backend = resolveSyncBackend();
	if (backend === "file") {
		return fileFn();
	}
	return firestoreFn();
}

function mapRunDoc(doc) {
	const data = doc || {};
	return {
		owner_id: String(data.owner_id || ""),
		run_id: String(data.run_id || ""),
		state: data.state && typeof data.state === "object" ? data.state : null,
		save_slot_id: typeof data.save_slot_id === "string" ? data.save_slot_id : "",
		created_at:
			typeof data.created_at === "string"
				? data.created_at
				: typeof data.created_at?.toDate === "function"
					? data.created_at.toDate().toISOString()
					: null,
		updated_at:
			typeof data.updated_at === "string"
				? data.updated_at
				: typeof data.updated_at?.toDate === "function"
					? data.updated_at.toDate().toISOString()
					: null,
	};
}

function mapEventDoc(doc) {
	const data = doc || {};
	return {
		owner_id: String(data.owner_id || ""),
		run_id: String(data.run_id || ""),
		commit_id: String(data.commit_id || ""),
		client_seq: Number.isFinite(Number(data.client_seq))
			? Number(data.client_seq)
			: null,
		accepted: Boolean(data.accepted),
		error_code: typeof data.error_code === "string" ? data.error_code : null,
		message: typeof data.message === "string" ? data.message : null,
		state_hash: typeof data.state_hash === "string" ? data.state_hash : null,
		commit: data.commit && typeof data.commit === "object" ? data.commit : null,
		created_at:
			typeof data.created_at === "string"
				? data.created_at
				: typeof data.created_at?.toDate === "function"
					? data.created_at.toDate().toISOString()
					: null,
	};
}

async function fileGetRun({ ownerId, runId }) {
	const db = readDb();
	const key = normalizeRunKey(ownerId, runId);
	const row = db.runs.find((entry) => entry.key === key) || null;
	if (!row) return null;
	return mapRunDoc(row);
}

async function filePutRun({ ownerId, runId, state, saveSlotId = "" }) {
	const db = readDb();
	const key = normalizeRunKey(ownerId, runId);
	const now = nowIso();
	const idx = db.runs.findIndex((entry) => entry.key === key);
	const existing = idx >= 0 ? db.runs[idx] : null;
	const row = {
		key,
		owner_id: String(ownerId),
		run_id: String(runId),
		state,
		save_slot_id: String(saveSlotId || existing?.save_slot_id || ""),
		created_at: existing?.created_at || now,
		updated_at: now,
	};
	if (idx >= 0) {
		db.runs[idx] = row;
	} else {
		db.runs.push(row);
	}
	writeDb(db);
	return mapRunDoc(row);
}

async function fileGetEventByCommitId({ ownerId, runId, commitId }) {
	const db = readDb();
	const key = `${normalizeRunKey(ownerId, runId)}:${String(commitId)}`;
	const row = db.events.find((entry) => entry.key === key) || null;
	return row ? mapEventDoc(row) : null;
}

async function fileAppendEvent({ ownerId, runId, event }) {
	const db = readDb();
	const key = `${normalizeRunKey(ownerId, runId)}:${String(event.commit_id || event.commitId)}`;
	const existingIdx = db.events.findIndex((entry) => entry.key === key);
	const row = {
		key,
		owner_id: String(ownerId),
		run_id: String(runId),
		commit_id: String(event.commit_id || event.commitId || ""),
		client_seq: Number.isFinite(Number(event.client_seq))
			? Number(event.client_seq)
			: null,
		accepted: Boolean(event.accepted),
		error_code: typeof event.error_code === "string" ? event.error_code : null,
		message: typeof event.message === "string" ? event.message : null,
		state_hash: typeof event.state_hash === "string" ? event.state_hash : null,
		commit: event.commit && typeof event.commit === "object" ? event.commit : null,
		created_at: nowIso(),
	};
	if (existingIdx >= 0) {
		db.events[existingIdx] = row;
	} else {
		db.events.push(row);
	}
	writeDb(db);
	return mapEventDoc(row);
}

async function fileListEvents({ ownerId, runId, afterSeq = 0, limit = DEFAULT_PULL_EVENT_LIMIT }) {
	const db = readDb();
	const runKey = normalizeRunKey(ownerId, runId);
	const cappedLimit = Math.max(1, Math.min(500, Number(limit) || DEFAULT_PULL_EVENT_LIMIT));
	return db.events
		.filter((entry) => entry.key.startsWith(`${runKey}:`))
		.map(mapEventDoc)
		.filter((entry) => Number.isFinite(Number(entry.client_seq)) && Number(entry.client_seq) > Number(afterSeq || 0))
		.sort((a, b) => Number(a.client_seq) - Number(b.client_seq))
		.slice(0, cappedLimit);
}

async function fireGetRun({ ownerId, runId }) {
	const key = normalizeRunKey(ownerId, runId);
	const snap = await ensureFirestore()
		.collection(getRunsCollectionName())
		.doc(key)
		.get();
	if (!snap.exists) return null;
	return mapRunDoc(snap.data());
}

async function firePutRun({ ownerId, runId, state, saveSlotId = "" }) {
	const key = normalizeRunKey(ownerId, runId);
	const docRef = ensureFirestore().collection(getRunsCollectionName()).doc(key);
	const existing = await docRef.get();
	const payload = {
		owner_id: String(ownerId),
		run_id: String(runId),
		state,
		save_slot_id: String(saveSlotId || existing.get("save_slot_id") || ""),
		updated_at: nowTimestamp(),
	};
	if (!existing.exists) {
		payload.created_at = nowTimestamp();
	}
	await docRef.set(payload, { merge: true });
	const updated = await docRef.get();
	return mapRunDoc(updated.data());
}

async function fireGetEventByCommitId({ ownerId, runId, commitId }) {
	const key = `${normalizeRunKey(ownerId, runId)}:${String(commitId)}`;
	const snap = await ensureFirestore()
		.collection(getEventsCollectionName())
		.doc(key)
		.get();
	if (!snap.exists) return null;
	return mapEventDoc(snap.data());
}

async function fireAppendEvent({ ownerId, runId, event }) {
	const key = `${normalizeRunKey(ownerId, runId)}:${String(event.commit_id || event.commitId)}`;
	const payload = {
		owner_id: String(ownerId),
		run_id: String(runId),
		commit_id: String(event.commit_id || event.commitId || ""),
		client_seq: Number.isFinite(Number(event.client_seq))
			? Number(event.client_seq)
			: null,
		accepted: Boolean(event.accepted),
		error_code: typeof event.error_code === "string" ? event.error_code : null,
		message: typeof event.message === "string" ? event.message : null,
		state_hash: typeof event.state_hash === "string" ? event.state_hash : null,
		commit: event.commit && typeof event.commit === "object" ? event.commit : null,
		created_at: nowTimestamp(),
	};
	await ensureFirestore()
		.collection(getEventsCollectionName())
		.doc(key)
		.set(payload, { merge: true });
	return mapEventDoc(payload);
}

async function fireListEvents({ ownerId, runId, afterSeq = 0, limit = DEFAULT_PULL_EVENT_LIMIT }) {
	const runKey = normalizeRunKey(ownerId, runId);
	const cappedLimit = Math.max(1, Math.min(500, Number(limit) || DEFAULT_PULL_EVENT_LIMIT));
	const snapshot = await ensureFirestore()
		.collection(getEventsCollectionName())
		.where("owner_id", "==", String(ownerId))
		.where("run_id", "==", String(runId))
		.where("client_seq", ">", Number(afterSeq || 0))
		.orderBy("client_seq", "asc")
		.limit(cappedLimit)
		.get();

	return snapshot.docs.map((doc) => mapEventDoc(doc.data())).filter((row) => row.commit_id && row.owner_id && row.run_id && `${row.owner_id}:${row.run_id}` === runKey);
}

async function getRun({ ownerId, runId }) {
	return withBackend({
		firestoreFn: () => fireGetRun({ ownerId, runId }),
		fileFn: () => fileGetRun({ ownerId, runId }),
	});
}

async function putRun({ ownerId, runId, state, saveSlotId = "" }) {
	return withBackend({
		firestoreFn: () => firePutRun({ ownerId, runId, state, saveSlotId }),
		fileFn: () => filePutRun({ ownerId, runId, state, saveSlotId }),
	});
}

async function getEventByCommitId({ ownerId, runId, commitId }) {
	return withBackend({
		firestoreFn: () => fireGetEventByCommitId({ ownerId, runId, commitId }),
		fileFn: () => fileGetEventByCommitId({ ownerId, runId, commitId }),
	});
}

async function appendEvent({ ownerId, runId, event }) {
	return withBackend({
		firestoreFn: () => fireAppendEvent({ ownerId, runId, event }),
		fileFn: () => fileAppendEvent({ ownerId, runId, event }),
	});
}

async function listEvents({ ownerId, runId, afterSeq = 0, limit = DEFAULT_PULL_EVENT_LIMIT }) {
	return withBackend({
		firestoreFn: () => fireListEvents({ ownerId, runId, afterSeq, limit }),
		fileFn: () => fileListEvents({ ownerId, runId, afterSeq, limit }),
	});
}

module.exports = {
	resolveSyncBackend,
	getRun,
	putRun,
	getEventByCommitId,
	appendEvent,
	listEvents,
};
