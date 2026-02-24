import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_PATH = path.resolve(process.cwd(), "godot");
const HEADLESS_SCRIPT = "res://scripts/headless_smoke.gd";

function isExecutable(filePath) {
	try {
		return fs.statSync(filePath).isFile();
	} catch {
		return false;
	}
}

function commandExists(cmd) {
	const result =
		process.platform === "win32"
			? spawnSync("where", [cmd], { stdio: "ignore" })
			: spawnSync("which", [cmd], { stdio: "ignore" });
	return result.status === 0;
}

function resolveGodotBin() {
	const explicit = String(process.env.GODOT_BIN || "").trim();
	if (explicit && isExecutable(explicit)) return explicit;
	if (commandExists("godot4")) return "godot4";
	if (commandExists("godot")) return "godot";
	return "";
}

function main() {
	const godotBin = resolveGodotBin();
	if (!godotBin) {
		console.error(
			"[godot-headless] Godot CLI not found. Set GODOT_BIN to the executable path.",
		);
		process.exitCode = 1;
		return;
	}

	const args = [
		"--headless",
		"--path",
		PROJECT_PATH,
		"--script",
		HEADLESS_SCRIPT,
	];
	const run = spawnSync(godotBin, args, {
		stdio: "inherit",
	});
	if (run.error) {
		console.error(run.error.message);
		process.exitCode = 1;
		return;
	}
	process.exitCode = Number.isInteger(run.status) ? run.status : 1;
}

main();
