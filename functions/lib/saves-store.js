<<<<<<< ours
=======
let dataconnectGenerated = null;
>>>>>>> theirs
const { resolveGameDbBackend, fileDb } = require("./game-db");

let firebaseAdminApp = null;
let firebaseAdminFirestore = null;
let firebaseAdminDataConnect = null;
let dataconnectGenerated = null;

const DEFAULT_COLLECTION = "game_saves";
const DEFAULT_WORLD_ID = "voidverse_slice_world_001";
const DEFAULT_MAP_ID = "map_village_square";

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function toIso(value) {
	if (!value) return null;
	if (typeof value === "string") return value;
	if (value instanceof Date) return value.toISOString();
	if (typeof value.toDate === "function") {
		try {
			return value.toDate().toISOString();
		} catch {
			return null;
		}
	}
	return null;
}

function nowIso() {
	return new Date().toISOString();
}

function getCollectionName() {
	return getOptionalEnv("GAME_SAVES_COLLECTION") || DEFAULT_COLLECTION;
}

function resolveSavesBackend() {
	const raw = getOptionalEnv("GAME_SAVES_STORAGE").toLowerCase();
	if (["file", "filesystem", "fs", "json", "local"].includes(raw)) return "file";
	if (["firestore", "firebase", "cloud-firestore"].includes(raw)) return "firestore";
	if (["dataconnect", "data-connect", "dc"].includes(raw)) return "dataconnect";
	const gameBackend = resolveGameDbBackend();
	if (gameBackend === "file") return "file";
	return "dataconnect";
}

function isDataconnectStrictMode() {
	const strictRaw =
		getOptionalEnv("SAVES_DATACONNECT_STRICT") ||
		getOptionalEnv("GAME_DATACONNECT_STRICT");
	return strictRaw.toLowerCase() === "true";
}


function getDataconnectGenerated() {
	if (!dataconnectGenerated) {
		dataconnectGenerated = require("../src/dataconnect-admin-generated");
	}
	return dataconnectGenerated;
}

function loadFirebaseAdmin() {
	if (firebaseAdminApp && firebaseAdminFirestore && firebaseAdminDataConnect) {
		return;
	}

	firebaseAdminApp = require("firebase-admin/app");
	firebaseAdminFirestore = require("firebase-admin/firestore");
	firebaseAdminDataConnect = require("firebase-admin/data-connect");
}

function getFirestoreDb() {
	loadFirebaseAdmin();
	if (firebaseAdminApp.getApps().length === 0) {
		firebaseAdminApp.initializeApp();
	}
	return firebaseAdminFirestore.getFirestore();
}

function getDataConnectDb() {
	loadFirebaseAdmin();
<<<<<<< ours
	const generated = loadDataconnectGenerated();
	return firebaseAdminDataConnect.getDataConnect(generated.connectorConfig);
}

function loadDataconnectGenerated() {
	if (dataconnectGenerated) return dataconnectGenerated;
	dataconnectGenerated = require("../src/dataconnect-admin-generated");
	return dataconnectGenerated;
=======
	return firebaseAdminDataConnect.getDataConnect(getDataconnectGenerated().connectorConfig);
>>>>>>> theirs
}

function normalizeString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function toInteger(value, fallback = 0) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.floor(parsed);
}

function safeParseJson(value, fallback = null) {
	if (value === null || value === undefined) return fallback;
	if (typeof value === "object") return value;
	if (typeof value !== "string") return fallback;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
}

function isRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toJsonOrNull(value) {
	if (!isRecord(value) && !Array.isArray(value)) return null;
	try {
		return JSON.stringify(value);
	} catch {
		return null;
	}
}

function buildDcOptions(userId) {
	const uid = normalizeString(userId);
	return {
		impersonate: {
			authClaims: {
				sub: uid,
				uid,
				user_id: uid,
				email_verified: false,
			},
		},
	};
}

