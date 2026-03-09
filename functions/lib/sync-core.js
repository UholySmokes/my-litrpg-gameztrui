const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
	TRIGGER_COMMAND_VERBS_V1,
	CHARACTER_COMMAND_VERBS_V1,
	COMMAND_VERB_POLICY_V1,
} = require("./sync-command-contract");

const TRIGGER_TYPES = Object.freeze([...TRIGGER_COMMAND_VERBS_V1]);
const SYNC_EVENT_TYPES = Object.freeze(["TRIGGER", "COMMAND"]);
const SYNC_EVENT_TYPE_SET = new Set(SYNC_EVENT_TYPES);
const TRIGGER_TYPE_SET = new Set(TRIGGER_TYPES);
const CHARACTER_COMMAND_TYPE = "CHARACTER";
const CHARACTER_COMMAND_CREATE_VERB = CHARACTER_COMMAND_VERBS_V1[0] || "CREATE";
const BATCHABLE_TRIGGER_TYPE = "ENTER_TILE";
const IMMEDIATE_TRIGGER_TYPES = new Set(
	Object.keys(COMMAND_VERB_POLICY_V1).filter(
		(verb) => Boolean(COMMAND_VERB_POLICY_V1[verb]?.immediate),
	),
);
const MAX_ENTER_TILE_BATCH_WINDOW_MS = 100;
const MAX_ENTER_TILE_BATCH_ITEMS = 4;
const DEFAULT_MANIFEST_PATH = path.resolve(__dirname, "sync-world-manifest.v1.json");
const DEFAULT_STATE_VERSION = 1;
const XP_PER_LEVEL = 100;
const ENCOUNTER_REWARD_TABLE = Object.freeze({
	victory: Object.freeze({
		xp: 40,
		gold: 12,
		itemId: "training_emblem",
		quantity: 1,
	}),
	setback: Object.freeze({
		xp: 20,
		gold: 4,
		itemId: "field_bandage",
		quantity: 1,
	}),
});

let manifestCache = null;

function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFiniteNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return Number.NaN;
}

function toInteger(value) {
	const parsed = toFiniteNumber(value);
	if (!Number.isFinite(parsed)) return Number.NaN;
	if (!Number.isInteger(parsed)) return Number.NaN;
	return parsed;
}

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function toNonNegativeInteger(value, fallback = 0) {
	const parsed = toInteger(value);
	if (!Number.isInteger(parsed) || parsed < 0) return fallback;
	return parsed;
}

function normalizeEventType(value, fallback = "TRIGGER") {
	const raw = normalizeString(value).toUpperCase();
	if (SYNC_EVENT_TYPE_SET.has(raw)) return raw;
	const fallbackUpper = normalizeString(fallback).toUpperCase();
	if (SYNC_EVENT_TYPE_SET.has(fallbackUpper)) return fallbackUpper;
	return "TRIGGER";
}

function parseIsoTimestampMs(value) {
	const raw = normalizeString(value);
	if (!raw) return Number.NaN;
	const ms = Date.parse(raw);
	return Number.isFinite(ms) ? ms : Number.NaN;
}

function normalizeSyncEvent(input) {
	const source = isRecord(input) ? input : {};
	const commit = isRecord(source.commit) ? source.commit : {};
	const command = isRecord(source.command)
		? source.command
		: isRecord(commit.command)
			? commit.command
			: null;

	const explicit = normalizeString(source.eventType || source.event_type);
	let inferred = "TRIGGER";
	if (command) inferred = "COMMAND";
	if (normalizeString(commit.commandType)) inferred = "COMMAND";

	const eventType = normalizeEventType(explicit || inferred);
	const commandVerb = normalizeString(
		source.commandVerb || source.command_verb || command?.verb || commit.command?.verb,
	);
	const triggerType = normalizeString(
		source.triggerType || source.trigger_type || commit.triggerType || commandVerb,
	);

	return {
		...source,
		eventType,
		event_type: eventType,
		triggerType: triggerType || null,
		trigger_type: triggerType || null,
		commit: Object.keys(commit).length ? commit : null,
	};
}

function canonicalize(value) {
	if (
		value === null ||
		typeof value === "string" ||
		typeof value === "boolean"
	) {
		return value;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			throw new Error("Non-finite numeric value in canonical serializer.");
		}
		return value;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => canonicalize(entry));
	}

	if (!isRecord(value)) {
		return value;
	}

	const keys = Object.keys(value).sort();
	const output = {};
	for (const key of keys) {
		output[key] = canonicalize(value[key]);
	}
	return output;
}

function stableJsonStringify(value) {
	return JSON.stringify(canonicalize(value));
}

