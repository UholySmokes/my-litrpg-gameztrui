const fileDb = require("./game-db-file");

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasSupabaseConfig() {
	const url =
		getOptionalEnv("SUPABASE_URL") ||
		getOptionalEnv("VITE_SUPABASE_URL") ||
		getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
	const key =
		getOptionalEnv("SUPABASE_ANON_KEY") ||
		getOptionalEnv("VITE_SUPABASE_ANON_KEY") ||
		getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
		getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
		getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
		getOptionalEnv("SUPABASE_SECRET_KEY");
	return Boolean(url && key);
}

function normalizeBackend(value) {
	const normalized = String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[_\s]+/g, "-");
	if (!normalized) return "";
	if (["file", "json", "local", "filesystem", "fs"].includes(normalized)) {
		return "file";
	}
	if (["firestore", "firebase", "fsdb"].includes(normalized)) {
		return "firestore";
	}
	if (["supabase", "postgres", "postgresql", "pg"].includes(normalized)) {
		return "supabase";
	}
	return normalized;
}

function resolveGameDbBackend() {
	const override = normalizeBackend(getOptionalEnv("GAME_DB_STORAGE"));
	if (override === "file" || override === "firestore" || override === "supabase") {
		return override;
	}

	const isEmulator =
		String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
	if (isEmulator && !getOptionalEnv("FIRESTORE_EMULATOR_HOST")) {
		return "file";
	}

	if (hasSupabaseConfig()) {
		return "supabase";
	}

	return "firestore";
}

module.exports = {
	resolveGameDbBackend,
	fileDb,
};

