const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { normalizeMode, resolveAssistantId, buildDefaultSuggestions } = require("./agent-router");
const { startFoundryRun, pollFoundryRun, awaitFoundryRun } = require("./foundry");
const {
	listFirebaseAgents,
	runFirebaseAgent,
} = require("./firebase-agents/runtime");

const MOOD_PATTERNS = [
	{ mood: "tense", patterns: [/danger/i, /threat/i, /ambush/i, /attack/i, /enemy/i, /looming/i] },
	{ mood: "triumphant", patterns: [/victory/i, /triumph/i, /succeed/i, /conquer/i, /glory/i, /reward/i] },
	{ mood: "mysterious", patterns: [/strange/i, /mystery/i, /whisper/i, /shadow/i, /ancient/i, /secret/i, /hidden/i] },
	{ mood: "serene", patterns: [/calm/i, /peace/i, /gentle/i, /rest/i, /quiet/i, /warm/i, /soft/i] },
	{ mood: "desperate", patterns: [/flee/i, /escape/i, /wound/i, /bleed/i, /dying/i, /last/i, /barely/i] },
];

function inferMood(text) {
	const value = typeof text === "string" ? text : "";
	if (!value.trim()) return "neutral";
	for (const { mood, patterns } of MOOD_PATTERNS) {
		if (patterns.some((p) => p.test(value))) return mood;
	}
	return "neutral";
}

function hashContent(text) {
	return crypto
		.createHash("sha256")
		.update(String(text || ""), "utf8")
		.digest("hex");
}

function tryParseStructured(text) {
	const raw = typeof text === "string" ? text.trim() : "";
	if (!raw) return null;
	if (!raw.startsWith("{") && !raw.startsWith("[")) return null;
	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return parsed;
		}
	} catch {
		return null;
	}
	return null;
}

async function health(_req, res) {
	return json(res, 200, {
		ok: true,
		service: "void-verse-firebase-api",
	});
}

async function agents(req, res) {
	const method = (req?.method || "GET").toUpperCase();
	if (method === "GET") {
		return json(res, 200, {
			ok: true,
			provider: "firebase-genkit",
			agents: listFirebaseAgents(),
		});
	}

	return json(res, 405, {
		ok: false,
		errorCode: "METHOD_NOT_ALLOWED",
		message: `Method ${method} is not supported for /api/agents.`,
	});
}

async function runAgent(req, res) {
	try {
		const body = await readJsonBody(req);
		const agent = typeof body?.agent === "string" ? body.agent.trim() : "";
		if (!agent) {
			return json(res, 400, {
				ok: false,
				errorCode: "MISSING_AGENT",
				message: "Request body must include an 'agent' field.",
			});
		}

		const hasInputField = Object.prototype.hasOwnProperty.call(body || {}, "input");
		const input = hasInputField
			? body.input
			: {
				...body,
				agent: undefined,
				model: undefined,
				temperature: undefined,
				topP: undefined,
			};

		const result = await runFirebaseAgent({
			agent,
			input,
			model: body?.model,
			temperature: body?.temperature,
			topP: body?.topP,
		});

		const responseBody = {
			ok: true,
			provider: "firebase-genkit",
			backend: result.backend,
			agent: result.agent,
			agentName: result.agentName,
			model: result.model,
			temperature: result.temperature,
			text: result.text,
			outputHash: hashContent(result.text),
		};

		if (typeof result.structured !== "undefined") {
			responseBody.structured = result.structured;
		}

		return json(res, 200, responseBody);
	} catch (error) {
		const parsedStatus = Number(error?.status);
		const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
		const responseBody = {
			ok: false,
			errorCode: error?.code || "UNEXPECTED_ERROR",
			message: String(error?.message || error || "Unknown error"),
		};
		if (Array.isArray(error?.allowedAgents)) {
			responseBody.allowedAgents = error.allowedAgents;
		}
		return json(res, status, responseBody);
	}
}

