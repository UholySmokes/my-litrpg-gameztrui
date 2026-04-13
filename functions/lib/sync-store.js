const fs = require("fs");
const path = require("path");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { resolveGameDbBackend } = require("./game-db");
const supabaseStore = require("./supabase");
const dataconnectStore = require("./sync-dataconnect-store");
const { normalizeSyncEvent } = require("./sync-core");

const DEFAULT_FILE_PATH = path.resolve(__dirname, "..", ".data", "sync-db.json");
const DEFAULT_RUNS_COLLECTION = "sync_runs";
const DEFAULT_EVENTS_COLLECTION = "run_events";
const DEFAULT_PROFILES_COLLECTION = "sync_profiles";
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

function resolveSyncBackend() {
	const raw = getOptionalEnv("SYNC_DB_STORAGE").toLowerCase();
	if (["file", "filesystem", "fs", "json", "local"].includes(raw)) return "file";
	if (["firestore", "firebase", "cloud-firestore"].includes(raw)) return "firestore";
	if (["dataconnect", "data-connect", "dc"].includes(raw)) return "dataconnect";
	if (["supabase", "postgres", "postgresql", "pg"].includes(raw)) return "supabase";
	const gameBackend = resolveGameDbBackend();
	if (gameBackend === "file") return "file";
	if (gameBackend === "supabase") return "supabase";
	return "file";
}

