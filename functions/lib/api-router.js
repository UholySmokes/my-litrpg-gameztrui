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

	return json(res, 404, {
		ok: false,
		errorCode: "NOT_FOUND",
		message: `No route for ${method} ${path}`,
	});
}

module.exports = {
	handleApiRequest,
};

