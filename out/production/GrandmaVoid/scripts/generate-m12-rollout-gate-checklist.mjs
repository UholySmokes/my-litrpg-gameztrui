import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const REQUIRED_STEPS = [10, 25, 50];
const GUARDRAILS = Object.freeze({
	maxCommandP95Ms: 350,
	maxSyncErrorRatePct: 1.0,
	maxStateHashDivergencePct: 0.1,
	minTelemetrySuccessRatePct: 99.0,
});

function parseArgs(argv) {
	const options = {
		input: "",
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = String(argv[i] || "").trim();
		if (arg === "--input") {
			options.input = String(argv[i + 1] || "").trim();
			i += 1;
		}
	}
	return options;
}

function normalizeIsoDate(value, label) {
	const raw = String(value || "").trim();
	if (!/^\d{4}-\d{2}-\d{2}$/u.test(raw)) {
		throw new Error(`Expected ${label} as YYYY-MM-DD, received "${raw || "empty"}".`);
	}
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (Number.isNaN(parsed.valueOf())) {
		throw new Error(`Invalid ${label}: ${raw}`);
	}
	return raw;
}

function toUtcMs(isoDate) {
	return new Date(`${isoDate}T00:00:00Z`).valueOf();
}

function numberOrThrow(value, label) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Expected ${label} to be a finite number.`);
	}
	return parsed;
}

function resolveInputPath(inputArg) {
	if (inputArg) return path.resolve(process.cwd(), inputArg);
	const today = new Date().toISOString().slice(0, 10);
	return path.resolve(process.cwd(), "docs", "reports", `m12_rollout_inputs_${today}.json`);
}

function normalizeSteps(payload) {
	const rawSteps = Array.isArray(payload?.steps) ? payload.steps : [];
	if (rawSteps.length === 0) {
		throw new Error("Expected non-empty steps array.");
	}
	return rawSteps
		.map((step, index) => {
			const percent = numberOrThrow(step?.percent, `steps[${index}].percent`);
			return {
				percent,
				windowStart: normalizeIsoDate(
					step?.window?.startDate || step?.startDate,
					`steps[${index}].window.startDate`,
				),
				windowEnd: normalizeIsoDate(
					step?.window?.endDate || step?.endDate,
					`steps[${index}].window.endDate`,
				),
				commandP95Ms: numberOrThrow(
					step?.commandP95Ms,
					`steps[${index}].commandP95Ms`,
				),
				syncErrorRatePct: numberOrThrow(
					step?.syncErrorRatePct,
					`steps[${index}].syncErrorRatePct`,
				),
				stateHashDivergencePct: numberOrThrow(
					step?.stateHashDivergencePct,
					`steps[${index}].stateHashDivergencePct`,
				),
				telemetrySuccessRatePct: numberOrThrow(
					step?.telemetrySuccessRatePct,
					`steps[${index}].telemetrySuccessRatePct`,
				),
				unresolvedSev1Sev2: numberOrThrow(
					step?.unresolvedSev1Sev2,
					`steps[${index}].unresolvedSev1Sev2`,
				),
				rollbackVerified: Boolean(step?.rollbackVerified),
				notes: String(step?.notes || "").trim(),
			};
		})
		.sort((a, b) => a.percent - b.percent);
}

function evaluateStep(step) {
	const reasons = [];
	if (step.commandP95Ms > GUARDRAILS.maxCommandP95Ms) {
		reasons.push(`command p95 ${step.commandP95Ms.toFixed(2)}ms > ${GUARDRAILS.maxCommandP95Ms}ms`);
	}
	if (step.syncErrorRatePct > GUARDRAILS.maxSyncErrorRatePct) {
		reasons.push(
			`sync error ${step.syncErrorRatePct.toFixed(2)}% > ${GUARDRAILS.maxSyncErrorRatePct.toFixed(
				2,
			)}%`,
		);
	}
	if (step.stateHashDivergencePct > GUARDRAILS.maxStateHashDivergencePct) {
		reasons.push(
			`hash divergence ${step.stateHashDivergencePct.toFixed(2)}% > ${GUARDRAILS.maxStateHashDivergencePct.toFixed(
				2,
			)}%`,
		);
	}
	if (step.telemetrySuccessRatePct < GUARDRAILS.minTelemetrySuccessRatePct) {
		reasons.push(
			`telemetry success ${step.telemetrySuccessRatePct.toFixed(2)}% < ${GUARDRAILS.minTelemetrySuccessRatePct.toFixed(
				2,
			)}%`,
		);
	}
	if (step.unresolvedSev1Sev2 > 0) {
		reasons.push(`unresolved Sev-1/Sev-2 incidents ${step.unresolvedSev1Sev2}`);
	}
	if (!step.rollbackVerified) {
		reasons.push("rollback not verified");
	}
	return {
		pass: reasons.length === 0,
		reasons,
	};
}

function evaluate(payload) {
	const steps = normalizeSteps(payload);
	const rolloutIssues = [];
	const seen = new Set(steps.map((step) => step.percent));
	for (const requiredPercent of REQUIRED_STEPS) {
		if (!seen.has(requiredPercent)) {
			rolloutIssues.push(`Missing required rollout step ${requiredPercent}%.`);
		}
	}

	for (let i = 1; i < steps.length; i += 1) {
		const previous = steps[i - 1];
		const current = steps[i];
		if (current.percent <= previous.percent) {
			rolloutIssues.push("Rollout percentages must be strictly increasing.");
			break;
		}
		if (toUtcMs(current.windowStart) < toUtcMs(previous.windowEnd)) {
			rolloutIssues.push(
				`Rollout windows overlap between ${previous.percent}% and ${current.percent}% steps.`,
			);
			break;
		}
	}

	const evaluatedSteps = steps.map((step) => ({
		...step,
		assessment: evaluateStep(step),
	}));
	const failedSteps = evaluatedSteps.filter((step) => !step.assessment.pass);
	const status = rolloutIssues.length === 0 && failedSteps.length === 0 ? "PASS" : "FAIL";
	const decision = status === "PASS" ? "ADVANCE" : "HOLD";
	return {
		status,
		decision,
		steps: evaluatedSteps,
		rolloutIssues,
		failedSteps,
	};
}

function buildReport(inputPath, evaluation) {
	const reportDate = evaluation.steps[evaluation.steps.length - 1]?.windowEnd || new Date().toISOString().slice(0, 10);
	const stepRows = evaluation.steps
		.map((step) => {
			const failReasons = step.assessment.reasons.join("; ");
			return `| ${step.percent}% | ${step.windowStart} -> ${step.windowEnd} | ${step.commandP95Ms.toFixed(2)}ms | ${step.syncErrorRatePct.toFixed(2)}% | ${step.stateHashDivergencePct.toFixed(2)}% | ${step.telemetrySuccessRatePct.toFixed(2)}% | ${step.unresolvedSev1Sev2} | ${step.rollbackVerified ? "yes" : "no"} | ${step.assessment.pass ? "PASS" : "FAIL"} | ${failReasons || "none"} |`;
		})
		.join("\n");
	const issues = [...evaluation.rolloutIssues, ...evaluation.failedSteps.flatMap((step) => step.assessment.reasons)];

	return {
		reportDate,
		markdown: `# M12 Rollout Gate Checklist (${reportDate})

