const SYNC_COMMAND_TYPES_V1 = Object.freeze(["TRIGGER", "CHARACTER"]);

const TRIGGER_COMMAND_VERBS_V1 = Object.freeze([
	"ENTER_TILE",
	"INTERACT",
	"ZONE_EXIT",
	"ENCOUNTER_GATE",
	"SAVEPOINT",
]);

const CHARACTER_COMMAND_VERBS_V1 = Object.freeze(["CREATE"]);

const SYNC_COMMAND_VERBS_V1 = Object.freeze([
	...TRIGGER_COMMAND_VERBS_V1,
	...CHARACTER_COMMAND_VERBS_V1,
]);

const COMMAND_VERBS_BY_TYPE_V1 = Object.freeze({
	TRIGGER: TRIGGER_COMMAND_VERBS_V1,
	CHARACTER: CHARACTER_COMMAND_VERBS_V1,
});

const COMMAND_VERB_POLICY_V1 = Object.freeze({
	ENTER_TILE: Object.freeze({ batchable: true, immediate: false }),
	INTERACT: Object.freeze({ batchable: false, immediate: true }),
	ZONE_EXIT: Object.freeze({ batchable: false, immediate: true }),
	ENCOUNTER_GATE: Object.freeze({ batchable: false, immediate: true }),
	SAVEPOINT: Object.freeze({ batchable: false, immediate: true }),
});

function normalizeUpperString(value) {
	return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeSyncCommandType(value) {
	const normalized = normalizeUpperString(value);
	return SYNC_COMMAND_TYPES_V1.includes(normalized) ? normalized : "";
}

function normalizeSyncCommandVerb(value, commandType = "") {
	const normalized = normalizeUpperString(value);
	const normalizedType = normalizeUpperString(commandType);
	if (normalizedType && Array.isArray(COMMAND_VERBS_BY_TYPE_V1[normalizedType])) {
		return COMMAND_VERBS_BY_TYPE_V1[normalizedType].includes(normalized)
			? normalized
			: "";
	}
	return SYNC_COMMAND_VERBS_V1.includes(normalized) ? normalized : "";
}

module.exports = {
	SYNC_COMMAND_TYPES_V1,
	TRIGGER_COMMAND_VERBS_V1,
	CHARACTER_COMMAND_VERBS_V1,
	SYNC_COMMAND_VERBS_V1,
	COMMAND_VERBS_BY_TYPE_V1,
	COMMAND_VERB_POLICY_V1,
	normalizeSyncCommandType,
	normalizeSyncCommandVerb,
};
