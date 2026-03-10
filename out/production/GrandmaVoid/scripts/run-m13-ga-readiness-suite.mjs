import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

function quoteArg(value) {
	return `"${String(value || "").replace(/"/gu, '\\"')}"`;
}

function runStep(label, commandLine, extraEnv = {}) {
	const startedAt = Date.now();
	const result = spawnSync(commandLine, {
		shell: true,
		encoding: "utf8",
		env: {
			...process.env,
			...extraEnv,
		},
	});
	const durationMs = Date.now() - startedAt;
	return {
		label,
		command: commandLine,
		status: result.status === 0 ? "PASS" : "FAIL",
		exitCode: Number.isInteger(result.status) ? result.status : 1,
		durationMs,
		stdout: result.stdout || "",
		stderr: result.stderr || "",
	};
}

function codeBlock(text) {
	const trimmed = String(text || "").trim();
	if (!trimmed) return "_(empty)_";
	return `\`\`\`text\n${trimmed}\n\`\`\``;
}

function buildReport(reportDate, steps) {
	const hasFailures = steps.some((step) => step.status === "FAIL");
	const summaryRows = steps
		.map(
			(step) =>
				`| ${step.label} | ${step.status} | ${step.exitCode} | ${step.durationMs} |`,
		)
		.join("\n");
	const detailBlocks = steps
		.map(
			(step) => `## ${step.label}

- Command: \`${step.command}\`
- Status: \`${step.status}\`
- Exit code: \`${step.exitCode}\`

### stdout
${codeBlock(step.stdout)}

### stderr
${codeBlock(step.stderr)}
`,
		)
		.join("\n");

	return `# M13 GA Readiness Suite (${reportDate})

Status: ${hasFailures ? "FAIL" : "PASS"}  
Generated: ${new Date().toISOString()}

## Summary

| Step | Status | Exit code | Duration (ms) |
|------|--------|-----------|---------------|
${summaryRows}

## Details

${detailBlocks}
`;
}

async function main() {
	const reportDate = new Date().toISOString().slice(0, 10);
	const releaseId = process.env.GA_RELEASE_ID || "ga-prep-2026-02-25";
	const techLead = process.env.GA_SIGNOFF_TECH_LEAD || "";
	const sre = process.env.GA_SIGNOFF_SRE || "";
	const pm = process.env.GA_SIGNOFF_PM || "";
	const releaseManager = process.env.GA_SIGNOFF_RELEASE_MANAGER || "";

	const steps = [];
	steps.push(
		runStep("M13 Full Enablement Audit", "npm run report:ga:enablement", {
			RUNTIME_ROLLOUT_STAGE: "m13_ga",
			INTERNAL_CANARY_MODE: "off",
			LIMITED_ROLLOUT_MODE: "off",
		}),
	);
	steps.push(
		runStep(
			"M13 GA Handoff Package",
			`npm run report:ga:handoff -- --release-id ${quoteArg(releaseId)}`,
		),
	);
	steps.push(runStep("M13 Closeout Dossier", "npm run report:ga:closeout -- --input docs/reports/m13_closeout_inputs_sample.json"));
	steps.push(runStep("M13 Post-Launch Playbook", "npm run report:ga:playbook -- --input docs/reports/m13_closeout_inputs_sample.json"));
	steps.push(
		runStep(
			"M13 Sign-off Register",
			`npm run report:ga:signoff -- --release-id ${quoteArg(releaseId)} --tech-lead ${quoteArg(
				techLead,
			)} --sre ${quoteArg(sre)} --pm ${quoteArg(pm)} --release-manager ${quoteArg(
				releaseManager,
			)}`,
		),
	);
	steps.push(
		runStep(
			"M13 GA Review Notes",
			`npm run report:ga:review -- --release-id ${quoteArg(releaseId)}`,
		),
	);
	steps.push(runStep("M13 Rollout Logs Summary", "npm run report:ga:rollout-logs"));

	const reportPath = path.resolve(
		process.cwd(),
		"docs",
		"reports",
		`m13_ga_readiness_suite_${reportDate}.md`,
	);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, buildReport(reportDate, steps), "utf8");

	const failed = steps.filter((step) => step.status === "FAIL");
	console.log(
		`[m13-ga-readiness] ${failed.length === 0 ? "PASS" : "FAIL"} steps=${steps.length} failed=${failed.length} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);
	if (failed.length > 0) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
