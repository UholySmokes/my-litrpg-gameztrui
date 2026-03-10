import { races, RACE_TRAITS, setRaceRegistry } from "./registries/RaceDataRegistry.js";
import { classes, setClasses } from "./registries/ClassDataRegistry.js";
import { origins, setOrigins } from "./registries/OriginDataRegistry.js";
import { itemDatabase, setItemDatabase } from "./registries/ItemDataRegistry.js";
import { enemies, setEnemies } from "./registries/EnemyDataRegistry.js";
import { gachaPools, setGachaPools } from "./gachaData.js";
import { shopDatabase, setShopDatabase } from "./shopData.js";
import { titleDatabase, setTitleDatabase } from "./titleData.js";
import { MAIN_QUESTS, SIDE_QUESTS, setQuestCatalog } from "./QuestCatalog.js";
import {
  ARCHETYPE_DEFINITIONS,
  setArchetypeDefinitions,
} from "../systems/archetype/ArchetypeSystemRegistry.js";
import {
  PROFESSIONS,
  PROFESSION_TIERS,
  PROFESSION_CATEGORIES,
  setProfessionRegistry,
} from "../systems/profession/ProfessionRegistry.js";

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
const isExternalUrl = (value) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith("//");
const sanitizeEndpointPath = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return undefined;
  if (isExternalUrl(trimmed)) return undefined;
  return trimmed;
};

const resolveStaticEndpoints = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const explicit = sanitizeEndpointPath(
    pickEnvValue(
      runtimeEnv.VITE_STATIC_DATA_ENDPOINT,
      buildEnv.VITE_STATIC_DATA_ENDPOINT,
    ),
  );
  return explicit ? [normalizeBaseUrl(explicit)] : [];
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
  if (Array.isArray(bundle.origins)) {
    setOrigins(bundle.origins);
  }
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

function buildLocalBundle() {
  return {
    races,
    raceTraits: RACE_TRAITS,
    classes,
    origins,
    items: itemDatabase,
    enemies,
    gachaPools,
    shopDatabase,
    titleDatabase,
    quests: {
      main: MAIN_QUESTS,
      side: SIDE_QUESTS,
    },
    archetypeDefinitions: ARCHETYPE_DEFINITIONS,
    professions: PROFESSIONS,
    professionTiers: PROFESSION_TIERS,
    professionCategories: PROFESSION_CATEGORIES,
  };
}

export async function bootstrapStaticData() {
  // Local static data is the default source to keep runtime independent from
  // external API hosts.
  applyStaticBundle(buildLocalBundle());

  const endpoints = resolveStaticEndpoints();
  if (endpoints.length === 0) {
    return { ok: true, source: "local" };
  }

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
    console.warn("Static data endpoint unavailable; using local bundle:", lastError);
  }
  return { ok: true, source: "local", warning: lastError?.message };
}