function sha256Hex(value) {
	return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function hashCanonicalState(state) {
	return sha256Hex(stableJsonStringify(state));
}

function deriveRngSeed(runSeed, seq, subsystemTag) {
	const payload = `${String(runSeed)}:${String(seq)}:${String(subsystemTag)}`;
	const digest = crypto.createHash("sha256").update(payload, "utf8").digest();
	const seed = digest.readUInt32BE(0);
	return seed === 0 ? 1 : seed;
}

function createDeterministicRng({ runSeed, seq, subsystemTag }) {
	let seed = deriveRngSeed(runSeed, seq, subsystemTag);
	return () => {
		seed = (1664525 * seed + 1013904223) >>> 0;
		return seed / 0x100000000;
	};
}

function getManifestPath() {
	const configured = normalizeString(process.env.SYNC_WORLD_MANIFEST_PATH);
	if (!configured) return DEFAULT_MANIFEST_PATH;
	if (path.isAbsolute(configured)) return configured;
	return path.resolve(__dirname, "..", configured);
}

function normalizeTriggerDefinition(triggerId, value) {
	const def = isRecord(value) ? value : {};
	return {
		id: triggerId,
		type: normalizeString(def.type),
		mapId: normalizeString(def.mapId),
		x: toInteger(def.x),
		y: toInteger(def.y),
		targetId: normalizeString(def.targetId),
		targetKind: normalizeString(def.targetKind),
		cooldownMs: Number.isFinite(toFiniteNumber(def.cooldownMs))
			? Math.max(0, Math.floor(toFiniteNumber(def.cooldownMs)))
			: 0,
		prereqFlags: isRecord(def.prereqFlags) ? { ...def.prereqFlags } : {},
		setQuestFlags: isRecord(def.setQuestFlags) ? { ...def.setQuestFlags } : {},
		transition: isRecord(def.transition)
			? {
					mapId: normalizeString(def.transition.mapId),
					x: toInteger(def.transition.x),
					y: toInteger(def.transition.y),
			  }
			: null,
	};
}

function normalizeMapDefinition(mapId, value) {
	const map = isRecord(value) ? value : {};
	const width = toInteger(map.width);
	const height = toInteger(map.height);
	const triggers = Array.isArray(map.triggers)
		? map.triggers.map((id) => normalizeString(id)).filter(Boolean)
		: [];
	return {
		id: mapId,
		width: Number.isFinite(width) ? width : 0,
		height: Number.isFinite(height) ? height : 0,
		triggers,
	};
}

function normalizeWorldManifest(rawValue) {
	const raw = isRecord(rawValue) ? rawValue : {};
	const mapsInput = isRecord(raw.maps) ? raw.maps : {};
	const triggersInput = isRecord(raw.triggers) ? raw.triggers : {};
	const npcsInput = isRecord(raw.npcs) ? raw.npcs : {};
	const objectsInput = isRecord(raw.objects) ? raw.objects : {};

	const maps = {};
	for (const mapId of Object.keys(mapsInput)) {
		maps[mapId] = normalizeMapDefinition(mapId, mapsInput[mapId]);
	}

	const triggers = {};
	for (const triggerId of Object.keys(triggersInput)) {
		triggers[triggerId] = normalizeTriggerDefinition(triggerId, triggersInput[triggerId]);
	}

	const npcs = {};
	for (const npcId of Object.keys(npcsInput)) {
		const npc = isRecord(npcsInput[npcId]) ? npcsInput[npcId] : {};
		npcs[npcId] = {
			id: npcId,
			mapId: normalizeString(npc.mapId),
			name: normalizeString(npc.name),
		};
	}

	const objects = {};
	for (const objectId of Object.keys(objectsInput)) {
		const objectDef = isRecord(objectsInput[objectId]) ? objectsInput[objectId] : {};
		objects[objectId] = {
			id: objectId,
			mapId: normalizeString(objectDef.mapId),
		};
	}

	const worldId = normalizeString(raw.worldId) || "voidverse_slice_world_001";
	const releaseId = normalizeString(raw.releaseId) || "slice-v1";
	const start = isRecord(raw.start)
		? {
				mapId: normalizeString(raw.start.mapId),
				x: Number.isFinite(toInteger(raw.start.x)) ? toInteger(raw.start.x) : 0,
				y: Number.isFinite(toInteger(raw.start.y)) ? toInteger(raw.start.y) : 0,
		  }
		: { mapId: "", x: 0, y: 0 };

	const fallbackMapId = Object.keys(maps)[0] || "";
	if (!start.mapId) {
		start.mapId = fallbackMapId;
	}

	const normalized = {
		worldId,
		releaseId,
		start,
		maps,
		npcs,
		objects,
		triggers,
	};

	const contentVersion = sha256Hex(stableJsonStringify(normalized));
	return {
		...normalized,
		contentVersion,
		triggerIdsByMap: Object.fromEntries(
			Object.values(maps).map((map) => [map.id, new Set(map.triggers)]),
		),
		approvedNpcIds: new Set(Object.keys(npcs)),
		approvedObjectIds: new Set(Object.keys(objects)),
	};
}

function loadWorldManifestFromDisk() {
	const manifestPath = getManifestPath();
	const raw = fs.readFileSync(manifestPath, "utf8");
	return normalizeWorldManifest(JSON.parse(raw));
}

function getWorldManifest() {
	if (!manifestCache) {
		manifestCache = loadWorldManifestFromDisk();
	}
	return manifestCache;
}

function clearWorldManifestCache() {
	manifestCache = null;
}

function buildInitialGameplayState({ runId, manifest, contentVersion }) {
	const runSeed = sha256Hex(`run:${runId}`).slice(0, 16);
	const state = {
		worldId: manifest.worldId,
		mapId: manifest.start.mapId,
		playerPos: {
			x: manifest.start.x,
			y: manifest.start.y,
		},
		entityStates: {},
		questFlags: {},
		runId: String(runId),
		seq: 0,
		tick: 0,
		stateHash: "",
		contentVersion: String(contentVersion || manifest.contentVersion),
		stateVersion: DEFAULT_STATE_VERSION,
		runSeed,
		cooldowns: {},
	};
	state.stateHash = hashCanonicalState(createHashPayload(state));
	return state;
}

function createHashPayload(state) {
	return {
		worldId: state.worldId,
		mapId: state.mapId,
		playerPos: state.playerPos,
		entityStates: state.entityStates,
		questFlags: state.questFlags,
		runId: state.runId,
		seq: state.seq,
		tick: state.tick,
		contentVersion: state.contentVersion,
		stateVersion: state.stateVersion,
		runSeed: state.runSeed,
	};
}

function createDefaultProgressionState() {
	return {
		level: 1,
		xp: 0,
		gold: 0,
		inventory: [],
	};
}

function normalizeProgressionState(input) {
	const source = isRecord(input) ? input : {};
	const level = Math.max(1, toNonNegativeInteger(source.level, 1));
	const xp = toNonNegativeInteger(source.xp, 0);
	const gold = toNonNegativeInteger(source.gold, 0);
	const inventoryMap = new Map();
	const inventoryInput = Array.isArray(source.inventory) ? source.inventory : [];
	for (const rawItem of inventoryInput) {
		if (!isRecord(rawItem)) continue;
		const itemId = normalizeString(rawItem.id);
		const quantity = toNonNegativeInteger(rawItem.quantity, 0);
		if (!itemId || quantity < 1) continue;
		inventoryMap.set(itemId, (inventoryMap.get(itemId) || 0) + quantity);
	}
	const inventory = Array.from(inventoryMap.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([id, quantity]) => ({ id, quantity }));
	return {
		level,
		xp,
		gold,
		inventory,
	};
}

function normalizeUniqueIdList(values) {
	if (!Array.isArray(values)) return [];
	const output = [];
	const seen = new Set();
	for (const entry of values) {
		const candidate = isRecord(entry)
			? normalizeString(entry.id || entry.name)
			: normalizeString(entry);
		if (!candidate || seen.has(candidate)) continue;
		seen.add(candidate);
		output.push(candidate);
	}
	return output;
}

function normalizeCharacterRefId(value, fallback = "") {
	const direct = normalizeString(fallback);
	if (direct) return direct;
	if (isRecord(value)) {
		return normalizeString(value.id || value.name);
	}
	return normalizeString(value);
}

function normalizeCharacterAttributes(attributes) {
	if (!isRecord(attributes)) return {};
	const normalized = {};
	for (const key of Object.keys(attributes)) {
		const normalizedKey = normalizeString(key);
		if (!normalizedKey || normalizedKey === "freePoints") continue;
		const parsed = toInteger(attributes[key]);
		if (!Number.isInteger(parsed)) continue;
		normalized[normalizedKey] = parsed;
	}
	return normalized;
}

function normalizeCharacterCreatePayload(input) {
	const source = isRecord(input) ? input : {};
	const blueprint = isRecord(source.characterCreationBlueprint)
		? source.characterCreationBlueprint
		: isRecord(source.blueprint)
			? source.blueprint
			: {};
	const mode = normalizeString(source.mode).toLowerCase() === "advanced" ? "advanced" : "basic";
	const name = normalizeString(source.name || blueprint.name);
	const gender = normalizeString(source.gender || blueprint.gender) || null;
	const raceId = normalizeCharacterRefId(source.race, source.raceId || blueprint.raceId);
	const classId = normalizeCharacterRefId(source.class, source.classId || blueprint.classId);
	const secondaryClassId =
		normalizeCharacterRefId(
			source.secondaryClass,
			source.secondaryClassId || blueprint.secondaryClassId,
		) || null;
	const originId = normalizeCharacterRefId(source.origin, source.originId || blueprint.originId);
	const alignmentId =
		normalizeCharacterRefId(source.alignment, source.alignmentId || blueprint.alignmentId) ||
		null;
	const archetypeSystemId =
		normalizeCharacterRefId(
			source.archetypeSystem || source.archetype,
			source.archetypeSystemId || source.archetypeId || blueprint.archetypeSystemId,
		) || null;
	const professionId =
		normalizeCharacterRefId(source.profession, source.professionId || blueprint.professionId) ||
		null;
	const skillLoadoutId =
		normalizeCharacterRefId(source.skillLoadoutId, blueprint.skillLoadoutId) || null;
	const activeSkillIds = normalizeUniqueIdList(
		source.activeSkillIds || source.activeSkills || blueprint.activeSkillIds || blueprint.activeSkills,
	);
	const passiveSkillIds = normalizeUniqueIdList(
		source.passiveSkillIds ||
			source.passiveSkills ||
			blueprint.passiveSkillIds ||
			blueprint.passiveSkills,
	);
	const perkIds = normalizeUniqueIdList(source.perkIds || source.perks || blueprint.perkIds);
	const starterTreeIds = normalizeUniqueIdList(
		source.starterTreeIds || source.starterTrees || blueprint.starterTreeIds,
	);
	const attributes = normalizeCharacterAttributes(source.attributes || blueprint.attributes);
	const blueprintVersion = Number.isInteger(toInteger(blueprint.version))
		? toInteger(blueprint.version)
		: 1;

	return {
		mode,
		name,
		gender,
		raceId,
		classId,
		secondaryClassId,
		originId,
		alignmentId,
		archetypeSystemId,
		professionId,
		skillLoadoutId,
		activeSkillIds,
		passiveSkillIds,
		perkIds,
		starterTreeIds,
		attributes,
		blueprint: {
			version: blueprintVersion,
			name,
			gender,
			raceId,
			classId,
			secondaryClassId,
			originId,
			professionId,
			archetypeSystemId,
			attributes,
			skillLoadoutId,
			activeSkillIds,
			passiveSkillIds,
			perkIds,
			starterTreeIds,
			alignmentId,
		},
	};
}

function withInventoryReward(inventory, { itemId, quantity }) {
	const normalizedItemId = normalizeString(itemId);
	const normalizedQty = toNonNegativeInteger(quantity, 0);
	if (!normalizedItemId || normalizedQty < 1) return inventory;
	const map = new Map(
		(Array.isArray(inventory) ? inventory : [])
			.filter((item) => isRecord(item) && normalizeString(item.id))
			.map((item) => [
				normalizeString(item.id),
				toNonNegativeInteger(item.quantity, 0),
			]),
	);
	map.set(normalizedItemId, (map.get(normalizedItemId) || 0) + normalizedQty);
	return Array.from(map.entries())
		.filter(([, qty]) => qty > 0)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([id, qty]) => ({ id, quantity: qty }));
}

