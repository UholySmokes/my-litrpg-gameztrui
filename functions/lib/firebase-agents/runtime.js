const { getAgentDefinition, listFirebaseAgents, normalizeAgentId } = require("./definitions");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4-turbo";
const DEFAULT_CEREBRAS_MODEL = "llama3.1-8b";
const DEFAULT_LOCATION = "global";
const DEFAULT_AI_TEXT_PROVIDER = "openai";
const DEFAULT_OPENAI_TIMEOUT_MS = 120000;
const DEFAULT_OPENROUTER_TIMEOUT_MS = 120000;
const DEFAULT_CEREBRAS_TIMEOUT_MS = 120000;
const NARRATION_FALLBACK_AGENTS = new Set([
	"narrator",
	"combat",
	"dialogue",
	"world",
	"system",
]);
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
let cerebrasClientPromise = null;
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
	if (raw === "cerebras") return "cerebras";
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

function resolveCerebrasAllowedModels() {
	const configured = parseCsvList(process.env.CEREBRAS_ALLOWED_MODELS || "");
	if (configured.length > 0) return configured;

	const fallback = new Set([DEFAULT_CEREBRAS_MODEL]);
	const envDefault = (process.env.CEREBRAS_MODEL || "").trim();
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
	if (configured === "cerebras") return "cerebras";
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

function normalizeText(value) {
	return typeof value === "string" ? value.trim() : "";
}

function dedupeStrings(values = [], maxItems = 6) {
	const seen = new Set();
	const normalized = [];
	for (const entry of values) {
		const item = normalizeText(entry);
		const key = item.toLowerCase();
		if (!item || seen.has(key)) continue;
		seen.add(key);
		normalized.push(item);
		if (normalized.length >= maxItems) break;
	}
	return normalized;
}

function normalizeList(value, maxItems = 6) {
	if (Array.isArray(value)) return dedupeStrings(value, maxItems);
	const raw = normalizeText(value);
	if (!raw || /^none(?:\s+(?:confirmed|stated))?$/i.test(raw)) return [];
	return dedupeStrings(
		raw
			.split(/[;,]/)
			.map((entry) => entry.trim())
			.filter(Boolean),
		maxItems,
	);
}

function escapeRegExp(value) {
	return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractPromptValue(prompt, label) {
	const source = normalizeText(prompt);
	if (!source) return "";
	const matcher = new RegExp(
		`^${escapeRegExp(label)}\\s*(?::|->)\\s*(.+)$`,
		"im",
	);
	return normalizeText(source.match(matcher)?.[1]);
}

function extractPromptSection(prompt, title) {
	const source = normalizeText(prompt);
	if (!source) return "";
	const matcher = new RegExp(
		`===\\s*${escapeRegExp(title)}\\s*===\\s*([\\s\\S]*?)(?=\\n===\\s*[^\\n]+\\s*===|$)`,
		"i",
	);
	return normalizeText(source.match(matcher)?.[1]);
}

function extractPromptChoices(prompt) {
	const section = extractPromptSection(prompt, "OPENING CHOICES");
	if (!section) return [];
	return dedupeStrings(
		Array.from(section.matchAll(/^\d+\.\s+(.+)$/gim), (match) => normalizeText(match[1])),
		4,
	);
}

function extractQuotedPlayerInput(prompt) {
	const source = normalizeText(prompt);
	if (!source) return "";
	const match = source.match(/The player attempted \(untrusted user input\): "([^"]+)"/i);
	return normalizeText(match?.[1]);
}

function extractActionSummary(prompt, success) {
	const source = normalizeText(prompt);
	if (!source) return "";
	const pattern = success
		? /The action succeeded\.\s*([^\n]+)/i
		: /The action failed\.\s*([^\n]+)/i;
	return normalizeText(source.match(pattern)?.[1]);
}

function extractFirstMeaningful(values = []) {
	for (const value of values) {
		const item = normalizeText(value);
		if (!item) continue;
		if (/^none(?:\s+(?:confirmed|stated))?$/i.test(item)) continue;
		if (/^unknown(?:\s+zone)?$/i.test(item)) continue;
		return item;
	}
	return "";
}

function cleanEntityLabel(value) {
	return normalizeText(value).replace(/\s*\([^)]*\)\s*$/, "");
}

