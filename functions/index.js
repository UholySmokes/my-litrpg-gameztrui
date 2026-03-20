const process = require("node:process");

const DEFAULT_OTEL_NODE_RESOURCE_DETECTORS =
	"env,host,os,process,serviceinstance,container,gcp";

if (!String(process.env.OTEL_NODE_RESOURCE_DETECTORS || "").trim()) {
	process.env.OTEL_NODE_RESOURCE_DETECTORS = DEFAULT_OTEL_NODE_RESOURCE_DETECTORS;
}

const { handleApiRequest } = require("./lib/api-router");
const crypto = require("crypto");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { isDevAuthEnabled } = require("./lib/auth");
const {
	listFirebaseAgents,
	runFirebaseAgent,
} = require("./lib/firebase-agents/runtime");

const AI_RUNTIME_SECRETS = ["OPENAI_API_KEY"];
const HTTP_API_OPTIONS = {
	region: "us-central1",
	memory: "1GiB",
	timeoutSeconds: 540,
	secrets: AI_RUNTIME_SECRETS,
};
const NARRATE_ROUTE_NAMES = new Set([
	"narrate",
	"narrate-start",
	"narrate-poll",
	"story-event",
	"story-start",
	"story-poll",
]);
const SYNC_ROUTE_NAMES = new Set([
	"saves-reset-legacy",
	"saves",
	"sync-commit",
	"sync-commit-batch",
	"sync-command",
	"sync-pull",
	"sync-replay",
	"sync-action",
]);
const ADMIN_ROUTE_NAMES = new Set([
	"health",
	"agents",
	"agents-run",
	"telemetry",
	"bulk-gen-run-start",
	"bulk-gen-run-tick",
	"bulk-gen-run-status",
	"bulk-gen-run-pause",
	"bulk-gen-run-resume",
	"bulk-gen-style",
	"bulk-gen-budget-alert",
]);

function hashContent(text) {
	return crypto
		.createHash("sha256")
		.update(String(text || ""), "utf8")
		.digest("hex");
}

function getCallableCallerId(request) {
	const devUserId = isDevAuthEnabled() ? String(process.env.DEV_USER_ID || "").trim() : "";
	return String(request?.auth?.uid || devUserId || "").trim();
}

function createHttpApiFunction(allowedRouteNames) {
	return onRequest(HTTP_API_OPTIONS, async (req, res) => {
		try {
			await handleApiRequest(req, res, { allowedRouteNames });
		} catch (error) {
			const message = String(error?.message || error || "Unknown error");
			res.status(500).json({ ok: false, errorCode: "UNEXPECTED_ERROR", message });
		}
	});
}

const apiNarrate = createHttpApiFunction(NARRATE_ROUTE_NAMES);
const apiSync = createHttpApiFunction(SYNC_ROUTE_NAMES);
const apiAdmin = createHttpApiFunction(ADMIN_ROUTE_NAMES);

exports.apiNarrate = apiNarrate;
exports.apiSync = apiSync;
exports.apiAdmin = apiAdmin;
exports.api = apiAdmin;

exports.agentList = onCall({ region: "us-central1" }, async (request) => {
	if (!getCallableCallerId(request)) {
		throw new HttpsError("unauthenticated", "Sign in required.");
	}

	return {
		ok: true,
		provider: "firebase-genkit",
		agents: listFirebaseAgents(),
	};
});

exports.agentRun = onCall(
	{ region: "us-central1", timeoutSeconds: 120, secrets: AI_RUNTIME_SECRETS },
	async (request) => {
		const callerId = getCallableCallerId(request);
		if (!callerId) {
			throw new HttpsError("unauthenticated", "Sign in required.");
		}

		const body =
			request?.data && typeof request.data === "object" && !Array.isArray(request.data)
				? request.data
				: {};
		const agent = typeof body?.agent === "string" ? body.agent.trim() : "";

		if (!agent) {
			throw new HttpsError(
				"invalid-argument",
				"Request payload must include an 'agent' field.",
			);
		}

		const hasInputField = Object.prototype.hasOwnProperty.call(body, "input");
		const input = hasInputField
			? body.input
			: {
				...body,
				agent: undefined,
				model: undefined,
				temperature: undefined,
				topP: undefined,
			};

		try {
			const result = await runFirebaseAgent({
				agent,
				input,
				model: body?.model,
				temperature: body?.temperature,
				topP: body?.topP,
			});

			const response = {
				ok: true,
				provider: "firebase-genkit",
				backend: result.backend,
				fallbackUsed: Boolean(result.fallbackUsed),
				fallbackFrom: result.fallbackFrom || undefined,
				agent: result.agent,
				agentName: result.agentName,
				model: result.model,
				temperature: result.temperature,
				text: result.text,
				outputHash: hashContent(result.text),
			};

			if (typeof result.structured !== "undefined") {
				response.structured = result.structured;
			}

			return response;
		} catch (error) {
			if (error?.code === "INVALID_AGENT") {
				throw new HttpsError("invalid-argument", String(error?.message || "Invalid agent."), {
					allowedAgents: Array.isArray(error?.allowedAgents)
						? error.allowedAgents
						: listFirebaseAgents().map((x) => x.id),
				});
			}

			if (error?.code === "NON_TEXT_OUTPUT") {
				throw new HttpsError("internal", String(error?.message || "Model returned empty output."));
			}

			if (error?.code === "MODEL_NOT_ALLOWED") {
				throw new HttpsError(
					"invalid-argument",
					String(error?.message || "Requested model is not allowed."),
					{
						allowedModels: Array.isArray(error?.allowedModels)
							? error.allowedModels
							: undefined,
					},
				);
			}

			throw new HttpsError("internal", String(error?.message || "Agent execution failed."));
		}
	},
);