function applyEncounterProgressionMutation({
	nextState,
	commit,
	triggerDef,
	resolvedTargetId,
	roll,
}) {
	const outcome = roll >= 50 ? "victory" : "setback";
	const reward = ENCOUNTER_REWARD_TABLE[outcome] || ENCOUNTER_REWARD_TABLE.setback;
	const progression = normalizeProgressionState(
		nextState.entityStates.progression || createDefaultProgressionState(),
	);

	progression.xp += reward.xp;
	progression.gold += reward.gold;
	progression.inventory = withInventoryReward(progression.inventory, {
		itemId: reward.itemId,
		quantity: reward.quantity,
	});

	const levelsGained = [];
	for (;;) {
		const levelThreshold = Math.max(1, progression.level) * XP_PER_LEVEL;
		if (progression.xp < levelThreshold) break;
		progression.xp -= levelThreshold;
		progression.level += 1;
		levelsGained.push(progression.level);
	}

	nextState.entityStates.progression = progression;
	nextState.entityStates.combat = {
		encounterId: resolvedTargetId || triggerDef.id,
		status: "resolved",
		outcome,
		roll,
		rewards: {
			xp: reward.xp,
			gold: reward.gold,
			itemId: reward.itemId,
			quantity: reward.quantity,
		},
		levelsGained,
		resolvedAtSeq: commit.clientSeq,
		resolvedAtTick: nextState.tick,
	};
	nextState.questFlags.quest_tutorial_combat_resolved = true;
	nextState.questFlags.quest_tutorial_combat_victory = outcome === "victory";
	nextState.questFlags.quest_tutorial_combat_setback = outcome === "setback";
	nextState.questFlags.quest_tutorial_loot_claimed = true;

	return {
		outcome,
		reward,
	};
}