function cleanPromptSnippet(value, maxLength = 200) {
	const raw = normalizeText(value)
		.replace(/^[*-]\s*/gm, "")
		.replace(/\s+/g, " ")
		.trim();
	if (!raw) return "";
	if (raw.length <= maxLength) return raw;
	return `${raw.slice(0, maxLength).trim().replace(/[,:;.\s]+$/, "")}.`;
}

function ensureSentence(value) {
	const text = normalizeText(value).replace(/\s+/g, " ");
	if (!text) return "";
	return /[.!?]$/.test(text) ? text : `${text}.`;
}

function stripTrailingSentencePunctuation(value) {
	return normalizeText(value).replace(/[.!?]+$/g, "");
}

function normalizeActionLead(input) {
	const raw = normalizeText(input);
	if (!raw) return "act on the nearest opening";
	if (/^(look|inspect|read|listen|search|check|scan|follow|ask|speak|talk|move|enter|leave|steady|rest|attack|use|cast)\b/i.test(raw)) {
		return raw;
	}
	return `try to ${raw}`;
}

function inferSuggestionCategory(text) {
	const raw = normalizeText(text).toLowerCase();
	if (!raw) return "progress";
	if (/^(look|inspect|read|listen|check|scan|survey)\b/.test(raw)) return "observe";
	if (/^(ask|speak|talk|hail|question|approach)\b/.test(raw)) return "social";
	if (/^(rest|steady|recover|bandage|breathe)\b/.test(raw)) return "recovery";
	if (/^(cast|use|channel|test|invoke)\b/.test(raw)) return "power";
	if (/^(hide|take cover|prepare|withdraw|retreat|flee|warn)\b/.test(raw)) return "risk";
	return "progress";
}

function buildChoiceMeta(suggestions = []) {
	return suggestions.map((suggestion, index) => ({
		intent: `The move keeps pressure on the most grounded lead in front of you.`,
		category: inferSuggestionCategory(suggestion),
		urgency: Math.max(0.4, 0.85 - index * 0.15),
		groundedInState: true,
	}));
}

