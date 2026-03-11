import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const THRESHOLDS = Object.freeze({
	minConsecutiveDays: 5,
	maxCommandP95Ms: 350,
	maxSyncErrorRatePct: 1.0,
	maxStateHashDivergencePct: 0.1,
	minTelemetrySuccessRatePct: 99.0,
	minOnCallDrillsPassed: 2,
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
		throw new Error(`Expected ${label} to be YYYY-MM-DD, received "${raw || "empty"}".`);
	}
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (Number.isNaN(parsed.valueOf())) {
		throw new Error(`Could not parse ${label}: "${raw}".`);
	}
	return raw;
}

function toUtcMs(isoDate) {
	return new Date(`${isoDate}T00:00:00Z`).valueOf();
}

function dayDifference(startDate, endDate) {
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;
	return Math.round((toUtcMs(endDate) - toUtcMs(startDate)) / ONE_DAY_MS);
}

function numberOrThrow(value, label) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Expected ${label} to be a finite number.`);
	}
	return parsed;
}

function statusPass(condition) {
	return condition ? "PASS" : "FAIL";
}

function formatPct(value) {
	return `${Number(value).toFixed(2)}%`;
}

function formatMs(value) {
	return `${Number(value).toFixed(2)}ms`;
}

function escapeMd(value) {
	return String(value || "")
		.replace(/\|/gu, "\\|")
		.replace(/\r?\n/gu, " ")
		.trim();
}

function normalizeStatus(value) {
	return String(value || "")
		.trim()
		.toLowerCase();
}

function isOpenSev1OrSev2Incident(incident) {
	const severity = String(incident.severity || "")
		.trim()
		.toUpperCase();
	const status = normalizeStatus(incident.status);
	const isSev1OrSev2 = severity === "SEV1" || severity === "SEV2";
	const isResolved = status === "resolved" || status === "closed";
	return isSev1OrSev2 && !isResolved;
}

function resolveInputPath(inputArg) {
	if (inputArg) {
		return path.resolve(process.cwd(), inputArg);
	}
	const today = new Date().toISOString().slice(0, 10);
	return path.resolve(process.cwd(), "docs", "reports", `m11_canary_inputs_${today}.json`);
}

function evaluatePayload(payload) {
	const reasons = [];

	const metricsRaw = Array.isArray(payload?.dailyMetrics) ? payload.dailyMetrics : [];
	if (metricsRaw.length === 0) {
		throw new Error("Expected non-empty dailyMetrics array.");
	}

	const metrics = metricsRaw
		.map((entry, index) => ({
			date: normalizeIsoDate(entry?.date, `dailyMetrics[${index}].date`),
			commandP95Ms: numberOrThrow(
				entry?.commandP95Ms,
				`dailyMetrics[${index}].commandP95Ms`,
			),
			syncErrorRatePct: numberOrThrow(
				entry?.syncErrorRatePct,
				`dailyMetrics[${index}].syncErrorRatePct`,
			),
			stateHashDivergencePct: numberOrThrow(
				entry?.stateHashDivergencePct,
				`dailyMetrics[${index}].stateHashDivergencePct`,
			),
			telemetrySuccessRatePct: numberOrThrow(
				entry?.telemetrySuccessRatePct,
				`dailyMetrics[${index}].telemetrySuccessRatePct`,
			),
		}))
		.sort((a, b) => toUtcMs(a.date) - toUtcMs(b.date));

	if (metrics.length < THRESHOLDS.minConsecutiveDays) {
		reasons.push(
			`Need at least ${THRESHOLDS.minConsecutiveDays} consecutive days of canary metrics; found ${metrics.length}.`,
		);
	}

	for (let i = 1; i < metrics.length; i += 1) {
		const previous = metrics[i - 1];
		const current = metrics[i];
		const diff = dayDifference(previous.date, current.date);
		if (diff !== 1) {
			reasons.push(
				`Daily metrics are not consecutive between ${previous.date} and ${current.date}.`,
			);
			break;
		}
	}

	for (const day of metrics) {
		if (day.commandP95Ms > THRESHOLDS.maxCommandP95Ms) {
			reasons.push(
				`${day.date} command p95 ${formatMs(day.commandP95Ms)} exceeds ${THRESHOLDS.maxCommandP95Ms}ms.`,
			);
		}
		if (day.syncErrorRatePct > THRESHOLDS.maxSyncErrorRatePct) {
			reasons.push(
				`${day.date} sync error rate ${formatPct(day.syncErrorRatePct)} exceeds ${formatPct(
					THRESHOLDS.maxSyncErrorRatePct,
				)}.`,
			);
		}
		if (day.stateHashDivergencePct > THRESHOLDS.maxStateHashDivergencePct) {
			reasons.push(
				`${day.date} state hash divergence ${formatPct(
					day.stateHashDivergencePct,
				)} exceeds ${formatPct(THRESHOLDS.maxStateHashDivergencePct)}.`,
			);
		}
		if (day.telemetrySuccessRatePct < THRESHOLDS.minTelemetrySuccessRatePct) {
			reasons.push(
				`${day.date} telemetry success ${formatPct(
					day.telemetrySuccessRatePct,
				)} is below ${formatPct(THRESHOLDS.minTelemetrySuccessRatePct)}.`,
			);
		}
	}

	const incidents = Array.isArray(payload?.incidents) ? payload.incidents : [];
	const openHighSeverity = incidents.filter(isOpenSev1OrSev2Incident);
	if (openHighSeverity.length > 0) {
		reasons.push(
			`Found ${openHighSeverity.length} unresolved Sev-1/Sev-2 incident(s).`,
		);
	}

	const drills = Array.isArray(payload?.onCallDrills) ? payload.onCallDrills : [];
	const passedDrills = drills.filter(
		(drill) => normalizeStatus(drill?.result) === "pass",
	).length;
	if (passedDrills < THRESHOLDS.minOnCallDrillsPassed) {
		reasons.push(
			`Need at least ${THRESHOLDS.minOnCallDrillsPassed} successful on-call drills; found ${passedDrills}.`,
		);
	}

	const windowStart = payload?.window?.startDate
		? normalizeIsoDate(payload.window.startDate, "window.startDate")
		: metrics[0].date;
	const windowEnd = payload?.window?.endDate
		? normalizeIsoDate(payload.window.endDate, "window.endDate")
		: metrics[metrics.length - 1].date;

	if (toUtcMs(windowStart) > toUtcMs(windowEnd)) {
		throw new Error(`window.startDate (${windowStart}) must be <= window.endDate (${windowEnd}).`);
	}

	return {
		status: reasons.length === 0 ? "PASS" : "FAIL",
		decision: reasons.length === 0 ? "ADVANCE" : "HOLD",
		reasons,
		windowStart,
		windowEnd,
		metrics,
		incidents,
		drills,
		passedDrills,
		openHighSeverity,
		summary: {
			maxCommandP95Ms: Math.max(...metrics.map((entry) => entry.commandP95Ms)),
			maxSyncErrorRatePct: Math.max(...metrics.map((entry) => entry.syncErrorRatePct)),
			maxStateHashDivergencePct: Math.max(
				...metrics.map((entry) => entry.stateHashDivergencePct),
			),
			minTelemetrySuccessRatePct: Math.min(
				...metrics.map((entry) => entry.telemetrySuccessRatePct),
			),
			days: metrics.length,
		},
	};
}

function buildIncidentLogMarkdown(inputPath, evaluation) {
	const incidentRows = evaluation.incidents
		.map((incident) => {
			const id = escapeMd(incident.id || "n/a");
			const severity = escapeMd(String(incident.severity || "n/a").toUpperCase());
			const status = escapeMd(incident.status || "n/a");
			const openedAt = escapeMd(incident.openedAt || "n/a");
			const resolvedAt = escapeMd(incident.resolvedAt || "n/a");
			const mttrMinutes =
				incident.mttrMinutes === null || incident.mttrMinutes === undefined
					? "n/a"
					: escapeMd(incident.mttrMinutes);
			const owner = escapeMd(incident.owner || "n/a");
			const summary = escapeMd(incident.summary || "");
			return `| ${id} | ${severity} | ${status} | ${openedAt} | ${resolvedAt} | ${mttrMinutes} | ${owner} | ${summary} |`;
		})
		.join("\n");

	return `# M11 Canary Incident Log (${evaluation.windowEnd})

