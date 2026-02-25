import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_TIMEOUT_MS = 20000;

function normalizeBaseUrl(input) {
	const raw = String(input || "").trim();
	if (!raw) return "";
	const normalized = raw.replace(/\/+$/u, "");
	try {
		const parsed = new URL(normalized);
		if (parsed.protocol !== "https:") {
			return "";
		}
		return `${parsed.protocol}//${parsed.host}`;
	} catch {
		return "";
	}
}

async function readProjectId() {
	try {
		const firebasercPath = path.resolve(process.cwd(), ".firebaserc");
		const raw = await fs.readFile(firebasercPath, "utf8");
		const parsed = JSON.parse(raw);
		const projectId = String(parsed?.projects?.default || "").trim();
		return projectId;
	} catch {
		return "";
	}
}

async function readCustomDomain() {
	try {
		const cnamePath = path.resolve(process.cwd(), "CNAME");
		const raw = await fs.readFile(cnamePath, "utf8");
		return String(raw || "").trim();
	} catch {
		return "";
	}
}

async function httpRequest(url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			...init,
			signal: controller.signal,
			redirect: "manual",
		});
		return {
			ok: true,
			status: res.status,
			statusText: res.statusText,
		};
	} catch (error) {
		return {
			ok: false,
			status: 0,
			statusText: "",
			error: error instanceof Error ? error.message : String(error),
		};
	} finally {
		clearTimeout(timer);
	}
}

function evaluateProbe(result) {
	const rootReachable = result.root.ok && result.root.status >= 200 && result.root.status < 400;
	const telemetryAuthGuard =
		result.telemetry.ok && [401, 400, 202].includes(Number(result.telemetry.status));
	const commandAuthGuard =
		result.command.ok && [401, 400, 409, 200].includes(Number(result.command.status));
	return {
		rootReachable,
		telemetryAuthGuard,
		commandAuthGuard,
		passed:
			rootReachable &&
			telemetryAuthGuard &&
			commandAuthGuard &&
			Boolean(result.authReadiness?.ready),
	};
}

async function readFirebaseApiKeyFromBundle(baseUrl) {
	const htmlRes = await httpRequest(`${baseUrl}/`);
	if (!htmlRes.ok || !htmlRes.status || htmlRes.status >= 400) {
		return "";
	}
	const htmlTextRes = await fetch(`${baseUrl}/`, {
		redirect: "manual",
	});
	const html = await htmlTextRes.text();
	const scriptMatch = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/iu);
	if (!scriptMatch || !scriptMatch[1]) return "";
	const assetPath = scriptMatch[1].startsWith("http")
		? scriptMatch[1]
		: `${baseUrl}${scriptMatch[1].startsWith("/") ? "" : "/"}${scriptMatch[1]}`;

	const jsRes = await fetch(assetPath, {
		redirect: "manual",
	});
	if (!jsRes.ok) return "";
	const js = await jsRes.text();
	const keyMatch = js.match(/VITE_FIREBASE_API_KEY:"([^"]+)"/u);
	return keyMatch && keyMatch[1] ? keyMatch[1] : "";
}

async function probeAuthReadiness(firebaseApiKey) {
	if (!firebaseApiKey) {
		return {
			ready: false,
			status: 0,
			code: "MISSING_FIREBASE_API_KEY",
			message: "Could not resolve Firebase API key from staging bundle.",
		};
	}
	try {
		const response = await fetch(
			`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(
				firebaseApiKey,
			)}`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					returnSecureToken: true,
				}),
			},
		);
		const bodyText = await response.text();
		let parsed = {};
		try {
			parsed = JSON.parse(bodyText);
		} catch {
			parsed = {};
		}

		if (response.ok && parsed && typeof parsed.idToken === "string") {
			return {
				ready: true,
				status: response.status,
				code: "ANON_TOKEN_MINTED",
				message: "Anonymous sign-up produced an ID token.",
			};
		}

		const message = String(parsed?.error?.message || "").trim();
		if (message === "CONFIGURATION_NOT_FOUND") {
			return {
				ready: false,
				status: response.status,
				code: message,
				message: "Firebase Auth configuration is missing for this API key/project.",
			};
		}

		if (message === "OPERATION_NOT_ALLOWED") {
			return {
				ready: true,
				status: response.status,
				code: message,
				message:
					"Firebase Auth is configured but anonymous sign-in is disabled (expected in some setups).",
			};
		}
		if (message === "ADMIN_ONLY_OPERATION") {
			return {
				ready: true,
				status: response.status,
				code: message,
				message:
					"Firebase Auth is configured; anonymous end-user sign-up is restricted by admin policy.",
			};
		}

		return {
			ready: false,
			status: response.status,
			code: message || "AUTH_READINESS_UNKNOWN",
			message:
				"Firebase Auth readiness probe returned unexpected response; treat as blocked until triaged.",
		};
	} catch (error) {
		return {
			ready: false,
			status: 0,
			code: "AUTH_READINESS_REQUEST_FAILED",
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

async function probeBase(baseUrl) {
	const firebaseApiKey = await readFirebaseApiKeyFromBundle(baseUrl);
	const authReadiness = await probeAuthReadiness(firebaseApiKey);
	const telemetryBody = JSON.stringify({
		source: "staging_probe",
		events: [
			{
				type: "probe",
				level: "info",
				ts: new Date().toISOString(),
			},
		],
	});
	const commandBody = JSON.stringify({
		id: "staging-probe-command",
		runId: "staging-probe-run",
		clientId: "staging-probe-client",
		clientSeq: 1,
		createdAt: new Date().toISOString(),
		contentVersion: "probe",
		command: {
			type: "TRIGGER",
			verb: "ENTER_TILE",
			triggerType: "ENTER_TILE",
			trigger: {
				triggerId: "tile_intro_square",
				mapId: "map_village_square",
				x: 6,
				y: 8,
			},
		},
	});

	const root = await httpRequest(`${baseUrl}/`);
	const telemetry = await httpRequest(`${baseUrl}/api/telemetry`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: telemetryBody,
	});
	const command = await httpRequest(`${baseUrl}/api/sync/command`, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: commandBody,
	});
	const assessment = evaluateProbe({ root, telemetry, command, authReadiness });
	return {
		baseUrl,
		firebaseApiKeyPresent: Boolean(firebaseApiKey),
		authReadiness,
		root,
		telemetry,
		command,
		assessment,
	};
}

