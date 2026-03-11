const TRIGGER_COMMAND_TYPE_V1 = "TRIGGER";
const CHARACTER_COMMAND_TYPE_V1 = "CHARACTER";

const TRIGGER_COMMAND_VERBS_V1 = Object.freeze([
	"ENTER_TILE",
	"INTERACT",
	"ZONE_EXIT",
	"ENCOUNTER_GATE",
	"SAVEPOINT",
]);

const CHARACTER_COMMAND_VERBS_V1 = Object.freeze(["CREATE"]);

const SYNC_COMMAND_TYPES_V1 = Object.freeze([
	TRIGGER_COMMAND_TYPE_V1,
	CHARACTER_COMMAND_TYPE_V1,
]);

// Legacy export: keep trigger verbs as the default progression/sync verb list.
const SYNC_COMMAND_VERBS_V1 = TRIGGER_COMMAND_VERBS_V1;

const ALL_SYNC_COMMAND_VERBS_V1 = Object.freeze([
	...TRIGGER_COMMAND_VERBS_V1,
	...CHARACTER_COMMAND_VERBS_V1,
]);

const COMMAND_VERB_POLICY_V1 = Object.freeze({
	ENTER_TILE: Object.freeze({ batchable: true, immediate: false }),
	INTERACT: Object.freeze({ batchable: false, immediate: true }),
	ZONE_EXIT: Object.freeze({ batchable: false, immediate: true }),
	ENCOUNTER_GATE: Object.freeze({ batchable: false, immediate: true }),
	SAVEPOINT: Object.freeze({ batchable: false, immediate: true }),
});

const COMMAND_VERBS_BY_TYPE_V1 = Object.freeze({
	[TRIGGER_COMMAND_TYPE_V1]: TRIGGER_COMMAND_VERBS_V1,
	[CHARACTER_COMMAND_TYPE_V1]: CHARACTER_COMMAND_VERBS_V1,
});

function normalizeUpperString(value) {
	return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeSyncCommandType(value) {
	const normalized = normalizeUpperString(value);
	return SYNC_COMMAND_TYPES_V1.includes(normalized) ? normalized : "";
}

function getSupportedCommandVerbs(commandType) {
	const normalizedType = normalizeSyncCommandType(commandType);
	return COMMAND_VERBS_BY_TYPE_V1[normalizedType] || ALL_SYNC_COMMAND_VERBS_V1;
}

function normalizeSyncCommandVerb(value, commandType) {
	const normalized = normalizeUpperString(value);
	return getSupportedCommandVerbs(commandType).includes(normalized) ? normalized : "";
}

module.exports = {
	TRIGGER_COMMAND_TYPE_V1,
	CHARACTER_COMMAND_TYPE_V1,
	SYNC_COMMAND_TYPES_V1,
	SYNC_COMMAND_VERBS_V1,
	ALL_SYNC_COMMAND_VERBS_V1,
	TRIGGER_COMMAND_VERBS_V1,
	CHARACTER_COMMAND_VERBS_V1,
	COMMAND_VERB_POLICY_V1,
	COMMAND_VERBS_BY_TYPE_V1,
	getSupportedCommandVerbs,
	normalizeSyncCommandType,
	normalizeSyncCommandVerb,
};
