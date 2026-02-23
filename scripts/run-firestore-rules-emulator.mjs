import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseJavaMajor(versionOutput) {
	const joined = Array.isArray(versionOutput)
		? versionOutput.join("\n")
		: String(versionOutput || "");
	const match = joined.match(/version "([^"]+)"/i);
	if (!match) return 0;
	const raw = match[1];
	if (raw.startsWith("1.")) {
		const legacy = Number.parseInt(raw.split(".")[1] || "0", 10);
		return Number.isFinite(legacy) ? legacy : 0;
	}
	const modern = Number.parseInt(raw.split(".")[0] || "0", 10);
	return Number.isFinite(modern) ? modern : 0;
}

function detectTemurin21OnWindows() {
	if (process.platform !== "win32") return "";
	const base = "C:\\Program Files\\Eclipse Adoptium";
	if (!existsSync(base)) return "";
	const dirs = readdirSync(base, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && /^jdk-21(\.|-|$)/i.test(entry.name))
		.map((entry) => entry.name)
		.sort()
		.reverse();
	if (dirs.length === 0) return "";
	const javaHome = path.join(base, dirs[0]);
	const javaExe = path.join(javaHome, "bin", "java.exe");
	return existsSync(javaExe) ? javaHome : "";
}

function resolveJavaEnv(baseEnv) {
	const env = { ...baseEnv };
	const current = spawnSync("java", ["-version"], {
		encoding: "utf8",
		env,
	});
	const currentMajor = parseJavaMajor([current.stdout, current.stderr]);
	if (current.status === 0 && currentMajor >= 21) {
		return env;
	}

	const temurin21 = detectTemurin21OnWindows();
	if (temurin21) {
		env.JAVA_HOME = temurin21;
		const javaBin = path.join(temurin21, "bin");
		const existingPath = String(env.Path || env.PATH || "");
		env.Path = `${javaBin};${existingPath}`;
		env.PATH = env.Path;
	}
	return env;
}

const env = resolveJavaEnv(process.env);
const command =
	process.platform === "win32"
		? 'npx firebase emulators:exec --only firestore "npm run test:firestore-rules"'
		: 'npx firebase emulators:exec --only firestore \'npm run test:firestore-rules\'';

const result = spawnSync(command, {
	stdio: "inherit",
	env,
	shell: true,
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}
process.exit(typeof result.status === "number" ? result.status : 1);
