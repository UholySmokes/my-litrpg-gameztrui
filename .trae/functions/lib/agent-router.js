const MODES = {
	exploration: "exploration",
	combat: "combat",
	dialogue: "dialogue",
	"system-event": "system-event",
	"scene-transition": "scene-transition",
};

function normalizeMode(mode) {
	const raw = typeof mode === "string" ? mode.trim().toLowerCase() : "";
	return raw && Object.prototype.hasOwnProperty.call(MODES, raw)
		? raw
		: MODES.exploration;
}

function env(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function resolveAssistantId(mode) {
	const normalized = normalizeMode(mode);
	const narrator = env("NARRATOR_AGENT_ID");

	if (normalized === MODES.combat) {
		return env("COMBAT_AGENT_ID") || narrator;
	}
	if (normalized === MODES.dialogue) {
		return env("DIALOGUE_AGENT_ID") || narrator;
	}
	if (normalized === MODES["system-event"]) {
		return env("SYSTEM_AGENT_ID") || narrator;
	}
	if (normalized === MODES["scene-transition"]) {
		return env("WORLD_AGENT_ID") || narrator;
	}
	return narrator;
}

function buildDefaultSuggestions(mode) {
	const normalized = normalizeMode(mode);
	if (normalized === MODES.combat) {
		return [
			{ t: "attack enemy", w: 1 },
			{ t: "use skill", w: 0.95 },
			{ t: "drink potion", w: 0.8 },
		];
	}
	if (normalized === MODES.dialogue) {
		return [
			{ t: "ask a question", w: 1 },
			{ t: "negotiate", w: 0.85 },
			{ t: "leave politely", w: 0.7 },
		];
	}
	if (normalized === MODES["scene-transition"]) {
		return [
			{ t: "look around", w: 1 },
			{ t: "check quests", w: 0.85 },
			{ t: "talk to locals", w: 0.8 },
		];
	}
	return [
		{ t: "explore area", w: 1 },
		{ t: "check status", w: 0.9 },
		{ t: "open inventory", w: 0.85 },
	];
}

module.exports = {
	normalizeMode,
	resolveAssistantId,
	buildDefaultSuggestions,
};

