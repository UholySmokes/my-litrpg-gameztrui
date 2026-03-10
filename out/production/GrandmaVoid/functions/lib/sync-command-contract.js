const SYNC_COMMAND_TYPES_V1 = Object.freeze(["TRIGGER"]);

const SYNC_COMMAND_VERBS_V1 = Object.freeze([
	"ENTER_TILE",
	"INTERACT",
	"ZONE_EXIT",
	"ENCOUNTER_GATE",
	"SAVEPOINT",
]);

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

function normalizeSyncCommandVerb(value) {
	const normalized = normalizeUpperString(value);
	return SYNC_COMMAND_VERBS_V1.includes(normalized) ? normalized : "";
}

module.exports = {
	SYNC_COMMAND_TYPES_V1,
	SYNC_COMMAND_VERBS_V1,
	COMMAND_VERB_POLICY_V1,
	normalizeSyncCommandType,
	normalizeSyncCommandVerb,
};
