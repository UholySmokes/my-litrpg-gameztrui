const { withRouteLatency } = require("./route-latency");

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value) {
	const raw = normalizeString(value).toLowerCase();
	if (!raw) return null;
	if (["1", "true", "yes", "on"].includes(raw)) return true;
	if (["0", "false", "no", "off"].includes(raw)) return false;
	return null;
}

function parseInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
}

function estimateJsonBytes(value) {
	if (value === undefined) return 0;
	try {
		return Buffer.byteLength(JSON.stringify(value), "utf8");
	} catch {
		return 0;
	}
}

function roundDuration(durationMs) {
	return Math.round(durationMs * 100) / 100;
}

function createNowNs() {
	if (typeof process.hrtime?.bigint === "function") {
		return process.hrtime.bigint();
	}
	return BigInt(Date.now()) * 1000000n;
}

function buildBulkGenerationRouteMeta(route, req) {
	const body = req?.body && typeof req.body === "object" ? req.body : null;
	const zoneIds = Array.isArray(body?.zoneIds)
		? body.zoneIds.map((zoneId) => normalizeString(zoneId)).filter(Boolean)
		: [];
	const meta = {
		route: normalizeString(route) || undefined,
		runId: normalizeString(req?.query?.runId || body?.runId) || undefined,
		payloadBytes: estimateJsonBytes(body) || undefined,
	};

	if (zoneIds.length > 0) {
		meta.zoneCount = zoneIds.length;
	}
	if (Number.isFinite(Number(body?.questCount))) {
		meta.questCount = parseInteger(body.questCount, 0);
	}
	if (Number.isFinite(Number(body?.loreCount))) {
		meta.loreCount = parseInteger(body.loreCount, 0);
	}
	if (Number.isFinite(Number(body?.assetCount))) {
		meta.assetCount = parseInteger(body.assetCount, 0);
	}
	if (Number.isFinite(Number(body?.limit))) {
		meta.limit = parseInteger(body.limit, 0);
	} else if (Number.isFinite(Number(req?.query?.limit))) {
		meta.limit = parseInteger(req.query.limit, 0);
	}
	if (Number.isFinite(Number(req?.query?.outputLimit))) {
		meta.outputLimit = parseInteger(req.query.outputLimit, 0);
	}
	const workerId = normalizeString(body?.workerId);
	if (workerId) {
		meta.workerId = workerId;
	}

	return meta;
}

async function runBulkGenerationRoute({ route, req, res }, work) {
	return withRouteLatency(
		{
			scope: "bulk_gen",
			route,
			req,
			res,
			meta: () => buildBulkGenerationRouteMeta(route, req),
		},
		work,
	);
}

function isBulkGenerationStageLoggingEnabled(env = process.env) {
	const specific = normalizeBoolean(env.BULK_GEN_STAGE_LOGGING);
	if (specific !== null) return specific;

	const shared = normalizeBoolean(env.GENERATION_STAGE_LOGGING);
	if (shared !== null) return shared;

	return normalizeString(env.NODE_ENV).toLowerCase() === "development";
}

function buildBulkGenerationStageLogEntry({ stage, durationMs, ok = true, meta = {} }) {
	const entry = {
		scope: "bulk_gen_stage",
		stage: normalizeString(stage) || "unknown",
		ok: Boolean(ok),
	};

	if (Number.isFinite(Number(durationMs))) {
		entry.durationMs = roundDuration(Number(durationMs));
	}

	for (const [key, value] of Object.entries(meta || {})) {
		if (value === undefined || value === null || value === "") continue;
		entry[key] = value;
	}

	return entry;
}

async function measureBulkGenerationStage(context, work) {
	const startedAtNs = createNowNs();
	let result;
	let thrownError = null;

	try {
		result = await work();
	} catch (error) {
		thrownError = error;
	}

	if (isBulkGenerationStageLoggingEnabled(context.env)) {
		const finishedAtNs = createNowNs();
		const durationMs = Number(finishedAtNs - startedAtNs) / 1000000;
		const resolvedMeta =
			typeof context.meta === "function"
				? context.meta({ result, error: thrownError })
				: context.meta || {};
		const entry = buildBulkGenerationStageLogEntry({
			stage: context.stage,
			durationMs,
			ok: !thrownError,
			meta: resolvedMeta,
		});
		const logger = context.logger || console.info;
		logger(`[bulk-gen-stage] ${JSON.stringify(entry)}`);
	}

	if (thrownError) {
		throw thrownError;
	}

	return result;
}

module.exports = {
	buildBulkGenerationRouteMeta,
	buildBulkGenerationStageLogEntry,
	isBulkGenerationStageLoggingEnabled,
	measureBulkGenerationStage,
	runBulkGenerationRoute,
};
