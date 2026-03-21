const fs = require("fs");
const path = require("path");
const { resolveGameDbBackend } = require("./game-db");

const DEFAULT_COLLECTION = "narrate_runs";
const DEFAULT_FILE_PATH = path.resolve(
	__dirname,
	"..",
	".data",
	"narrate-runs.json",
);
const DEFAULT_TTL_MS = 5 * 60 * 1000;
let firebaseAdminModules = null;

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getTtlMs() {
	const parsed = Number.parseInt(getOptionalEnv("NARRATE_RUN_TTL_MS"), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MS;
}

function getFilePath() {
	const configured = getOptionalEnv("NARRATE_RUNS_FILE_PATH");
	return configured ? path.resolve(configured) : DEFAULT_FILE_PATH;
}

function nowMs() {
	return Date.now();
}

function getFirebaseAdminModules() {
	if (firebaseAdminModules) return firebaseAdminModules;
	const app = require("firebase-admin/app");
	const firestore = require("firebase-admin/firestore");
	firebaseAdminModules = {
		getApps: app.getApps,
		initializeApp: app.initializeApp,
		getFirestore: firestore.getFirestore,
		Timestamp: firestore.Timestamp,
	};
	return firebaseAdminModules;
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

function toTimestamp(ms) {
	const { Timestamp } = getFirebaseAdminModules();
	return Timestamp.fromDate(new Date(ms));
}

function normalizeRunKey(threadId, runId) {
	return `${String(threadId || "").trim()}:${String(runId || "").trim()}`;
}

function mapFirestoreRun(doc) {
	const data = doc.data() || {};
	return {
		key: String(doc.id),
		thread_id: String(data.thread_id || ""),
		run_id: String(data.run_id || ""),
		owner_id: String(data.owner_id || ""),
		mode: String(data.mode || "exploration"),
		status: String(data.status || "running"),
		done: Boolean(data.done),
		ok:
			typeof data.ok === "boolean"
				? data.ok
				: data.done
					? data.status === "completed"
					: null,
		narrative:
			typeof data.narrative === "string" ? data.narrative : undefined,
		mood: typeof data.mood === "string" ? data.mood : undefined,
		suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined,
		provider: typeof data.provider === "string" ? data.provider : undefined,
		fallback_used:
			typeof data.fallback_used === "boolean" ? data.fallback_used : undefined,
		output_hash:
			typeof data.output_hash === "string" ? data.output_hash : undefined,
		error_code:
			typeof data.error_code === "string" ? data.error_code : undefined,
		message: typeof data.message === "string" ? data.message : undefined,
		created_at: toIso(data.created_at),
		updated_at: toIso(data.updated_at),
		expires_at: toIso(data.expires_at),
	};
}

function getCollectionName() {
	return getOptionalEnv("NARRATE_RUNS_COLLECTION") || DEFAULT_COLLECTION;
}

function getFirestoreDb() {
	const { getApps, initializeApp, getFirestore } = getFirebaseAdminModules();
	if (getApps().length === 0) {
		initializeApp();
	}
	return getFirestore();
}

async function fireCreateRun({ threadId, runId, ownerId, mode }) {
	const key = normalizeRunKey(threadId, runId);
	const now = nowMs();
	const expiresAt = now + getTtlMs();
	const doc = {
		thread_id: String(threadId),
		run_id: String(runId),
		owner_id: String(ownerId),
		mode: String(mode || "exploration"),
		status: "running",
		done: false,
		ok: null,
		created_at: toTimestamp(now),
		updated_at: toTimestamp(now),
		expires_at: toTimestamp(expiresAt),
	};

	await getFirestoreDb()
		.collection(getCollectionName())
		.doc(key)
		.set(doc, { merge: false });
}

async function fireUpdateRun({ threadId, runId, ownerId, patch }) {
	const key = normalizeRunKey(threadId, runId);
	const docRef = getFirestoreDb().collection(getCollectionName()).doc(key);
	const snap = await docRef.get();
	if (!snap.exists) return null;
	const existing = mapFirestoreRun(snap);
	if (String(existing.owner_id) !== String(ownerId)) return null;

	const now = nowMs();
	const next = {
		updated_at: toTimestamp(now),
		expires_at: toTimestamp(now + getTtlMs()),
	};
	if (Object.prototype.hasOwnProperty.call(patch, "status")) {
		next.status = String(patch.status || "running");
	}
	if (Object.prototype.hasOwnProperty.call(patch, "done")) {
		next.done = Boolean(patch.done);
	}
	if (Object.prototype.hasOwnProperty.call(patch, "ok")) {
		next.ok =
			typeof patch.ok === "boolean" ? patch.ok : patch.ok === null ? null : undefined;
	}
	if (typeof patch.mode === "string") next.mode = patch.mode;
	if (typeof patch.narrative === "string") next.narrative = patch.narrative;
	if (typeof patch.mood === "string") next.mood = patch.mood;
	if (Array.isArray(patch.suggestions)) next.suggestions = patch.suggestions;
	if (typeof patch.provider === "string") next.provider = patch.provider;
	if (typeof patch.fallbackUsed === "boolean") {
		next.fallback_used = patch.fallbackUsed;
	}
	if (typeof patch.outputHash === "string") next.output_hash = patch.outputHash;
	if (typeof patch.errorCode === "string") next.error_code = patch.errorCode;
	if (typeof patch.message === "string") next.message = patch.message;

	await docRef.set(next, { merge: true });
	const updated = await docRef.get();
	return mapFirestoreRun(updated);
}

async function fireGetRun({ threadId, runId, ownerId }) {
	const key = normalizeRunKey(threadId, runId);
	const snap = await getFirestoreDb().collection(getCollectionName()).doc(key).get();
	if (!snap.exists) return null;
	const row = mapFirestoreRun(snap);
	if (String(row.owner_id) !== String(ownerId)) return null;
	return row;
}

async function firePurgeExpiredRuns() {
	const cutoff = toTimestamp(nowMs());
	const snapshot = await getFirestoreDb()
		.collection(getCollectionName())
		.where("expires_at", "<=", cutoff)
		.limit(100)
		.get();

	if (snapshot.empty) return 0;
	let count = 0;
	const batch = getFirestoreDb().batch();
	for (const doc of snapshot.docs) {
		batch.delete(doc.ref);
		count += 1;
	}
	await batch.commit();
	return count;
}

function readFileDb() {
	const filePath = getFilePath();
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return { runs: [] };
		}
		return {
			runs: Array.isArray(parsed.runs) ? parsed.runs : [],
		};
	} catch {
		return { runs: [] };
	}
}

