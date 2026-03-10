const crypto = require("crypto");
const { getDataConnect } = require("firebase-admin/data-connect");
const dataconnectGenerated = require("../src/dataconnect-admin-generated");
const { getSave, createSave, updateSave } = require("./saves-store");

const GUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function resolveSnapshotPreference() {
	const value = normalizeString(process.env.SYNC_CANONICAL_PERSISTENCE).toLowerCase();
	if (["dataconnect", "data-connect", "dc"].includes(value)) return "dataconnect";
	if (["firestore", "fallback", "legacy"].includes(value)) return "fallback";
	return "dataconnect";
}

function ensureUuid(value) {
	const raw = normalizeString(value);
	if (GUID_REGEX.test(raw)) return raw.toLowerCase();
	return crypto.randomUUID();
}

function toNonNegativeInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) return fallback;
	return parsed;
}

function readProgressionState(runState) {
	const progression =
		runState?.entityStates && typeof runState.entityStates === "object"
			? runState.entityStates.progression
			: null;
	const source = progression && typeof progression === "object" ? progression : {};
	const level = Math.max(1, toNonNegativeInteger(source.level, 1));
	const xp = toNonNegativeInteger(source.xp, 0);
	const gold = toNonNegativeInteger(source.gold, 0);
	const inventory = Array.isArray(source.inventory)
		? source.inventory
				.filter((entry) => entry && typeof entry === "object")
				.map((entry) => ({
					id: normalizeString(entry.id),
					quantity: toNonNegativeInteger(entry.quantity, 0),
				}))
				.filter((entry) => entry.id && entry.quantity > 0)
		: [];
	return {
		level,
		xp,
		gold,
		inventory,
	};
}

function buildMinimalPlayerState(runState) {
	const progression = readProgressionState(runState);
	return {
		name: "Traveler",
		level: progression.level,
		hp: { current: 100, max: 100 },
		mana: { current: 50, max: 50 },
		attributes: {},
		inventory: progression.inventory,
		equipment: {},
		abilities: [],
		titles: [],
		unlockedTitles: [],
		equippedTitle: null,
		activeSkills: [],
		passiveSkills: [],
		xp: { current: progression.xp, max: progression.level * 100 },
		gold: progression.gold,
	};
}

function buildMinimalWorldState(runState) {
	return {
		id: String(runState?.worldId || "voidverse_slice_world_001"),
		location: {
			current: String(runState?.mapId || "map_village_square"),
			visited: [String(runState?.mapId || "map_village_square")],
			unlockedAreas: [String(runState?.mapId || "map_village_square")],
			biome: "slice",
		},
		flags:
			runState?.questFlags && typeof runState.questFlags === "object"
				? runState.questFlags
				: {},
		vars: {},
		counters: {},
		factionReputation: {},
		time: Number.isInteger(runState?.tick) ? runState.tick : 0,
		turnCount: Number.isInteger(runState?.tick) ? runState.tick : 0,
	};
}

function buildSaveGameState(runState) {
	return {
		player: buildMinimalPlayerState(runState),
		world: buildMinimalWorldState(runState),
		quests: {
			active: [],
			completed: [],
		},
		config: {},
		narrative: {
			lastTrigger: runState?.entityStates?.lastSavepoint?.triggerId || null,
		},
		combat:
			runState?.entityStates?.combat || runState?.entityStates?.encounter || null,
	};
}

function buildSaveSlotVariables({ saveSlotId, runState }) {
	const gameState = buildSaveGameState(runState);
	const mapId = normalizeString(runState?.mapId) || "map_village_square";
	const playerPosJson = JSON.stringify(
		runState?.playerPos && typeof runState.playerPos === "object"
			? runState.playerPos
			: { x: 0, y: 0 },
	);
	const entityStatesJson = JSON.stringify(
		runState?.entityStates && typeof runState.entityStates === "object"
			? runState.entityStates
			: {},
	);
	const questFlagsJson = JSON.stringify(
		runState?.questFlags && typeof runState.questFlags === "object"
			? runState.questFlags
			: {},
	);
	const contentVersion = normalizeString(runState?.contentVersion) || null;
	const stateVersion = Number.isInteger(runState?.stateVersion)
		? runState.stateVersion
		: null;
	const runId = normalizeString(runState?.runId) || null;
	const seq = Number.isInteger(runState?.seq) ? runState.seq : null;
	const tick = Number.isInteger(runState?.tick) ? runState.tick : null;
	const stateHash = normalizeString(runState?.stateHash) || null;
	return {
		id: ensureUuid(saveSlotId),
		saveName: "Auto Savepoint",
		gameStateJson: JSON.stringify(gameState),
		playerName: "Traveler",
		playerLevel: toNonNegativeInteger(gameState?.player?.level, 1),
		worldId: normalizeString(runState?.worldId) || "voidverse_slice_world_001",
		locationId: mapId,
		mapId,
		playerPosJson,
		entityStatesJson,
		questFlagsJson,
		turnCount: Number.isInteger(runState?.tick) ? runState.tick : 0,
		contentVersion,
		stateVersion,
		runId,
		seq,
		tick,
		stateHash,
	};
}

function buildImpersonation(ownerId) {
	const userId = normalizeString(ownerId);
	return {
		impersonate: {
			authClaims: {
				sub: userId,
				uid: userId,
				user_id: userId,
				email_verified: false,
			},
		},
	};
}

async function persistWithDataConnect({ ownerId, saveSlotId, runState }) {
	const vars = buildSaveSlotVariables({ saveSlotId, runState });
	const options = buildImpersonation(ownerId);
	const dc = getDataConnect(dataconnectGenerated.connectorConfig);

	await dataconnectGenerated.upsertMyProfile(dc, { displayName: "Traveler" }, options);
	await dataconnectGenerated.upsertSaveSlot(dc, vars, options);

	return {
		backend: "dataconnect",
		saveSlotId: vars.id,
	};
}

async function persistWithFallbackStore({ ownerId, saveSlotId, runState }) {
	const vars = buildSaveSlotVariables({ saveSlotId, runState });
	const existing = await getSave({ userId: ownerId, saveId: vars.id });
	if (existing) {
		await updateSave({
			userId: ownerId,
			saveId: vars.id,
			saveName: vars.saveName,
			gameState: vars.gameStateJson,
			now: new Date().toISOString(),
		});
	} else {
		await createSave({
			saveId: vars.id,
			userId: ownerId,
			saveName: vars.saveName,
			gameState: vars.gameStateJson,
			now: new Date().toISOString(),
		});
	}
	return {
		backend: "fallback",
		saveSlotId: vars.id,
	};
}

async function persistRunSnapshot({ ownerId, saveSlotId, runState }) {
	const preference = resolveSnapshotPreference();
	if (preference === "fallback") {
		return persistWithFallbackStore({ ownerId, saveSlotId, runState });
	}

	try {
		return await persistWithDataConnect({ ownerId, saveSlotId, runState });
	} catch (error) {
		const fallback = await persistWithFallbackStore({
			ownerId,
			saveSlotId,
			runState,
		});
		return {
			...fallback,
			fallbackReason: String(error?.message || "Data Connect write failed."),
		};
	}
}

module.exports = {
	persistRunSnapshot,
};
