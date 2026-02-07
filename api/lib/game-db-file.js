const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getOptionalEnv } = require("./azure-ai-utils");

const DEFAULT_DB_PATH = path.resolve(__dirname, "..", ".data", "game-db.json");

function nowIso() {
  return new Date().toISOString();
}

function resolveDbPath() {
  const configured = getOptionalEnv("GAME_DB_PATH");
  if (!configured) return DEFAULT_DB_PATH;
  if (path.isAbsolute(configured)) return configured;
  const normalized = configured.startsWith("api/")
    ? configured.slice(4)
    : configured;
  return path.resolve(__dirname, "..", normalized);
}

function createEmptyDb() {
  const iso = nowIso();
  return {
    version: 1,
    created_at: iso,
    updated_at: iso,
    staticBundles: {},
    saves: [],
    runs: [],
    runEvents: [],
    runSnapshots: [],
  };
}

function normalizeDb(value) {
  const base = createEmptyDb();
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  return {
    ...base,
    version: Number.isFinite(Number(value.version)) ? Number(value.version) : 1,
    created_at: typeof value.created_at === "string" ? value.created_at : base.created_at,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : base.updated_at,
    staticBundles:
      value.staticBundles && typeof value.staticBundles === "object" && !Array.isArray(value.staticBundles)
        ? value.staticBundles
        : {},
    saves: Array.isArray(value.saves) ? value.saves : [],
    runs: Array.isArray(value.runs) ? value.runs : [],
    runEvents: Array.isArray(value.runEvents) ? value.runEvents : [],
    runSnapshots: Array.isArray(value.runSnapshots) ? value.runSnapshots : [],
  };
}

