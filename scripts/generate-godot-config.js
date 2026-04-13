import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const GODOT_CONFIG_PATH = path.resolve(process.cwd(), "godot", "data", "config.json");
const DIST_CONFIG_PATH = path.resolve(process.cwd(), "dist", "runtime-config.js");
const PUBLIC_CONFIG_PATH = path.resolve(process.cwd(), "public", "runtime-config.js");
const DEFAULT_API_BASE_BY_PROFILE = Object.freeze({
	local: "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api",
	singleplayer_local: "http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api",
	production:
		"https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api",
});
const SUPPORTED_PROFILES = new Set(["local", "production", "singleplayer_local"]);

function normalizeConfigValue(value) {
	return String(value || "").trim();
}

function normalizeRelativeApiPath(value, fallbackPath) {
	const raw = normalizeConfigValue(value);
	let pathOnly = raw;
	if (!pathOnly) {
		pathOnly = fallbackPath;
	}
	try {
		if (/^[a-z][a-z0-9+.-]*:\/\//i.test(pathOnly)) {
			const parsed = new URL(pathOnly);
			pathOnly = `${parsed.pathname || ""}${parsed.search || ""}` || fallbackPath;
		}
	} catch {
		pathOnly = fallbackPath;
	}

	if (!pathOnly.startsWith("/")) {
		pathOnly = `/${pathOnly}`;
	}
	if (pathOnly.startsWith("/api/")) {
		pathOnly = `/${pathOnly.slice(5)}`;
	}
	return pathOnly;
}

async function readRuntimeConfigFile() {
	for (const candidate of [DIST_CONFIG_PATH, PUBLIC_CONFIG_PATH]) {
		try {
			const content = await fs.readFile(candidate, "utf8");
			return { content, source: path.relative(process.cwd(), candidate) };
		} catch {
			// Try next candidate path.
		}
	}
	return { content: "", source: "defaults" };
}

function extractRuntimeConfig(content) {
	if (!content.trim()) return {};
	const context = {
		globalThis: {
			__RUNTIME_CONFIG__: {},
		},
	};
	vm.createContext(context);
	try {
		vm.runInContext(content, context, { timeout: 1000 });
		const value = context.globalThis.__RUNTIME_CONFIG__;
		return value && typeof value === "object" ? value : {};
	} catch {
		return {};
	}
}

function parseArgs(argv) {
	const result = {};
	for (let i = 0; i < argv.length; i += 1) {
		const token = argv[i];
		if (token === "--profile") result.profile = String(argv[i + 1] || "").trim();
		if (token === "--api-base") result.apiBaseUrl = String(argv[i + 1] || "").trim();
	}
	return result;
}

function resolveProfile(cliArgs) {
	const profile = normalizeConfigValue(
		cliArgs.profile ||
		process.env.GODOT_CONFIG_PROFILE ||
		process.env.VITE_GODOT_CONFIG_PROFILE ||
		"",
	).toLowerCase();
	if (!profile) return "local";
	if (!SUPPORTED_PROFILES.has(profile)) {
		throw new Error(
			`Unsupported Godot config profile "${profile}". Use one of: ${Array.from(SUPPORTED_PROFILES).join(", ")}`,
		);
	}
	return profile;
}

function resolveExplicitApiBase(cliArgs) {
	return normalizeConfigValue(
		cliArgs.apiBaseUrl ||
		process.env.GODOT_API_BASE_URL ||
		process.env.VITE_GODOT_API_BASE_URL ||
		"",
	);
}

function isLocalhostApi(value) {
	const normalized = normalizeConfigValue(value).toLowerCase();
	return normalized.includes("127.0.0.1") || normalized.includes("localhost");
}

function buildGodotConfig({ runtimeConfig, source, profile, explicitApiBase }) {
	const envApiBase = normalizeConfigValue(
		process.env.VITE_API_BASE_URL || process.env.VITE_API_BASE || "",
	);
	const envBuildId = normalizeConfigValue(process.env.VITE_BUILD_ID || "");
	const envNarrate = normalizeConfigValue(process.env.VITE_NARRATE_ENDPOINT || "");
	const fileApiBase = normalizeConfigValue(
		runtimeConfig.VITE_API_BASE_URL || runtimeConfig.VITE_API_BASE || "",
	);
	const fileBuildId = normalizeConfigValue(runtimeConfig.VITE_BUILD_ID || "");
	const fileNarrate = normalizeConfigValue(runtimeConfig.VITE_NARRATE_ENDPOINT || "");
	const resolvedApiBase = explicitApiBase || envApiBase || fileApiBase;
	const fallbackApiBase =
		DEFAULT_API_BASE_BY_PROFILE[profile] || DEFAULT_API_BASE_BY_PROFILE.local;
	const apiBaseFromResolved =
		resolvedApiBase && resolvedApiBase !== "/" ? resolvedApiBase : fallbackApiBase;
	const safeApiBaseUrl =
		profile === "production" && isLocalhostApi(apiBaseFromResolved) && !explicitApiBase
			? DEFAULT_API_BASE_BY_PROFILE.production
			: apiBaseFromResolved;
	const syncCommandPath = normalizeRelativeApiPath(
		runtimeConfig.GODOT_SYNC_COMMAND_PATH || "",
		"/sync/command",
	);
	const syncPullPath = normalizeRelativeApiPath(
		runtimeConfig.GODOT_SYNC_PULL_PATH || "",
		"/sync/pull",
	);
	const telemetryPath = normalizeRelativeApiPath(
		runtimeConfig.GODOT_TELEMETRY_PATH || "",
		"/telemetry",
	);
	const storyStartPath = normalizeRelativeApiPath(
		runtimeConfig.GODOT_STORY_START_PATH || "",
		"/story/start",
	);
	const storyPollPath = normalizeRelativeApiPath(
		runtimeConfig.GODOT_STORY_POLL_PATH || "",
		"/story/poll",
	);

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		source,
		profile,
		runtimeMode: profile === "singleplayer_local" ? "singleplayer_local" : "online",
		devConsoleEnabled: profile === "singleplayer_local",
		buildId: envBuildId || fileBuildId || "godot-dev",
		apiBaseUrl: safeApiBaseUrl,
		narrateEndpoint: normalizeRelativeApiPath(
			envNarrate || fileNarrate,
			"/narrate",
		),
		syncCommandPath,
		syncPullPath,
		telemetryPath,
		storyStartPath,
		storyPollPath,
	};
}

async function main() {
	const cliArgs = parseArgs(process.argv.slice(2));
	const profile = resolveProfile(cliArgs);
	const explicitApiBase = resolveExplicitApiBase(cliArgs);
	const { content, source } = await readRuntimeConfigFile();
	const runtimeConfig = extractRuntimeConfig(content);
	const godotConfig = buildGodotConfig({
		runtimeConfig,
		source,
		profile,
		explicitApiBase,
	});

	await fs.mkdir(path.dirname(GODOT_CONFIG_PATH), { recursive: true });
	await fs.writeFile(
		GODOT_CONFIG_PATH,
		`${JSON.stringify(godotConfig, null, 2)}\n`,
		"utf8",
	);

	console.log(
		`[godot-config] wrote ${path.relative(process.cwd(), GODOT_CONFIG_PATH)} from ${source} (profile=${profile})`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
