const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { resolveGameDbBackend, fileDb } = require("./game-db");

const DEFAULT_COLLECTION = "game_saves";

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

function getFirestoreDb() {
	if (getApps().length === 0) {
		initializeApp();
	}
	return getFirestore();
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
	const ts = Timestamp.fromDate(new Date(iso));
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
	const ts = Timestamp.fromDate(new Date(iso));
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

async function withBackend({ firestoreFn, fileFn }) {
	const backend = resolveGameDbBackend();
	if (backend === "file") {
		return fileFn();
	}

	return firestoreFn();
}

async function listSaves({ userId, limit }) {
	return withBackend({
		operation: "list",
		firestoreFn: () => fireListSaves({ userId, limit }),
		fileFn: () => fileDb.listSaves({ userId, limit }),
	});
}

async function getSave({ userId, saveId }) {
	return withBackend({
		operation: "get",
		firestoreFn: () => fireGetSave({ userId, saveId }),
		fileFn: () => fileDb.getSave({ userId, saveId }),
	});
}

async function createSave({ saveId, userId, saveName, gameState, now }) {
	return withBackend({
		operation: "create",
		firestoreFn: () =>
			fireCreateSave({ saveId, userId, saveName, gameState, now }),
		fileFn: () => fileDb.createSave({ saveId, userId, saveName, gameState, now }),
	});
}

async function updateSave({ userId, saveId, saveName, gameState, now }) {
	return withBackend({
		operation: "update",
		firestoreFn: () =>
			fireUpdateSave({ userId, saveId, saveName, gameState, now }),
		fileFn: () => fileDb.updateSave({ userId, saveId, saveName, gameState, now }),
	});
}

async function deleteSave({ userId, saveId }) {
	return withBackend({
		operation: "delete",
		firestoreFn: () => fireDeleteSave({ userId, saveId }),
		fileFn: () => fileDb.deleteSave({ userId, saveId }),
	});
}

module.exports = {
	listSaves,
	getSave,
	createSave,
	updateSave,
	deleteSave,
};