function chooseRecommended({ webAppProbe, customProbe, customDomain }) {
	if (webAppProbe.assessment.passed) {
		return {
			baseUrl: webAppProbe.baseUrl,
			reason:
				"Use the Firebase-managed web.app host for staging automation to reduce DNS/custom-domain drift.",
		};
	}
	if (customProbe && customProbe.assessment.passed) {
		return {
			baseUrl: customProbe.baseUrl,
			reason: `Fallback to custom domain (${customDomain}) because web.app probe failed.`,
		};
	}
	return {
		baseUrl: "",
		reason: "No candidate host passed staging probe checks.",
	};
}

function row(label, value) {
	return `- ${label}: ${value}`;
}

function fmtStatus(check) {
	if (!check.ok) {
		return `error (${check.error || "request_failed"})`;
	}
	return `${check.status}`;
}

function buildReport({
	reportDate,
	projectId,
	webAppProbe,
	customProbe,
	customDomain,
	recommended,
}) {
	const probeToMarkdown = (probe) => [
		`### ${probe.baseUrl}`,
		row("root `/`", `\`${fmtStatus(probe.root)}\``),
		row("`POST /api/telemetry`", `\`${fmtStatus(probe.telemetry)}\``),
		row("`POST /api/sync/command`", `\`${fmtStatus(probe.command)}\``),
		row(
			"auth configuration readiness",
			`\`${probe.authReadiness.ready ? "ready" : "blocked"}\` (${probe.authReadiness.code})`,
		),
		row(
			"auth readiness detail",
			probe.authReadiness.message || "none",
		),
		row("passed", `\`${probe.assessment.passed ? "yes" : "no"}\``),
	].join("\n");

	return `# M10 Staging Endpoint Probe (${reportDate})

Status: ${recommended.baseUrl ? "PASS" : "FAIL"}  
Generated: ${new Date().toISOString()}

## Project

- Firebase project: \`${projectId || "unknown"}\`
- web.app candidate: \`${webAppProbe.baseUrl}\`
- custom-domain candidate: \`${customProbe ? customProbe.baseUrl : "n/a"}\`

## Probe Results

${probeToMarkdown(webAppProbe)}

${customProbe ? probeToMarkdown(customProbe) : "_No custom-domain candidate configured._"}

## Recommendation

- Recommended staging base URL: \`${recommended.baseUrl || "none"}\`
- Rationale: ${recommended.reason}
- Operational policy: use web.app for automated staging soak commands; reserve custom domain for user-facing smoke/UX checks.
`;
}

async function main() {
	const projectId = await readProjectId();
	const defaultWebApp = projectId ? `https://${projectId}.web.app` : "";
	const customDomain = await readCustomDomain();

	const webAppBase = normalizeBaseUrl(
		process.env.STAGING_WEBAPP_BASE_URL || process.env.STAGING_BASE_URL || defaultWebApp,
	);
	if (!webAppBase) {
		throw new Error(
			"Missing STAGING_BASE_URL/STAGING_WEBAPP_BASE_URL and could not derive web.app URL from .firebaserc.",
		);
	}

	const customBase = normalizeBaseUrl(
		process.env.STAGING_CUSTOM_BASE_URL ||
			(customDomain ? `https://${customDomain}` : ""),
	);

	const webAppProbe = await probeBase(webAppBase);
	const customProbe =
		customBase && customBase !== webAppBase ? await probeBase(customBase) : null;
	const recommended = chooseRecommended({
		webAppProbe,
		customProbe,
		customDomain,
	});

	const reportDate = new Date().toISOString().slice(0, 10);
	const reportName = `m10_staging_endpoint_probe_${reportDate}.md`;
	const reportPath = path.resolve(process.cwd(), "docs", "reports", reportName);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	await fs.writeFile(
		reportPath,
		buildReport({
			reportDate,
			projectId,
			webAppProbe,
			customProbe,
			customDomain,
			recommended,
		}),
		"utf8",
	);

	const code = recommended.baseUrl ? 0 : 1;
	console.log(
		`[staging-endpoint-probe] ${
			code === 0 ? "PASS" : "FAIL"
		} recommended=${recommended.baseUrl || "none"} report=${path.relative(
			process.cwd(),
			reportPath,
		)}`,
	);
	process.exitCode = code;
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
