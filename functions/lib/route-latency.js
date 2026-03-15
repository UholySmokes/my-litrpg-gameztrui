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

function normalizePath(url) {
	const raw = normalizeString(url);
	return raw.split("?")[0] || "";
}

function isRouteLatencyLoggingEnabled(scope, env = process.env) {
	const specificKey = `${normalizeString(scope).toUpperCase()}_ROUTE_LATENCY_LOGGING`;
	const specific = normalizeBoolean(env[specificKey]);
	if (specific !== null) return specific;

	const shared = normalizeBoolean(env.ROUTE_LATENCY_LOGGING);
	if (shared !== null) return shared;

	return normalizeString(env.NODE_ENV).toLowerCase() === "development";
}

function createNowNs() {
	if (typeof process.hrtime?.bigint === "function") {
		return process.hrtime.bigint();
	}
	return BigInt(Date.now()) * 1000000n;
}

function roundDuration(durationMs) {
	return Math.round(durationMs * 100) / 100;
}

function buildRouteLatencyLogEntry({ scope, route, req, res, durationMs, meta }) {
	const entry = {
		scope: normalizeString(scope) || "http",
		route: normalizeString(route) || normalizePath(req?.url) || "unknown",
		method: normalizeString(req?.method).toUpperCase() || "GET",
		path: normalizePath(req?.url),
		statusCode: Number.isFinite(Number(res?.statusCode)) ? Number(res.statusCode) : 0,
		durationMs: roundDuration(durationMs),
	};

	for (const [key, value] of Object.entries(meta || {})) {
		if (value === undefined || value === null || value === "") continue;
		entry[key] = value;
	}

	return entry;
}

async function withRouteLatency(context, work) {
	const startedAtNs = createNowNs();
	let result;
	let thrownError = null;
	try {
		result = await work();
	} catch (error) {
		thrownError = error;
	}

	if (isRouteLatencyLoggingEnabled(context.scope, context.env)) {
		const finishedAtNs = createNowNs();
		const durationMs = Number(finishedAtNs - startedAtNs) / 1000000;
		const resolvedMeta =
			typeof context.meta === "function" ? context.meta() : context.meta || {};
		const entry = buildRouteLatencyLogEntry({
			scope: context.scope,
			route: context.route,
			req: context.req,
			res: context.res,
			durationMs,
			meta: resolvedMeta,
		});
		const logger = context.logger || console.info;
		logger(`[route-latency] ${JSON.stringify(entry)}`);
	}

	if (thrownError) {
		throw thrownError;
	}

	return result;
}

module.exports = {
	isRouteLatencyLoggingEnabled,
	buildRouteLatencyLogEntry,
	withRouteLatency,
};
