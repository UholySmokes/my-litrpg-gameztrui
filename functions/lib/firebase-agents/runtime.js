const { getAgentDefinition, listFirebaseAgents, normalizeAgentId } = require("./definitions");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4-turbo";
const DEFAULT_LOCATION = "global";
const DEFAULT_AI_TEXT_PROVIDER = "openai";
const DEFAULT_OPENAI_TIMEOUT_MS = 120000;
const DEFAULT_OPENROUTER_TIMEOUT_MS = 120000;
const OPENAI_NARRATION_AGENTS = new Set([
	"narrator",
	"combat",
	"dialogue",
	"world",
	"system",
	"quest",
]);

let geminiRuntimePromise = null;
let openAiClientPromise = null;
let openRouterClientPromise = null;
let runtimeTestOverrides = null;

function parseNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTemperature(value, fallback) {
	const parsed = parseNumber(value, fallback);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(0, Math.min(2, parsed));
}

function parseCsvList(value) {
	if (typeof value !== "string") return [];
	return value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function normalizeProvider(value) {
	const raw = String(value || "").trim().toLowerCase();
	if (raw === "gemini") return "gemini";
	if (raw === "openai") return "openai";
	if (raw === "openrouter") return "openrouter";
	return DEFAULT_AI_TEXT_PROVIDER;
}

function getConfiguredProvider() {
	return normalizeProvider(process.env.AI_TEXT_PROVIDER || DEFAULT_AI_TEXT_PROVIDER);
}

function resolveGeminiAllowedModels() {
	const configured = parseCsvList(process.env.GENKIT_ALLOWED_MODELS || "");
	if (configured.length > 0) return configured;

	const fallback = new Set([DEFAULT_GEMINI_MODEL]);
	const envDefault = (process.env.GEMINI_MODEL || "").trim();
	if (envDefault) fallback.add(envDefault);
	return Array.from(fallback);
}

function resolveOpenAiAllowedModels() {
	const configured = parseCsvList(process.env.OPENAI_ALLOWED_MODELS || "");
	if (configured.length > 0) return configured;

	const fallback = new Set([DEFAULT_OPENAI_MODEL]);
	const envDefault = (process.env.OPENAI_MODEL || "").trim();
	if (envDefault) fallback.add(envDefault);
	return Array.from(fallback);
}

function resolveOpenRouterAllowedModels() {
	const configured = parseCsvList(process.env.OPENROUTER_ALLOWED_MODELS || "");
	if (configured.length > 0) return configured;

	const fallback = new Set([DEFAULT_OPENROUTER_MODEL]);
	const envDefault = (process.env.OPENROUTER_MODEL || "").trim();
	if (envDefault) fallback.add(envDefault);
	return Array.from(fallback);
}

function isOpenAiPrimaryAgent(agentId) {
	return OPENAI_NARRATION_AGENTS.has(agentId);
}

function resolvePrimaryProvider(agentId) {
	if (agentId === "content_smith") return "gemini";
	const configured = getConfiguredProvider();
	if (configured === "gemini") return "gemini";
	if (configured === "openrouter") return "openrouter";
	if (isOpenAiPrimaryAgent(agentId)) return "openai";
	return "gemini";
}

function resolveProjectId() {
	const direct =
		(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "").trim();
	if (direct) return direct;

	const firebaseConfigRaw = (process.env.FIREBASE_CONFIG || "").trim();
	if (!firebaseConfigRaw) return "";

	try {
		if (firebaseConfigRaw.startsWith("{")) {
			const parsed = JSON.parse(firebaseConfigRaw);
			const fromJson = typeof parsed?.projectId === "string" ? parsed.projectId.trim() : "";
			if (fromJson) return fromJson;
		}
	} catch {
		// Ignore invalid FIREBASE_CONFIG payload and continue with empty result.
	}

	return "";
}

function toJsonString(value) {
	if (typeof value === "string") return value;
	if (typeof value === "undefined") return "";
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function blockFromValue(label, value) {
	const text = toJsonString(value);
	if (!text || !text.trim()) return "";
	return `<${label}>\n${text}`;
}

function buildInputPrompt(agentId, input) {
	const payload =
		input && typeof input === "object" && !Array.isArray(input)
			? input
			: { input };

	const blocks = [];
	if (agentId === "narrator") {
		blocks.push(blockFromValue("GAME_STATE", payload.game_state ?? payload));
		blocks.push(blockFromValue("REACTION_CONTEXT", payload.reaction_context));
	}
	if (agentId === "combat") {
		blocks.push(blockFromValue("COMBAT_STATE", payload.combat_state ?? payload));
	}
	if (agentId === "dialogue") {
		blocks.push(blockFromValue("NPC_CONTEXT", payload.npc_context ?? payload));
		blocks.push(blockFromValue("REACTION_CONTEXT", payload.reaction_context));
	}
	if (agentId === "world") {
		blocks.push(blockFromValue("WORLD_CONTEXT", payload.world_context ?? payload));
	}
	if (agentId === "system") {
		blocks.push(blockFromValue("GAME_STATE", payload.game_state ?? payload));
		blocks.push(blockFromValue("QUERY", payload.player_query ?? payload.query));
	}
	if (agentId === "quest") {
		blocks.push(blockFromValue("GAME_STATE", payload.game_state ?? payload.world_state));
		blocks.push(
			blockFromValue(
				"PLAYER_REQUEST",
				payload.player_request ?? payload.request ?? payload.prompt,
			),
		);
	}
	if (agentId === "content_smith") {
		blocks.push(
			blockFromValue(
				"CONTENT_REQUEST",
				payload.content_request ?? payload.request ?? payload.prompt,
			),
		);
		blocks.push(blockFromValue("WORLD_CONTEXT", payload.world_context ?? payload));
	}

	const filtered = blocks.filter(Boolean);
	if (filtered.length) return filtered.join("\n\n");
	return blockFromValue("INPUT", payload);
}

function tryParseStructured(text) {
	const raw = typeof text === "string" ? text.trim() : "";
	if (!raw) return undefined;
	if (!raw.startsWith("{") && !raw.startsWith("[")) return undefined;
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function resolveStatusCode(error) {
	const direct = Number(error?.status);
	if (Number.isFinite(direct)) return direct;
	const alternate = Number(error?.statusCode);
	if (Number.isFinite(alternate)) return alternate;
	const nested = Number(error?.response?.status);
	if (Number.isFinite(nested)) return nested;
	return NaN;
}

function extractOpenAiText(response) {
	const outputText =
		typeof response?.output_text === "string" ? response.output_text.trim() : "";
	if (outputText) return outputText;

	const output = Array.isArray(response?.output) ? response.output : [];
	const parts = [];
	for (const item of output) {
		const content = Array.isArray(item?.content) ? item.content : [];
		for (const part of content) {
			if (part?.type === "output_text" && typeof part?.text === "string") {
				const text = part.text.trim();
				if (text) parts.push(text);
			}
		}
	}
	return parts.join("\n").trim();
}

function isFunctionsEmulatorEnvironment() {
	return String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
}

function isRetryableProviderError(error) {
	const status = resolveStatusCode(error);
	if (status === 429 || status >= 500) return true;

	const code = String(error?.code || "").toUpperCase();
	if (
		[
			"ETIMEDOUT",
			"ECONNRESET",
			"ECONNREFUSED",
			"EAI_AGAIN",
			"ENOTFOUND",
			"ERR_STREAM_PREMATURE_CLOSE",
		].includes(code)
	) {
		return true;
	}

	const message = String(error?.message || "").toLowerCase();
	if (!message) return false;
	return (
		message.includes("timeout") ||
		message.includes("timed out") ||
		message.includes("temporarily unavailable") ||
		message.includes("rate limit") ||
		message.includes("too many requests") ||
		message.includes("overloaded") ||
		message.includes("upstream")
	);
}

function isCredentialConfigurationError(error) {
	if (error?.code === "OPENAI_API_KEY_MISSING") return true;

	const message = String(error?.message || "").toLowerCase();
	if (!message) return false;
	if (
		message.includes("api key not valid") ||
		message.includes("api_key_invalid") ||
		message.includes("invalid api key")
	) {
		return true;
	}
	return (
		message.includes("failed to authenticate") ||
		message.includes("missing openai api key") ||
		message.includes("application default credentials") ||
		message.includes("default credentials") ||
		message.includes("could not load the default credentials") ||
		message.includes("permission denied")
	);
}

function createModelNotAllowedError(model, allowedModels, configHint) {
	const error = new Error(
		`Model '${model}' is not allowed. Configure ${configHint} to permit it.`,
	);
	error.status = 400;
	error.code = "MODEL_NOT_ALLOWED";
	error.allowedModels = allowedModels;
	return error;
}

function createMissingOpenAiKeyError() {
	const error = new Error(
		"Missing OpenAI API key. Set OPENAI_API_KEY for OpenAI provider execution.",
	);
	error.status = 500;
	error.code = "OPENAI_API_KEY_MISSING";
	return error;
}

function createMissingOpenRouterKeyError() {
	const error = new Error(
		"Missing OpenRouter API key. Set OPENROUTER_API_KEY for OpenRouter provider execution.",
	);
	error.status = 500;
	error.code = "OPENROUTER_API_KEY_MISSING";
	return error;
}

function buildNarrationFallbackPayload(agentId) {
	if (agentId === "combat") {
		return {
			narrative:
				"Steel and breath hang in tense balance while the local emulator stands in for the live narrator service.",
			mood: "tense",
			suggestions: ["Hold your ground", "Read the battlefield", "Choose your next move"],
		};
	}
	if (agentId === "dialogue") {
		return {
			narrative:
				"The conversation pauses for a heartbeat, with the local emulator filling in until the live narrator service is configured.",
			mood: "mysterious",
			suggestions: ["Ask another question", "Study their reaction", "End the exchange"],
		};
	}
	if (agentId === "world") {
		return {
			narrative:
				"The world settles into a readable hush while the local emulator stands in for the live narrator service.",
			mood: "serene",
			suggestions: ["Survey the area", "Follow the path ahead", "Pause and prepare"],
		};
	}
	if (agentId === "system") {
		return {
			narrative:
				"The local emulator is active, so this response confirms the narrator API path without relying on a cloud model.",
			mood: "neutral",
			suggestions: ["Open the status panel", "Review your options", "Continue"],
		};
	}
	return {
		narrative:
			"The local emulator is narrating this scene because no valid cloud AI credentials are configured for local development yet.",
		mood: "neutral",
		suggestions: ["Look around", "Check inventory", "Continue"],
	};
}

function buildStructuredFallbackPayload(agentId) {
	if (agentId === "quest") {
		return {
			ok: true,
			quest: {
				id: "local-emulator-quest",
				title: "Emulator Proving Ground",
				type: "exploration",
				summary: "Confirm the local narrator API path is working end to end.",
				objectives: [
					{
						id: "verify-local-api",
						text: "Trigger a local narration request successfully.",
						kind: "interact",
						target: "narrator-api",
						quantity: 1,
						optional: false,
					},
				],
				constraints: ["Local emulator only placeholder quest."],
				recommendedLevel: 1,
				rewards: {
					xp: 0,
					gold: 0,
					items: [],
					titles: [],
				},
				failureConditions: [],
				lore: "Generated by the local emulator fallback.",
			},
		};
	}

	if (agentId === "content_smith") {
		return {
			ok: true,
			kind: "local-emulator",
			drafts: [
				{
					id: "local-emulator-draft-1",
					type: "note",
					name: "Local Emulator Draft",
					summary: "Placeholder output generated without a live AI provider.",
					details: {
						tags: ["local", "emulator", "placeholder"],
						notes: "Replace with live provider output once credentials are configured.",
					},
				},
				{
					id: "local-emulator-draft-2",
					type: "note",
					name: "Narration Path Verified",
					summary: "The request reached the runtime successfully.",
					details: {
						tags: ["verification"],
						notes: "Cloud provider configuration is still pending.",
					},
				},
				{
					id: "local-emulator-draft-3",
					type: "note",
					name: "Credential Gap",
					summary: "Local fallback activated because provider credentials were unavailable.",
					details: {
						tags: ["credentials"],
						notes: "Set OPENAI_API_KEY or GOOGLE_GENAI_API_KEY for live content generation.",
					},
				},
				{
					id: "local-emulator-draft-4",
					type: "note",
					name: "Safe Development Mode",
					summary: "Fallback is restricted to the local functions emulator.",
					details: {
						tags: ["safety"],
						notes: "Production routing still requires configured cloud providers.",
					},
				},
				{
					id: "local-emulator-draft-5",
					type: "note",
					name: "Next Step",
					summary: "Add valid provider credentials when you want live AI output.",
					details: {
						tags: ["next-step"],
						notes: "Until then, the emulator returns deterministic placeholder content.",
					},
				},
			],
		};
	}

	return buildNarrationFallbackPayload(agentId);
}

async function initializeGeminiRuntime() {
	const [{ genkit }, { vertexAI, googleAI }] = await Promise.all([
		import("genkit"),
		import("@genkit-ai/google-genai"),
	]);

	const location = process.env.GENKIT_VERTEX_LOCATION || DEFAULT_LOCATION;
	const apiKey =
		(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
	const projectId = resolveProjectId();
	const useGoogleAI = Boolean(apiKey);
	let plugin;
	let modelResolver;

	if (useGoogleAI) {
		plugin = googleAI({ apiKey });
		modelResolver = (modelName) => googleAI.model(modelName);
	} else {
		const pluginOptions = { location };
		if (projectId) pluginOptions.projectId = projectId;
		plugin = vertexAI(pluginOptions);
		modelResolver = (modelName) => vertexAI.model(modelName);
	}

	const ai = genkit({
		plugins: [plugin],
	});

	return {
		ai,
		modelResolver,
		backend: useGoogleAI ? "google-ai-studio" : "vertex-ai",
	};
}

async function getGeminiRuntime() {
	if (!geminiRuntimePromise) geminiRuntimePromise = initializeGeminiRuntime();
	return geminiRuntimePromise;
}

async function initializeOpenAiClient() {
	const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
	if (!apiKey) throw createMissingOpenAiKeyError();

	const mod = await import("openai");
	const OpenAI = mod?.default || mod?.OpenAI;
	const client = new OpenAI({ apiKey });
	return client;
}

async function initializeOpenRouterClient() {
	const apiKey = String(process.env.OPENROUTER_API_KEY || "").trim();
	if (!apiKey) throw createMissingOpenRouterKeyError();

	const mod = await import("openai");
	const OpenAI = mod?.default || mod?.OpenAI;
	const client = new OpenAI({
		apiKey,
		baseURL: "https://openrouter.io/api/v1",
		defaultHeaders: {
			"HTTP-Referer": "https://my-litrpg-gameztrui.web.app",
		}
	});
	return client;
}

async function getOpenAiClient() {
	if (!openAiClientPromise) openAiClientPromise = initializeOpenAiClient();
	return openAiClientPromise;
}

async function getOpenRouterClient() {
	if (!openRouterClientPromise) openRouterClientPromise = initializeOpenRouterClient();
	return openRouterClientPromise;
}

function computeActiveTemperature(definition, provider, inputTemperature) {
	let envKey = "GEMINI_TEMPERATURE";
	if (provider === "openai") envKey = "OPENAI_TEMPERATURE";
	if (provider === "openrouter") envKey = "OPENROUTER_TEMPERATURE";
	return parseTemperature(
		inputTemperature,
		parseTemperature(process.env[envKey], definition.temperature),
	);
}

function formatExecutionResult({
	definition,
	activeModel,
	activeTemperature,
	backend,
	text,
	fallbackUsed = false,
	fallbackFrom = "",
}) {
	return {
		agent: definition.id,
		agentName: definition.name,
		model: activeModel,
		temperature: activeTemperature,
		backend,
		text,
		structured: tryParseStructured(text),
		fallbackUsed: Boolean(fallbackUsed),
		fallbackFrom: fallbackFrom || undefined,
	};
}

function buildLocalEmulatorFallbackResult({
	definition,
	activeModel,
	activeTemperature,
	fallbackFrom,
}) {
	const payload = buildStructuredFallbackPayload(definition.id);
	return formatExecutionResult({
		definition,
		activeModel,
		activeTemperature,
		backend: "local-emulator-fallback",
		text: JSON.stringify(payload),
		fallbackUsed: true,
		fallbackFrom,
	});
}

function setRuntimeTestOverrides(overrides) {
	runtimeTestOverrides =
		overrides && typeof overrides === "object" ? { ...overrides } : null;
	// Ensure each test run starts from a clean runtime cache.
	geminiRuntimePromise = null;
	openAiClientPromise = null;
}

function resetRuntimeTestOverrides() {
	runtimeTestOverrides = null;
	geminiRuntimePromise = null;
	openAiClientPromise = null;
}

async function executeGeminiProvider({
	definition,
	fullPrompt,
	activeModel,
	activeTemperature,
	activeTopP,
}) {
	if (runtimeTestOverrides?.executeGeminiProvider) {
		const overrideResult = await runtimeTestOverrides.executeGeminiProvider({
			definition,
			fullPrompt,
			activeModel,
			activeTemperature,
			activeTopP,
		});
		return formatExecutionResult({
			definition,
			activeModel,
			activeTemperature,
			backend: overrideResult.backend || "google-ai-studio",
			text: String(overrideResult.text || "").trim(),
		});
	}

	const { ai, modelResolver, backend } = await getGeminiRuntime();
	const { response, stream } = ai.generateStream({
		model: modelResolver(activeModel),
		prompt: fullPrompt,
		config: {
			temperature: activeTemperature,
			topP: activeTopP,
		},
	});

	let streamedText = "";
	for await (const chunk of stream) {
		const part = typeof chunk?.text === "string" ? chunk.text : "";
		if (part) streamedText += part;
	}

	const final = await response;
	const finalText = (typeof final?.text === "string" && final.text.trim())
		? final.text.trim()
		: streamedText.trim();

	if (!finalText) {
		const error = new Error("Model returned empty output.");
		error.status = 502;
		error.code = "NON_TEXT_OUTPUT";
		throw error;
	}

	return formatExecutionResult({
		definition,
		activeModel,
		activeTemperature,
		backend,
		text: finalText,
	});
}

async function executeOpenAiProvider({
	definition,
	fullPrompt,
	activeModel,
	activeTemperature,
	activeTopP,
}) {
	if (runtimeTestOverrides?.executeOpenAiProvider) {
		const overrideResult = await runtimeTestOverrides.executeOpenAiProvider({
			definition,
			fullPrompt,
			activeModel,
			activeTemperature,
			activeTopP,
		});
		return formatExecutionResult({
			definition,
			activeModel,
			activeTemperature,
			backend: overrideResult.backend || "openai-responses",
			text: String(overrideResult.text || "").trim(),
		});
	}

	const client = await getOpenAiClient();
	const timeout = parseNumber(process.env.OPENAI_TIMEOUT_MS, DEFAULT_OPENAI_TIMEOUT_MS);
	const response = await client.responses.create(
		{
			model: activeModel,
			input: fullPrompt,
			temperature: activeTemperature,
			top_p: activeTopP,
		},
		{ timeout },
	);

	const finalText = extractOpenAiText(response);
	if (!finalText) {
		const error = new Error("Model returned empty output.");
		error.status = 502;
		error.code = "NON_TEXT_OUTPUT";
		throw error;
	}

	return formatExecutionResult({
		definition,
		activeModel,
		activeTemperature,
		backend: "openai-responses",
		text: finalText,
	});
}

async function executeOpenRouterProvider({
	definition,
	fullPrompt,
	activeModel,
	activeTemperature,
	activeTopP,
}) {
	if (runtimeTestOverrides?.executeOpenRouterProvider) {
		const overrideResult = await runtimeTestOverrides.executeOpenRouterProvider({
			definition,
			fullPrompt,
			activeModel,
			activeTemperature,
			activeTopP,
		});
		return formatExecutionResult({
			definition,
			activeModel,
			activeTemperature,
			backend: overrideResult.backend || "openrouter",
			text: String(overrideResult.text || "").trim(),
		});
	}

	const client = await getOpenRouterClient();
	const timeout = parseNumber(process.env.OPENROUTER_TIMEOUT_MS, DEFAULT_OPENROUTER_TIMEOUT_MS);
	const response = await client.chat.completions.create(
		{
			model: activeModel,
			messages: [
				{
					role: "user",
					content: fullPrompt,
				},
			],
			temperature: activeTemperature,
			top_p: activeTopP,
		},
		{ timeout },
	);

	const finalText =
		response?.choices?.[0]?.message?.content || "";
	if (!finalText.trim()) {
		const error = new Error("Model returned empty output.");
		error.status = 502;
		error.code = "NON_TEXT_OUTPUT";
		throw error;
	}

	return formatExecutionResult({
		definition,
		activeModel,
		activeTemperature,
		backend: "openrouter",
		text: finalText.trim(),
	});
}

async function runFirebaseAgent({
	agent,
	input,
	model,
	temperature,
	topP,
}) {
	const normalizedAgent = normalizeAgentId(agent);
	const definition = getAgentDefinition(normalizedAgent);
	if (!definition) {
		const error = new Error(`Unknown agent: ${String(agent || "")}`);
		error.status = 400;
		error.code = "INVALID_AGENT";
		error.allowedAgents = listFirebaseAgents().map((x) => x.id);
		throw error;
	}

	const provider = resolvePrimaryProvider(definition.id);
	const requestedModel = (typeof model === "string" && model.trim()) || "";
	let activeModel;
	let allowedModels;

	if (provider === "openai") {
		activeModel = requestedModel || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
		allowedModels = resolveOpenAiAllowedModels();
	} else if (provider === "openrouter") {
		activeModel = requestedModel || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
		allowedModels = resolveOpenRouterAllowedModels();
	} else {
		activeModel = requestedModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
		allowedModels = resolveGeminiAllowedModels();
	}
	if (!allowedModels.includes(activeModel)) {
		let configHint = "GENKIT_ALLOWED_MODELS";
		if (provider === "openai") configHint = "OPENAI_ALLOWED_MODELS";
		if (provider === "openrouter") configHint = "OPENROUTER_ALLOWED_MODELS";
		throw createModelNotAllowedError(activeModel, allowedModels, configHint);
	}

	const activeTemperature = computeActiveTemperature(
		definition,
		provider,
		temperature,
	);
	const activeTopP = Math.max(0, Math.min(1, parseNumber(topP, 1)));
	const inputPrompt = buildInputPrompt(definition.id, input);
	const fullPrompt = `${definition.instructions}\n\nINPUT\n${inputPrompt}`;

	if (provider === "openrouter") {
		try {
			return await executeOpenRouterProvider({
				definition,
				fullPrompt,
				activeModel,
				activeTemperature,
				activeTopP,
			});
		} catch (error) {
			if (!isRetryableProviderError(error) && error?.code !== "OPENROUTER_API_KEY_MISSING") {
				if (isFunctionsEmulatorEnvironment() && isCredentialConfigurationError(error)) {
					return buildLocalEmulatorFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "openrouter",
					});
				}
				throw error;
			}

			const fallbackModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
			const fallbackAllowedModels = resolveGeminiAllowedModels();
			if (!fallbackAllowedModels.includes(fallbackModel)) {
				throw createModelNotAllowedError(
					fallbackModel,
					fallbackAllowedModels,
					"GENKIT_ALLOWED_MODELS",
				);
			}

			console.warn(
				`[firebase-agents] OpenRouter execution failed for '${definition.id}', falling back to Gemini.`,
				{
					status: resolveStatusCode(error),
					code: error?.code || "",
				},
			);
			try {
				const fallbackResult = await executeGeminiProvider({
					definition,
					fullPrompt,
					activeModel: fallbackModel,
					activeTemperature: computeActiveTemperature(definition, "gemini", temperature),
					activeTopP,
				});
				return {
					...fallbackResult,
					fallbackUsed: true,
					fallbackFrom: "openrouter",
				};
			} catch (fallbackError) {
				if (
					isFunctionsEmulatorEnvironment() &&
					isCredentialConfigurationError(fallbackError)
				) {
					return buildLocalEmulatorFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "google-ai-studio",
					});
				}
				throw fallbackError;
			}
		}
	}

	if (provider === "openai") {
		try {
			return await executeOpenAiProvider({
				definition,
				fullPrompt,
				activeModel,
				activeTemperature,
				activeTopP,
			});
		} catch (error) {
			if (!isRetryableProviderError(error) && error?.code !== "OPENAI_API_KEY_MISSING") {
				if (isFunctionsEmulatorEnvironment() && isCredentialConfigurationError(error)) {
					return buildLocalEmulatorFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "openai-responses",
					});
				}
				throw error;
			}

			const fallbackModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
			const fallbackAllowedModels = resolveGeminiAllowedModels();
			if (!fallbackAllowedModels.includes(fallbackModel)) {
				throw createModelNotAllowedError(
					fallbackModel,
					fallbackAllowedModels,
					"GENKIT_ALLOWED_MODELS",
				);
			}

			console.warn(
				`[firebase-agents] OpenAI execution failed for '${definition.id}', falling back to Gemini.`,
				{
					status: resolveStatusCode(error),
					code: error?.code || "",
				},
			);
			try {
				const fallbackResult = await executeGeminiProvider({
					definition,
					fullPrompt,
					activeModel: fallbackModel,
					activeTemperature: computeActiveTemperature(definition, "gemini", temperature),
					activeTopP,
				});
				return {
					...fallbackResult,
					fallbackUsed: true,
					fallbackFrom: "openai-responses",
				};
			} catch (fallbackError) {
				if (
					isFunctionsEmulatorEnvironment() &&
					isCredentialConfigurationError(fallbackError)
				) {
					return buildLocalEmulatorFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "google-ai-studio",
					});
				}
				throw fallbackError;
			}
		}
	}

	try {
		return await executeGeminiProvider({
			definition,
			fullPrompt,
			activeModel,
			activeTemperature,
			activeTopP,
		});
	} catch (error) {
		if (isFunctionsEmulatorEnvironment() && isCredentialConfigurationError(error)) {
			return buildLocalEmulatorFallbackResult({
				definition,
				activeModel,
				activeTemperature,
				fallbackFrom: "google-ai-studio",
			});
		}
		throw error;
	}
}

module.exports = {
	listFirebaseAgents,
	runFirebaseAgent,
	__setRuntimeTestOverrides: setRuntimeTestOverrides,
	__resetRuntimeTestOverrides: resetRuntimeTestOverrides,
};