function isDataconnectStrictMode() {
	return getOptionalEnv("SYNC_DATACONNECT_STRICT").toLowerCase() === "true";
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

function getProfilesCollectionName() {
	return getOptionalEnv("SYNC_PROFILES_COLLECTION") || DEFAULT_PROFILES_COLLECTION;
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
		migration_versions: {},
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
		migration_versions:
			value.migration_versions &&
			typeof value.migration_versions === "object" &&
			!Array.isArray(value.migration_versions)
				? value.migration_versions
				: {},
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
	const serialized = JSON.stringify(db, null, 2);
	fs.writeFileSync(tmpPath, serialized, "utf8");
	try {
		fs.renameSync(tmpPath, filePath);
	} catch {
		if (fs.existsSync(tmpPath)) {
			fs.copyFileSync(tmpPath, filePath);
			fs.unlinkSync(tmpPath);
			return;
		}
		fs.writeFileSync(filePath, serialized, "utf8");
	}
}

function ensureFirestore() {
	if (getApps().length === 0) {
		initializeApp();
	}
	return getFirestore();
}

async function withBackend({ supabaseFn, dataconnectFn, firestoreFn, fileFn }) {
	const backend = resolveSyncBackend();
	if (backend === "file") {
		return fileFn();
	}
	if (backend === "supabase") {
		return supabaseFn();
	}
	if (backend === "dataconnect") {
		try {
			return await dataconnectFn();
		} catch (error) {
			if (isDataconnectStrictMode()) {
				throw error;
			}
			return firestoreFn();
		}
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
	const normalized = normalizeSyncEvent(doc || {});
	const data = normalized || {};
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
		seq: Number.isFinite(Number(data.seq)) ? Number(data.seq) : null,
		tick: Number.isFinite(Number(data.tick)) ? Number(data.tick) : null,
		event_type:
			typeof data.event_type === "string"
				? data.event_type
				: typeof data.eventType === "string"
					? data.eventType
					: "TRIGGER",
		trigger_type:
			typeof data.trigger_type === "string"
				? data.trigger_type
				: typeof data.triggerType === "string"
					? data.triggerType
					: null,
		commit: data.commit && typeof data.commit === "object" ? data.commit : null,
		created_at:
			typeof data.created_at === "string"
				? data.created_at
				: typeof data.created_at?.toDate === "function"
					? data.created_at.toDate().toISOString()
					: null,
	};
}

function mapSupabaseRun(row) {
	if (!row || typeof row !== "object") return null;
	return {
		owner_id: String(row.owner_id || ""),
		run_id: String(row.run_id || ""),
		state: row.state && typeof row.state === "object" ? row.state : null,
		save_slot_id: typeof row.save_slot_id === "string" ? row.save_slot_id : "",
		created_at: toIso(row.created_at),
		updated_at: toIso(row.updated_at),
	};
}

function mapSupabaseEvent(row) {
	if (!row || typeof row !== "object") return null;
	const normalized = normalizeSyncEvent(row || {});
	return {
		owner_id: String(row.owner_id || ""),
		run_id: String(row.run_id || ""),
		commit_id: String(row.commit_id || ""),
		client_seq: Number.isFinite(Number(row.client_seq))
			? Number(row.client_seq)
			: null,
		accepted: Boolean(row.accepted),
		error_code: typeof row.error_code === "string" ? row.error_code : null,
		message: typeof row.message === "string" ? row.message : null,
		state_hash: typeof row.state_hash === "string" ? row.state_hash : null,
		seq: Number.isFinite(Number(row.seq)) ? Number(row.seq) : null,
		tick: Number.isFinite(Number(row.tick)) ? Number(row.tick) : null,
		event_type:
			typeof row.event_type === "string"
				? row.event_type
				: typeof normalized.eventType === "string"
					? normalized.eventType
					: "TRIGGER",
		trigger_type:
			typeof row.trigger_type === "string"
				? row.trigger_type
				: typeof normalized.triggerType === "string"
					? normalized.triggerType
					: null,
		commit: row.commit && typeof row.commit === "object" ? row.commit : null,
		created_at: toIso(row.created_at),
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
	const normalizedEvent = normalizeSyncEvent(event || {});
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
		seq: Number.isFinite(Number(event.seq)) ? Number(event.seq) : null,
		tick: Number.isFinite(Number(event.tick)) ? Number(event.tick) : null,
		event_type: String(normalizedEvent.eventType || "TRIGGER"),
		trigger_type:
			typeof normalizedEvent.triggerType === "string"
				? normalizedEvent.triggerType
				: null,
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

async function fileGetMigrationVersion({ ownerId }) {
	const db = readDb();
	return Math.max(0, Number(db.migration_versions?.[String(ownerId)] || 0) || 0);
}

async function fileMarkMigrationVersion({ ownerId, version }) {
	const db = readDb();
	db.migration_versions = {
		...(db.migration_versions || {}),
		[String(ownerId)]: Math.max(0, Number(version) || 0),
	};
	writeDb(db);
	return true;
}

async function filePurgeUserProgress({ ownerId }) {
	const db = readDb();
	const normalizedOwnerId = String(ownerId || "");
	const deletedRunCount = db.runs.filter((entry) => entry.owner_id === normalizedOwnerId).length;
	const deletedEventCount = db.events.filter((entry) => entry.owner_id === normalizedOwnerId).length;
	db.runs = db.runs.filter((entry) => entry.owner_id !== normalizedOwnerId);
	db.events = db.events.filter((entry) => entry.owner_id !== normalizedOwnerId);
	writeDb(db);
	return {
		deletedRunCount,
		deletedEventCount,
	};
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
	const normalizedEvent = normalizeSyncEvent(event || {});
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
		seq: Number.isFinite(Number(event.seq)) ? Number(event.seq) : null,
		tick: Number.isFinite(Number(event.tick)) ? Number(event.tick) : null,
		event_type: String(normalizedEvent.eventType || "TRIGGER"),
		trigger_type:
			typeof normalizedEvent.triggerType === "string"
				? normalizedEvent.triggerType
				: null,
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

async function fireGetMigrationVersion({ ownerId }) {
	const snap = await ensureFirestore()
		.collection(getProfilesCollectionName())
		.doc(String(ownerId))
		.get();
	if (!snap.exists) return 0;
	return Math.max(0, Number(snap.get("migrationVersion") || 0) || 0);
}

async function fireMarkMigrationVersion({ ownerId, version, displayName = "" }) {
	await ensureFirestore()
		.collection(getProfilesCollectionName())
		.doc(String(ownerId))
		.set(
			{
				owner_id: String(ownerId),
				display_name: String(displayName || "Traveler"),
				migrationVersion: Math.max(0, Number(version) || 0),
				updated_at: nowTimestamp(),
			},
			{ merge: true },
		);
	return true;
}

async function firePurgeUserProgress({ ownerId }) {
	const db = ensureFirestore();
	const runsSnapshot = await db
		.collection(getRunsCollectionName())
		.where("owner_id", "==", String(ownerId))
		.get();
	const eventsSnapshot = await db
		.collection(getEventsCollectionName())
		.where("owner_id", "==", String(ownerId))
		.get();

	const batch = db.batch();
	runsSnapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	eventsSnapshot.docs.forEach((doc) => {
		batch.delete(doc.ref);
	});
	if (runsSnapshot.docs.length || eventsSnapshot.docs.length) {
		await batch.commit();
	}
	return {
		deletedRunCount: runsSnapshot.docs.length,
		deletedEventCount: eventsSnapshot.docs.length,
	};
}

async function supaGetRun({ ownerId, runId }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const { data, error } = await client
		.from(getRunsCollectionName())
		.select("*")
		.eq("owner_id", String(ownerId))
		.eq("run_id", String(runId))
		.limit(1);

	if (error) throw error;
	if (!Array.isArray(data) || data.length === 0) return null;
	return mapSupabaseRun(data[0]);
}

async function supaPutRun({ ownerId, runId, state, saveSlotId = "" }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const { data, error } = await client
		.from(getRunsCollectionName())
		.upsert(
			{
				owner_id: String(ownerId),
				run_id: String(runId),
				state,
				save_slot_id: String(saveSlotId || ""),
				updated_at: nowIso(),
			},
			{ onConflict: "owner_id,run_id" },
		)
		.select("*")
		.single();

	if (error) throw error;
	return mapSupabaseRun(data);
}

async function supaGetEventByCommitId({ ownerId, runId, commitId }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const { data, error } = await client
		.from(getEventsCollectionName())
		.select("*")
		.eq("owner_id", String(ownerId))
		.eq("run_id", String(runId))
		.eq("commit_id", String(commitId))
		.limit(1);

	if (error) throw error;
	if (!Array.isArray(data) || data.length === 0) return null;
	return mapSupabaseEvent(data[0]);
}

async function supaAppendEvent({ ownerId, runId, event }) {
	const normalizedEvent = normalizeSyncEvent(event || {});
	const client = supabaseStore.getSupabaseServiceClient();
	const { data, error } = await client
		.from(getEventsCollectionName())
		.upsert(
			{
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
				seq: Number.isFinite(Number(event.seq)) ? Number(event.seq) : null,
				tick: Number.isFinite(Number(event.tick)) ? Number(event.tick) : null,
				event_type: String(normalizedEvent.eventType || "TRIGGER"),
				trigger_type:
					typeof normalizedEvent.triggerType === "string"
						? normalizedEvent.triggerType
						: null,
				commit: event.commit && typeof event.commit === "object" ? event.commit : null,
				created_at: nowIso(),
			},
			{ onConflict: "owner_id,run_id,commit_id" },
		)
		.select("*")
		.single();

	if (error) throw error;
	return mapSupabaseEvent(data);
}

async function supaListEvents({
	ownerId,
	runId,
	afterSeq = 0,
	limit = DEFAULT_PULL_EVENT_LIMIT,
}) {
	const client = supabaseStore.getSupabaseServiceClient();
	const cappedLimit = Math.max(1, Math.min(500, Number(limit) || DEFAULT_PULL_EVENT_LIMIT));
	const { data, error } = await client
		.from(getEventsCollectionName())
		.select("*")
		.eq("owner_id", String(ownerId))
		.eq("run_id", String(runId))
		.gt("client_seq", Number(afterSeq || 0))
		.order("client_seq", { ascending: true })
		.limit(cappedLimit);

	if (error) throw error;
	return Array.isArray(data)
		? data.map((row) => mapSupabaseEvent(row)).filter(Boolean)
		: [];
}

async function supaGetMigrationVersion({ ownerId }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const { data, error } = await client
		.from(getProfilesCollectionName())
		.select("migration_version")
		.eq("owner_id", String(ownerId))
		.limit(1);

	if (error) throw error;
	if (!Array.isArray(data) || data.length === 0) return 0;
	return Math.max(0, Number(data[0]?.migration_version || 0) || 0);
}

async function supaMarkMigrationVersion({ ownerId, version, displayName = "" }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const { error } = await client
		.from(getProfilesCollectionName())
		.upsert(
			{
				owner_id: String(ownerId),
				display_name: String(displayName || "Traveler"),
				migration_version: Math.max(0, Number(version) || 0),
				updated_at: nowIso(),
			},
			{ onConflict: "owner_id" },
		);

	if (error) throw error;
	return true;
}

async function supaPurgeUserProgress({ ownerId }) {
	const client = supabaseStore.getSupabaseServiceClient();
	const eventsDelete = await client
		.from(getEventsCollectionName())
		.delete({ count: "exact" })
		.eq("owner_id", String(ownerId));
	if (eventsDelete.error) throw eventsDelete.error;

	const runsDelete = await client
		.from(getRunsCollectionName())
		.delete({ count: "exact" })
		.eq("owner_id", String(ownerId));
	if (runsDelete.error) throw runsDelete.error;

	return {
		deletedRunCount: Number(runsDelete.count) || 0,
		deletedEventCount: Number(eventsDelete.count) || 0,
	};
}

async function getRun({ ownerId, runId }) {
	return withBackend({
		supabaseFn: () => supaGetRun({ ownerId, runId }),
		dataconnectFn: () => dataconnectStore.getRun({ ownerId, runId }),
		firestoreFn: () => fireGetRun({ ownerId, runId }),
		fileFn: () => fileGetRun({ ownerId, runId }),
	});
}

async function putRun({ ownerId, runId, state, saveSlotId = "" }) {
	return withBackend({
		supabaseFn: () => supaPutRun({ ownerId, runId, state, saveSlotId }),
		dataconnectFn: () => dataconnectStore.putRun({ ownerId, runId, state, saveSlotId }),
		firestoreFn: () => firePutRun({ ownerId, runId, state, saveSlotId }),
		fileFn: () => filePutRun({ ownerId, runId, state, saveSlotId }),
	});
}

async function getEventByCommitId({ ownerId, runId, commitId }) {
	return withBackend({
		supabaseFn: () =>
			supaGetEventByCommitId({ ownerId, runId, commitId }),
		dataconnectFn: () =>
			dataconnectStore.getEventByCommitId({ ownerId, runId, commitId }),
		firestoreFn: () => fireGetEventByCommitId({ ownerId, runId, commitId }),
		fileFn: () => fileGetEventByCommitId({ ownerId, runId, commitId }),
	});
}

async function appendEvent({ ownerId, runId, event }) {
	return withBackend({
		supabaseFn: () => supaAppendEvent({ ownerId, runId, event }),
		dataconnectFn: () => dataconnectStore.appendEvent({ ownerId, runId, event }),
		firestoreFn: () => fireAppendEvent({ ownerId, runId, event }),
		fileFn: () => fileAppendEvent({ ownerId, runId, event }),
	});
}

async function listEvents({ ownerId, runId, afterSeq = 0, limit = DEFAULT_PULL_EVENT_LIMIT }) {
	return withBackend({
		supabaseFn: () =>
			supaListEvents({ ownerId, runId, afterSeq, limit }),
		dataconnectFn: () =>
			dataconnectStore.listEvents({ ownerId, runId, afterSeq, limit }),
		firestoreFn: () => fireListEvents({ ownerId, runId, afterSeq, limit }),
		fileFn: () => fileListEvents({ ownerId, runId, afterSeq, limit }),
	});
}

async function getMigrationVersion({ ownerId }) {
	return withBackend({
		supabaseFn: () => supaGetMigrationVersion({ ownerId }),
		dataconnectFn: () => dataconnectStore.getMigrationVersion({ ownerId }),
		firestoreFn: () => fireGetMigrationVersion({ ownerId }),
		fileFn: () => fileGetMigrationVersion({ ownerId }),
	});
}

async function markMigrationVersion({ ownerId, version, displayName = "" }) {
	return withBackend({
		supabaseFn: () =>
			supaMarkMigrationVersion({ ownerId, version, displayName }),
		dataconnectFn: () =>
			dataconnectStore.markMigrationVersion({ ownerId, version, displayName }),
		firestoreFn: () => fireMarkMigrationVersion({ ownerId, version, displayName }),
		fileFn: () => fileMarkMigrationVersion({ ownerId, version }),
	});
}

async function purgeUserProgress({ ownerId }) {
	return withBackend({
		supabaseFn: () => supaPurgeUserProgress({ ownerId }),
		dataconnectFn: () => dataconnectStore.purgeUserProgress({ ownerId }),
		firestoreFn: () => firePurgeUserProgress({ ownerId }),
		fileFn: () => filePurgeUserProgress({ ownerId }),
	});
}

module.exports = {
	resolveSyncBackend,
	getMigrationVersion,
	markMigrationVersion,
	purgeUserProgress,
	getRun,
	putRun,
	getEventByCommitId,
	appendEvent,
	listEvents,
};