function readDb() {
  const filePath = resolveDbPath();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeDb(parsed);
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

function findOwnedRun(db, userId, runId) {
  return db.runs.find((run) => run.id === runId && run.user_id === userId) || null;
}

function touchRun(db, runId, now) {
  const idx = db.runs.findIndex((run) => run.id === runId);
  if (idx === -1) return;
  db.runs[idx] = { ...db.runs[idx], updated_at: now };
}

function getDbPath() {
  return resolveDbPath();
}

function health() {
  const filePath = resolveDbPath();
  const exists = fs.existsSync(filePath);
  const db = readDb();
  return {
    ok: true,
    path: filePath,
    exists,
    version: db.version,
    updated_at: db.updated_at,
  };
}

function getStaticBundle(bundleKey) {
  const db = readDb();
  const row = db.staticBundles?.[bundleKey];
  return row && typeof row === "object" ? row : null;
}

function upsertStaticBundle({ bundleKey, payload, now }) {
  const iso = now || nowIso();
  const db = readDb();
  const existing = db.staticBundles?.[bundleKey];
  const createdAt =
    existing && typeof existing.created_at === "string" ? existing.created_at : iso;
  const row = {
    bundle_key: bundleKey,
    payload,
    created_at: createdAt,
    updated_at: iso,
  };
  db.staticBundles = db.staticBundles && typeof db.staticBundles === "object" ? db.staticBundles : {};
  db.staticBundles[bundleKey] = row;
  persistDb(db);
  return row;
}

function listSaves({ userId, limit }) {
  const db = readDb();
  const rows = db.saves
    .filter((row) => row.user_id === userId)
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    .slice(0, limit);
  return rows.map((row) => ({
    id: row.id,
    save_name: row.save_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

function getSave({ userId, saveId }) {
  const db = readDb();
  return (
    db.saves.find((row) => row.id === saveId && row.user_id === userId) || null
  );
}

function createSave({ userId, saveName, gameState, now }) {
  const iso = now || nowIso();
  const db = readDb();
  const entry = {
    id: crypto.randomUUID(),
    user_id: userId,
    save_name: saveName,
    game_state: gameState,
    created_at: iso,
    updated_at: iso,
  };
  db.saves.unshift(entry);
  persistDb(db);
  return entry;
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

function listRuns({ userId, limit }) {
  const db = readDb();
  return db.runs
    .filter((row) => row.user_id === userId)
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      run_name: row.run_name,
      seed: row.seed ?? null,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
}

function getRun({ userId, runId }) {
  const db = readDb();
  return (
    db.runs.find((row) => row.id === runId && row.user_id === userId) || null
  );
}

function createRun({
  userId,
  runName,
  seed,
  status,
  meta,
  initialState,
  initialTick,
  now,
}) {
  const iso = now || nowIso();
  const db = readDb();
  const run = {
    id: crypto.randomUUID(),
    user_id: userId,
    run_name: runName,
    seed: seed ?? null,
    status,
    meta: meta ?? null,
    created_at: iso,
    updated_at: iso,
  };
  db.runs.unshift(run);

  if (initialState) {
    db.runSnapshots.push({
      run_id: run.id,
      tick: Number.isFinite(Number(initialTick)) ? Number(initialTick) : 0,
      game_state: initialState,
      created_at: iso,
    });
  }

  persistDb(db);
  return run;
}

function updateRun({ userId, runId, runName, status, meta, now }) {
  const iso = now || nowIso();
  const db = readDb();
  const idx = db.runs.findIndex((row) => row.id === runId && row.user_id === userId);
  if (idx === -1) return null;
  const existing = db.runs[idx];
  const updated = {
    ...existing,
    run_name: runName,
    status: status ?? existing.status,
    meta: meta ?? null,
    updated_at: iso,
  };
  db.runs[idx] = updated;
  persistDb(db);
  return updated;
}

function deleteRun({ userId, runId }) {
  const db = readDb();
  const beforeRuns = db.runs.length;
  db.runs = db.runs.filter((row) => !(row.id === runId && row.user_id === userId));
  const deleted = db.runs.length !== beforeRuns;
  if (!deleted) return false;
  db.runEvents = db.runEvents.filter((row) => row.run_id !== runId);
  db.runSnapshots = db.runSnapshots.filter((row) => row.run_id !== runId);
  persistDb(db);
  return true;
}

function listRunEvents({ userId, runId, afterSeq, limit }) {
  const db = readDb();
  const owned = findOwnedRun(db, userId, runId);
  if (!owned) return { owned: false, rows: [] };

  const after = Number.isFinite(Number(afterSeq)) ? Number(afterSeq) : null;
  const rows = db.runEvents
    .filter((row) => row.run_id === runId && (after == null || Number(row.seq) > after))
    .sort((a, b) => Number(a.seq) - Number(b.seq))
    .slice(0, limit);
  return { owned: true, rows };
}

function addRunEvents({ userId, runId, events, now }) {
  const iso = now || nowIso();
  const db = readDb();
  const owned = findOwnedRun(db, userId, runId);
  if (!owned) return { error: "RUN_NOT_FOUND" };

  let maxSeq = 0;
  for (const row of db.runEvents) {
    if (row.run_id === runId) {
      const n = Number(row.seq);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  }

  const insertedRows = [];
  for (const ev of events) {
    const eventType = ev.eventType;
    const payload = ev.payload;
    const tick = ev.tick;
    if (!eventType || !payload) continue;
    maxSeq += 1;
    db.runEvents.push({
      run_id: runId,
      seq: maxSeq,
      tick,
      event_type: eventType,
      payload,
      created_at: iso,
    });
    insertedRows.push({
      seq: maxSeq,
      tick,
      event_type: eventType,
      created_at: iso,
    });
  }

  touchRun(db, runId, iso);
  persistDb(db);
  return { rows: insertedRows };
}

function listRunSnapshots({ userId, runId, latestOnly, limit }) {
  const db = readDb();
  const owned = findOwnedRun(db, userId, runId);
  if (!owned) return { owned: false, rows: [] };

  const rows = db.runSnapshots
    .filter((row) => row.run_id === runId)
    .sort((a, b) => {
      const tickDiff = Number(b.tick) - Number(a.tick);
      if (tickDiff) return tickDiff;
      return String(b.created_at).localeCompare(String(a.created_at));
    });

  if (latestOnly) return { owned: true, rows: rows.slice(0, 1) };
  return { owned: true, rows: rows.slice(0, limit) };
}

function upsertRunSnapshot({ userId, runId, tick, gameState, now }) {
  const iso = now || nowIso();
  const db = readDb();
  const owned = findOwnedRun(db, userId, runId);
  if (!owned) return { error: "RUN_NOT_FOUND" };

  const normalizedTick =
    Number.isFinite(Number(tick)) && Number(tick) >= 0 ? Math.floor(Number(tick)) : 0;

  const idx = db.runSnapshots.findIndex(
    (row) => row.run_id === runId && Number(row.tick) === normalizedTick,
  );

  if (idx === -1) {
    db.runSnapshots.push({
      run_id: runId,
      tick: normalizedTick,
      game_state: gameState,
      created_at: iso,
    });
  } else {
    db.runSnapshots[idx] = {
      ...db.runSnapshots[idx],
      game_state: gameState,
      created_at: iso,
    };
  }

  touchRun(db, runId, iso);
  persistDb(db);
  return { tick: normalizedTick, created_at: iso };
}

module.exports = {
  getDbPath,
  health,
  getStaticBundle,
  upsertStaticBundle,
  listSaves,
  getSave,
  createSave,
  updateSave,
  deleteSave,
  listRuns,
  getRun,
  createRun,
  updateRun,
  deleteRun,
  listRunEvents,
  addRunEvents,
  listRunSnapshots,
  upsertRunSnapshot,
};

