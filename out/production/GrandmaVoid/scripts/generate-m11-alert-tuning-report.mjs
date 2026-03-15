import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ALERT_THRESHOLDS = Object.freeze({
	critical: {
		commandP95Ms: 350,
		syncErrorRatePct: 1.0,
		stateHashDivergencePct: 0.1,
		telemetrySuccessRatePct: 99.0,
	},
	warning: {
		commandP95Ms: 300,
		syncErrorRatePct: 0.75,
		stateHashDivergencePct: 0.05,
		telemetrySuccessRatePct: 99.3,
	},
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

function numberOrThrow(value, label) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Expected ${label} to be finite number.`);
	}
	return parsed;
}

function toUtcMs(isoDate) {
	return new Date(`${isoDate}T00:00:00Z`).valueOf();
}

function resolveInputPath(inputArg) {
	if (inputArg) {
		return path.resolve(process.cwd(), inputArg);
	}
	const today = new Date().toISOString().slice(0, 10);
	return path.resolve(process.cwd(), "docs", "reports", `m11_canary_inputs_${today}.json`);
}

function toMetricRows(payload) {
	const dailyMetrics = Array.isArray(payload?.dailyMetrics) ? payload.dailyMetrics : [];
	if (dailyMetrics.length === 0) {
		throw new Error("dailyMetrics array is required.");
	}
	return dailyMetrics
		.map((entry, index) => ({
			date: normalizeIsoDate(entry?.date, `dailyMetrics[${index}].date`),
			commandP95Ms: numberOrThrow(entry?.commandP95Ms, `dailyMetrics[${index}].commandP95Ms`),
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
}

function incidentSummary(payload) {
	const incidents = Array.isArray(payload?.incidents) ? payload.incidents : [];
	const unresolvedHighSeverity = incidents.filter((incident) => {
		const severity = String(incident?.severity || "")
			.trim()
			.toUpperCase();
		const status = String(incident?.status || "")
			.trim()
			.toLowerCase();
		const resolved = status === "resolved" || status === "closed";
		return (severity === "SEV1" || severity === "SEV2") && !resolved;
	});
	return {
		incidents,
		unresolvedHighSeverity,
	};
}

function alertLines(metrics, level) {
	const thresholds = ALERT_THRESHOLDS[level];
	const lines = [];
	for (const day of metrics) {
		if (day.commandP95Ms > thresholds.commandP95Ms) {
			lines.push({
				level,
				date: day.date,
				metric: "command_p95_ms",
				threshold: thresholds.commandP95Ms,
				observed: day.commandP95Ms,
			});
		}
		if (day.syncErrorRatePct > thresholds.syncErrorRatePct) {
			lines.push({
				level,
				date: day.date,
				metric: "sync_error_rate_pct",
				threshold: thresholds.syncErrorRatePct,
				observed: day.syncErrorRatePct,
			});
		}
		if (day.stateHashDivergencePct > thresholds.stateHashDivergencePct) {
			lines.push({
				level,
				date: day.date,
				metric: "state_hash_divergence_pct",
				threshold: thresholds.stateHashDivergencePct,
				observed: day.stateHashDivergencePct,
			});
		}
		if (day.telemetrySuccessRatePct < thresholds.telemetrySuccessRatePct) {
			lines.push({
				level,
				date: day.date,
				metric: "telemetry_success_rate_pct",
				threshold: thresholds.telemetrySuccessRatePct,
				observed: day.telemetrySuccessRatePct,
			});
		}
	}
	return lines;
}

function metricBreachesByDate(metrics, level) {
	const thresholds = ALERT_THRESHOLDS[level];
	const byDate = [];
	for (const day of metrics) {
		const breaches = [];
		if (day.commandP95Ms > thresholds.commandP95Ms) breaches.push("command_p95_ms");
		if (day.syncErrorRatePct > thresholds.syncErrorRatePct) breaches.push("sync_error_rate_pct");
		if (day.stateHashDivergencePct > thresholds.stateHashDivergencePct)
			breaches.push("state_hash_divergence_pct");
		if (day.telemetrySuccessRatePct < thresholds.telemetrySuccessRatePct)
			breaches.push("telemetry_success_rate_pct");
		byDate.push({
			date: day.date,
			breaches,
		});
	}
	return byDate;
}

function hasConsecutiveBreachDays(metrics, level) {
	const breachedByDate = metricBreachesByDate(metrics, level);
	for (let i = 1; i < breachedByDate.length; i += 1) {
		const previous = breachedByDate[i - 1];
		const current = breachedByDate[i];
		if (previous.breaches.length === 0 || current.breaches.length === 0) continue;
		if (toUtcMs(current.date) - toUtcMs(previous.date) === 24 * 60 * 60 * 1000) {
			return true;
		}
	}
	return false;
}

function formatObserved(entry) {
	if (entry.metric.endsWith("_ms")) {
		return `${Number(entry.observed).toFixed(2)}ms`;
	}
	return `${Number(entry.observed).toFixed(2)}%`;
}

function formatThreshold(entry) {
	if (entry.metric.endsWith("_ms")) {
		return `${Number(entry.threshold).toFixed(0)}ms`;
	}
	return `${Number(entry.threshold).toFixed(2)}%`;
}

function buildReport({ inputPath, metrics, criticalAlerts, warningAlerts, incidentData }) {
	const startDate = metrics[0].date;
	const endDate = metrics[metrics.length - 1].date;
	const criticalConsecutive = hasConsecutiveBreachDays(metrics, "critical");
	const warningConsecutive = hasConsecutiveBreachDays(metrics, "warning");
	const status =
		criticalConsecutive || incidentData.unresolvedHighSeverity.length > 0 ? "FAIL" : "PASS";
	const recommendation = status === "PASS" ? "KEEP_ALERTS" : "TUNE_AND_HOLD";

	const alertRows = [...criticalAlerts, ...warningAlerts]
		.map(
			(alert) =>
				`| ${alert.level.toUpperCase()} | ${alert.date} | ${alert.metric} | ${formatObserved(
					alert,
				)} | ${formatThreshold(alert)} |`,
		)
		.join("\n");

	const metricsRows = metrics
		.map(
			(day) =>
				`| ${day.date} | ${day.commandP95Ms.toFixed(2)} | ${day.syncErrorRatePct.toFixed(2)} | ${day.stateHashDivergencePct.toFixed(2)} | ${day.telemetrySuccessRatePct.toFixed(2)} |`,
		)
		.join("\n");

	return `# M11 Canary Alert Tuning Report (${endDate})

Status: ${status}  
Recommendation: ${recommendation}  
Generated: ${new Date().toISOString()}

## Input

- Source JSON: \`${path.relative(process.cwd(), inputPath)}\`
- Window: \`${startDate}\` to \`${endDate}\`

## Alert Window Evaluation

- Critical alerts on two consecutive days: \`${criticalConsecutive ? "yes" : "no"}\`
- Warning alerts on two consecutive days: \`${warningConsecutive ? "yes" : "no"}\`
- Unresolved Sev-1/Sev-2 incidents: \`${incidentData.unresolvedHighSeverity.length}\`

## Triggered Alerts

| Level | Date | Metric | Observed | Threshold |
|-------|------|--------|----------|-----------|
${alertRows || "| _(none)_ | n/a | n/a | n/a | n/a |"}

## Daily Metrics

| Date | Command p95 (ms) | Sync error (%) | State hash divergence (%) | Telemetry success (%) |
|------|------------------|----------------|---------------------------|-----------------------|
${metricsRows}

## Tuning Guidance

- Keep critical thresholds strict for canary: command p95 \`350ms\`, sync error \`1.00%\`, divergence \`0.10%\`, telemetry success \`99.00%\`.
- Use warning thresholds to detect regression trend before canary-blocking incidents.
- If critical consecutive-day alerts are detected, hold rollout and investigate before advancing.
`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const inputPath = resolveInputPath(options.input);
	const raw = await fs.readFile(inputPath, "utf8");
	const payload = JSON.parse(raw);
	const metrics = toMetricRows(payload);
	const incidentData = incidentSummary(payload);
	const criticalAlerts = alertLines(metrics, "critical");
	const warningAlerts = alertLines(metrics, "warning");
	const reportDate = metrics[metrics.length - 1].date;
	const reportName = `m11_alert_tuning_${reportDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);

	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(
		reportPath,
		buildReport({
			inputPath,
			metrics,
			criticalAlerts,
			warningAlerts,
			incidentData,
		}),
		"utf8",
	);

	const shouldFail =
		hasConsecutiveBreachDays(metrics, "critical") ||
		incidentData.unresolvedHighSeverity.length > 0;
	console.log(
		`[m11-alert-tuning] ${shouldFail ? "FAIL" : "PASS"} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);
	if (shouldFail) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
