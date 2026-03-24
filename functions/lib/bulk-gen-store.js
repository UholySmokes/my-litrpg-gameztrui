const fs = require("fs");
const path = require("path");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");
const { resolveGameDbBackend } = require("./game-db");
const {
	createEmptyFileDb,
	mapFirestoreRun,
	mapFirestoreTask,
	normalizeObject,
	normalizeOutput,
	normalizeRun,
	normalizeSpendEvent,
	normalizeString,
	normalizeStyleProfile,
	normalizeTask,
	nowIso,
	toIso,
} = require("./bulk-gen-store-normalization");

const DEFAULT_RUNS_COLLECTION = "bulk_generation_runs";
const DEFAULT_TASKS_COLLECTION = "bulk_generation_tasks";
const DEFAULT_OUTPUTS_COLLECTION = "bulk_generation_outputs";
const DEFAULT_STYLE_COLLECTION = "bulk_generation_styles";
const DEFAULT_SPEND_COLLECTION = "bulk_generation_spend_events";
const DEFAULT_FILE_PATH = path.resolve(__dirname, "..", ".data", "bulk-gen-db.json");

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getCollectionName(key, fallback) {
	return getOptionalEnv(key) || fallback;
}

function getFilePath() {
	const configured = getOptionalEnv("BULK_GEN_FILE_PATH");
	return configured ? path.resolve(configured) : DEFAULT_FILE_PATH;
}

function toTimestamp(value) {
	return Timestamp.fromDate(new Date(value));
}

function getFirestoreDb() {
	if (getApps().length === 0) {
		initializeApp();
	}
	return getFirestore();
}

function readFileDb() {
	const filePath = getFilePath();
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return createEmptyFileDb();
		}
		return {
			runs: Array.isArray(parsed.runs) ? parsed.runs : [],
			tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
			outputs: Array.isArray(parsed.outputs) ? parsed.outputs : [],
			styles: Array.isArray(parsed.styles) ? parsed.styles : [],
			spendEvents: Array.isArray(parsed.spendEvents) ? parsed.spendEvents : [],
		};
	} catch {
		return createEmptyFileDb();
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

async function withBackend({ firestoreFn, fileFn }) {
	const backend = resolveGameDbBackend();
	if (backend === "file" || backend === "supabase") {
		return fileFn();
	}
	return firestoreFn();
}

async function createRun(run) {
	const normalized = normalizeRun(run);
	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			await db
				.collection(getCollectionName("BULK_GEN_RUNS_COLLECTION", DEFAULT_RUNS_COLLECTION))
				.doc(normalized.run_id)
				.set(
					{
						...normalized,
						created_at: toTimestamp(normalized.created_at),
						updated_at: toTimestamp(normalized.updated_at),
					},
					{ merge: false },
				);
			return normalized;
		},
		fileFn: async () => {
			const db = readFileDb();
			db.runs = db.runs.filter((row) => row.run_id !== normalized.run_id);
			db.runs.push(normalized);
			writeFileDb(db);
			return normalized;
		},
	});
}

async function getRun(runId) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return null;
	return withBackend({
		firestoreFn: async () => {
			const snap = await getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_RUNS_COLLECTION", DEFAULT_RUNS_COLLECTION))
				.doc(safeRunId)
				.get();
			if (!snap.exists) return null;
			return mapFirestoreRun(snap);
		},
		fileFn: async () => {
			const db = readFileDb();
			const row = db.runs.find((entry) => entry.run_id === safeRunId);
			return row ? normalizeRun(row) : null;
		},
	});
}

async function updateRun(runId, patch) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return null;
	const safePatch = normalizeObject(patch);
	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			const docRef = db
				.collection(getCollectionName("BULK_GEN_RUNS_COLLECTION", DEFAULT_RUNS_COLLECTION))
				.doc(safeRunId);
			const existing = await docRef.get();
			if (!existing.exists) return null;
			const next = {
				updated_at: toTimestamp(nowIso()),
			};
			for (const [key, value] of Object.entries(safePatch)) {
				next[key] = value;
			}
			await docRef.set(next, { merge: true });
			const updated = await docRef.get();
			return mapFirestoreRun(updated);
		},
		fileFn: async () => {
			const db = readFileDb();
			const index = db.runs.findIndex((entry) => entry.run_id === safeRunId);
			if (index === -1) return null;
			const updated = normalizeRun({
				...db.runs[index],
				...safePatch,
				run_id: safeRunId,
				updated_at: nowIso(),
			});
			db.runs[index] = updated;
			writeFileDb(db);
			return updated;
		},
	});
}