function writeFileDb(db) {
	const filePath = getFilePath();
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	const tmpPath = `${filePath}.tmp`;
	fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
	try {
		fs.renameSync(tmpPath, filePath);
	} catch {
		fs.copyFileSync(tmpPath, filePath);
		fs.unlinkSync(tmpPath);
	}
}

function filePurgeExpiredRuns() {
	const db = readFileDb();
	const now = nowMs();
	const before = db.runs.length;
	db.runs = db.runs.filter((run) => {
		const expiresAtMs = Number.parseInt(run?.expires_at_ms, 10);
		return !Number.isFinite(expiresAtMs) || expiresAtMs > now;
	});
	if (db.runs.length !== before) {
		writeFileDb(db);
	}
	return before - db.runs.length;
}

function fileCreateRun({ threadId, runId, ownerId, mode }) {
	const db = readFileDb();
	const key = normalizeRunKey(threadId, runId);
	const now = nowMs();
	const run = {
		key,
		thread_id: String(threadId),
		run_id: String(runId),
		owner_id: String(ownerId),
		mode: String(mode || "exploration"),
		status: "running",
		done: false,
		ok: null,
		created_at: new Date(now).toISOString(),
		updated_at: new Date(now).toISOString(),
		expires_at_ms: now + getTtlMs(),
	};

	db.runs = db.runs.filter((row) => row.key !== key);
	db.runs.unshift(run);
	writeFileDb(db);
}