function extractSaveSlotMetadata(gameStateInput) {
	const parsed = safeParseJson(gameStateInput, {});
	const gameState = isRecord(parsed) ? parsed : {};
	const player = isRecord(gameState.player) ? gameState.player : {};
	const world = isRecord(gameState.world) ? gameState.world : {};
	const location = isRecord(world.location) ? world.location : {};

	const mapId =
		normalizeString(gameState.mapId) ||
		normalizeString(location.current) ||
		DEFAULT_MAP_ID;
	const locationId = normalizeString(gameState.locationId) || mapId;
	const worldId = normalizeString(world.id) || normalizeString(gameState.worldId) || DEFAULT_WORLD_ID;
	const turnCount = toInteger(world.turnCount, toInteger(world.time, toInteger(gameState.tick, 0)));
	const playerName = normalizeString(player.name) || "Traveler";
	const playerLevel = Math.max(1, toInteger(player.level, 1));

	const playerPosJson = toJsonOrNull(gameState.playerPos);
	const entityStatesJson = toJsonOrNull(gameState.entityStates);
	const questFlagsJson = toJsonOrNull(
		isRecord(gameState.questFlags) ? gameState.questFlags : world.flags,
	);

	return {
		worldId,
		locationId,
		mapId,
		playerName,
		playerLevel,
		turnCount,
		playerPosJson,
		entityStatesJson,
		questFlagsJson,
		contentVersion: normalizeString(gameState.contentVersion) || null,
		stateVersion: Number.isInteger(gameState.stateVersion) ? gameState.stateVersion : null,
		runId: normalizeString(gameState.runId) || null,
		seq: Number.isInteger(gameState.seq) ? gameState.seq : null,
		tick: Number.isInteger(gameState.tick) ? gameState.tick : null,
		stateHash: normalizeString(gameState.stateHash) || null,
	};
}

function buildSaveSlotVars({ saveId, saveName, gameState }) {
	const stateJson =
		typeof gameState === "string"
			? gameState
			: JSON.stringify(gameState && typeof gameState === "object" ? gameState : {});
	const metadata = extractSaveSlotMetadata(stateJson);
	return {
		id: String(saveId),
		saveName: String(saveName),
		gameStateJson: stateJson,
		playerName: metadata.playerName,
		playerLevel: metadata.playerLevel,
		worldId: metadata.worldId,
		locationId: metadata.locationId,
		mapId: metadata.mapId,
		playerPosJson: metadata.playerPosJson,
		entityStatesJson: metadata.entityStatesJson,
		questFlagsJson: metadata.questFlagsJson,
		turnCount: metadata.turnCount,
		contentVersion: metadata.contentVersion,
		stateVersion: metadata.stateVersion,
		runId: metadata.runId,
		seq: metadata.seq,
		tick: metadata.tick,
		stateHash: metadata.stateHash,
	};
}

function mapDataconnectSave({ userId, slot }) {
	if (!slot || typeof slot !== "object") return null;
	return {
		id: String(slot.id || ""),
		user_id: String(userId || ""),
		save_name: String(slot.saveName || "Auto Save"),
		game_state: slot.gameStateJson,
		created_at: toIso(slot.createdAt),
		updated_at: toIso(slot.updatedAt),
	};
}

