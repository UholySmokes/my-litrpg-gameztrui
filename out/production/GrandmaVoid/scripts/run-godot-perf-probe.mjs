import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_PATH = path.resolve(process.cwd(), "godot");
const PERF_SCRIPT = "res://scripts/headless_perf_probe.gd";
const REPORTS_DIR = path.resolve(process.cwd(), "docs", "reports");

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

function parseMetrics(output) {
	const lines = String(output || "").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("[godot-perf-probe] {")) continue;
		const jsonText = trimmed.slice("[godot-perf-probe] ".length);
		try {
			return JSON.parse(jsonText);
		} catch {
			return null;
		}
	}
	return null;
}

function writeReport(metrics) {
	fs.mkdirSync(REPORTS_DIR, { recursive: true });
	const dateStamp = new Date().toISOString().slice(0, 10);
	const reportPath = path.join(
		REPORTS_DIR,
		`godot_map_traversal_perf_baseline_${dateStamp}.md`,
	);
	const report = [
		`# Godot Map Traversal Perf Baseline (${dateStamp})`,
		"",
		"Source: `npm run test:godot:perf` via headless Godot probe.",
		"",
		"| Metric | Value |",
		"|--------|-------|",
		`| mapTransitions | ${metrics.mapTransitions ?? 0} |`,
		`| baselineIterations | ${metrics.baselineIterations ?? 0} |`,
		`| moveSamples | ${metrics.moveSamples ?? 0} |`,
		`| renderSamples | ${metrics.renderSamples ?? 0} |`,
		`| moveAvgMs | ${Number(metrics.moveAvgMs ?? 0).toFixed(4)} |`,
		`| moveP95Ms | ${Number(metrics.moveP95Ms ?? 0).toFixed(4)} |`,
		`| renderAvgMs | ${Number(metrics.renderAvgMs ?? 0).toFixed(4)} |`,
		`| renderP95Ms | ${Number(metrics.renderP95Ms ?? 0).toFixed(4)} |`,
		"",
		"Notes:",
		"- Baseline is a deterministic headless traversal sweep over configured maps.",
		"- This is a regression anchor for future sprite/tile complexity changes.",
		"",
	].join("\n");
	fs.writeFileSync(reportPath, report, "utf8");
	return reportPath;
}

function main() {
	const godotBin = resolveGodotBin();
	if (!godotBin) {
		console.error(
			"[godot-perf-probe] Godot CLI not found. Set GODOT_BIN to the executable path.",
		);
		process.exitCode = 1;
		return;
	}

	const args = ["--headless", "--path", PROJECT_PATH, "--script", PERF_SCRIPT];
	const run = spawnSync(godotBin, args, { encoding: "utf8" });
	const output = `${run.stdout || ""}${run.stderr || ""}`;
	if (run.stdout) process.stdout.write(run.stdout);
	if (run.stderr) process.stderr.write(run.stderr);
	if (run.error) {
		console.error(run.error.message);
		process.exitCode = 1;
		return;
	}
	const hasScriptErrors = /(SCRIPT ERROR:|Parse Error:|Failed to load script)/.test(output);
	if (hasScriptErrors) {
		process.exitCode = 1;
		return;
	}
	if ((run.status ?? 1) !== 0) {
		process.exitCode = Number.isInteger(run.status) ? run.status : 1;
		return;
	}

	const metrics = parseMetrics(output);
	if (!metrics || typeof metrics !== "object") {
		console.error("[godot-perf-probe] Missing metrics output from probe.");
		process.exitCode = 1;
		return;
	}

	const reportPath = writeReport(metrics);
	console.log(`[godot-perf-probe] report: ${path.relative(process.cwd(), reportPath)}`);
	process.exitCode = 0;
}

main();
