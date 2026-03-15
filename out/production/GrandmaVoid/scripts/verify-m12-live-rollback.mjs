import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
	const options = {
		input: "",
		percent: "",
		notes: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		const next = String(argv[i + 1] || "").trim();
		switch (arg) {
			case "--input":
				options.input = next;
				i += 1;
				break;
			case "--percent":
				options.percent = next;
				i += 1;
				break;
			case "--notes":
				options.notes = next;
				i += 1;
				break;
			default:
				break;
		}
	}
	return options;
}

function normalizeIsoDate(value, label) {
	const raw = String(value || "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
		throw new Error(`Expected ${label} as YYYY-MM-DD.`);
	}
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (Number.isNaN(parsed.valueOf())) {
		throw new Error(`Invalid ${label}: ${raw}`);
	}
	return raw;
}

function resolveInputPath(inputArg) {
	const raw = String(inputArg || "").trim();
	if (!raw) {
		const today = new Date().toISOString().slice(0, 10);
		return path.resolve(process.cwd(), "docs", "reports", `m12_rollout_inputs_${today}.json`);
	}
	return path.resolve(process.cwd(), raw);
}

function normalizePercent(value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
		throw new Error("Expected --percent as number in [0..100].");
	}
	return Math.floor(parsed);
}

function runRollbackParity() {
	const commandLine = "npm run test:rollback:parity";
	const result = spawnSync(commandLine, {
		shell: true,
		encoding: "utf8",
		env: process.env,
	});
	const stdout = result.stdout || "";
	const stderr = result.stderr || "";
	const combined = `${stdout}\n${stderr}`;
	const reportMatch = combined.match(/report=([^\s]+)/u);
	return {
		commandLine,
		exitCode: Number.isInteger(result.status) ? result.status : 1,
		stdout,
		stderr,
		reportPath: reportMatch ? String(reportMatch[1] || "").trim() : "",
	};
}

function formatBlock(text) {
	const trimmed = String(text || "").trim();
	if (!trimmed) return "_(empty)_";
	return `\`\`\`text\n${trimmed}\n\`\`\``;
}

async function updateInputRolloutStep(inputPath, percent, verification) {
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new Error("Rollout input JSON root must be an object.");
	}
	const steps = Array.isArray(payload.steps) ? payload.steps : [];
	const index = steps.findIndex((step) => Number(step?.percent) === percent);
	if (index < 0) {
		throw new Error(`Could not find rollout step ${percent}% in ${path.relative(process.cwd(), inputPath)}.`);
	}

	steps[index] = {
		...steps[index],
		rollbackVerified: verification.passed,
		rollbackVerification: {
			verifiedAt: verification.verifiedAt,
			command: verification.commandLine,
			exitCode: verification.exitCode,
			parityReportPath: verification.parityReportPath,
			notes: verification.notes,
		},
	};
	payload.steps = steps;
	await fs.writeFile(inputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildReport({ inputPath, percent, verification }) {
	const runDate = verification.verifiedAt.slice(0, 10);
	return {
		reportDate: runDate,
		markdown: `# M12 Live Rollback Verification (${runDate}, ${percent}%)

Status: ${verification.passed ? "PASS" : "FAIL"}  
Generated: ${verification.verifiedAt}

## Target

- Rollout step: \`${percent}%\`
- Input JSON: \`${path.relative(process.cwd(), inputPath)}\`

## Command

- Executed: \`${verification.commandLine}\`
- Exit code: \`${verification.exitCode}\`
- Parity report: \`${verification.parityReportPath || "not-detected"}\`
- Notes: \`${verification.notes || "none"}\`

## Output

### stdout
${formatBlock(verification.stdout)}

### stderr
${formatBlock(verification.stderr)}
`,
	};
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const percent = normalizePercent(options.percent);
	const parity = runRollbackParity();
	const verification = {
		passed: parity.exitCode === 0,
		verifiedAt: new Date().toISOString(),
		commandLine: parity.commandLine,
		exitCode: parity.exitCode,
		parityReportPath: parity.reportPath,
		notes: String(options.notes || "").trim(),
		stdout: parity.stdout,
		stderr: parity.stderr,
	};

	await updateInputRolloutStep(inputPath, percent, verification);

	const report = buildReport({ inputPath, percent, verification });
	const reportPath = path.resolve(
		process.cwd(),
		"docs",
		"reports",
		`m12_live_rollback_verification_${report.reportDate}_${percent}.md`,
	);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, report.markdown, "utf8");

	console.log(
		`[m12-live-rollback] ${verification.passed ? "PASS" : "FAIL"} step=${percent}% report=${path.relative(
			process.cwd(),
			reportPath,
		)} input=${path.relative(process.cwd(), inputPath)}`,
	);
	if (!verification.passed) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
