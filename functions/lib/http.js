function json(res, status, body) {
	res.status(status);
	res.set("Content-Type", "application/json");
	res.json(body);
}

function toStringSafe(value) {
	return typeof value === "string" ? value : "";
}

async function readJsonBody(req) {
	if (!req) return {};
	if (req.body && typeof req.body === "object") return req.body;
	const raw = toStringSafe(req.rawBody ? req.rawBody.toString("utf8") : "");
	if (!raw.trim()) return {};
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

module.exports = {
	json,
	readJsonBody,
};