function normalizeCommitEnvelope(input) {
	if (!isRecord(input)) {
		return {
			ok: false,
			errorCode: "INVALID_COMMIT_ENVELOPE",
			message: "Commit envelope must be an object.",
		};
	}

	const id = normalizeString(input.id);
	const runId = normalizeString(input.runId);
	const clientId = normalizeString(input.clientId);
	const clientSeq = toInteger(input.clientSeq);
	const createdAt = normalizeString(input.createdAt);
	const createdAtMs = parseIsoTimestampMs(createdAt);
	const contentVersion = normalizeString(input.contentVersion);
	const commandPayload = isRecord(input.command) ? input.command : null;
	const commandType = normalizeString(
		input.commandType || commandPayload?.type,
	).toUpperCase();
	const triggerType = normalizeString(input.triggerType);
	const triggerInput = isRecord(input.trigger) ? input.trigger : null;

	if (!id) {
		return {
			ok: false,
			errorCode: "INVALID_COMMIT_ID",
			message: "Commit id is required.",
		};
	}
	if (!runId) {
		return {
			ok: false,
			errorCode: "INVALID_RUN_ID",
			message: "runId is required.",
		};
	}
	if (!clientId) {
		return {
			ok: false,
			errorCode: "INVALID_CLIENT_ID",
			message: "clientId is required.",
		};
	}
	if (!Number.isInteger(clientSeq) || clientSeq < 1) {
		return {
			ok: false,
			errorCode: "INVALID_CLIENT_SEQ",
			message: "clientSeq must be an integer >= 1.",
		};
	}
	if (!Number.isFinite(createdAtMs)) {
		return {
			ok: false,
			errorCode: "INVALID_CREATED_AT",
			message: "createdAt must be an ISO-8601 timestamp.",
		};
	}
	if (!contentVersion) {
		return {
			ok: false,
			errorCode: "INVALID_CONTENT_VERSION",
			message: "contentVersion is required.",
		};
	}
	if (commandType === CHARACTER_COMMAND_TYPE) {
		return {
			ok: true,
			commit: {
				id,
				runId,
				clientId,
				clientSeq,
				createdAt,
				createdAtMs,
				contentVersion,
				triggerType: null,
				trigger: null,
				commandType,
				command: commandPayload || null,
			},
		};
	}
	if (!TRIGGER_TYPE_SET.has(triggerType)) {
		return {
			ok: false,
			errorCode: "INVALID_TRIGGER_TYPE",
			message: `triggerType must be one of: ${TRIGGER_TYPES.join(", ")}.`,
		};
	}
	if (!triggerInput) {
		return {
			ok: false,
			errorCode: "INVALID_TRIGGER_PAYLOAD",
			message: "trigger payload is required.",
		};
	}

	const triggerId = normalizeString(triggerInput.triggerId);
	const mapId = normalizeString(triggerInput.mapId);
	const x = toInteger(triggerInput.x);
	const y = toInteger(triggerInput.y);
	const targetId = normalizeString(triggerInput.targetId);
	if (!triggerId) {
		return {
			ok: false,
			errorCode: "INVALID_TRIGGER_ID",
			message: "trigger.triggerId is required.",
		};
	}
	if (!mapId) {
		return {
			ok: false,
			errorCode: "INVALID_TRIGGER_MAP",
			message: "trigger.mapId is required.",
		};
	}
	if (!Number.isInteger(x) || !Number.isInteger(y)) {
		return {
			ok: false,
			errorCode: "INVALID_TRIGGER_COORDS",
			message: "trigger coordinates must be integers.",
		};
	}

	return {
		ok: true,
		commit: {
			id,
			runId,
			clientId,
			clientSeq,
			createdAt,
			createdAtMs,
			contentVersion,
			triggerType,
			trigger: {
				triggerId,
				mapId,
				x,
				y,
				targetId: targetId || null,
			},
			commandType: commandType || null,
			command: commandPayload || null,
		},
	};
}

