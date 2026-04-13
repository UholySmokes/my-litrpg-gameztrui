const { json } = require("./http");
const { findApiRoute, normalizePath } = require("./api-route-table");
const { checkRateLimit } = require("./rate-limit");
const { createRequestTraceContext } = require("./request-tracing");

const MAX_BODY_SIZE = 100 * 1024; // 100KB

function parseCsv(value) {
	if (typeof value !== "string") return [];
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function normalizeOrigin(value) {
	return typeof value === "string" ? value.trim() : "";
}

function guessRequestOrigin(req) {
	const protoHeader =
		typeof req?.headers?.["x-forwarded-proto"] === "string"
			? req.headers["x-forwarded-proto"]
			: "";
	const proto = (protoHeader.split(",")[0] || "").trim() || "https";
	const host = typeof req?.headers?.host === "string" ? req.headers.host.trim() : "";
	if (!host) return "";
	return `${proto}://${host}`;
}

function matchesAllowedOrigin(origin, allowed) {
	if (!origin || !allowed) return false;
	if (allowed === "*") return true;
	if (allowed.endsWith("*")) {
		const prefix = allowed.slice(0, -1);
		return origin.startsWith(prefix);
	}
	if (allowed.startsWith("*.")) {
		try {
			const url = new URL(origin);
			const host = url.hostname.toLowerCase();
			const suffix = allowed.slice(1).toLowerCase();
			return host.endsWith(suffix);
		} catch {
			return false;
		}
	}
	return origin === allowed;
}

function shouldAllowOrigin(origin, req) {
	const normalized = normalizeOrigin(origin);
	if (!normalized) return false;

	const requestOrigin = guessRequestOrigin(req);
	if (requestOrigin && normalized === requestOrigin) return true;

	const configured = parseCsv(process.env.CORS_ALLOWED_ORIGINS);
	const defaults = [
		"https://void-verse.com",
		"https://my-litrpg-gameztrui-3416-da75c.web.app",
		"http://127.0.0.1:5173",
		"http://localhost:5173",
		"http://127.0.0.1:5000",
		"http://localhost:5000",
	];

	const allowedList = configured.length > 0 ? configured : defaults;
	return allowedList.some((allowed) => matchesAllowedOrigin(normalized, allowed));
}

function applyCorsHeaders(res, origin) {
	if (!res || !origin) return;
	res.set("Access-Control-Allow-Origin", origin);
	res.set("Vary", "Origin");
	res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
	res.set(
		"Access-Control-Allow-Headers",
		[
			"Content-Type",
			"Authorization",
			"X-Dev-User-Id",
			"X-Dev-User-Email",
			"X-Trace-Id",
			"X-Span-Id",
			"X-Parent-Span-Id",
		].join(", "),
	);
	res.set(
		"Access-Control-Expose-Headers",
		[
			"X-Trace-Id",
			"X-Span-Id",
			"X-Parent-Span-Id",
			"X-RateLimit-Limit",
			"X-RateLimit-Remaining",
			"Retry-After",
		].join(", "),
	);
	res.set("Access-Control-Max-Age", "86400");
}

function handleCors(req, res) {
	const origin = normalizeOrigin(req?.headers?.origin);
	if (!origin) return false;
	if (!shouldAllowOrigin(origin, req)) return false;

	applyCorsHeaders(res, origin);

	const method = String(req?.method || "GET").toUpperCase();
	if (method === "OPTIONS") {
		res.status(204).send("");
		return true;
	}

	return false;
}

function getRequestPath(req) {
	return normalizePath(req?.originalUrl || req?.url);
}

async function handleApiRequest(req, res, options = {}) {
  req.traceContext = createRequestTraceContext(req);
  res.locals = {
    ...(res.locals || {}),
    traceContext: req.traceContext,
  };

  if (handleCors(req, res)) {
    return;
  }

	// Rate limit check
	const rateResult = checkRateLimit(req);
	if (!rateResult.allowed) {
		res.set("Retry-After", String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)));
		res.set("X-RateLimit-Limit", String(rateResult.limit));
		res.set("X-RateLimit-Remaining", "0");
		return json(res, 429, { ok: false, errorCode: "RATE_LIMITED", message: rateResult.message });
	}
	res.set("X-RateLimit-Limit", String(rateResult.limit));
	res.set("X-RateLimit-Remaining", String(rateResult.remaining));

	// Body size validation
	const contentLength = parseInt(req.headers?.['content-length'] || '0', 10);
	if (contentLength > MAX_BODY_SIZE) {
		return json(res, 413, {
			ok: false,
			errorCode: 'PAYLOAD_TOO_LARGE',
			message: `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes.`,
		});
	}
	if (req.body) {
		const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
		if (bodyString && bodyString.length > MAX_BODY_SIZE) {
			return json(res, 413, {
				ok: false,
				errorCode: 'PAYLOAD_TOO_LARGE',
				message: `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes.`,
			});
		}
	}

	const path = getRequestPath(req);
	const method = (req?.method || "GET").toUpperCase();
	const found = findApiRoute(path, method);
	const allowedRouteNames = options?.allowedRouteNames;

	if (found) {
		if (allowedRouteNames && !allowedRouteNames.has(found.route.name)) {
			return json(res, 404, {
				ok: false,
				errorCode: "NOT_FOUND",
				message: `No route for ${method} ${path}`,
			});
		}

		await found.route.handle(req, res, found.match);
		return;
	}

	return json(res, 404, {
		ok: false,
		errorCode: "NOT_FOUND",
		message: `No route for ${method} ${path}`,
	});
}

module.exports = {
	getRequestPath,
	handleApiRequest,
	MAX_BODY_SIZE,
};