async function incrementRunCounters(runId, increments) {
	const safeRunId = normalizeString(runId);
	const safeIncrements = normalizeObject(increments);
	if (!safeRunId) return null;
	return withBackend({
		firestoreFn: async () => {
			const docRef = getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_RUNS_COLLECTION", DEFAULT_RUNS_COLLECTION))
				.doc(safeRunId);
			const patch = { updated_at: FieldValue.serverTimestamp() };
			for (const [key, value] of Object.entries(safeIncrements)) {
				const amount = Number(value);
				if (Number.isFinite(amount) && amount !== 0) {
					patch[key] = FieldValue.increment(amount);
				}
			}
			await docRef.set(patch, { merge: true });
			const updated = await docRef.get();
			if (!updated.exists) return null;
			return mapFirestoreRun(updated);
		},
		fileFn: async () => {
			const db = readFileDb();
			const index = db.runs.findIndex((entry) => entry.run_id === safeRunId);
			if (index === -1) return null;
			const row = { ...db.runs[index], updated_at: nowIso() };
			for (const [key, value] of Object.entries(safeIncrements)) {
				const amount = Number(value);
				if (!Number.isFinite(amount) || amount === 0) continue;
				const prev = Number(row[key]) || 0;
				row[key] = prev + amount;
			}
			db.runs[index] = normalizeRun(row);
			writeFileDb(db);
			return db.runs[index];
		},
	});
}

function toFirestoreTask(task) {
	return {
		...task,
		created_at: toTimestamp(task.created_at),
		updated_at: toTimestamp(task.updated_at),
		claimed_at: task.claimed_at ? toTimestamp(task.claimed_at) : null,
		defer_until: task.defer_until ? toTimestamp(task.defer_until) : null,
		completed_at: task.completed_at ? toTimestamp(task.completed_at) : null,
	};
}

async function createTasks(runId, tasks) {
	const safeRunId = normalizeString(runId);
	const inputTasks = Array.isArray(tasks) ? tasks : [];
	const normalizedTasks = inputTasks.map((task) => normalizeTask(task, safeRunId));
	if (!safeRunId || normalizedTasks.length === 0) return [];

	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			const collection = db.collection(
				getCollectionName("BULK_GEN_TASKS_COLLECTION", DEFAULT_TASKS_COLLECTION),
			);
			const chunkSize = 400;
			for (let offset = 0; offset < normalizedTasks.length; offset += chunkSize) {
				const chunk = normalizedTasks.slice(offset, offset + chunkSize);
				const batch = db.batch();
				for (const task of chunk) {
					batch.set(collection.doc(task.task_id), toFirestoreTask(task), { merge: false });
				}
				await batch.commit();
			}
			await incrementRunCounters(safeRunId, { pending_tasks: normalizedTasks.length });
			return normalizedTasks;
		},
		fileFn: async () => {
			const db = readFileDb();
			for (const task of normalizedTasks) {
				db.tasks = db.tasks.filter((row) => row.task_id !== task.task_id);
				db.tasks.push(task);
			}
			const runIndex = db.runs.findIndex((row) => row.run_id === safeRunId);
			if (runIndex >= 0) {
				const current = Number(db.runs[runIndex].pending_tasks) || 0;
				db.runs[runIndex].pending_tasks = current + normalizedTasks.length;
				db.runs[runIndex].updated_at = nowIso();
			}
			writeFileDb(db);
			return normalizedTasks;
		},
	});
}

