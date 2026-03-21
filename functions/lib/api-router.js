const { json } = require("./http");
const { findApiRoute, normalizePath } = require("./api-route-table");
const { checkRateLimit } = require("./rate-limit");
const { createRequestTraceContext } = require("./request-tracing");

const MAX_BODY_SIZE = 100 * 1024; // 100KB

function getRequestPath(req) {
	return normalizePath(req?.originalUrl || req?.url);
}

async function handleApiRequest(req, res, options = {}) {
  req.traceContext = createRequestTraceContext(req);
  res.locals = {
    ...(res.locals || {}),
    traceContext: req.traceContext,
  };

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

