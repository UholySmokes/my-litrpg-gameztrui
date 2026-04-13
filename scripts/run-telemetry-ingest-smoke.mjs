import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../functions/lib/api-router.js");

if (!process.env.DEV_AUTH_ENABLED) {
	process.env.DEV_AUTH_ENABLED = "true";
}

function createRes() {
	const res = {
		statusCode: 0,
		headers: {},
		body: null,
	};
	res.status = (code) => {
		res.statusCode = code;
		return res;
	};
	res.set = (key, value) => {
		res.headers[key] = value;
		return res;
	};
	res.json = (value) => {
		res.body = value;
		return res;
	};
	return res;
}

function buildTelemetryBatch(nowIso) {
	return {
		source: "godot",
		sessionId: `telemetry-smoke-${nowIso.slice(0, 19).replace(/[:T]/g, "")}`,
		build: process.env.TELEMETRY_SMOKE_BUILD_ID || "telemetry-smoke",
		clientTime: nowIso,
		tags: {
			client: "godot",
			platform: process.platform,
			smoke: "true",
		},
		events: [
			{
				type: "telemetry_smoke_start",
				level: "info",
				ts: nowIso,
				message: "smoke_start",
				data: {
					node: process.version,
				},
			},
			{
				type: "telemetry_smoke_end",
				level: "info",
				ts: nowIso,
				message: "smoke_end",
				data: {
					seed: "telemetry_smoke_v1",
				},
			},
		],
	};
}

function buildReport({
	reportDate,
	durationMs,
	statusCode,
	accepted,
	dropped,
	ok,
	errorCode,
	message,
}) {
	return `# Telemetry Ingest Health Smoke (${reportDate})

Status: ${ok ? "PASS" : "FAIL"}  
Generated: ${new Date().toISOString()}

## Summary

- HTTP status: \`${statusCode}\`
- Batch accepted: \`${accepted}\`
- Batch dropped: \`${dropped}\`
- Latency (ms): \`${durationMs.toFixed(2)}\`
- Error code: \`${errorCode || "none"}\`
- Message: \`${message || "none"}\`

## Command

\`\`\`bash
npm run test:telemetry:smoke
\`\`\`
`;
}

async function main() {
	const nowIso = new Date().toISOString();
	const req = {
		method: "POST",
		url: "/api/telemetry",
		headers: {
			"x-dev-user-id": process.env.DEV_USER_ID || "telemetry-smoke-user",
			"x-dev-user-email": "telemetry-smoke@example.test",
		},
		body: buildTelemetryBatch(nowIso),
	};
	const res = createRes();

	const startedAt = performance.now();
	await handleApiRequest(req, res);
	const durationMs = performance.now() - startedAt;

	const body = res.body && typeof res.body === "object" ? res.body : {};
	const accepted = Number(body.accepted || 0);
	const dropped = Number(body.dropped || 0);
	const ok = Boolean(body.ok) && res.statusCode === 202;
	const reportDate = nowIso.slice(0, 10);
	const reportName = `telemetry_ingest_health_smoke_${reportDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);

	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(
		reportPath,
		buildReport({
			reportDate,
			durationMs,
			statusCode: res.statusCode,
			accepted,
			dropped,
			ok,
			errorCode: body.errorCode || "",
			message: body.message || "",
		}),
		"utf8",
	);

	console.log(
		`[telemetry-smoke] ${ok ? "PASS" : "FAIL"} status=${res.statusCode} accepted=${accepted} dropped=${dropped} latencyMs=${durationMs.toFixed(
			2,
		)} report=${path.relative(process.cwd(), reportPath)}`,
	);

	if (!ok) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
