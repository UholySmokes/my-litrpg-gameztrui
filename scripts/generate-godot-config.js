import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const GODOT_CONFIG_PATH = path.resolve(process.cwd(), "godot", "data", "config.json");
const DIST_CONFIG_PATH = path.resolve(process.cwd(), "dist", "runtime-config.js");
const PUBLIC_CONFIG_PATH = path.resolve(process.cwd(), "public", "runtime-config.js");
const DEFAULT_API_BASE_URL =
	"http://127.0.0.1:5001/my-litrpg-gameztrui-3416-da75c/us-central1/api";

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

function buildGodotConfig({ runtimeConfig, source }) {
	const envApiBase = normalizeConfigValue(
		process.env.VITE_API_BASE_URL || process.env.VITE_API_BASE || "",
	);
	const envNarrate = normalizeConfigValue(process.env.VITE_NARRATE_ENDPOINT || "");
	const fileApiBase = normalizeConfigValue(
		runtimeConfig.VITE_API_BASE_URL || runtimeConfig.VITE_API_BASE || "",
	);
	const fileNarrate = normalizeConfigValue(runtimeConfig.VITE_NARRATE_ENDPOINT || "");
	const resolvedApiBase = envApiBase || fileApiBase;
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
		apiBaseUrl:
			resolvedApiBase && resolvedApiBase !== "/"
				? resolvedApiBase
				: DEFAULT_API_BASE_URL,
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
	const { content, source } = await readRuntimeConfigFile();
	const runtimeConfig = extractRuntimeConfig(content);
	const godotConfig = buildGodotConfig({ runtimeConfig, source });

	await fs.mkdir(path.dirname(GODOT_CONFIG_PATH), { recursive: true });
	await fs.writeFile(
		GODOT_CONFIG_PATH,
		`${JSON.stringify(godotConfig, null, 2)}\n`,
		"utf8",
	);

	console.log(
		`[godot-config] wrote ${path.relative(process.cwd(), GODOT_CONFIG_PATH)} from ${source}`,
	);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
