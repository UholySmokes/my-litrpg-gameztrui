import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";

function runCommand(label, command, args, extraEnv = {}) {
	const commandLine = [command, ...args]
		.map((arg) => {
			if (/[\s"]/u.test(arg)) {
				return `"${arg.replace(/"/g, '\\"')}"`;
			}
			return arg;
		})
		.join(" ");
	const startedAt = performance.now();
	const result = spawnSync(commandLine, {
		encoding: "utf8",
		shell: true,
		env: {
			...process.env,
			...extraEnv,
		},
	});
	const durationMs = performance.now() - startedAt;
	const stderr = `${result.stderr || ""}${result.error ? `\n${result.error.message}` : ""}`;
	return {
		label,
		command: commandLine,
		status: result.status === 0 ? "PASS" : "FAIL",
		exitCode: Number.isInteger(result.status) ? result.status : 1,
		durationMs,
		stdout: result.stdout || "",
		stderr,
	};
}

function toCodeBlock(text) {
	if (!text || !text.trim()) return "_(empty)_";
	return `\`\`\`text\n${text.trim()}\n\`\`\``;
}

function buildReport(runDate, checks) {
	const generatedAt = new Date().toISOString();
	const hasFailures = checks.some((check) => check.status === "FAIL");
	const summaryLines = checks.map(
		(check) =>
			`| ${check.label} | ${check.status} | ${check.exitCode} | ${check.durationMs.toFixed(0)} |`,
	);
	const detailSections = checks
		.map(
			(check) => `## ${check.label}

- Command: \`${check.command}\`
- Status: \`${check.status}\`
- Exit code: \`${check.exitCode}\`

### stdout
${toCodeBlock(check.stdout)}

### stderr
${toCodeBlock(check.stderr)}
`,
		)
		.join("\n");

	return `# M10 Staging Soak Smoke (${runDate})

Status: ${hasFailures ? "FAIL" : "PASS"}  
Generated: ${generatedAt}

## Summary

| Check | Status | Exit code | Duration (ms) |
|-------|--------|-----------|---------------|
${summaryLines.join("\n")}

## Details

${detailSections}
`;
}

async function main() {
	const runDate = new Date().toISOString().slice(0, 10);
	const checks = [];
	checks.push(
		runCommand("Determinism + Progression", "npm", [
			"test",
			"--",
			"tests/unit/SyncCoreDeterminism.test.js",
			"tests/unit/SyncProgressionScenarioHarness.test.js",
			"--runInBand",
		]),
	);
	checks.push(
		runCommand("Godot Contract Coverage", "npm", [
			"test",
			"--",
			"tests/unit/GodotCommandContract.test.js",
			"tests/unit/GodotAuthResilienceContract.test.js",
			"--runInBand",
		]),
	);
	checks.push(runCommand("Telemetry Ingest Smoke", "npm", ["run", "test:telemetry:smoke"]));

	const godotBin = String(process.env.GODOT_BIN || "").trim();
	if (godotBin) {
		checks.push(
			runCommand(
				"Godot Headless Smoke",
				"npm",
				["run", "test:godot:headless"],
				{ GODOT_BIN: godotBin },
			),
		);
	} else {
		checks.push({
			label: "Godot Headless Smoke",
			command: "npm run test:godot:headless",
			status: "FAIL",
			exitCode: 1,
			durationMs: 0,
			stdout: "",
			stderr: "GODOT_BIN is not set; headless smoke could not run.",
		});
	}

	const reportName = `m10_staging_soak_smoke_${runDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, buildReport(runDate, checks), "utf8");

	const failedChecks = checks.filter((check) => check.status === "FAIL");
	console.log(
		`[staging-soak-smoke] ${
			failedChecks.length === 0 ? "PASS" : "FAIL"
		} checks=${checks.length} failed=${failedChecks.length} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);

	if (failedChecks.length > 0) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