Status: ${evaluation.openHighSeverity.length === 0 ? "PASS" : "FAIL"}  
Generated: ${new Date().toISOString()}

## Input

- Source JSON: \`${path.relative(process.cwd(), inputPath)}\`
- Window: \`${evaluation.windowStart}\` to \`${evaluation.windowEnd}\`

## Incident Summary

- Total incidents: \`${evaluation.incidents.length}\`
- Unresolved Sev-1/Sev-2 incidents: \`${evaluation.openHighSeverity.length}\`

## Incident Details

| ID | Severity | Status | Opened | Resolved | MTTR (min) | Owner | Summary |
|----|----------|--------|--------|----------|------------|-------|---------|
${incidentRows || "| _(none)_ | n/a | n/a | n/a | n/a | n/a | n/a | No incidents recorded. |"}
`;
}

function buildDecisionMemoMarkdown(inputPath, evaluation, incidentLogName) {
	const metricsRows = evaluation.metrics
		.map(
			(day) =>
				`| ${day.date} | ${formatMs(day.commandP95Ms)} | ${formatPct(day.syncErrorRatePct)} | ${formatPct(
					day.stateHashDivergencePct,
				)} | ${formatPct(day.telemetrySuccessRatePct)} |`,
		)
		.join("\n");

	const drillsRows = evaluation.drills
		.map((drill) => {
			const name = escapeMd(drill.name || "Unnamed drill");
			const date = escapeMd(drill.date || "n/a");
			const result = escapeMd(drill.result || "n/a");
			const mttr =
				drill.mttrMinutes === null || drill.mttrMinutes === undefined
					? "n/a"
					: escapeMd(drill.mttrMinutes);
			const notes = escapeMd(drill.notes || "");
			return `| ${name} | ${date} | ${result} | ${mttr} | ${notes} |`;
		})
		.join("\n");

	return `# M11 Internal Canary Report (${evaluation.windowEnd})

Status: ${evaluation.status}  
Decision: ${evaluation.decision}  
Generated: ${new Date().toISOString()}

## Inputs

- Source JSON: \`${path.relative(process.cwd(), inputPath)}\`
- Incident log: \`docs/reports/${incidentLogName}\`
- Review window: \`${evaluation.windowStart}\` to \`${evaluation.windowEnd}\`

## Guardrail Summary

| Guardrail | Threshold | Observed | Status |
|-----------|-----------|----------|--------|
| Consecutive daily window | >= ${THRESHOLDS.minConsecutiveDays} days | ${evaluation.summary.days} days | ${statusPass(evaluation.summary.days >= THRESHOLDS.minConsecutiveDays)} |
| Command latency p95 | <= ${THRESHOLDS.maxCommandP95Ms}ms | ${formatMs(evaluation.summary.maxCommandP95Ms)} | ${statusPass(evaluation.summary.maxCommandP95Ms <= THRESHOLDS.maxCommandP95Ms)} |
| Sync error rate | <= ${formatPct(THRESHOLDS.maxSyncErrorRatePct)} | ${formatPct(evaluation.summary.maxSyncErrorRatePct)} | ${statusPass(evaluation.summary.maxSyncErrorRatePct <= THRESHOLDS.maxSyncErrorRatePct)} |
| State hash divergence | <= ${formatPct(THRESHOLDS.maxStateHashDivergencePct)} | ${formatPct(evaluation.summary.maxStateHashDivergencePct)} | ${statusPass(evaluation.summary.maxStateHashDivergencePct <= THRESHOLDS.maxStateHashDivergencePct)} |
| Telemetry ingest success | >= ${formatPct(THRESHOLDS.minTelemetrySuccessRatePct)} | ${formatPct(evaluation.summary.minTelemetrySuccessRatePct)} | ${statusPass(evaluation.summary.minTelemetrySuccessRatePct >= THRESHOLDS.minTelemetrySuccessRatePct)} |
| Unresolved Sev-1/Sev-2 incidents | = 0 | ${evaluation.openHighSeverity.length} | ${statusPass(evaluation.openHighSeverity.length === 0)} |
| Successful on-call drills | >= ${THRESHOLDS.minOnCallDrillsPassed} | ${evaluation.passedDrills} | ${statusPass(evaluation.passedDrills >= THRESHOLDS.minOnCallDrillsPassed)} |

## Daily Metrics

| Date | Command p95 | Sync error rate | State hash divergence | Telemetry success |
|------|-------------|-----------------|-----------------------|-------------------|
${metricsRows}

## On-call Drill Summary

| Drill | Date | Result | MTTR (min) | Notes |
|-------|------|--------|------------|-------|
${drillsRows || "| _(none)_ | n/a | n/a | n/a | No drills recorded. |"}

## Decision Notes

${
	evaluation.reasons.length === 0
		? "- Guardrails satisfied for the current review window. Continue canary monitoring cadence."
		: evaluation.reasons.map((reason) => `- ${reason}`).join("\n")
}

## Sign-off

- Tech Lead: \`<name/date>\`
- SRE: \`<name/date>\`
- Release Manager: \`<name/date>\`
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const inputRaw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(inputRaw);
	const evaluation = evaluatePayload(payload);

	const reportsDir = path.resolve(process.cwd(), "docs", "reports");
	await fs.mkdir(reportsDir, { recursive: true });

	const reportDate = evaluation.windowEnd;
	const incidentLogName = `m11_canary_incident_log_${reportDate}.md`;
	const incidentLogPath = path.resolve(reportsDir, incidentLogName);
	const decisionMemoName = `m11_canary_decision_memo_${reportDate}.md`;
	const decisionMemoPath = path.resolve(reportsDir, decisionMemoName);

	await fs.writeFile(
		incidentLogPath,
		buildIncidentLogMarkdown(inputPath, evaluation),
		"utf8",
	);
	await fs.writeFile(
		decisionMemoPath,
		buildDecisionMemoMarkdown(inputPath, evaluation, incidentLogName),
		"utf8",
	);

	console.log(
		`[m11-canary-report] ${evaluation.status} decision=${evaluation.decision} incidentLog=${path.relative(
			process.cwd(),
			incidentLogPath,
		)} memo=${path.relative(process.cwd(), decisionMemoPath)}`,
	);

	if (evaluation.status !== "PASS") {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
