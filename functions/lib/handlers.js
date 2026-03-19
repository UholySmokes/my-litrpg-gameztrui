const crypto = require("crypto");
const { json, readJsonBody } = require("./http");
const { normalizeMode, buildDefaultSuggestions } = require("./agent-router");
const auth = require("./auth");
const runtime = require("./firebase-agents/runtime");
const narrateRunsStore = require("./narrate-runs-store");

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

function resolveNarratorAgentId(mode) {
	const normalized = normalizeMode(mode);
	if (normalized === "combat") return "combat";
	if (normalized === "dialogue") return "dialogue";
	if (normalized === "system-event") return "system";
	if (normalized === "scene-transition") return "world";
	return "narrator";
}

async function cleanupNarrateRuns() {
	try {
		await narrateRunsStore.purgeExpiredNarrateRuns();
	} catch {
		// Cleanup is best-effort.
	}
}

function buildNarrativePayload(rawText, mode) {
	const structured = tryParseStructured(rawText);
	const narrative =
		typeof structured?.narrative === "string" && structured.narrative.trim()
			? structured.narrative.trim()
			: String(rawText || "");
	const mood =
		typeof structured?.mood === "string" && structured.mood.trim()
			? structured.mood.trim()
			: inferMood(narrative);
	const suggestions = Array.isArray(structured?.suggestions)
		? structured.suggestions
		: buildDefaultSuggestions(mode);

	return {
		narrative,
		mood,
		suggestions,
		outputHash: hashContent(narrative),
	};
}

async function requireAuthenticatedUser(req, res) {
	const user = await auth.getUserFromRequest(req);
	if (user) return user;

	json(res, 401, {
		ok: false,
		errorCode: "UNAUTHENTICATED",
		message: "Sign in required.",
	});
	return null;
}

async function runNarration(body) {
	const mode = normalizeMode(body?.mode);
	const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
	const input =
		prompt ||
		`Narrate the next scene based on: ${JSON.stringify(body || {})}`;
	const agentId = resolveNarratorAgentId(mode);

	const result = await runtime.runFirebaseAgent({
		agent: agentId,
		input: {
			prompt: input,
			mode,
		},
		model: body?.model,
		temperature: body?.temperature,
		topP: body?.topP,
	});

	const payload = buildNarrativePayload(result?.text, mode);
	return {
		mode,
		agentId,
		status: "completed",
		backend: result?.backend || "firebase-genkit",
		fallbackUsed: Boolean(result?.fallbackUsed),
		fallbackFrom: result?.fallbackFrom || undefined,
		model: result?.model,
		temperature: result?.temperature,
		...payload,
	};
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
			agents: runtime.listFirebaseAgents(),
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
		if (!(await requireAuthenticatedUser(req, res))) return;

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

		const result = await runtime.runFirebaseAgent({
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
		if (Array.isArray(error?.allowedModels)) {
			responseBody.allowedModels = error.allowedModels;
		}
		return json(res, status, responseBody);
	}
}

async function narrate(req, res) {
	try {
		if (!(await requireAuthenticatedUser(req, res))) return;

		const body = await readJsonBody(req);
		const result = await runNarration(body);
		return json(res, 200, {
			ok: true,
			narrative: result.narrative,
			mood: result.mood,
			suggestions: result.suggestions,
			outputHash: result.outputHash,
			mode: result.mode,
			agentId: result.agentId,
			backend: result.backend,
			fallbackUsed: result.fallbackUsed,
			fallbackFrom: result.fallbackFrom,
			model: result.model,
			status: result.status,
		});
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

async function narrateStart(req, res) {
	try {
		const user = await requireAuthenticatedUser(req, res);
		if (!user) return;

		await cleanupNarrateRuns();
		const body = await readJsonBody(req);
		const mode = normalizeMode(body?.mode);
		const threadId = crypto.randomUUID();
		const runId = crypto.randomUUID();

		await narrateRunsStore.createNarrateRun({
			threadId,
			runId,
			ownerId: user.id,
			mode,
		});

		let result;
		try {
			result = await runNarration(body);
		} catch (error) {
			const parsedStatus = Number(error?.status);
			const status = Number.isFinite(parsedStatus) ? parsedStatus : 500;
			const message = String(error?.message || error || "Unknown error");
			const errorCode = error?.code || "RUN_FAILED";

			await narrateRunsStore.updateNarrateRun({
				threadId,
				runId,
				ownerId: user.id,
				patch: {
					status: "failed",
					done: true,
					ok: false,
					mode,
					errorCode,
					message,
				},
			});

			return json(res, status, {
				ok: false,
				errorCode,
				message,
				threadId,
				runId,
				status: "failed",
				done: true,
				mode,
			});
		}

		await narrateRunsStore.updateNarrateRun({
			threadId,
			runId,
			ownerId: user.id,
			patch: {
				status: "completed",
				done: true,
				ok: true,
				mode: result.mode,
				narrative: result.narrative,
				mood: result.mood,
				suggestions: result.suggestions,
				outputHash: result.outputHash,
			},
		});

		return json(res, 200, {
			ok: true,
			threadId,
			runId,
			status: "completed",
			done: true,
			mode: result.mode,
			agentId: result.agentId,
			narrative: result.narrative,
			mood: result.mood,
			suggestions: result.suggestions,
			outputHash: result.outputHash,
			backend: result.backend,
			fallbackUsed: result.fallbackUsed,
			fallbackFrom: result.fallbackFrom,
			model: result.model,
		});
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

async function narratePoll(req, res) {
	try {
		const user = await requireAuthenticatedUser(req, res);
		if (!user) return;

		await cleanupNarrateRuns();
		const threadId = req?.query?.threadId;
		const runId = req?.query?.runId;
		if (!threadId || !runId) {
			return json(res, 400, {
				ok: false,
				errorCode: "MISSING_PARAMS",
				message: "threadId and runId query parameters are required.",
			});
		}

		const run = await narrateRunsStore.getNarrateRun({
			threadId: String(threadId),
			runId: String(runId),
			ownerId: user.id,
		});
		if (!run) {
			return json(res, 404, {
				ok: false,
				errorCode: "RUN_NOT_FOUND",
				message: "Run not found.",
			});
		}

		if (run.done && run.ok === false) {
			return json(res, 500, {
				ok: false,
				errorCode: run.error_code || "RUN_FAILED",
				status: run.status || "failed",
				done: true,
				mode: run.mode || normalizeMode(req?.query?.mode),
				message: run.message || "Run failed.",
			});
		}

		const response = {
			ok: true,
			status: run.status || (run.done ? "completed" : "running"),
			done: Boolean(run.done),
			mode: run.mode || normalizeMode(req?.query?.mode),
		};

		if (run.narrative) {
			response.narrative = run.narrative;
			response.mood = run.mood || inferMood(run.narrative);
			response.suggestions = Array.isArray(run.suggestions)
				? run.suggestions
				: buildDefaultSuggestions(response.mode);
			response.outputHash = run.output_hash || hashContent(run.narrative);
		}

		return json(res, run.done ? 200 : 202, response);
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