async function narrate(req, res) {
	try {
		const body = await readJsonBody(req);
		const mode = normalizeMode(body?.mode);
		const assistantId = resolveAssistantId(mode);
		if (!assistantId) {
			return json(res, 500, {
				ok: false,
				errorCode: "MISSING_ENV",
				message: "Missing environment variable: NARRATOR_AGENT_ID",
			});
		}
		const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
		const instruction = prompt || `Narrate the next scene based on: ${JSON.stringify(body || {})}`;

		const { threadId, runId } = await startFoundryRun(instruction, assistantId);
		const result = await awaitFoundryRun(threadId, runId);
		const assistantText = result.text;
		if (!assistantText) {
			return json(res, 502, {
				ok: false,
				errorCode: "NON_TEXT_OUTPUT",
				message: "Narrator returned empty output.",
			});
		}

		const structured = tryParseStructured(assistantText);
		const narrative =
			typeof structured?.narrative === "string" && structured.narrative.trim()
				? structured.narrative.trim()
				: assistantText;
		const mood =
			typeof structured?.mood === "string" && structured.mood.trim()
				? structured.mood.trim()
				: inferMood(narrative);
		const suggestions = Array.isArray(structured?.suggestions)
			? structured.suggestions
			: buildDefaultSuggestions(mode);
		return json(res, 200, {
			ok: true,
			narrative,
			mood,
			suggestions,
			outputHash: hashContent(narrative),
			mode,
			threadId,
			runId,
			status: result.status,
		});
	} catch (error) {
		const parsedStatus = Number(error?.status);
		const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
		const errorCode = error?.code || "UNEXPECTED_ERROR";
		const responseBody = {
			ok: false,
			errorCode,
			message: String(error?.message || error || "Unknown error"),
		};
		if (typeof error?.detail !== "undefined") responseBody.detail = error.detail;
		if (error?.threadId) responseBody.threadId = error.threadId;
		if (error?.runId) responseBody.runId = error.runId;
		return json(res, status, responseBody);
	}
}

async function narrateStart(req, res) {
	try {
		const body = await readJsonBody(req);
		const mode = normalizeMode(body?.mode);
		const assistantId = resolveAssistantId(mode);
		if (!assistantId) {
			return json(res, 500, {
				ok: false,
				errorCode: "MISSING_ENV",
				message: "Missing environment variable: NARRATOR_AGENT_ID",
			});
		}
		const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
		const instruction = prompt || `Narrate the next scene based on: ${JSON.stringify(body || {})}`;
		const { threadId, runId, status } = await startFoundryRun(instruction, assistantId);
		return json(res, 202, {
			ok: true,
			threadId,
			runId,
			status,
			mode,
		});
	} catch (error) {
		const parsedStatus = Number(error?.status);
		const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
		return json(res, status, {
			ok: false,
			errorCode: error?.code || "UNEXPECTED_ERROR",
			message: String(error?.message || error || "Unknown error"),
			detail: error?.detail,
		});
	}
}

async function narratePoll(req, res) {
	try {
		const threadId = req?.query?.threadId;
		const runId = req?.query?.runId;
		const mode = normalizeMode(req?.query?.mode);
		if (!threadId || !runId) {
			return json(res, 400, {
				ok: false,
				errorCode: "MISSING_PARAMS",
				message: "threadId and runId query parameters are required.",
			});
		}

		const result = await pollFoundryRun(threadId, runId);
		if (result.error) {
			return json(res, 500, {
				ok: false,
				errorCode: "RUN_FAILED",
				status: result.status,
				done: true,
				message: result.error,
			});
		}

		const response = {
			ok: true,
			status: result.status,
			done: result.done,
			mode,
		};

		if (result.text) {
			const structured = tryParseStructured(result.text);
			const narrative =
				typeof structured?.narrative === "string" && structured.narrative.trim()
					? structured.narrative.trim()
					: result.text;
			response.narrative = narrative;
			response.mood =
				typeof structured?.mood === "string" && structured.mood.trim()
					? structured.mood.trim()
					: inferMood(narrative);
			response.suggestions = Array.isArray(structured?.suggestions)
				? structured.suggestions
				: buildDefaultSuggestions(mode);
			response.outputHash = hashContent(narrative);
		}

		return json(res, result.done ? 200 : 202, response);
	} catch (error) {
		const parsedStatus = Number(error?.status);
		const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
		return json(res, status, {
			ok: false,
			errorCode: error?.code || "UNEXPECTED_ERROR",
			message: String(error?.message || error || "Unknown error"),
		});
	}
}

module.exports = {
	health,
	agents,
	runAgent,
	narrate,
	narrateStart,
	narratePoll,
};