function normalizeCommitBatchRequest(input) {
	if (!isRecord(input) || !Array.isArray(input.commits)) {
		return {
			ok: false,
			errorCode: "INVALID_BATCH",
			message: "Request body must include a commits array.",
		};
	}

	if (input.commits.length === 0 || input.commits.length > MAX_ENTER_TILE_BATCH_ITEMS) {
		return {
			ok: false,
			errorCode: "INVALID_BATCH_SIZE",
			message: `Batch must contain 1-${MAX_ENTER_TILE_BATCH_ITEMS} commits.`,
		};
	}

	const commits = [];
	for (const rawCommit of input.commits) {
		const normalized = normalizeCommitEnvelope(rawCommit);
		if (!normalized.ok) return normalized;
		if (normalized.commit.triggerType !== BATCHABLE_TRIGGER_TYPE) {
			return {
				ok: false,
				errorCode: "NON_BATCHABLE_TRIGGER",
				message: "Only ENTER_TILE commits are allowed in commit-batch.",
			};
		}
		commits.push(normalized.commit);
	}

	for (let i = 1; i < commits.length; i += 1) {
		if (commits[i].clientSeq <= commits[i - 1].clientSeq) {
			return {
				ok: false,
				errorCode: "INVALID_BATCH_ORDER",
				message: "Batch commits must be ordered by clientSeq ascending.",
			};
		}
	}

	const firstMs = commits[0].createdAtMs;
	const lastMs = commits[commits.length - 1].createdAtMs;
	if (lastMs - firstMs > MAX_ENTER_TILE_BATCH_WINDOW_MS) {
		return {
			ok: false,
			errorCode: "BATCH_WINDOW_EXCEEDED",
			message: `ENTER_TILE batch window exceeds ${MAX_ENTER_TILE_BATCH_WINDOW_MS}ms.`,
		};
	}

	const runId = commits[0].runId;
	const clientId = commits[0].clientId;
	const contentVersion = commits[0].contentVersion;
	for (const commit of commits) {
		if (commit.runId !== runId || commit.clientId !== clientId) {
			return {
				ok: false,
				errorCode: "INVALID_BATCH_SCOPE",
				message: "All commits in a batch must share runId and clientId.",
			};
		}
		if (commit.contentVersion !== contentVersion) {
			return {
				ok: false,
				errorCode: "INVALID_BATCH_CONTENT_VERSION",
				message: "All commits in a batch must share contentVersion.",
			};
		}
	}

	return {
		ok: true,
		commits,
	};
}

