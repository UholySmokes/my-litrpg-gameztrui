const { getAgentDefinition, listFirebaseAgents, normalizeAgentId } = require("./definitions");

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_LOCATION = "global";

let runtimePromise = null;

function parseNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTemperature(value, fallback) {
	const parsed = parseNumber(value, fallback);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(0, Math.min(2, parsed));
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
	}
	if (agentId === "combat") {
		blocks.push(blockFromValue("COMBAT_STATE", payload.combat_state ?? payload));
	}
	if (agentId === "dialogue") {
		blocks.push(blockFromValue("NPC_CONTEXT", payload.npc_context ?? payload));
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

async function initializeRuntime() {
	const [{ genkit }, { vertexAI }] = await Promise.all([
		import("genkit"),
		import("@genkit-ai/google-genai"),
	]);

	const location = process.env.GENKIT_VERTEX_LOCATION || DEFAULT_LOCATION;
	const apiKey =
		(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
	const pluginOptions = { location };
	if (apiKey) pluginOptions.apiKey = apiKey;

	const ai = genkit({
		plugins: [vertexAI(pluginOptions)],
	});

	return { ai, vertexAI };
}

async function getRuntime() {
	if (!runtimePromise) runtimePromise = initializeRuntime();
	return runtimePromise;
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

	const activeModel = (typeof model === "string" && model.trim()) || process.env.GEMINI_MODEL || DEFAULT_MODEL;
	const activeTemperature = parseTemperature(
		temperature,
		parseTemperature(process.env.GEMINI_TEMPERATURE, definition.temperature),
	);
	const activeTopP = Math.max(0, Math.min(1, parseNumber(topP, 1)));
	const inputPrompt = buildInputPrompt(definition.id, input);
	const fullPrompt = `${definition.instructions}\n\nINPUT\n${inputPrompt}`;

	const { ai, vertexAI } = await getRuntime();
	const { response, stream } = ai.generateStream({
		model: vertexAI.model(activeModel),
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

	return {
		agent: definition.id,
		agentName: definition.name,
		model: activeModel,
		temperature: activeTemperature,
		text: finalText,
		structured: tryParseStructured(finalText),
	};
}

module.exports = {
	listFirebaseAgents,
	runFirebaseAgent,
};
