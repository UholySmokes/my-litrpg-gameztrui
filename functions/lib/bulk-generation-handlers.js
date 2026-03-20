const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const auth = require("./auth");
const bulkService = require("./bulk-generation-service");
const { runBulkGenerationRoute } = require("./bulk-gen-observability");

function normalizeString(value, fallback = "") {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseCsvList(value) {
	if (typeof value !== "string") return [];
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function getHeader(req, name) {
	if (!req || !req.headers) return "";
	const lower = String(name || "").toLowerCase();
	return req.headers[lower] || req.headers[name] || "";
}

function safeTokenMatch(expected, received) {
	const lhs = Buffer.from(String(expected || ""), "utf8");
	const rhs = Buffer.from(String(received || ""), "utf8");
	if (lhs.length === 0 || rhs.length === 0 || lhs.length !== rhs.length) {
		return false;
	}
	return crypto.timingSafeEqual(lhs, rhs);
}

function hasValidInternalToken(req) {
	const expected = normalizeString(process.env.BULK_GEN_INTERNAL_TOKEN);
	if (!expected) return false;
	const headerToken =
		normalizeString(getHeader(req, "x-bulk-gen-token")) ||
		normalizeString(getHeader(req, "x-internal-token"));
	if (headerToken && safeTokenMatch(expected, headerToken)) return true;
	const authHeader = normalizeString(getHeader(req, "authorization"));
	const match = authHeader.match(/^Bearer\s+(.+)$/i);
	return Boolean(match && safeTokenMatch(expected, normalizeString(match[1])));
}

async function requireOperatorUser(req, res) {
	if (hasValidInternalToken(req)) {
		return {
			id: "internal-bulk-operator",
			email: "internal-bulk-operator@local",
			provider: "internal",
			roles: ["authenticated", "operator"],
		};
	}

	const user = await auth.getUserFromRequest(req);
	if (!user) {
		json(res, 401, {
			ok: false,
			errorCode: "UNAUTHENTICATED",
			message: "Sign in required.",
		});
		return null;
	}

	const allowed = parseCsvList(process.env.BULK_GEN_ALLOWED_USER_IDS || "");
	if (allowed.length === 0) {
		json(res, 403, {
			ok: false,
			errorCode: "FORBIDDEN",
			message: "Bulk generation is disabled until operator IDs are configured.",
		});
		return null;
	}

	if (!allowed.includes(String(user.id))) {
		json(res, 403, {
			ok: false,
			errorCode: "FORBIDDEN",
			message: "You are not allowed to operate bulk generation runs.",
		});
		return null;
	}
	return user;
}

function requireInternalToken(req, res) {
	if (hasValidInternalToken(req)) return true;
	json(res, 401, {
		ok: false,
		errorCode: "UNAUTHORIZED_INTERNAL_CALL",
		message: "Missing or invalid internal token.",
	});
	return false;
}

async function startRun(req, res) {
	return runBulkGenerationRoute({ route: "start", req, res }, async () => {
		try {
			const user = await requireOperatorUser(req, res);
			if (!user) return;
			const body = await readJsonBody(req);
			req.body = body;
			const run = await bulkService.startBulkGenerationRun({
				ownerId: user.id,
				body,
			});
			return json(res, 200, {
				ok: true,
				runId: run.run_id,
				status: run.status,
				maxTasks: run.max_tasks,
				maxEstimatedEur: run.max_estimated_eur,
				expiresAt: run.expires_at,
			});
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not start bulk generation run."),
			});
		}
	});
}

async function tickRun(req, res) {
	return runBulkGenerationRoute({ route: "tick", req, res }, async () => {
		try {
			const method = String(req?.method || "").toUpperCase();
			if (method !== "POST") {
				return json(res, 405, {
					ok: false,
					errorCode: "METHOD_NOT_ALLOWED",
					message: "tick endpoint requires POST.",
				});
			}
			if (!hasValidInternalToken(req)) {
				const user = await requireOperatorUser(req, res);
				if (!user) return;
			}
			const body = await readJsonBody(req);
			req.body = body;
			const result = await bulkService.tickBulkGenerationRun({
				runId: body?.runId,
				workerId: body?.workerId || "manual",
				limit: body?.limit,
			});
			return json(res, 200, result);
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Bulk generation tick failed."),
			});
		}
	});
}

