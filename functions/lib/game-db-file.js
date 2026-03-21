const fs = require("fs");
const path = require("path");
const { computeSaveStateHash } = require("./save-versioning");

const DEFAULT_DB_PATH = path.resolve(__dirname, "..", ".data", "game-db.json");

function nowIso() {
	return new Date().toISOString();
}

function getOptionalEnv(name) {
	const value = process.env[name];
	return typeof value === "string" && value.trim() ? value.trim() : "";
}

function resolveDbPath() {
	const configured = getOptionalEnv("GAME_DB_PATH");
	if (!configured) return DEFAULT_DB_PATH;
	if (path.isAbsolute(configured)) return configured;
	const normalized = configured.startsWith("functions/")
		? configured.slice("functions/".length)
		: configured;
	return path.resolve(__dirname, "..", normalized);
}

function createEmptyDb() {
	const iso = nowIso();
	return {
		version: 1,
		created_at: iso,
		updated_at: iso,
		saves: [],
	};
}

function normalizeDb(value) {
	const base = createEmptyDb();
	if (!value || typeof value !== "object" || Array.isArray(value)) return base;
	return {
		...base,
		version: Number.isFinite(Number(value.version)) ? Number(value.version) : 1,
		created_at:
			typeof value.created_at === "string" ? value.created_at : base.created_at,
		updated_at:
			typeof value.updated_at === "string" ? value.updated_at : base.updated_at,
		saves: Array.isArray(value.saves) ? value.saves : [],
	};
}

function readDb() {
	const filePath = resolveDbPath();
	try {
		const raw = fs.readFileSync(filePath, "utf8");
		return normalizeDb(JSON.parse(raw));
	} catch {
		return createEmptyDb();
	}
}

function writeDb(db) {
	const filePath = resolveDbPath();
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	const tmpPath = `${filePath}.tmp`;
	fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
	try {
		fs.renameSync(tmpPath, filePath);
	} catch {
		fs.copyFileSync(tmpPath, filePath);
		fs.unlinkSync(tmpPath);
	}
}

function persistDb(db) {
	db.updated_at = nowIso();
	writeDb(db);
}

function listSaves({ userId, limit }) {
	const db = readDb();
	return db.saves
		.filter((row) => row.user_id === userId)
		.sort((a, b) =>
			String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
		)
		.slice(0, limit)
		.map((row) => ({
			id: row.id,
			save_name: row.save_name,
			created_at: row.created_at,
			updated_at: row.updated_at,
      state_hash: row.state_hash || computeSaveStateHash(row.game_state),
		}));
}

function getSave({ userId, saveId }) {
	const db = readDb();
	const row = db.saves.find((entry) => entry.id === saveId && entry.user_id === userId);
  if (!row) return null;
  return {
    ...row,
    state_hash: row.state_hash || computeSaveStateHash(row.game_state),
  };
}

function createSave({ saveId, userId, saveName, gameState, now }) {
	const iso = now || nowIso();
	const db = readDb();
  const stateHash = computeSaveStateHash(gameState);
	const row = {
		id: saveId,
		user_id: userId,
		save_name: saveName,
		game_state: gameState,
    state_hash: stateHash,
		created_at: iso,
		updated_at: iso,
	};
	db.saves.unshift(row);
	persistDb(db);
	return row;
}

function updateSave({ userId, saveId, saveName, gameState, now }) {
	const iso = now || nowIso();
	const db = readDb();
	const idx = db.saves.findIndex(
		(row) => row.id === saveId && row.user_id === userId,
	);
	if (idx === -1) return null;
	const updated = {
		...db.saves[idx],
		save_name: saveName,
		game_state: gameState,
    state_hash: computeSaveStateHash(gameState),
		updated_at: iso,
	};
	db.saves[idx] = updated;
	persistDb(db);
	return updated;
}

function deleteSave({ userId, saveId }) {
	const db = readDb();
	const before = db.saves.length;
	db.saves = db.saves.filter(
		(row) => !(row.id === saveId && row.user_id === userId),
	);
	const deleted = db.saves.length !== before;
	if (deleted) persistDb(db);
	return deleted;
}

module.exports = {
	listSaves,
	getSave,
	createSave,
	updateSave,
	deleteSave,
};

