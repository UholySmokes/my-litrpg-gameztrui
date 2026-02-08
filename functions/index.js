const functions = require("firebase-functions");
const { handleApiRequest } = require("./lib/api-router");

exports.api = functions.https.onRequest(async (req, res) => {
	try {
		await handleApiRequest(req, res);
	} catch (error) {
		const message = String(error?.message || error || "Unknown error");
		res.status(500).json({ ok: false, errorCode: "UNEXPECTED_ERROR", message });
	}
});