function validateTriggerAgainstManifest({ manifest, state, commit }) {
	if (commit.contentVersion !== manifest.contentVersion) {
		return {
			ok: false,
			errorCode: "CONTENT_VERSION_MISMATCH",
			message: "Commit contentVersion does not match active manifest.",
		};
	}

	const triggerDef = manifest.triggers[commit.trigger.triggerId];
	if (!triggerDef) {
		return {
			ok: false,
			errorCode: "UNKNOWN_TRIGGER_ID",
			message: "Trigger id is not in the approved manifest.",
		};
	}

	if (triggerDef.type !== commit.triggerType) {
		return {
			ok: false,
			errorCode: "TRIGGER_TYPE_MISMATCH",
			message: "Commit triggerType does not match manifest trigger type.",
		};
	}

	if (triggerDef.mapId !== commit.trigger.mapId) {
		return {
			ok: false,
			errorCode: "TRIGGER_MAP_MISMATCH",
			message: "Commit mapId does not match trigger definition.",
		};
	}

	if (triggerDef.x !== commit.trigger.x || triggerDef.y !== commit.trigger.y) {
		return {
			ok: false,
			errorCode: "TRIGGER_COORDINATES_MISMATCH",
			message: "Commit coordinates do not match trigger definition.",
		};
	}

	if (state.mapId !== commit.trigger.mapId) {
		return {
			ok: false,
			errorCode: "STATE_MAP_MISMATCH",
			message: "Commit mapId does not match canonical run map.",
		};
	}

	const mapDef = manifest.maps[triggerDef.mapId];
	if (!mapDef) {
		return {
			ok: false,
			errorCode: "UNKNOWN_MAP_ID",
			message: "Trigger mapId is not in manifest maps.",
		};
	}
	const allowedTriggerIds = manifest.triggerIdsByMap[triggerDef.mapId];
	if (allowedTriggerIds && !allowedTriggerIds.has(triggerDef.id)) {
		return {
			ok: false,
			errorCode: "TRIGGER_NOT_ALLOWED_FOR_MAP",
			message: "Trigger is not allowed on this map.",
		};
	}

	const resolvedTargetId = commit.trigger.targetId || triggerDef.targetId || "";
	if (commit.trigger.targetId && triggerDef.targetId && commit.trigger.targetId !== triggerDef.targetId) {
		return {
			ok: false,
			errorCode: "TRIGGER_TARGET_MISMATCH",
			message: "targetId does not match manifest trigger target.",
		};
	}

	if (triggerDef.targetKind === "npc" && resolvedTargetId) {
		if (!manifest.approvedNpcIds.has(resolvedTargetId)) {
			return {
				ok: false,
				errorCode: "UNKNOWN_NPC_ID",
				message: "NPC id is not approved by manifest.",
			};
		}
	}
	if (triggerDef.targetKind === "object" && resolvedTargetId) {
		if (!manifest.approvedObjectIds.has(resolvedTargetId)) {
			return {
				ok: false,
				errorCode: "UNKNOWN_OBJECT_ID",
				message: "Object id is not approved by manifest.",
			};
		}
	}

	for (const [flag, expected] of Object.entries(triggerDef.prereqFlags || {})) {
		if (Boolean(state.questFlags[flag]) !== Boolean(expected)) {
			return {
				ok: false,
				errorCode: "PREREQ_NOT_SATISFIED",
				message: `Prerequisite flag '${flag}' is not satisfied.`,
			};
		}
	}

	const lastCommittedAt = toFiniteNumber(state.cooldowns?.[triggerDef.id]);
	if (
		Number.isFinite(lastCommittedAt) &&
		Number.isFinite(triggerDef.cooldownMs) &&
		triggerDef.cooldownMs > 0 &&
		commit.createdAtMs - lastCommittedAt < triggerDef.cooldownMs
	) {
		return {
			ok: false,
			errorCode: "TRIGGER_COOLDOWN",
			message: "Trigger is currently on cooldown.",
		};
	}

	return {
		ok: true,
		triggerDef,
		resolvedTargetId: resolvedTargetId || null,
	};
}

function validateCharacterCommand({ manifest, commit }) {
	if (commit.contentVersion !== manifest.contentVersion) {
		return {
			ok: false,
			errorCode: "CONTENT_VERSION_MISMATCH",
			message: "Commit contentVersion does not match active manifest.",
		};
	}

	if (normalizeString(commit.commandType).toUpperCase() !== CHARACTER_COMMAND_TYPE) {
		return {
			ok: false,
			errorCode: "UNSUPPORTED_COMMAND_TYPE",
			message: `Only ${CHARACTER_COMMAND_TYPE} command type is supported here.`,
		};
	}

	const command = isRecord(commit.command) ? commit.command : null;
	if (!command) {
		return {
			ok: false,
			errorCode: "INVALID_COMMAND_PAYLOAD",
			message: "command payload is required.",
		};
	}

	const verb = normalizeString(command.verb).toUpperCase();
	if (verb !== CHARACTER_COMMAND_CREATE_VERB) {
		return {
			ok: false,
			errorCode: "UNSUPPORTED_COMMAND_VERB",
			message: `Supported ${CHARACTER_COMMAND_TYPE} verbs: ${CHARACTER_COMMAND_VERBS_V1.join(", ")}.`,
		};
	}

	const character = normalizeCharacterCreatePayload(command.character);
	if (!character.name) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_NAME",
			message: "character.name is required.",
		};
	}
	if (!character.raceId) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_RACE",
			message: "character race selection is required.",
		};
	}
	if (!character.classId) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_CLASS",
			message: "character class selection is required.",
		};
	}
	if (!character.originId) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_ORIGIN",
			message: "character origin selection is required.",
		};
	}
	if (!character.alignmentId) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_ALIGNMENT",
			message: "character alignment selection is required.",
		};
	}
	if (!character.archetypeSystemId) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_ARCHETYPE",
			message: "character archetype selection is required.",
		};
	}
	if (Object.keys(character.attributes).length === 0) {
		return {
			ok: false,
			errorCode: "INVALID_CHARACTER_ATTRIBUTES",
			message: "character attributes are required.",
		};
	}

	return {
		ok: true,
		commandType: CHARACTER_COMMAND_TYPE,
		commandVerb: verb,
		character,
	};
}