async function getRunStatus(req, res) {
	return runBulkGenerationRoute({ route: "status", req, res }, async () => {
		try {
			const user = await requireOperatorUser(req, res);
			if (!user) return;
			const runId = normalizeString(req?.query?.runId);
			if (!runId) {
				return json(res, 400, {
					ok: false,
					errorCode: "MISSING_RUN_ID",
					message: "runId query parameter is required.",
				});
			}
			const status = await bulkService.getRunStatus(runId, req?.query?.outputLimit);
			if (!status) {
				return json(res, 404, {
					ok: false,
					errorCode: "RUN_NOT_FOUND",
					message: "Run not found.",
				});
			}
			return json(res, 200, {
				ok: true,
				run: status.run,
				stats: status.stats,
				outputs: status.outputs,
			});
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not fetch run status."),
			});
		}
	});
}

async function pauseRun(req, res) {
	return runBulkGenerationRoute({ route: "pause", req, res }, async () => {
		try {
			const user = await requireOperatorUser(req, res);
			if (!user) return;
			const body = await readJsonBody(req);
			req.body = body;
			const runId = normalizeString(body?.runId);
			if (!runId) {
				return json(res, 400, {
					ok: false,
					errorCode: "MISSING_RUN_ID",
					message: "runId is required.",
				});
			}
			const run = await bulkService.pauseRun(runId, body?.reason);
			if (!run) {
				return json(res, 404, {
					ok: false,
					errorCode: "RUN_NOT_FOUND",
					message: "Run not found.",
				});
			}
			return json(res, 200, { ok: true, run });
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not pause run."),
			});
		}
	});
}

async function resumeRun(req, res) {
	return runBulkGenerationRoute({ route: "resume", req, res }, async () => {
		try {
			const user = await requireOperatorUser(req, res);
			if (!user) return;
			const body = await readJsonBody(req);
			req.body = body;
			const runId = normalizeString(body?.runId);
			if (!runId) {
				return json(res, 400, {
					ok: false,
					errorCode: "MISSING_RUN_ID",
					message: "runId is required.",
				});
			}
			const run = await bulkService.resumeRun(runId);
			if (!run) {
				return json(res, 404, {
					ok: false,
					errorCode: "RUN_NOT_FOUND",
					message: "Run not found.",
				});
			}
			return json(res, 200, { ok: true, run });
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not resume run."),
			});
		}
	});
}

async function upsertStyle(req, res) {
	return runBulkGenerationRoute({ route: "style", req, res }, async () => {
		try {
			const user = await requireOperatorUser(req, res);
			if (!user) return;
			const body = await readJsonBody(req);
			req.body = body;
			const profile = await bulkService.upsertStyleProfile(body);
			return json(res, 200, { ok: true, profile });
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not update style profile."),
			});
		}
	});
}

async function budgetAlert(req, res) {
	return runBulkGenerationRoute({ route: "budget-alert", req, res }, async () => {
		try {
			if (!requireInternalToken(req, res)) return;
			const body = await readJsonBody(req);
			req.body = body;
			const result = await bulkService.handleBudgetAlert(body);
			return json(res, 200, result);
		} catch (error) {
			const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 500;
			return json(res, status, {
				ok: false,
				errorCode: normalizeString(error?.code, "UNEXPECTED_ERROR"),
				message: normalizeString(error?.message, "Could not process budget alert."),
			});
		}
	});
}

module.exports = {
	startRun,
	tickRun,
	getRunStatus,
	pauseRun,
	resumeRun,
	upsertStyle,
	budgetAlert,
};
