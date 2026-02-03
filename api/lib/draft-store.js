const fs = require("fs");
const path = require("path");
const {
  getOptionalEnv,
  getRedisClient,
  getRedisUrl,
  isProductionEnv,
  isTruthyFlag,
} = require("./azure-ai-utils");

const DEFAULT_MAX_DRAFTS = 200;
const DEFAULT_LIST_KEY = "factory:drafts:ids";
const DEFAULT_HASH_KEY = "factory:drafts:byId";

const draftsStorePath =
  process.env.FACTORY_DRAFTS_PATH ||
  path.resolve(__dirname, "..", "factory-drafts.json");

function resolveMaxDrafts() {
  const raw = getOptionalEnv("FACTORY_DRAFTS_MAX", String(DEFAULT_MAX_DRAFTS));
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_DRAFTS;
}

function resolveKeys() {
  return {
    listKey: getOptionalEnv("FACTORY_DRAFTS_LIST_KEY", DEFAULT_LIST_KEY),
    hashKey: getOptionalEnv("FACTORY_DRAFTS_HASH_KEY", DEFAULT_HASH_KEY),
  };
}

function shouldUseRedis() {
  const override = getOptionalEnv("FACTORY_DRAFTS_STORAGE");
  if (override) return override.trim().toLowerCase() === "redis";
  return Boolean(getRedisUrl());
}

function requireRedisForDrafts() {
  const flag = getOptionalEnv("REQUIRE_REDIS_DRAFTS");
  if (flag) return isTruthyFlag(flag);
  return isProductionEnv();
}

function readDraftsFile() {
  try {
    const raw = fs.readFileSync(draftsStorePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDraftsFile(drafts) {
  fs.writeFileSync(draftsStorePath, JSON.stringify(drafts, null, 2));
}

function saveDraftFile(entry) {
  const drafts = readDraftsFile();
  drafts.unshift(entry);
  writeDraftsFile(drafts.slice(0, resolveMaxDrafts()));
  return entry;
}

function updateDraftStatusFile(draftId, status, nowIso) {
  const drafts = readDraftsFile();
  const next = drafts.map((draft) =>
    draft.id === draftId ? { ...draft, status, updatedAt: nowIso } : draft
  );
  writeDraftsFile(next);
  return next.find((draft) => draft.id === draftId) || null;
}

async function getDraftsRedisClient() {
  const requireRedis = requireRedisForDrafts();
  const useRedis = shouldUseRedis() || requireRedis;
  if (!useRedis) return null;

  const url = getRedisUrl();
  if (!url) {
    if (requireRedis) {
      throw new Error(
        "Redis is required for factory drafts but REDIS_URL is not configured."
      );
    }
    return null;
  }

  const client = await getRedisClient();
  if (!client && requireRedis) {
    throw new Error("Redis client unavailable for factory drafts.");
  }
  return client;
}

async function cleanupDraftHash(client, listKey, hashKey, maxDrafts) {
  const ids = await client.lRange(listKey, 0, maxDrafts - 1);
  const existing = await client.hKeys(hashKey);
  if (!existing.length) return;
  const allowed = new Set(ids);
  const toRemove = existing.filter((id) => !allowed.has(id));
  if (toRemove.length) {
    await client.hDel(hashKey, toRemove);
  }
}

async function saveDraftRedis(entry) {
  const client = await getDraftsRedisClient();
  if (!client) return saveDraftFile(entry);
  const { listKey, hashKey } = resolveKeys();
  const maxDrafts = resolveMaxDrafts();
  const payload = JSON.stringify(entry);
  await client.hSet(hashKey, entry.id, payload);
  await client.lPush(listKey, entry.id);
  await client.lTrim(listKey, 0, maxDrafts - 1);
  await cleanupDraftHash(client, listKey, hashKey, maxDrafts);
  return entry;
}

async function updateDraftStatusRedis(draftId, status, nowIso) {
  const client = await getDraftsRedisClient();
  if (!client) return updateDraftStatusFile(draftId, status, nowIso);
  const { listKey, hashKey } = resolveKeys();
  const raw = await client.hGet(hashKey, draftId);
  if (!raw) return null;
  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    draft = null;
  }
  if (!draft || typeof draft !== "object") return null;
  const updated = { ...draft, status, updatedAt: nowIso };
  await client.hSet(hashKey, draftId, JSON.stringify(updated));
  await client.lPos(listKey, draftId).catch(() => null);
  return updated;
}

async function saveDraft(entry) {
  return saveDraftRedis(entry);
}

async function updateDraftStatus(draftId, status, nowIso) {
  return updateDraftStatusRedis(draftId, status, nowIso);
}

module.exports = {
  saveDraft,
  updateDraftStatus,
};