function validateCommitAgainstState({ manifest, state, commit }) {
	if (normalizeString(commit.commandType).toUpperCase() === CHARACTER_COMMAND_TYPE) {
		return validateCharacterCommand({ manifest, state, commit });
	}
	return validateTriggerAgainstManifest({ manifest, state, commit });
}

function buildNextStateBase(state, commit) {
	return {
		...state,
		entityStates: isRecord(state.entityStates) ? { ...state.entityStates } : {},
		questFlags: isRecord(state.questFlags) ? { ...state.questFlags } : {},
		cooldowns: isRecord(state.cooldowns) ? { ...state.cooldowns } : {},
		seq: commit.clientSeq,
		tick: Number.isInteger(state.tick) ? state.tick + 1 : 1,
		contentVersion: commit.contentVersion,
	};
}

function applyManifestTransition(nextState, triggerDef) {
	if (!triggerDef.transition) return;
	if (!triggerDef.transition.mapId) return;
	if (!Number.isInteger(triggerDef.transition.x) || !Number.isInteger(triggerDef.transition.y)) return;
	nextState.mapId = triggerDef.transition.mapId;
	nextState.playerPos = {
		x: triggerDef.transition.x,
		y: triggerDef.transition.y,
	};
}

function applyQuestFlagPatch(nextState, patch) {
	for (const [flag, value] of Object.entries(patch || {})) {
		nextState.questFlags[flag] = Boolean(value);
	}
}

function applyCharacterCommandToState({ state, commit, character }) {
	const nextState = buildNextStateBase(state, commit);
	const existingRoster = Array.isArray(nextState.entityStates.characterRoster)
		? nextState.entityStates.characterRoster.filter((entry) => isRecord(entry))
		: [];
	const characterRoster = existingRoster.map((entry) => ({ ...entry }));
	const playerProfile = isRecord(nextState.entityStates.playerProfile)
		? { ...nextState.entityStates.playerProfile }
		: {};
	const nextCharactersCreated = toNonNegativeInteger(playerProfile.charactersCreated, 0) + 1;

	const rosterEntry = {
		commitId: commit.id,
		clientSeq: commit.clientSeq,
		createdAt: commit.createdAt,
		mode: character.mode,
		name: character.name,
		gender: character.gender,
		raceId: character.raceId,
		classId: character.classId,
		secondaryClassId: character.secondaryClassId,
		originId: character.originId,
		professionId: character.professionId,
		archetypeSystemId: character.archetypeSystemId,
		alignmentId: character.alignmentId,
		skillLoadoutId: character.skillLoadoutId,
		activeSkillIds: [...character.activeSkillIds],
		passiveSkillIds: [...character.passiveSkillIds],
		perkIds: [...character.perkIds],
		starterTreeIds: [...character.starterTreeIds],
		attributes: { ...character.attributes },
		blueprint: {
			...character.blueprint,
			activeSkillIds: [...character.blueprint.activeSkillIds],
			passiveSkillIds: [...character.blueprint.passiveSkillIds],
			perkIds: [...character.blueprint.perkIds],
			starterTreeIds: [...character.blueprint.starterTreeIds],
			attributes: { ...character.blueprint.attributes },
		},
	};

	characterRoster.push(rosterEntry);
	playerProfile.charactersCreated = nextCharactersCreated;
	playerProfile.advancedCreationUnlocked = nextCharactersCreated >= 1;
	playerProfile.lastCreationMode = character.mode;

	nextState.entityStates.characterRoster = characterRoster;
	nextState.entityStates.activeCharacter = { ...rosterEntry };
	nextState.entityStates.playerProfile = playerProfile;
	nextState.questFlags.character_created = true;
	nextState.questFlags.character_creation_completed = true;
	nextState.stateHash = hashCanonicalState(createHashPayload(nextState));
	return nextState;
}

