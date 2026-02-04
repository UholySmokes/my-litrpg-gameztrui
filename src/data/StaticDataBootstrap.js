import { setRaceRegistry } from "./registries/RaceDataRegistry.js";
import { setClasses } from "./registries/ClassDataRegistry.js";
import { setItemDatabase } from "./registries/ItemDataRegistry.js";
import { setEnemies } from "./registries/EnemyDataRegistry.js";
import { setGachaPools } from "./gachaData.js";
import { setShopDatabase } from "./shopData.js";
import { setTitleDatabase } from "./titleData.js";
import { setQuestCatalog } from "./QuestCatalog.js";
import { setArchetypeDefinitions } from "../systems/archetype/ArchetypeSystemRegistry.js";
import { setProfessionRegistry } from "../systems/profession/ProfessionRegistry.js";

const DEFAULT_TIMEOUT_MS = 8000;

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object"
    ? runtimeConfig
    : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const normalizeBaseUrl = (value) => value.replace(/\/+$/g, "");

const resolveStaticEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const explicit = pickEnvValue(
    runtimeEnv.VITE_STATIC_DATA_ENDPOINT,
    buildEnv.VITE_STATIC_DATA_ENDPOINT,
  );
  const apiBaseUrl = pickEnvValue(
    runtimeEnv.VITE_API_BASE_URL,
    buildEnv.VITE_API_BASE_URL,
    runtimeEnv.VITE_API_BASE,
    buildEnv.VITE_API_BASE,
  );
  const derived = apiBaseUrl
    ? `${normalizeBaseUrl(apiBaseUrl)}/api/static-data`
    : undefined;
  return [explicit, derived, "/api/static-data"].filter(Boolean);
};

const resolveTimeoutMs = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const value = pickEnvValue(
    runtimeEnv.VITE_STATIC_DATA_TIMEOUT_MS,
    buildEnv.VITE_STATIC_DATA_TIMEOUT_MS,
  );
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function applyStaticBundle(bundle) {
  if (!bundle || typeof bundle !== "object") return false;

  setRaceRegistry({
    races: bundle.races,
    raceTraits: bundle.raceTraits,
  });
  setClasses(bundle.classes);
  setItemDatabase(bundle.items);
  setEnemies(bundle.enemies);
  setGachaPools(bundle.gachaPools);
  setShopDatabase(bundle.shopDatabase);
  setTitleDatabase(bundle.titleDatabase);
  setQuestCatalog(bundle.quests);
  setArchetypeDefinitions(bundle.archetypeDefinitions);
  setProfessionRegistry({
    professions: bundle.professions,
    tiers: bundle.professionTiers,
    categories: bundle.professionCategories,
  });

  return true;
}

export async function bootstrapStaticData() {
  const endpoints = resolveStaticEndpoints();
  const timeoutMs = resolveTimeoutMs();
  let lastError = null;

  for (const base of endpoints) {
    try {
      const response = await fetchWithTimeout(base, { method: "GET" }, timeoutMs);
      const data = await response.json().catch(() => null);

      if (!response.ok && (response.status === 404 || response.status === 405)) {
        lastError = new Error("Static data endpoint not found");
        continue;
      }

      if (!response.ok) {
        const message =
          typeof data?.message === "string" ? data.message : "Static data fetch failed.";
        throw new Error(message);
      }

      const bundle = data?.bundle || data?.payload || data;
      const applied = applyStaticBundle(bundle);
      if (!applied) {
        throw new Error("Static data bundle missing or invalid.");
      }

      return { ok: true, source: base };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    // eslint-disable-next-line no-console
    console.warn("Static data bootstrap failed:", lastError);
  }
  return { ok: false, error: lastError?.message };
}
