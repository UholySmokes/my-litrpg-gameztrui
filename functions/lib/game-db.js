const fileDb = require("./game-db-file");

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
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

	return "firestore";
}

module.exports = {
	resolveGameDbBackend,
	fileDb,
};

