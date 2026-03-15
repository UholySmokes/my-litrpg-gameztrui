const crypto = require("crypto");

function nowMs() {
	return Date.now();
}

function nowIso() {
	return new Date(nowMs()).toISOString();
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

function normalizeString(value, fallback = "") {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeObject(value) {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function createEmptyFileDb() {
	return { runs: [], tasks: [], outputs: [], styles: [], spendEvents: [] };
}

function normalizeTask(task, runId) {
	const normalized = normalizeObject(task);
	return {
		task_id: normalizeString(normalized.task_id, crypto.randomUUID()),
		run_id: normalizeString(normalized.run_id, runId),
		kind: normalizeString(normalized.kind, "narrative"),
		zone_id: normalizeString(normalized.zone_id, "global"),
		status: normalizeString(normalized.status, "pending"),
		attempt_count: Number.isFinite(Number(normalized.attempt_count))
			? Number(normalized.attempt_count)
			: 0,
		estimate_eur: Number.isFinite(Number(normalized.estimate_eur))
			? Number(normalized.estimate_eur)
			: 0,
		payload: normalizeObject(normalized.payload),
		claimed_by: normalizeString(normalized.claimed_by),
		claimed_at: normalizeString(normalized.claimed_at) || null,
		defer_until: normalizeString(normalized.defer_until) || null,
		last_error: normalizeString(normalized.last_error),
		created_at: normalizeString(normalized.created_at, nowIso()),
		updated_at: normalizeString(normalized.updated_at, nowIso()),
		completed_at: normalizeString(normalized.completed_at) || null,
	};
}

function normalizeRun(run) {
	const normalized = normalizeObject(run);
	return {
		run_id: normalizeString(normalized.run_id, crypto.randomUUID()),
		owner_id: normalizeString(normalized.owner_id),
		status: normalizeString(normalized.status, "running"),
		pause_reason: normalizeString(normalized.pause_reason),
		credit_guard_mode: normalizeString(normalized.credit_guard_mode, "hard-stop"),
		max_tasks: Number.isFinite(Number(normalized.max_tasks))
			? Number(normalized.max_tasks)
			: 0,
		completed_tasks: Number.isFinite(Number(normalized.completed_tasks))
			? Number(normalized.completed_tasks)
			: 0,
		failed_tasks: Number.isFinite(Number(normalized.failed_tasks))
			? Number(normalized.failed_tasks)
			: 0,
		pending_tasks: Number.isFinite(Number(normalized.pending_tasks))
			? Number(normalized.pending_tasks)
			: 0,
		max_estimated_eur: Number.isFinite(Number(normalized.max_estimated_eur))
			? Number(normalized.max_estimated_eur)
			: 0,
		estimated_spend_eur: Number.isFinite(Number(normalized.estimated_spend_eur))
			? Number(normalized.estimated_spend_eur)
			: 0,
		credit_stop_threshold_eur: Number.isFinite(Number(normalized.credit_stop_threshold_eur))
			? Number(normalized.credit_stop_threshold_eur)
			: 0,
		expires_at: normalizeString(normalized.expires_at) || null,
		created_at: normalizeString(normalized.created_at, nowIso()),
		updated_at: normalizeString(normalized.updated_at, nowIso()),
		meta: normalizeObject(normalized.meta),
	};
}

function normalizeOutput(output, runId, taskId) {
	const normalized = normalizeObject(output);
	return {
		output_id: normalizeString(normalized.output_id, crypto.randomUUID()),
		run_id: normalizeString(normalized.run_id, runId),
		task_id: normalizeString(normalized.task_id, taskId),
		output_type: normalizeString(normalized.output_type, "narrative"),
		zone_id: normalizeString(normalized.zone_id, "global"),
		title: normalizeString(normalized.title),
		body: normalizeString(normalized.body),
		model: normalizeString(normalized.model),
		gcs_uri: normalizeString(normalized.gcs_uri),
		asset_type: normalizeString(normalized.asset_type),
		variant_index: Number.isFinite(Number(normalized.variant_index))
			? Number(normalized.variant_index)
			: 0,
		quality_score: Number.isFinite(Number(normalized.quality_score))
			? Number(normalized.quality_score)
			: 0,
		is_winner: Boolean(normalized.is_winner),
		meta: normalizeObject(normalized.meta),
		created_at: normalizeString(normalized.created_at, nowIso()),
	};
}

function normalizeStyleProfile(profile) {
	const normalized = normalizeObject(profile);
	return {
		zone_id: normalizeString(normalized.zone_id, "global"),
		visual_style_prompt: normalizeString(normalized.visual_style_prompt),
		negative_prompt: normalizeString(normalized.negative_prompt),
		palette: Array.isArray(normalized.palette) ? normalized.palette.map(String) : [],
		lighting: normalizeString(normalized.lighting),
		composition_rules: Array.isArray(normalized.composition_rules)
			? normalized.composition_rules.map(String)
			: [],
		reference_assets: Array.isArray(normalized.reference_assets)
			? normalized.reference_assets.map(String)
			: [],
		updated_at: normalizeString(normalized.updated_at, nowIso()),
	};
}

function normalizeSpendEvent(event) {
	const normalized = normalizeObject(event);
	return {
		event_id: normalizeString(normalized.event_id, crypto.randomUUID()),
		run_id: normalizeString(normalized.run_id),
		source: normalizeString(normalized.source, "worker"),
		action: normalizeString(normalized.action, "allow"),
		estimated_cost_eur: Number.isFinite(Number(normalized.estimated_cost_eur))
			? Number(normalized.estimated_cost_eur)
			: 0,
		remaining_credit_estimate_eur: Number.isFinite(
			Number(normalized.remaining_credit_estimate_eur),
		)
			? Number(normalized.remaining_credit_estimate_eur)
			: 0,
		note: normalizeString(normalized.note),
		created_at: normalizeString(normalized.created_at, nowIso()),
	};
}

function mapFirestoreRun(doc) {
	const data = doc.data() || {};
	return normalizeRun({
		...data,
		run_id: String(doc.id || data.run_id || ""),
		created_at: toIso(data.created_at),
		updated_at: toIso(data.updated_at),
	});
}

function mapFirestoreTask(doc) {
	const data = doc.data() || {};
	return normalizeTask(
		{
			...data,
			task_id: String(doc.id || data.task_id || ""),
			created_at: toIso(data.created_at),
			updated_at: toIso(data.updated_at),
			claimed_at: toIso(data.claimed_at),
			defer_until: toIso(data.defer_until),
			completed_at: toIso(data.completed_at),
		},
		String(data.run_id || ""),
	);
}

module.exports = {
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
};