function buildFallbackContext(input = {}) {
	const payload =
		input && typeof input === "object" && !Array.isArray(input)
			? input
			: { input };
	const prompt = extractFirstMeaningful([
		payload.prompt,
		payload.player_request,
		payload.request,
		payload.content_request,
	]);
	const npcContext =
		payload.npc_context && typeof payload.npc_context === "object"
			? payload.npc_context
			: {};
	const reactionContext =
		payload.reaction_context && typeof payload.reaction_context === "object"
			? payload.reaction_context
			: {};
	const sceneMemory =
		payload.sceneMemory && typeof payload.sceneMemory === "object"
			? payload.sceneMemory
			: {};
	const playerInput = extractFirstMeaningful([
		extractQuotedPlayerInput(prompt),
		npcContext.spokenText,
		payload.player_request,
		payload.request,
	]);
	const actionSucceeded = /The action succeeded\./i.test(prompt)
		? true
		: /The action failed\./i.test(prompt)
			? false
			: null;
	const signatureNpc = cleanEntityLabel(extractPromptValue(prompt, "Signature NPC"));
	const targetLabel = cleanEntityLabel(
		extractFirstMeaningful([
			npcContext.targetLabel,
			extractPromptValue(prompt, "Addressed target"),
		]),
	);
	const focusEntity = cleanEntityLabel(reactionContext.focusEntity);
	const openingChoices = extractPromptChoices(prompt);
	const locationLabel = extractFirstMeaningful([
		sceneMemory.locationLabel,
		extractPromptValue(prompt, "Scene Location"),
		extractPromptValue(prompt, "Current Locale"),
		extractPromptValue(prompt, "Starting Point"),
		extractPromptValue(prompt, "Location"),
	]);
	const zoneLabel = extractFirstMeaningful([
		sceneMemory.zoneLabel,
		extractPromptValue(prompt, "Scene Zone"),
		extractPromptValue(prompt, "Zone"),
	]);
	const immediateObjective = extractFirstMeaningful([
		sceneMemory.immediateObjective,
		extractPromptValue(prompt, "Immediate Objective"),
		extractPromptValue(prompt, "Opening Quest"),
		extractPromptValue(prompt, "Main Quest"),
		extractPromptValue(prompt, "First Pressure"),
	]);
	const presentEntities = dedupeStrings([
		...(Array.isArray(sceneMemory.presentEntities) ? sceneMemory.presentEntities : []),
		...normalizeList(extractPromptValue(prompt, "Present Entities")),
		signatureNpc,
		targetLabel,
		focusEntity,
	]);
	const activeThreats = dedupeStrings([
		...(Array.isArray(sceneMemory.activeThreats) ? sceneMemory.activeThreats : []),
		...normalizeList(extractPromptValue(prompt, "Active Threats")),
	]);
	const unresolvedHooks = dedupeStrings([
		...(Array.isArray(sceneMemory.unresolvedHooks) ? sceneMemory.unresolvedHooks : []),
		...normalizeList(extractPromptValue(prompt, "Unresolved Hooks")),
		extractPromptValue(prompt, "First Pressure"),
		...normalizeList(extractPromptValue(prompt, "Nearby Landmarks")),
		...openingChoices,
	]);
	const familiarEntities = dedupeStrings([
		...(Array.isArray(sceneMemory.familiarEntities) ? sceneMemory.familiarEntities : []),
		...normalizeList(extractPromptValue(prompt, "Familiar Entities")),
	]);
	const partyEntities = dedupeStrings([
		...(Array.isArray(sceneMemory.partyEntities) ? sceneMemory.partyEntities : []),
		...normalizeList(extractPromptValue(prompt, "Party Entities")),
	]);
	const socialSummary = extractFirstMeaningful([
		sceneMemory.socialSummary,
		extractPromptValue(prompt, "Social Summary"),
	]);
	const actionSummary = extractFirstMeaningful([
		extractActionSummary(prompt, actionSucceeded === false ? false : true),
		extractPromptValue(prompt, "Last Consequence"),
		sceneMemory.lastConsequence,
	]);
	const openingScene = cleanPromptSnippet(extractPromptSection(prompt, "OPENING SCENE"), 220);
	const systemName = cleanEntityLabel(extractPromptValue(prompt, "System"));
	const playerName = extractPromptValue(prompt, "Name");
	return {
		prompt,
		playerName,
		playerInput,
		actionSucceeded,
		actionSummary,
		locationLabel,
		zoneLabel,
		immediateObjective,
		presentEntities,
		activeThreats,
		unresolvedHooks,
		familiarEntities,
		partyEntities,
		socialSummary,
		targetLabel,
		focusEntity,
		openingChoices,
		openingScene,
		systemName,
		sceneMemory: {
			locationLabel,
			zoneLabel,
			immediateObjective,
			presentEntities,
			activeThreats,
			unresolvedHooks,
			lastConsequence: actionSummary,
			familiarEntities,
			partyEntities,
			socialSummary,
		},
	};
}

function buildFallbackSuggestions(context = {}) {
	const suggestions = [];
	const locationLead = context.locationLabel || context.zoneLabel;
	if (context.openingChoices.length > 0) {
		suggestions.push(...context.openingChoices.slice(0, 3));
	}
	if (suggestions.length < 3 && context.targetLabel) {
		suggestions.push(`Ask ${context.targetLabel} what they know`);
	}
	if (suggestions.length < 3 && context.focusEntity && context.focusEntity !== context.targetLabel) {
		suggestions.push(`Watch ${context.focusEntity} more closely`);
	}
	if (suggestions.length < 3 && context.unresolvedHooks[0]) {
		suggestions.push(`Inspect ${context.unresolvedHooks[0]}`);
	}
	if (suggestions.length < 3 && context.presentEntities[0]) {
		suggestions.push(`Approach ${context.presentEntities[0]}`);
	}
	if (suggestions.length < 3 && context.activeThreats[0]) {
		suggestions.push(`Prepare for ${context.activeThreats[0]}`);
	}
	if (suggestions.length < 3 && locationLead) {
		suggestions.push(`Look around ${locationLead}`);
	}
	if (suggestions.length < 3 && context.immediateObjective) {
		suggestions.push(`Advance ${context.immediateObjective}`);
	}
	if (suggestions.length < 3) {
		suggestions.push("Steady yourself and read the room");
	}
	return dedupeStrings(suggestions, 3);
}

