import { resolvePlayerArchetypeSystem } from "../../systems/archetype/resolvePlayerArchetypeSystem.js";
import { isDevourerCorePlayer } from "@voidverse/game-core/systems/archetype/devourerCore.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toSentencePreview(value, fallback = "No system synopsis available.") {
  const text = normalizeText(value, fallback);
  if (text.length <= 240) return text;
  return `${text.slice(0, 237).trimEnd()}...`;
}

function toList(values, limit = 3) {
  return Array.isArray(values)
    ? values
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .slice(0, limit)
    : [];
}

function toResourceKeyCandidates(resource) {
  const explicitKeys = [
    resource?.id,
    resource?.key,
    resource?.resourceKey,
  ]
    .map((value) => normalizeText(value))
    .filter(Boolean);

  const derivedNameKey = normalizeText(resource?.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return derivedNameKey ? [...explicitKeys, derivedNameKey] : explicitKeys;
}

function resolveResourceCurrent(player, archetypeSystem, definition) {
  const liveResource = isPlainObject(archetypeSystem?.resource)
    ? archetypeSystem.resource
    : null;
  if (liveResource) {
    return {
      name: normalizeText(liveResource.name, normalizeText(definition?.name, "System Resource")),
      current: Number.isFinite(Number(liveResource.current)) ? Number(liveResource.current) : 0,
      max:
        Number.isFinite(Number(liveResource.max)) && Number(liveResource.max) > 0
          ? Number(liveResource.max)
          : Number(definition?.maxValue) || 100,
      regenRate: Number.isFinite(Number(liveResource.regenRate))
        ? Number(liveResource.regenRate)
        : Number(definition?.regenRate) || 0,
      color: normalizeText(liveResource.color, normalizeText(definition?.color, "#00F3FF")),
    };
  }

  if (!definition) return null;

  const playerResources = isPlainObject(player?.resources) ? player.resources : {};
  const currentCandidate = toResourceKeyCandidates(definition)
    .map((key) => playerResources[key])
    .find((value) => Number.isFinite(Number(value)));

  return {
    name: normalizeText(definition.name, "System Resource"),
    current:
      Number.isFinite(Number(currentCandidate))
        ? Number(currentCandidate)
        : Number(definition.startValue) || 0,
    max:
      Number.isFinite(Number(definition.maxValue)) && Number(definition.maxValue) > 0
        ? Number(definition.maxValue)
        : 100,
    regenRate: Number.isFinite(Number(definition.regenRate))
      ? Number(definition.regenRate)
      : 0,
    color: normalizeText(definition.color, "#00F3FF"),
  };
}


function buildDevourerConsole(archetypeSystem) {
  const runtime = isPlainObject(archetypeSystem?.runtime) ? archetypeSystem.runtime : {};
  const storedSamplesSource = isPlainObject(runtime.storedSamples) ? runtime.storedSamples : {};
  const adaptationsSource = isPlainObject(runtime.adaptations) ? runtime.adaptations : {};

  const storedSamples = Object.entries(storedSamplesSource)
    .map(([family, sample]) => ({
      family,
      count: Number.isFinite(Number(sample?.count)) ? Math.max(0, Math.floor(Number(sample.count))) : 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));

  const adaptations = Object.entries(adaptationsSource)
    .map(([family, entry]) => ({
      family,
      rank: Number.isFinite(Number(entry?.rank)) ? Math.max(0, Math.floor(Number(entry.rank))) : 0,
      maxRank: Number.isFinite(Number(entry?.maxRank))
        ? Math.max(1, Math.floor(Number(entry.maxRank)))
        : 5,
    }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.family.localeCompare(b.family));

  return {
    taint: Number.isFinite(Number(runtime.taint)) ? Math.max(0, Math.floor(Number(runtime.taint))) : 0,
    sentientDevours: Number.isFinite(Number(runtime.sentientDevours))
      ? Math.max(0, Math.floor(Number(runtime.sentientDevours)))
      : 0,
    storedSamples,
    knownPreyCount: isPlainObject(runtime.knownPrey) ? Object.keys(runtime.knownPrey).length : 0,
    adaptations,
    lastNotice: normalizeText(runtime.lastNotice),
    recentPrey: Array.isArray(runtime.recentPrey)
      ? runtime.recentPrey.map((entry) => normalizeText(entry)).filter(Boolean).slice(-4)
      : [],
    commands: ["digest <prey>", "refine <prey>", "purge taint"],
  };
}

export function buildArchetypeSystemViewModel(player = {}) {
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  if (!archetypeSystem) return null;

  const name = normalizeText(archetypeSystem.name, normalizeText(archetypeSystem.id, "Unknown System"));
  const category = normalizeText(archetypeSystem.category, "Unknown");
  const summary = normalizeText(
    archetypeSystem.summary,
    normalizeText(archetypeSystem.description, "No system synopsis available."),
  );
  const descriptionPreview = toSentencePreview(
    archetypeSystem.description,
    summary,
  );
  const rarity = normalizeText(archetypeSystem.rarity);
  const stability = normalizeText(archetypeSystem.stability);
  const resource = resolveResourceCurrent(
    player,
    archetypeSystem,
    isPlainObject(archetypeSystem.archetypeResource)
      ? archetypeSystem.archetypeResource
      : null,
  );
  const profile = [rarity, stability].filter(Boolean).join(" / ");
  const devourerConsole = isDevourerCorePlayer({ archetypeSystem })
    ? buildDevourerConsole(archetypeSystem)
    : null;

  return {
    id: normalizeText(archetypeSystem.id, name),
    name,
    category,
    label: `${name} (${category})`,
    summary,
    descriptionPreview,
    rarity,
    stability,
    profile,
    resource,
    coreLoop: toList(archetypeSystem.coreLoop, 3),
    possibleUses: toList(archetypeSystem.possibleUses, 3),
    limits: toList(archetypeSystem.limits, 3),
    costs: toList(archetypeSystem.costs, 3),
    narrativeHooks: toList(archetypeSystem.narrativeHooks, 3),
    questHooks: toList(archetypeSystem.questHooks, 3),
    worldCompatibility: toList(archetypeSystem.worldCompatibility, 3),
    devourerConsole,
  };
}
