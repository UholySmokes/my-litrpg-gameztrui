const {
	TRIGGER_TYPES,
	SYNC_EVENT_TYPES,
	CHARACTER_COMMAND_TYPE,
	BATCHABLE_TRIGGER_TYPE,
	MAX_ENTER_TILE_BATCH_WINDOW_MS,
	MAX_ENTER_TILE_BATCH_ITEMS,
} = require("./constants");
const {
	isRecord,
	normalizeString,
	parseIsoTimestampMs,
	toInteger,
} = require("./shared");

const SYNC_EVENT_TYPE_SET = new Set(SYNC_EVENT_TYPES);
const TRIGGER_TYPE_SET = new Set(TRIGGER_TYPES);

function normalizeEventType(value, fallback = "TRIGGER") {
	const raw = normalizeString(value).toUpperCase();
	if (SYNC_EVENT_TYPE_SET.has(raw)) return raw;
	const fallbackUpper = normalizeString(fallback).toUpperCase();
	if (SYNC_EVENT_TYPE_SET.has(fallbackUpper)) return fallbackUpper;
	return "TRIGGER";
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
		source.activeSkillIds ||
			source.activeSkills ||
			blueprint.activeSkillIds ||
			blueprint.activeSkills,
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
	const commandType = normalizeString(input.commandType || commandPayload?.type).toUpperCase();
	const triggerType = normalizeString(input.triggerType).toUpperCase();
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

module.exports = {
	normalizeEventType,
	normalizeSyncEvent,
	normalizeUniqueIdList,
	normalizeCharacterRefId,
	normalizeCharacterAttributes,
	normalizeCharacterCreatePayload,
	normalizeCommitEnvelope,
	normalizeCommitBatchRequest,
};
