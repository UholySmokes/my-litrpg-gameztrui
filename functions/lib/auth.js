let firebaseAdminAppModule = null;
let firebaseAdminAuthModule = null;
let firebaseAdminLoadAttempted = false;

function loadFirebaseAdminModules() {
	if (firebaseAdminLoadAttempted) {
		if (firebaseAdminAppModule && firebaseAdminAuthModule) {
			return {
				app: firebaseAdminAppModule,
				auth: firebaseAdminAuthModule,
			};
		}
		return null;
	}

	firebaseAdminLoadAttempted = true;
	try {
		firebaseAdminAppModule = require("firebase-admin/app");
		firebaseAdminAuthModule = require("firebase-admin/auth");
		return {
			app: firebaseAdminAppModule,
			auth: firebaseAdminAuthModule,
		};
	} catch {
		firebaseAdminAppModule = null;
		firebaseAdminAuthModule = null;
		return null;
	}
}

function parseOptionalBoolean(value) {
	if (typeof value !== "string") return null;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return null;
}

const PRODUCTION_PROJECT_IDS = [
	'my-litrpg-gameztrui-3416-da75c',
];

function isProductionEnvironment() {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || '';
	return PRODUCTION_PROJECT_IDS.includes(projectId);
}

function isFunctionsEmulatorEnvironment() {
	return String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
}

function isDevAuthEnabled() {
	const explicit = parseOptionalBoolean(process.env.DEV_AUTH_ENABLED);
	if (isFunctionsEmulatorEnvironment()) {
		if (explicit !== null) return explicit;
		return true;
	}

	// SECURITY: Never allow dev auth against deployed production functions.
	if (isProductionEnvironment()) return false;

	if (explicit !== null) return explicit;
	return false;
}

function getHeader(req, name) {
	if (!req || !req.headers) return "";
	const lower = String(name || "").toLowerCase();
	return req.headers[lower] || req.headers[name] || "";
}

function getDevUser(req) {
	if (!isDevAuthEnabled()) {
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
	const modules = loadFirebaseAdminModules();
	if (!modules) return false;

	const { getApps, initializeApp } = modules.app;
	if (getApps().length === 0) {
		initializeApp();
	}

	return true;
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
		if (!ensureFirebaseApp()) return null;
		const modules = loadFirebaseAdminModules();
		if (!modules) return null;
		const { getAuth } = modules.auth;
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
	isDevAuthEnabled,
	isProductionEnvironment,
	getUserFromRequest,
};