async function claimPendingTasks({ runId, limit, workerId, statuses }) {
	const safeRunId = normalizeString(runId);
	const safeWorkerId = normalizeString(workerId, "worker");
	const safeLimit = Math.max(1, Math.min(100, Number(limit) || 1));
	const allowedStatuses = Array.isArray(statuses) && statuses.length
		? new Set(statuses.map((status) => normalizeString(status).toLowerCase()))
		: new Set(["pending"]);
	if (!safeRunId) return [];

	return withBackend({
		firestoreFn: async () => {
			const now = nowIso();
			const nowEpochMs = Date.parse(now);
			const db = getFirestoreDb();
			const collection = db.collection(
				getCollectionName("BULK_GEN_TASKS_COLLECTION", DEFAULT_TASKS_COLLECTION),
			);

			const claimed = [];

			// Prefer targeted queries to avoid stalls when the first 500 docs are all non-pending.
			// If indexes or query shapes fail, fall back to paginated scanning over run_id.
			const allowedList = Array.from(allowedStatuses).filter(Boolean);
			let candidateRefs = [];
			if (allowedList.length === 1) {
				try {
					const snapshot = await collection
						.where("run_id", "==", safeRunId)
						.where("status", "==", allowedList[0])
						.limit(Math.max(safeLimit * 3, safeLimit))
						.get();
					candidateRefs = snapshot.docs.map((doc) => doc.ref);
				} catch {
					candidateRefs = [];
				}
			} else if (allowedList.length > 1 && allowedList.length <= 10) {
				try {
					const snapshot = await collection
						.where("run_id", "==", safeRunId)
						.where("status", "in", allowedList)
						.limit(Math.max(safeLimit * 3, safeLimit))
						.get();
					candidateRefs = snapshot.docs.map((doc) => doc.ref);
				} catch {
					candidateRefs = [];
				}
			}

			if (candidateRefs.length === 0) {
				const pageSize = 500;
				const maxPages = 20;
				let pageSnapshot = await collection.where("run_id", "==", safeRunId).limit(pageSize).get();
				for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
					const pageRefs = pageSnapshot.docs
						.filter((doc) => allowedStatuses.has(String(doc.get("status") || "").toLowerCase()))
						.map((doc) => doc.ref);
					for (const ref of pageRefs) {
						if (candidateRefs.length >= safeLimit * 3) break;
						candidateRefs.push(ref);
					}
					if (candidateRefs.length >= safeLimit * 3) break;
					if (pageSnapshot.docs.length < pageSize) break;
					try {
						pageSnapshot = await collection
							.where("run_id", "==", safeRunId)
							.startAfter(pageSnapshot.docs[pageSnapshot.docs.length - 1])
							.limit(pageSize)
							.get();
					} catch {
						break;
					}
				}
			}

			if (candidateRefs.length > 0) {
				await db.runTransaction(async (tx) => {
					const uniqueRefs = [];
					const seenPaths = new Set();
					for (const ref of candidateRefs) {
						const pathKey = String(ref?.path || "");
						if (!pathKey || seenPaths.has(pathKey)) continue;
						seenPaths.add(pathKey);
						uniqueRefs.push(ref);
					}

					// Firestore requires all reads to happen before writes inside a transaction.
					const snaps = await tx.getAll(...uniqueRefs);

					for (const snap of snaps) {
						if (claimed.length >= safeLimit) break;
						if (!snap?.exists) continue;
						const status = String(snap.get("status") || "").toLowerCase();
						if (!allowedStatuses.has(status)) continue;
						const deferUntilIso = toIso(snap.get("defer_until"));
						if (deferUntilIso && Date.parse(deferUntilIso) > nowEpochMs) continue;
						tx.set(
							snap.ref,
							{
								status: "running",
								claimed_by: safeWorkerId,
								claimed_at: toTimestamp(now),
								defer_until: null,
								updated_at: toTimestamp(now),
								attempt_count: FieldValue.increment(1),
							},
							{ merge: true },
						);
						claimed.push(mapFirestoreTask(snap));
					}
				});
			}

			if (claimed.length > 0) {
				await incrementRunCounters(safeRunId, { pending_tasks: -claimed.length });
			}
			return claimed;
		},
		fileFn: async () => {
			const db = readFileDb();
			const now = nowIso();
			const nowEpochMs = Date.parse(now);
			const claimed = [];
			for (const task of db.tasks) {
				if (claimed.length >= safeLimit) break;
				if (String(task.run_id) !== safeRunId) continue;
				if (!allowedStatuses.has(String(task.status || "").toLowerCase())) continue;
				if (task.defer_until && Date.parse(String(task.defer_until)) > nowEpochMs) continue;
				task.status = "running";
				task.claimed_by = safeWorkerId;
				task.claimed_at = now;
				task.defer_until = null;
				task.updated_at = now;
				task.attempt_count = (Number(task.attempt_count) || 0) + 1;
				claimed.push(normalizeTask(task, safeRunId));
			}
			if (claimed.length > 0) {
				const runIndex = db.runs.findIndex((row) => row.run_id === safeRunId);
				if (runIndex >= 0) {
					db.runs[runIndex].pending_tasks = Math.max(
						0,
						(Number(db.runs[runIndex].pending_tasks) || 0) - claimed.length,
					);
					db.runs[runIndex].updated_at = now;
				}
				writeFileDb(db);
			}
			return claimed;
		},
	});
}

