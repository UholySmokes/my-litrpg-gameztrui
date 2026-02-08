const { json } = require("./http");
const {
	narrate,
	narrateStart,
	narratePoll,
	health,
} = require("./handlers");

function normalizePath(url) {
	const raw = typeof url === "string" ? url : "";
	const withoutQuery = raw.split("?")[0] || "";
	return withoutQuery.replace(/\/+/g, "/");
}

async function handleApiRequest(req, res) {
	const path = normalizePath(req?.url);
	const method = (req?.method || "GET").toUpperCase();

	if (path === "/api/health" && method === "GET") {
		return health(req, res);
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