async function ensureDcProfile({ userId, displayName }) {
	const generated = loadDataconnectGenerated();
	const dc = getDataConnectDb();
<<<<<<< ours
	await generated.upsertMyProfile(
=======
	await getDataconnectGenerated().upsertMyProfile(
>>>>>>> theirs
		dc,
		{ displayName: normalizeString(displayName) || "Traveler" },
		buildDcOptions(userId),
	);
}

async function dcListSaves({ userId, limit }) {
	const generated = loadDataconnectGenerated();
	const dc = getDataConnectDb();
<<<<<<< ours
	const response = await generated.listMySaveSlots(
=======
	const response = await getDataconnectGenerated().listMySaveSlots(
>>>>>>> theirs
		dc,
		buildDcOptions(userId),
	);
	const slots = Array.isArray(response?.data?.userProfile?.saveSlots)
		? response.data.userProfile.saveSlots
		: [];
	return slots
		.map((slot) => mapDataconnectSave({ userId, slot }))
		.filter(Boolean)
		.sort((a, b) =>
			String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
		)
		.slice(0, limit)
		.map((row) => ({
			id: row.id,
			save_name: row.save_name,
			created_at: row.created_at,
			updated_at: row.updated_at,
		}));
}

async function dcGetSave({ userId, saveId }) {
	const generated = loadDataconnectGenerated();
	const dc = getDataConnectDb();
<<<<<<< ours
	const response = await generated.getMySaveSlot(
=======
	const response = await getDataconnectGenerated().getMySaveSlot(
>>>>>>> theirs
		dc,
		{ id: String(saveId) },
		buildDcOptions(userId),
	);
	const slot = response?.data?.saveSlot;
	if (!slot) return null;
	return mapDataconnectSave({ userId, slot });
}

async function dcCreateSave({ saveId, userId, saveName, gameState, now }) {
	const generated = loadDataconnectGenerated();
	const vars = buildSaveSlotVars({ saveId, saveName, gameState });
	await ensureDcProfile({ userId, displayName: vars.playerName });
	const dc = getDataConnectDb();
<<<<<<< ours
	await generated.upsertSaveSlot(dc, vars, buildDcOptions(userId));
=======
	await getDataconnectGenerated().upsertSaveSlot(dc, vars, buildDcOptions(userId));
>>>>>>> theirs
	const row = await dcGetSave({ userId, saveId: vars.id });
	if (row) return row;
	return {
		id: String(vars.id),
		user_id: String(userId),
		save_name: String(saveName),
		game_state: vars.gameStateJson,
		created_at: now || nowIso(),
		updated_at: now || nowIso(),
	};
}

async function dcUpdateSave({ userId, saveId, saveName, gameState, now }) {
	const generated = loadDataconnectGenerated();
	const existing = await dcGetSave({ userId, saveId });
	if (!existing) return null;

	const vars = buildSaveSlotVars({ saveId, saveName, gameState });
	await ensureDcProfile({ userId, displayName: vars.playerName });
	const dc = getDataConnectDb();
<<<<<<< ours
	await generated.upsertSaveSlot(dc, vars, buildDcOptions(userId));
=======
	await getDataconnectGenerated().upsertSaveSlot(dc, vars, buildDcOptions(userId));
>>>>>>> theirs
	const updated = await dcGetSave({ userId, saveId });
	if (updated) return updated;
	return {
		...existing,
		save_name: String(saveName),
		game_state: vars.gameStateJson,
		updated_at: now || nowIso(),
	};
}

async function dcDeleteSave({ userId, saveId }) {
	const generated = loadDataconnectGenerated();
	const existing = await dcGetSave({ userId, saveId });
	if (!existing) return false;
	const dc = getDataConnectDb();
<<<<<<< ours
	await generated.deleteSaveSlot(
=======
	await getDataconnectGenerated().deleteSaveSlot(
>>>>>>> theirs
		dc,
		{ id: String(saveId) },
		buildDcOptions(userId),
	);
	return true;
}

function mapFirestoreSave(doc) {
	const data = doc.data() || {};
	return {
		id: String(doc.id),
		user_id: String(data.user_id || ""),
		save_name: String(data.save_name || "Auto Save"),
		game_state:
			typeof data.game_state === "string" ? data.game_state : data.game_state,
		created_at: toIso(data.created_at),
		updated_at: toIso(data.updated_at),
	};
}

async function fireListSaves({ userId, limit }) {
	const snapshot = await getFirestoreDb()
		.collection(getCollectionName())
		.where("user_id", "==", String(userId))
		.orderBy("updated_at", "desc")
		.limit(limit)
		.get();

	return snapshot.docs
		.map(mapFirestoreSave)
		.map((row) => ({
			id: row.id,
			save_name: row.save_name,
			created_at: row.created_at,
			updated_at: row.updated_at,
		}));
}

async function fireGetSave({ userId, saveId }) {
	const snap = await getFirestoreDb()
		.collection(getCollectionName())
		.doc(String(saveId))
		.get();
	if (!snap.exists) return null;
	const row = mapFirestoreSave(snap);
	if (row.user_id !== String(userId)) return null;
	return row;
}

async function fireCreateSave({ saveId, userId, saveName, gameState, now }) {
	const iso = now || nowIso();
	const ts = firebaseAdminFirestore.Timestamp.fromDate(new Date(iso));
	const row = {
		user_id: String(userId),
		save_name: String(saveName),
		game_state: gameState,
		created_at: ts,
		updated_at: ts,
	};
	await getFirestoreDb()
		.collection(getCollectionName())
		.doc(String(saveId))
		.set(row, { merge: false });

	return {
		id: String(saveId),
		user_id: String(userId),
		save_name: String(saveName),
		game_state: gameState,
		created_at: iso,
		updated_at: iso,
	};
}

async function fireUpdateSave({ userId, saveId, saveName, gameState, now }) {
	const docRef = getFirestoreDb().collection(getCollectionName()).doc(String(saveId));
	const snap = await docRef.get();
	if (!snap.exists) return null;

	const existing = mapFirestoreSave(snap);
	if (existing.user_id !== String(userId)) return null;

	const iso = now || nowIso();
	const ts = firebaseAdminFirestore.Timestamp.fromDate(new Date(iso));
	await docRef.update({
		save_name: String(saveName),
		game_state: gameState,
		updated_at: ts,
	});

	return {
		...existing,
		save_name: String(saveName),
		game_state: gameState,
		updated_at: iso,
	};
}

async function fireDeleteSave({ userId, saveId }) {
	const docRef = getFirestoreDb().collection(getCollectionName()).doc(String(saveId));
	const snap = await docRef.get();
	if (!snap.exists) return false;
	const row = mapFirestoreSave(snap);
	if (row.user_id !== String(userId)) return false;
	await docRef.delete();
	return true;
}

async function withBackend({ dataconnectFn, firestoreFn, fileFn }) {
	const backend = resolveSavesBackend();
	if (backend === "file") {
		return fileFn();
	}
	if (backend === "dataconnect") {
		try {
			return await dataconnectFn();
		} catch (error) {
			if (isDataconnectStrictMode()) {
				throw error;
			}
			return firestoreFn();
		}
	}
	return firestoreFn();
}

async function listSaves({ userId, limit }) {
	return withBackend({
		dataconnectFn: () => dcListSaves({ userId, limit }),
		firestoreFn: () => fireListSaves({ userId, limit }),
		fileFn: () => fileDb.listSaves({ userId, limit }),
	});
}

async function getSave({ userId, saveId }) {
	return withBackend({
		dataconnectFn: () => dcGetSave({ userId, saveId }),
		firestoreFn: () => fireGetSave({ userId, saveId }),
		fileFn: () => fileDb.getSave({ userId, saveId }),
	});
}

async function createSave({ saveId, userId, saveName, gameState, now }) {
	return withBackend({
		dataconnectFn: () =>
			dcCreateSave({ saveId, userId, saveName, gameState, now }),
		firestoreFn: () =>
			fireCreateSave({ saveId, userId, saveName, gameState, now }),
		fileFn: () => fileDb.createSave({ saveId, userId, saveName, gameState, now }),
	});
}

async function updateSave({ userId, saveId, saveName, gameState, now }) {
	return withBackend({
		dataconnectFn: () =>
			dcUpdateSave({ userId, saveId, saveName, gameState, now }),
		firestoreFn: () =>
			fireUpdateSave({ userId, saveId, saveName, gameState, now }),
		fileFn: () => fileDb.updateSave({ userId, saveId, saveName, gameState, now }),
	});
}

async function deleteSave({ userId, saveId }) {
	return withBackend({
		dataconnectFn: () => dcDeleteSave({ userId, saveId }),
		firestoreFn: () => fireDeleteSave({ userId, saveId }),
		fileFn: () => fileDb.deleteSave({ userId, saveId }),
	});
}

module.exports = {
	resolveSavesBackend,
	listSaves,
	getSave,
	createSave,
	updateSave,
	deleteSave,
};