function resolveFallbackMood(context = {}) {
	if (context.actionSucceeded === false && context.activeThreats.length > 0) return "desperate";
	if (context.activeThreats.length > 0) return "tense";
	if (context.targetLabel || context.focusEntity) return "mysterious";
	if (context.openingScene || context.unresolvedHooks.length > 0) return "mysterious";
	return "neutral";
}

function buildOpeningFallbackStory(context = {}) {
	const locationLead = context.locationLabel || context.zoneLabel || "the first threshold";
	const primaryEntity = context.presentEntities[0];
	const primaryHook = context.unresolvedHooks[0] || context.immediateObjective;
	const systemNotice = context.systemName
		? `[${context.systemName}: opening pressure acknowledged.]`
		: "";
	return [
		`You come into ${locationLead} without any soft landing, only the immediate sense that this place expects a choice from you.`,
		context.openingScene ||
			`${locationLead} feels newly sharpened, as if every sound and angle is waiting to see what kind of problem you become.`,
		primaryEntity
			? `${primaryEntity} stands out at once, too central to fade into the background.`
			: "",
		primaryHook
			? `${primaryHook} already feels like the pressure point most likely to decide your first real move.`
			: "",
		systemNotice,
		`Nothing here reads like a tutorial. The opening narrows around your next step and dares you to prove you belong in it.`,
	]
		.filter(Boolean)
		.map(ensureSentence)
		.join(" ");
}

