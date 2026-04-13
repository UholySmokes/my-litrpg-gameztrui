const supabase = require("./supabase");

function parseOptionalBoolean(value) {
	if (typeof value !== "string") return null;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return null;
}

const PRODUCTION_PROJECT_IDS = [
	"my-litrpg-gameztrui-3416-da75c",
];

function isProductionEnvironment() {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "";
	const vercelEnv = String(process.env.VERCEL_ENV || "").trim().toLowerCase();
	return PRODUCTION_PROJECT_IDS.includes(projectId) || vercelEnv === "production";
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

	// SECURITY: Never allow dev auth against deployed production runtimes.
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

function extractBearerToken(req) {
	const header = String(getHeader(req, "authorization") || "").trim();
	if (!header) return "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	return match ? String(match[1] || "").trim() : "";
}

function mapSupabaseUser(user) {
	if (!user || typeof user !== "object" || !user.id) return null;
	const primaryIdentity = Array.isArray(user.identities)
		? user.identities.find((entry) => entry?.provider)
		: null;
	const primaryProvider =
		user.app_metadata?.provider ||
		primaryIdentity?.provider ||
		user.user_metadata?.provider ||
		"";

	return {
		id: String(user.id),
		email:
			typeof user.email === "string" && user.email.trim()
				? user.email
				: String(user.id),
		provider: primaryProvider || "supabase",
		roles: ["authenticated"],
	};
}

async function getSupabaseUser(req) {
	const token = extractBearerToken(req);
	if (!token || !supabase.isSupabaseConfigured()) return null;

	try {
		const client = supabase.getSupabaseServiceClient();
		const { data, error } = await client.auth.getUser(token);
		if (error) return null;
		return mapSupabaseUser(data?.user);
	} catch {
		return null;
	}
}

async function getUserFromRequest(req) {
	const devUser = getDevUser(req);
	if (devUser) return devUser;

	const supabaseUser = await getSupabaseUser(req);
	if (supabaseUser) return supabaseUser;

	return null;
}

module.exports = {
	isDevAuthEnabled,
	isProductionEnvironment,
	getUserFromRequest,
};