async function rescheduleTask({ taskId, lastError, deferSeconds }) {
	const safeTaskId = normalizeString(taskId);
	if (!safeTaskId) return null;

	const delaySeconds = Math.max(5, Math.min(3600, Number(deferSeconds) || 30));
	const now = nowIso();
	const deferUntilIso = new Date(Date.parse(now) + delaySeconds * 1000).toISOString();

	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			const taskRef = db
				.collection(getCollectionName("BULK_GEN_TASKS_COLLECTION", DEFAULT_TASKS_COLLECTION))
				.doc(safeTaskId);
			const snap = await taskRef.get();
			if (!snap.exists) return null;
			const existing = mapFirestoreTask(snap);
			const prevStatus = String(existing.status || "").toLowerCase();

			await taskRef.set(
				{
					status: "pending",
					defer_until: toTimestamp(deferUntilIso),
					updated_at: toTimestamp(now),
					completed_at: null,
					last_error: normalizeString(lastError),
				},
				{ merge: true },
			);

			if (prevStatus !== "pending") {
				await incrementRunCounters(existing.run_id, { pending_tasks: 1 });
			}

			const updated = await taskRef.get();
			return mapFirestoreTask(updated);
		},
		fileFn: async () => {
			const db = readFileDb();
			const index = db.tasks.findIndex((row) => row.task_id === safeTaskId);
			if (index === -1) return null;
			const prevStatus = String(db.tasks[index].status || "").toLowerCase();
			db.tasks[index].status = "pending";
			db.tasks[index].defer_until = deferUntilIso;
			db.tasks[index].updated_at = now;
			db.tasks[index].completed_at = null;
			db.tasks[index].last_error = normalizeString(lastError);
			const runId = db.tasks[index].run_id;
			if (prevStatus !== "pending") {
				const runIndex = db.runs.findIndex((row) => row.run_id === runId);
				if (runIndex >= 0) {
					db.runs[runIndex].pending_tasks = (Number(db.runs[runIndex].pending_tasks) || 0) + 1;
					db.runs[runIndex].updated_at = now;
				}
			}
			writeFileDb(db);
			return normalizeTask(db.tasks[index], runId);
		},
	});
}