Status: ${evaluation.status}  
Decision: ${evaluation.decision}  
Generated: ${new Date().toISOString()}

## Input

- Source JSON: \`${path.relative(process.cwd(), inputPath)}\`
- Required steps: \`${REQUIRED_STEPS.join("% -> ")}%\`

## Step Validation

| Step | Window | Command p95 | Sync error | Hash divergence | Telemetry success | Unresolved Sev1/2 | Rollback verified | Status | Notes |
|------|--------|-------------|------------|-----------------|-------------------|-------------------|-------------------|--------|-------|
${stepRows}

## Guardrails

- Command p95 <= \`${GUARDRAILS.maxCommandP95Ms}ms\`
- Sync error <= \`${GUARDRAILS.maxSyncErrorRatePct.toFixed(2)}%\`
- State hash divergence <= \`${GUARDRAILS.maxStateHashDivergencePct.toFixed(2)}%\`
- Telemetry success >= \`${GUARDRAILS.minTelemetrySuccessRatePct.toFixed(2)}%\`
- Unresolved Sev-1/Sev-2 incidents = \`0\`
- Rollback verification required at every step

## Decision Notes

${
	issues.length === 0
		? "- All required rollout steps passed guardrails and rollback checks."
		: issues.map((issue) => `- ${issue}`).join("\n")
}

## Sign-off

- SRE: \`<name/date>\`
- PM: \`<name/date>\`
- Release Manager: \`<name/date>\`
`,
	};
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);
	const evaluation = evaluate(payload);
	const report = buildReport(inputPath, evaluation);
	const reportPath = path.resolve(
		process.cwd(),
		"docs",
		"reports",
		`m12_rollout_gate_checklist_${report.reportDate}.md`,
	);

	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(reportPath, report.markdown, "utf8");

	console.log(
		`[m12-rollout-checklist] ${evaluation.status} decision=${evaluation.decision} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);
	if (evaluation.status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