function applyCommitToState({ state, commit, triggerDef, resolvedTargetId, character }) {
	if (normalizeString(commit.commandType).toUpperCase() === CHARACTER_COMMAND_TYPE) {
		return applyCharacterCommandToState({ state, commit, character });
	}

	const nextState = buildNextStateBase(state, commit);
	nextState.playerPos = {
		x: commit.trigger.x,
		y: commit.trigger.y,
	};

	applyQuestFlagPatch(nextState, triggerDef.setQuestFlags);

	if (commit.triggerType === "INTERACT") {
		if (resolvedTargetId) {
			nextState.entityStates[resolvedTargetId] = {
				...(isRecord(nextState.entityStates[resolvedTargetId])
					? nextState.entityStates[resolvedTargetId]
					: {}),
				lastInteractedSeq: commit.clientSeq,
				lastInteractedAt: commit.createdAt,
			};
		}
	}

	if (commit.triggerType === "ENCOUNTER_GATE") {
		const rng = createDeterministicRng({
			runSeed: nextState.runSeed,
			seq: commit.clientSeq,
			subsystemTag: "encounter",
		});
		const roll = Math.floor(rng() * 100);
		const encounterResult = applyEncounterProgressionMutation({
			nextState,
			commit,
			triggerDef,
			resolvedTargetId,
			roll,
		});
		nextState.entityStates.encounter = {
			gateId: resolvedTargetId || triggerDef.id,
			status: "resolved",
			roll,
			outcome:
				encounterResult.outcome === "victory"
					? "win"
					: encounterResult.outcome,
			rewards: {
				xp: encounterResult.reward.xp,
				gold: encounterResult.reward.gold,
				itemId: encounterResult.reward.itemId,
				quantity: encounterResult.reward.quantity,
			},
		};
		nextState.questFlags.quest_tutorial_encounter_resolved = true;
		nextState.questFlags.quest_tutorial_encounter_win =
			encounterResult.outcome === "victory";
		applyManifestTransition(nextState, triggerDef);
	}

	if (commit.triggerType === "ZONE_EXIT") {
		applyManifestTransition(nextState, triggerDef);
	}

	if (commit.triggerType === "SAVEPOINT") {
		const progression = normalizeProgressionState(
			nextState.entityStates.progression || createDefaultProgressionState(),
		);
		nextState.entityStates.progression = progression;
		const inventoryUnitCount = progression.inventory.reduce(
			(total, item) => total + toNonNegativeInteger(item.quantity, 0),
			0,
		);
		nextState.entityStates.lastSavepoint = {
			triggerId: triggerDef.id,
			mapId: commit.trigger.mapId,
			x: commit.trigger.x,
			y: commit.trigger.y,
			seq: commit.clientSeq,
			tick: nextState.tick,
			progression: {
				level: progression.level,
				xp: progression.xp,
				gold: progression.gold,
				inventoryUnitCount,
			},
		};
		nextState.questFlags.quest_tutorial_savepoint_bound = true;
	}

	if (commit.triggerType === "ENTER_TILE") {
		// ENTER_TILE is local-movement reconciled only on triggers; quest flags were patched above.
	}

	nextState.cooldowns[triggerDef.id] = commit.createdAtMs;
	nextState.stateHash = hashCanonicalState(createHashPayload(nextState));
	return nextState;
}

function replayCommitLog({ manifest, runId, commits, initialState }) {
	const activeManifest = manifest || getWorldManifest();
	let state =
		initialState ||
		buildInitialGameplayState({
			runId,
			manifest: activeManifest,
			contentVersion: activeManifest.contentVersion,
		});

	const timeline = [];
	for (const rawCommit of commits || []) {
		const normalized = normalizeCommitEnvelope(rawCommit);
		if (!normalized.ok) {
			timeline.push({
				accepted: false,
				errorCode: normalized.errorCode,
				message: normalized.message,
			});
			continue;
		}

		if (normalized.commit.clientSeq !== state.seq + 1) {
			timeline.push({
				accepted: false,
				errorCode: "OUT_OF_ORDER_SEQ",
				message: "Commit sequence must be strictly monotonic.",
				commit: normalized.commit,
			});
			continue;
		}

		const commitValidation = validateCommitAgainstState({
			manifest: activeManifest,
			state,
			commit: normalized.commit,
		});
		if (!commitValidation.ok) {
			timeline.push({
				accepted: false,
				errorCode: commitValidation.errorCode,
				message: commitValidation.message,
				commit: normalized.commit,
			});
			continue;
		}

		state = applyCommitToState({
			state,
			commit: normalized.commit,
			triggerDef: commitValidation.triggerDef,
			resolvedTargetId: commitValidation.resolvedTargetId,
			character: commitValidation.character,
		});
		timeline.push({
			accepted: true,
			commit: normalized.commit,
			seq: state.seq,
			tick: state.tick,
			stateHash: state.stateHash,
		});
	}

	return {
		state,
		timeline,
	};
}

function toPublicState(state) {
	if (!state) return null;
	return {
		worldId: state.worldId,
		mapId: state.mapId,
		playerPos: state.playerPos,
		entityStates: state.entityStates,
		questFlags: state.questFlags,
		runId: state.runId,
		seq: state.seq,
		tick: state.tick,
		stateHash: state.stateHash,
		contentVersion: state.contentVersion,
		stateVersion: state.stateVersion,
	};
}

module.exports = {
	TRIGGER_TYPES,
	SYNC_EVENT_TYPES,
	MAX_ENTER_TILE_BATCH_WINDOW_MS,
	MAX_ENTER_TILE_BATCH_ITEMS,
	BATCHABLE_TRIGGER_TYPE,
	IMMEDIATE_TRIGGER_TYPES,
	stableJsonStringify,
	hashCanonicalState,
	deriveRngSeed,
	createDeterministicRng,
	getWorldManifest,
	clearWorldManifestCache,
	normalizeCommitEnvelope,
	normalizeCommitBatchRequest,
	buildInitialGameplayState,
	validateTriggerAgainstManifest,
	validateCommitAgainstState,
	applyCommitToState,
	replayCommitLog,
	toPublicState,
	normalizeEventType,
	normalizeSyncEvent,
};