async function setTaskResult({ taskId, status, lastError, estimateEurDelta }) {
	const safeTaskId = normalizeString(taskId);
	const safeStatus = normalizeString(status);
	if (!safeTaskId || !safeStatus) return null;

	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			const taskRef = db
				.collection(getCollectionName("BULK_GEN_TASKS_COLLECTION", DEFAULT_TASKS_COLLECTION))
				.doc(safeTaskId);
			const snap = await taskRef.get();
			if (!snap.exists) return null;
			const existing = mapFirestoreTask(snap);
			const now = nowIso();
			const prevStatus = String(existing.status || "").toLowerCase();
			const nextStatus = String(safeStatus || "").toLowerCase();
			const isTerminal = nextStatus === "completed" || nextStatus === "failed";
			const alreadyTerminal = prevStatus === "completed" || prevStatus === "failed";
			await taskRef.set(
				{
					status: safeStatus,
					updated_at: toTimestamp(now),
					completed_at: isTerminal ? toTimestamp(now) : null,
					last_error: normalizeString(lastError),
				},
				{ merge: true },
			);
			const updates = {};
			if (!alreadyTerminal) {
				if (nextStatus === "completed") updates.completed_tasks = 1;
				if (nextStatus === "failed") updates.failed_tasks = 1;
				const delta = Number(estimateEurDelta);
				if (nextStatus === "completed" && Number.isFinite(delta) && delta !== 0) {
					updates.estimated_spend_eur = delta;
				}
			}
			if (Object.keys(updates).length > 0) {
				await incrementRunCounters(existing.run_id, updates);
			}
			const updated = await taskRef.get();
			return mapFirestoreTask(updated);
		},
		fileFn: async () => {
			const db = readFileDb();
			const index = db.tasks.findIndex((row) => row.task_id === safeTaskId);
			if (index === -1) return null;
			const now = nowIso();
			db.tasks[index].status = safeStatus;
			db.tasks[index].updated_at = now;
			db.tasks[index].completed_at = now;
			db.tasks[index].last_error = normalizeString(lastError);
			const runId = db.tasks[index].run_id;
			const runIndex = db.runs.findIndex((row) => row.run_id === runId);
			if (runIndex >= 0) {
				if (safeStatus === "completed") {
					db.runs[runIndex].completed_tasks = (Number(db.runs[runIndex].completed_tasks) || 0) + 1;
				}
				if (safeStatus === "failed") {
					db.runs[runIndex].failed_tasks = (Number(db.runs[runIndex].failed_tasks) || 0) + 1;
				}
				const delta = Number(estimateEurDelta);
				if (Number.isFinite(delta) && delta !== 0) {
					db.runs[runIndex].estimated_spend_eur =
						(Number(db.runs[runIndex].estimated_spend_eur) || 0) + delta;
				}
				db.runs[runIndex].updated_at = now;
			}
			writeFileDb(db);
			return normalizeTask(db.tasks[index], runId);
		},
	});
}

async function appendOutputs(outputs) {
	const safeOutputs = Array.isArray(outputs) ? outputs : [];
	if (safeOutputs.length === 0) return [];
	const normalized = safeOutputs.map((entry) =>
		normalizeOutput(entry, normalizeString(entry?.run_id), normalizeString(entry?.task_id)),
	);

	return withBackend({
		firestoreFn: async () => {
			const db = getFirestoreDb();
			const collection = db.collection(
				getCollectionName("BULK_GEN_OUTPUTS_COLLECTION", DEFAULT_OUTPUTS_COLLECTION),
			);
			const chunkSize = 400;
			for (let offset = 0; offset < normalized.length; offset += chunkSize) {
				const chunk = normalized.slice(offset, offset + chunkSize);
				const batch = db.batch();
				for (const output of chunk) {
					batch.set(
						collection.doc(output.output_id),
						{
							...output,
							created_at: toTimestamp(output.created_at),
						},
						{ merge: false },
					);
				}
				await batch.commit();
			}
			return normalized;
		},
		fileFn: async () => {
			const db = readFileDb();
			for (const output of normalized) {
				db.outputs = db.outputs.filter((row) => row.output_id !== output.output_id);
				db.outputs.push(output);
			}
			writeFileDb(db);
			return normalized;
		},
	});
}

async function getRunOutputs(runId, limit = 50) {
	const safeRunId = normalizeString(runId);
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
	if (!safeRunId) return [];
	return withBackend({
		firestoreFn: async () => {
			const snapshot = await getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_OUTPUTS_COLLECTION", DEFAULT_OUTPUTS_COLLECTION))
				.where("run_id", "==", safeRunId)
				.limit(safeLimit)
				.get();
			return snapshot.docs.map((doc) => {
				const data = doc.data() || {};
				return normalizeOutput(
					{
						...data,
						output_id: String(doc.id || data.output_id || ""),
						created_at: toIso(data.created_at),
					},
					safeRunId,
					String(data.task_id || ""),
				);
			});
		},
		fileFn: async () => {
			const db = readFileDb();
			return db.outputs
				.filter((row) => String(row.run_id) === safeRunId)
				.slice(0, safeLimit)
				.map((row) => normalizeOutput(row, safeRunId, String(row.task_id || "")));
		},
	});
}

async function upsertStyleProfile(profile) {
	const normalized = normalizeStyleProfile(profile);
	return withBackend({
		firestoreFn: async () => {
			const collection = getFirestoreDb().collection(
				getCollectionName("BULK_GEN_STYLE_COLLECTION", DEFAULT_STYLE_COLLECTION),
			);
			await collection.doc(normalized.zone_id).set(
				{
					...normalized,
					updated_at: toTimestamp(normalized.updated_at),
				},
				{ merge: true },
			);
			return normalized;
		},
		fileFn: async () => {
			const db = readFileDb();
			db.styles = db.styles.filter((row) => row.zone_id !== normalized.zone_id);
			db.styles.push(normalized);
			writeFileDb(db);
			return normalized;
		},
	});
}

