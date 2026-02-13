const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function getHeader(req, name) {
	if (!req || !req.headers) return "";
	const lower = String(name || "").toLowerCase();
	return req.headers[lower] || req.headers[name] || "";
}

function getDevUser(req) {
	if (process.env.NODE_ENV === "production") {
		return null;
	}

	const envUserId =
		typeof process.env.DEV_USER_ID === "string"
			? process.env.DEV_USER_ID.trim()
			: "";
	if (envUserId) {
		return {
			id: String(envUserId),
			email: String(process.env.DEV_USER_EMAIL || envUserId),
			provider: "dev",
			roles: ["authenticated"],
		};
	}

	const headerUserId = getHeader(req, "x-dev-user-id");
	if (headerUserId) {
		return {
			id: String(headerUserId),
			email: String(getHeader(req, "x-dev-user-email") || headerUserId),
			provider: "dev",
			roles: ["authenticated"],
		};
	}

	return null;
}

function ensureFirebaseApp() {
	if (getApps().length === 0) {
		initializeApp();
	}
}

function extractBearerToken(req) {
	const header = String(getHeader(req, "authorization") || "").trim();
	if (!header) return "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	return match ? String(match[1] || "").trim() : "";
}

async function getFirebaseUser(req) {
	const token = extractBearerToken(req);
	if (!token) return null;

	try {
		ensureFirebaseApp();
		const decoded = await getAuth().verifyIdToken(token);
		if (!decoded || !decoded.uid) return null;
		return {
			id: String(decoded.uid),
			email:
				typeof decoded.email === "string" && decoded.email.trim()
					? decoded.email
					: String(decoded.uid),
			provider: "firebase",
			roles: ["authenticated"],
		};
	} catch {
		return null;
	}
}

async function getUserFromRequest(req) {
	const devUser = getDevUser(req);
	if (devUser) return devUser;

	const firebaseUser = await getFirebaseUser(req);
	if (firebaseUser) return firebaseUser;

	return null;
}

module.exports = {
	getUserFromRequest,
};
