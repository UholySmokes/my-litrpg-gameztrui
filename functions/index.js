const { handleApiRequest } = require("./lib/api-router");
const crypto = require("crypto");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { isDevAuthEnabled } = require("./lib/auth");
const {
	listFirebaseAgents,
	runFirebaseAgent,
} = require("./lib/firebase-agents/runtime");

const AI_RUNTIME_SECRETS = ["OPENAI_API_KEY"];

function hashContent(text) {
	return crypto
		.createHash("sha256")
		.update(String(text || ""), "utf8")
		.digest("hex");
}

exports.api = onRequest(
	{
		region: "us-central1",
		memory: "1GiB",
		timeoutSeconds: 540,
		secrets: AI_RUNTIME_SECRETS,
	},
	async (req, res) => {
		try {
			await handleApiRequest(req, res);
		} catch (error) {
			const message = String(error?.message || error || "Unknown error");
			res.status(500).json({ ok: false, errorCode: "UNEXPECTED_ERROR", message });
		}
	},
);

exports.agentList = onCall({ region: "us-central1" }, async () => ({
	ok: true,
	provider: "firebase-genkit",
	agents: listFirebaseAgents(),
}));

exports.agentRun = onCall(
	{ region: "us-central1", timeoutSeconds: 120, secrets: AI_RUNTIME_SECRETS },
	async (request) => {
		const devUserId = isDevAuthEnabled() ? String(process.env.DEV_USER_ID || "").trim() : "";
		const callerId = String(request?.auth?.uid || devUserId || "").trim();
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

