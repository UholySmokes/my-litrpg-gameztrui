const { json } = require("./http");
const {
	agents,
	runAgent,
	narrate,
	narrateStart,
	narratePoll,
	health,
} = require("./handlers");
const { handleSavesRequest } = require("./saves");
const sync = require("./sync");
const telemetry = require("./telemetry");
const bulkGeneration = require("./bulk-generation-handlers");

function normalizePath(url) {
	const raw = typeof url === "string" ? url : "";
	const withoutQuery = raw.split("?")[0] || "";
	return withoutQuery.replace(/\/+/g, "/");
}

async function handleApiRequest(req, res) {
	const path = normalizePath(req?.url);
	const method = (req?.method || "GET").toUpperCase();

	const savesMatch = path.match(/^\/api\/saves(?:\/([^/]+))?$/);
	if (savesMatch) {
		const encodedSaveId = savesMatch[1] || "";
		let saveId = "";
		if (encodedSaveId) {
			try {
				saveId = decodeURIComponent(encodedSaveId);
			} catch {
				return json(res, 400, {
					ok: false,
					errorCode: "INVALID_SAVE_ID",
					message: "Malformed save id path segment.",
				});
			}
		}
		return handleSavesRequest(req, res, { saveId });
	}

	if (path === "/api/health" && method === "GET") {
		return health(req, res);
	}

	if (path === "/api/agents" && method === "GET") {
		return agents(req, res);
	}

	if (path === "/api/agents/run" && method === "POST") {
		return runAgent(req, res);
	}

	if (path === "/api/narrate" && method === "POST") {
		return narrate(req, res);
	}

	if (path === "/api/narrate-start" && method === "POST") {
		return narrateStart(req, res);
	}

	if (path === "/api/narrate-poll" && method === "GET") {
		return narratePoll(req, res);
	}

	if (path === "/api/story/event" && method === "POST") {
		return narrate(req, res);
	}

	if (path === "/api/story/start" && method === "POST") {
		return narrateStart(req, res);
	}

	if (path === "/api/story/poll" && method === "GET") {
		return narratePoll(req, res);
	}

	if (path === "/api/telemetry" && method === "POST") {
		return telemetry.telemetryIngest(req, res);
	}

	if (path === "/api/sync/commit" && method === "POST") {
		return sync.commit(req, res);
	}

	if (path === "/api/sync/commit-batch" && method === "POST") {
		return sync.commitBatch(req, res);
	}

	if (path === "/api/sync/command" && method === "POST") {
		return sync.command(req, res);
	}

	if (path === "/api/sync/pull" && method === "GET") {
		return sync.pull(req, res);
	}

	if (path === "/api/sync/replay" && method === "GET") {
		return sync.replay(req, res);
	}

	if (path === "/api/sync/action" && method === "POST") {
		res.set("Deprecation", "true");
		res.set("Sunset", "Wed, 01 Jul 2026 00:00:00 GMT");
		res.set("Link", '</api/sync/commit>; rel="successor-version"');
		return sync.action(req, res);
	}

	if (path === "/api/bulk-gen/run/start" && method === "POST") {
		return bulkGeneration.startRun(req, res);
	}

	if (path === "/api/bulk-gen/run/tick" && method === "POST") {
		return bulkGeneration.tickRun(req, res);
	}

	if (path === "/api/bulk-gen/run/status" && method === "GET") {
		return bulkGeneration.getRunStatus(req, res);
	}

	if (path === "/api/bulk-gen/run/pause" && method === "POST") {
		return bulkGeneration.pauseRun(req, res);
	}

	if (path === "/api/bulk-gen/run/resume" && method === "POST") {
		return bulkGeneration.resumeRun(req, res);
	}

	if (path === "/api/bulk-gen/style" && method === "POST") {
		return bulkGeneration.upsertStyle(req, res);
	}

	if (path === "/api/bulk-gen/budget-alert" && method === "POST") {
		return bulkGeneration.budgetAlert(req, res);
	}

	return json(res, 404, {
		ok: false,
		errorCode: "NOT_FOUND",
		message: `No route for ${method} ${path}`,
	});
}

module.exports = {
	handleApiRequest,
};