function buildTurnFallbackStory(context = {}) {
	const locationLead = context.locationLabel || context.zoneLabel || "the scene";
	const actionLead = normalizeActionLead(context.playerInput);
	const primaryEntity = context.targetLabel || context.focusEntity || context.presentEntities[0];
	const primaryHook = context.unresolvedHooks[0] || context.immediateObjective;
	const threat = context.activeThreats[0];
	const systemNotice = context.systemName
		? `[${context.systemName}: leverage point pending.]`
		: "";
	const firstLine = context.actionSucceeded === false
		? `You ${actionLead}, but the moment resists cleanly enough to leave the failure stinging.`
		: `You ${actionLead}, and the scene answers quickly enough to make the choice feel real.`;
	return [
		firstLine,
		context.actionSummary
			? `${locationLead} takes the consequence immediately: ${stripTrailingSentencePunctuation(context.actionSummary)}.`
			: `At ${locationLead}, even a small move changes the pressure in the air.`,
		primaryEntity
			? `${primaryEntity} reacts first, making it clear you are no longer background noise here.`
			: "",
		threat
			? `${threat} keeps the edge on the moment, turning every hesitation into a risk.`
			: "",
		primaryHook
			? `${primaryHook} remains the lead most likely to matter if you keep pressing forward.`
			: "",
		systemNotice,
	]
		.filter(Boolean)
		.map(ensureSentence)
		.join(" ");
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
	if (error?.code === "CEREBRAS_API_KEY_MISSING") return true;

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
		message.includes("missing cerebras api key") ||
		message.includes("application default credentials") ||
		message.includes("default credentials") ||
		message.includes("could not load the default credentials") ||
		message.includes("unable to detect a project id") ||
		message.includes("unable to detect a project id in the current environment") ||
		message.includes("could not determine project id") ||
		message.includes("missing google cloud project") ||
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

function createMissingCerebrasKeyError() {
	const error = new Error(
		"Missing Cerebras API key. Set CEREBRAS_API_KEY for Cerebras provider execution.",
	);
	error.status = 500;
	error.code = "CEREBRAS_API_KEY_MISSING";
	return error;
}

function buildNarrationFallbackPayload(agentId, input) {
	const context = buildFallbackContext(input);
	const suggestions = buildFallbackSuggestions(context);
	const mood = resolveFallbackMood(context);
	const story =
		context.playerInput || context.actionSucceeded !== null
			? buildTurnFallbackStory(context)
			: buildOpeningFallbackStory(context);

	if (agentId === "combat") {
		return {
			story,
			narrative: story,
			mood: context.activeThreats.length > 0 ? "tense" : mood,
			suggestions,
			choiceMeta: buildChoiceMeta(suggestions),
			sceneMemory: context.sceneMemory,
		};
	}
	if (agentId === "dialogue") {
		return {
			story,
			narrative: story,
			mood: context.targetLabel ? "mysterious" : mood,
			suggestions,
			choiceMeta: buildChoiceMeta(suggestions),
			sceneMemory: context.sceneMemory,
		};
	}
	if (agentId === "world") {
		return {
			story,
			narrative: story,
			mood: context.activeThreats.length > 0 ? "tense" : "mysterious",
			suggestions,
			choiceMeta: buildChoiceMeta(suggestions),
			sceneMemory: context.sceneMemory,
		};
	}
	if (agentId === "system") {
		return {
			story,
			narrative: story,
			mood,
			suggestions,
			choiceMeta: buildChoiceMeta(suggestions),
			sceneMemory: context.sceneMemory,
		};
	}
	return {
		story,
		narrative: story,
		mood,
		suggestions,
		choiceMeta: buildChoiceMeta(suggestions),
		sceneMemory: context.sceneMemory,
	};
}

function buildStructuredFallbackPayload(agentId, input) {
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

	return buildNarrationFallbackPayload(agentId, input);
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

async function initializeCerebrasClient() {
	const apiKey = String(process.env.CEREBRAS_API_KEY || "").trim();
	if (!apiKey) throw createMissingCerebrasKeyError();

	const mod = require("@cerebras/cerebras_cloud_sdk");
	const Cerebras = mod?.default || mod?.Cerebras || mod;
	return new Cerebras({
		apiKey,
		warmTCPConnection: false,
	});
}

async function getOpenAiClient() {
	if (!openAiClientPromise) openAiClientPromise = initializeOpenAiClient();
	return openAiClientPromise;
}

async function getOpenRouterClient() {
	if (!openRouterClientPromise) openRouterClientPromise = initializeOpenRouterClient();
	return openRouterClientPromise;
}

async function getCerebrasClient() {
	if (!cerebrasClientPromise) cerebrasClientPromise = initializeCerebrasClient();
	return cerebrasClientPromise;
}

function computeActiveTemperature(definition, provider, inputTemperature) {
	let envKey = "GEMINI_TEMPERATURE";
	if (provider === "openai") envKey = "OPENAI_TEMPERATURE";
	if (provider === "openrouter") envKey = "OPENROUTER_TEMPERATURE";
	if (provider === "cerebras") envKey = "CEREBRAS_TEMPERATURE";
	return parseTemperature(
		inputTemperature,
		parseTemperature(process.env[envKey], definition.temperature),
	);
}

function extractChatCompletionText(response) {
	const content = response?.choices?.[0]?.message?.content;
	if (typeof content === "string") return content.trim();
	if (!Array.isArray(content)) return "";

	return content
		.map((part) => {
			if (typeof part === "string") return part;
			if (typeof part?.text === "string") return part.text;
			return "";
		})
		.join("\n")
		.trim();
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

function buildDeterministicFallbackResult({
	definition,
	activeModel,
	activeTemperature,
	fallbackFrom,
	input,
	backend = "local-emulator-fallback",
}) {
	const payload = buildStructuredFallbackPayload(definition.id, input);
	return formatExecutionResult({
		definition,
		activeModel,
		activeTemperature,
		backend,
		text: JSON.stringify(payload),
		fallbackUsed: true,
		fallbackFrom,
	});
}

function shouldUseCredentialFallback(agentId, error) {
	return (
		isCredentialConfigurationError(error) &&
		(isFunctionsEmulatorEnvironment() || NARRATION_FALLBACK_AGENTS.has(agentId))
	);
}

function setRuntimeTestOverrides(overrides) {
	runtimeTestOverrides =
		overrides && typeof overrides === "object" ? { ...overrides } : null;
	// Ensure each test run starts from a clean runtime cache.
	geminiRuntimePromise = null;
	openAiClientPromise = null;
	openRouterClientPromise = null;
	cerebrasClientPromise = null;
}

function resetRuntimeTestOverrides() {
	runtimeTestOverrides = null;
	geminiRuntimePromise = null;
	openAiClientPromise = null;
	openRouterClientPromise = null;
	cerebrasClientPromise = null;
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

	const finalText = extractChatCompletionText(response);
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

async function executeCerebrasProvider({
	definition,
	fullPrompt,
	activeModel,
	activeTemperature,
	activeTopP,
}) {
	if (runtimeTestOverrides?.executeCerebrasProvider) {
		const overrideResult = await runtimeTestOverrides.executeCerebrasProvider({
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
			backend: overrideResult.backend || "cerebras-chat-completions",
			text: String(overrideResult.text || "").trim(),
		});
	}

	const client = await getCerebrasClient();
	const timeout = parseNumber(process.env.CEREBRAS_TIMEOUT_MS, DEFAULT_CEREBRAS_TIMEOUT_MS);
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

	const finalText = extractChatCompletionText(response);
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
		backend: "cerebras-chat-completions",
		text: finalText,
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
	} else if (provider === "cerebras") {
		activeModel = requestedModel || process.env.CEREBRAS_MODEL || DEFAULT_CEREBRAS_MODEL;
		allowedModels = resolveCerebrasAllowedModels();
	} else {
		activeModel = requestedModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
		allowedModels = resolveGeminiAllowedModels();
	}
	if (!allowedModels.includes(activeModel)) {
		let configHint = "GENKIT_ALLOWED_MODELS";
		if (provider === "openai") configHint = "OPENAI_ALLOWED_MODELS";
		if (provider === "openrouter") configHint = "OPENROUTER_ALLOWED_MODELS";
		if (provider === "cerebras") configHint = "CEREBRAS_ALLOWED_MODELS";
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
				if (shouldUseCredentialFallback(definition.id, error)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "openrouter",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
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
				if (shouldUseCredentialFallback(definition.id, fallbackError)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "google-ai-studio",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
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
				if (shouldUseCredentialFallback(definition.id, error)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "openai-responses",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
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
				if (shouldUseCredentialFallback(definition.id, fallbackError)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "google-ai-studio",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
					});
				}
				throw fallbackError;
			}
		}
	}

	if (provider === "cerebras") {
		try {
			return await executeCerebrasProvider({
				definition,
				fullPrompt,
				activeModel,
				activeTemperature,
				activeTopP,
			});
		} catch (error) {
			if (!isRetryableProviderError(error) && error?.code !== "CEREBRAS_API_KEY_MISSING") {
				if (shouldUseCredentialFallback(definition.id, error)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "cerebras-chat-completions",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
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
				`[firebase-agents] Cerebras execution failed for '${definition.id}', falling back to Gemini.`,
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
					fallbackFrom: "cerebras-chat-completions",
				};
			} catch (fallbackError) {
				if (shouldUseCredentialFallback(definition.id, fallbackError)) {
					return buildDeterministicFallbackResult({
						definition,
						activeModel,
						activeTemperature,
						fallbackFrom: "google-ai-studio",
						input,
						backend: isFunctionsEmulatorEnvironment()
							? "local-emulator-fallback"
							: "credential-fallback",
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
		if (shouldUseCredentialFallback(definition.id, error)) {
			return buildDeterministicFallbackResult({
				definition,
				activeModel,
				activeTemperature,
				fallbackFrom: "google-ai-studio",
				input,
				backend: isFunctionsEmulatorEnvironment()
					? "local-emulator-fallback"
					: "credential-fallback",
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
