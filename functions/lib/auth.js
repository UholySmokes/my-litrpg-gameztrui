let firebaseAdminAppModule = null;
let firebaseAdminAuthModule = null;
let firebaseAdminLoadAttempted = false;
const { getSupabaseUser } = require("./supabase");

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

function isDevAuthEnabled() {
	// SECURITY: Never allow dev auth in production
	if (isProductionEnvironment()) return false;

	const explicit = parseOptionalBoolean(process.env.DEV_AUTH_ENABLED);
	if (explicit !== null) return explicit;
	return String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
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

function setAuthContext(req, patch) {
	if (!req || typeof req !== "object") return;
	req.authContext = {
		...(req.authContext || {}),
		...(patch && typeof patch === "object" ? patch : {}),
	};
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
		setAuthContext(req, {
			accessToken: token,
			provider: "firebase",
		});
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

async function getSupabaseAuthUser(req) {
	const token = extractBearerToken(req);
	if (!token) return null;
	const user = await getSupabaseUser(token);
	if (!user) return null;
	setAuthContext(req, {
		accessToken: token,
		provider: "supabase",
	});
	return user;
}

async function getUserFromRequest(req) {
	const devUser = getDevUser(req);
	if (devUser) {
		setAuthContext(req, {
			accessToken: "",
			provider: "dev",
		});
		return devUser;
	}

	const supabaseUser = await getSupabaseAuthUser(req);
	if (supabaseUser) return supabaseUser;

	const firebaseUser = await getFirebaseUser(req);
	if (firebaseUser) return firebaseUser;

	return null;
}

module.exports = {
	isDevAuthEnabled,
	isProductionEnvironment,
	getUserFromRequest,
};