function fileUpdateRun({ threadId, runId, ownerId, patch }) {
	const db = readFileDb();
	const key = normalizeRunKey(threadId, runId);
	const idx = db.runs.findIndex((row) => row.key === key);
	if (idx === -1) return null;
	const existing = db.runs[idx];
	if (String(existing.owner_id) !== String(ownerId)) return null;

	const now = nowMs();
	const updated = {
		...existing,
		updated_at: new Date(now).toISOString(),
		expires_at_ms: now + getTtlMs(),
	};

	if (Object.prototype.hasOwnProperty.call(patch, "status")) {
		updated.status = String(patch.status || "running");
	}
	if (Object.prototype.hasOwnProperty.call(patch, "done")) {
		updated.done = Boolean(patch.done);
	}
	if (Object.prototype.hasOwnProperty.call(patch, "ok")) {
		updated.ok =
			typeof patch.ok === "boolean" ? patch.ok : patch.ok === null ? null : updated.ok;
	}
	if (typeof patch.mode === "string") updated.mode = patch.mode;
	if (typeof patch.narrative === "string") updated.narrative = patch.narrative;
	if (typeof patch.mood === "string") updated.mood = patch.mood;
	if (Array.isArray(patch.suggestions)) updated.suggestions = patch.suggestions;
	if (typeof patch.provider === "string") updated.provider = patch.provider;
	if (typeof patch.fallbackUsed === "boolean") {
		updated.fallback_used = patch.fallbackUsed;
	}
	if (typeof patch.outputHash === "string") updated.output_hash = patch.outputHash;
	if (typeof patch.errorCode === "string") updated.error_code = patch.errorCode;
	if (typeof patch.message === "string") updated.message = patch.message;

	db.runs[idx] = updated;
	writeFileDb(db);
	return {
		...updated,
		expires_at: new Date(updated.expires_at_ms).toISOString(),
	};
}

function fileGetRun({ threadId, runId, ownerId }) {
	const db = readFileDb();
	const key = normalizeRunKey(threadId, runId);
	const row = db.runs.find((entry) => entry.key === key) || null;
	if (!row) return null;
	if (String(row.owner_id) !== String(ownerId)) return null;
	return {
		...row,
		expires_at: Number.isFinite(Number(row.expires_at_ms))
			? new Date(Number(row.expires_at_ms)).toISOString()
			: null,
	};
}

async function withBackend({ firestoreFn, fileFn }) {
	const backend = resolveGameDbBackend();
	if (backend === "file") {
		return fileFn();
	}
	return firestoreFn();
}

async function createNarrateRun({ threadId, runId, ownerId, mode }) {
	return withBackend({
		firestoreFn: () => fireCreateRun({ threadId, runId, ownerId, mode }),
		fileFn: () => fileCreateRun({ threadId, runId, ownerId, mode }),
	});
}

async function updateNarrateRun({ threadId, runId, ownerId, patch }) {
	return withBackend({
		firestoreFn: () => fireUpdateRun({ threadId, runId, ownerId, patch }),
		fileFn: () => fileUpdateRun({ threadId, runId, ownerId, patch }),
	});
}

async function getNarrateRun({ threadId, runId, ownerId }) {
	return withBackend({
		firestoreFn: () => fireGetRun({ threadId, runId, ownerId }),
		fileFn: () => fileGetRun({ threadId, runId, ownerId }),
	});
}

async function purgeExpiredNarrateRuns() {
	return withBackend({
		firestoreFn: () => firePurgeExpiredRuns(),
		fileFn: () => filePurgeExpiredRuns(),
	});
}

module.exports = {
	createNarrateRun,
	updateNarrateRun,
	getNarrateRun,
	purgeExpiredNarrateRuns,
};