async function getStyleProfile(zoneId) {
	const safeZoneId = normalizeString(zoneId, "global");
	return withBackend({
		firestoreFn: async () => {
			const snap = await getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_STYLE_COLLECTION", DEFAULT_STYLE_COLLECTION))
				.doc(safeZoneId)
				.get();
			if (!snap.exists) return null;
			const data = snap.data() || {};
			return normalizeStyleProfile({
				...data,
				zone_id: String(snap.id || data.zone_id || safeZoneId),
				updated_at: toIso(data.updated_at),
			});
		},
		fileFn: async () => {
			const db = readFileDb();
			const row = db.styles.find((entry) => entry.zone_id === safeZoneId);
			return row ? normalizeStyleProfile(row) : null;
		},
	});
}

async function appendSpendEvent(event) {
	const normalized = normalizeSpendEvent(event);
	return withBackend({
		firestoreFn: async () => {
			await getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_SPEND_COLLECTION", DEFAULT_SPEND_COLLECTION))
				.doc(normalized.event_id)
				.set(
					{
						...normalized,
						created_at: toTimestamp(normalized.created_at),
					},
					{ merge: false },
				);
			return normalized;
		},
		fileFn: async () => {
			const db = readFileDb();
			db.spendEvents = db.spendEvents.filter((row) => row.event_id !== normalized.event_id);
			db.spendEvents.push(normalized);
			writeFileDb(db);
			return normalized;
		},
	});
}

async function getRunTaskStats(runId) {
	const safeRunId = normalizeString(runId);
	if (!safeRunId) return { pending: 0, running: 0, completed: 0, failed: 0 };
	const counters = {
		pending: 0,
		running: 0,
		completed: 0,
		failed: 0,
	};
	return withBackend({
		firestoreFn: async () => {
			const snapshot = await getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_TASKS_COLLECTION", DEFAULT_TASKS_COLLECTION))
				.where("run_id", "==", safeRunId)
				.limit(5000)
				.get();
			for (const doc of snapshot.docs) {
				const row = mapFirestoreTask(doc);
				const status = String(row.status || "").toLowerCase();
				if (status === "pending") counters.pending += 1;
				if (status === "running") counters.running += 1;
				if (status === "completed") counters.completed += 1;
				if (status === "failed") counters.failed += 1;
			}
			return counters;
		},
		fileFn: async () => {
			const db = readFileDb();
			for (const row of db.tasks) {
				if (String(row.run_id) !== safeRunId) continue;
				const status = String(row.status || "").toLowerCase();
				if (status === "pending") counters.pending += 1;
				if (status === "running") counters.running += 1;
				if (status === "completed") counters.completed += 1;
				if (status === "failed") counters.failed += 1;
			}
			return counters;
		},
	});
}

async function listRuns({ status, limit } = {}) {
	const safeStatus = normalizeString(status).toLowerCase();
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
	return withBackend({
		firestoreFn: async () => {
			let query = getFirestoreDb()
				.collection(getCollectionName("BULK_GEN_RUNS_COLLECTION", DEFAULT_RUNS_COLLECTION))
				.limit(safeLimit);
			if (safeStatus) {
				query = query.where("status", "==", safeStatus);
			}
			const snapshot = await query.get();
			return snapshot.docs.map((doc) => mapFirestoreRun(doc));
		},
		fileFn: async () => {
			const db = readFileDb();
			let rows = db.runs.map((row) => normalizeRun(row));
			if (safeStatus) {
				rows = rows.filter((row) => String(row.status || "").toLowerCase() === safeStatus);
			}
			return rows.slice(0, safeLimit);
		},
	});
}

module.exports = {
	createRun,
	getRun,
	updateRun,
	incrementRunCounters,
	createTasks,
	claimPendingTasks,
	rescheduleTask,
	setTaskResult,
	appendOutputs,
	getRunOutputs,
	upsertStyleProfile,
	getStyleProfile,
	appendSpendEvent,
	getRunTaskStats,
	listRuns,
};
