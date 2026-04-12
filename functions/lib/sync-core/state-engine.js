const { CHARACTER_COMMAND_VERBS_V1 } = require("../sync-command-contract");
const {
	CHARACTER_COMMAND_TYPE,
	CHARACTER_COMMAND_CREATE_VERB,
	DEFAULT_STATE_VERSION,
} = require("./constants");
const {
	createDeterministicRng,
	hashCanonicalState,
	sha256Hex,
} = require("./deterministic");
const { getWorldManifest } = require("./manifest-store");
const {
	createDefaultProgressionState,
	normalizeProgressionState,
	applyEncounterProgressionMutation,
} = require("./reward-policy");
const {
	normalizeCommitEnvelope,
	normalizeCharacterCreatePayload,
} = require("./commit-normalization");
const { isRecord, normalizeString, toFiniteNumber, toNonNegativeInteger } = require("./shared");

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
	if (
		commit.trigger.targetId &&
		triggerDef.targetId &&
		commit.trigger.targetId !== triggerDef.targetId
	) {
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
		return validateCharacterCommand({ manifest, commit });
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
	if (!Number.isInteger(triggerDef.transition.x) || !Number.isInteger(triggerDef.transition.y)) {
		return;
	}
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
		skillCatalogVersion: character.skillCatalogVersion || character.blueprint?.skillCatalogVersion || null,
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

	if (commit.triggerType === "INTERACT" && resolvedTargetId) {
		nextState.entityStates[resolvedTargetId] = {
			...(isRecord(nextState.entityStates[resolvedTargetId])
				? nextState.entityStates[resolvedTargetId]
				: {}),
			lastInteractedSeq: commit.clientSeq,
			lastInteractedAt: commit.createdAt,
		};
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
				encounterResult.outcome === "victory" ? "win" : encounterResult.outcome,
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
	buildInitialGameplayState,
	createHashPayload,
	validateTriggerAgainstManifest,
	validateCharacterCommand,
	validateCommitAgainstState,
	buildNextStateBase,
	applyManifestTransition,
	applyQuestFlagPatch,
	applyCharacterCommandToState,
	applyCommitToState,
	replayCommitLog,
	toPublicState,
};
