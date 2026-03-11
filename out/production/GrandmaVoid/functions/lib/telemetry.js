const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { getUserFromRequest } = require("./auth");

const MAX_EVENTS = 200;
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error"]);

function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function normalizeLevel(value) {
	const normalized = normalizeString(value).toLowerCase();
	return ALLOWED_LEVELS.has(normalized) ? normalized : "info";
}

function parseIsoTimestamp(value) {
	const raw = normalizeString(value);
	if (!raw) return "";
	const parsed = Date.parse(raw);
	return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function normalizeEvent(event, index) {
	if (!isRecord(event)) {
		return {
			ok: false,
			errorCode: "INVALID_TELEMETRY_EVENT",
			message: `events[${index}] must be an object.`,
		};
	}

	const type = normalizeString(event.type);
	if (!type) {
		return {
			ok: false,
			errorCode: "INVALID_TELEMETRY_EVENT",
			message: `events[${index}].type is required.`,
		};
	}

	if (typeof event.ts !== "undefined" && !parseIsoTimestamp(event.ts)) {
		return {
			ok: false,
			errorCode: "INVALID_TELEMETRY_EVENT",
			message: `events[${index}].ts must be an ISO-8601 timestamp.`,
		};
	}

	return {
		ok: true,
		event: {
			type,
			level: normalizeLevel(event.level),
			ts: parseIsoTimestamp(event.ts) || new Date().toISOString(),
			message: normalizeString(event.message) || null,
			data: event.data,
		},
	};
}

function createRequestId() {
	if (typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return crypto.randomBytes(16).toString("hex");
}

async function telemetryIngest(req, res) {
	try {
		const user = await getUserFromRequest(req);
		if (!user) {
			return json(res, 401, {
				ok: false,
				errorCode: "UNAUTHENTICATED",
				message: "Sign in required.",
			});
		}

		const body = await readJsonBody(req);
		if (!isRecord(body) || !Array.isArray(body.events)) {
			return json(res, 400, {
				ok: false,
				errorCode: "INVALID_TELEMETRY_BATCH",
				message: "Payload must include an events array.",
			});
		}

		if (body.events.length < 1 || body.events.length > MAX_EVENTS) {
			return json(res, 400, {
				ok: false,
				errorCode: "INVALID_TELEMETRY_BATCH",
				message: `events must contain 1-${MAX_EVENTS} entries.`,
			});
		}

		const normalizedEvents = [];
		for (let i = 0; i < body.events.length; i += 1) {
			const normalized = normalizeEvent(body.events[i], i);
			if (!normalized.ok) {
				return json(res, 400, {
					ok: false,
					errorCode: normalized.errorCode,
					message: normalized.message,
				});
			}
			normalizedEvents.push(normalized.event);
		}

		const requestId = createRequestId();
		const receivedAt = new Date().toISOString();
		const source = normalizeString(body.source) || "unknown";
		const sessionId = normalizeString(body.sessionId) || null;
		const build = normalizeString(body.build) || null;
		const tags = isRecord(body.tags) ? body.tags : {};

		console.log(
			`[telemetry] requestId=${requestId} user=${user.id} source=${source} events=${normalizedEvents.length}`,
			{
				requestId,
				userId: user.id,
				source,
				sessionId,
				build,
				clientTime: parseIsoTimestamp(body.clientTime) || null,
				tags,
				events: normalizedEvents,
				receivedAt,
			},
		);

		return json(res, 202, {
			ok: true,
			requestId,
			accepted: normalizedEvents.length,
			dropped: 0,
			receivedAt,
		});
	} catch (error) {
		return json(res, 500, {
			ok: false,
			errorCode: "UNEXPECTED_TELEMETRY_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

module.exports = {
	telemetryIngest,
};
