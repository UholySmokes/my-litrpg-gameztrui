import { getArchetypeSystemById } from "./ArchetypeSystemRegistry.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function resolvePlayerArchetypeSystem(player = {}) {
  const raw = player?.archetypeSystem;
  if (!raw) return null;

  if (typeof raw === "string") {
    return getArchetypeSystemById(raw) || { id: raw, name: raw };
  }

  if (!isPlainObject(raw)) {
    return null;
  }

  const resolvedId = raw.id || raw.archetypeId || raw.definition?.id || null;
  const resolved = resolvedId ? getArchetypeSystemById(resolvedId) : null;
  if (!resolved) {
    return raw.definition && isPlainObject(raw.definition) ? raw.definition : raw;
  }

  return {
    ...resolved,
    ...raw,
    id: raw.id || resolved.id,
    name: raw.name || resolved.name,
    category: raw.category || resolved.category,
  };
}

export function getPlayerArchetypeSystemId(player = {}) {
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  return archetypeSystem?.id || null;
}

export function getPlayerArchetypeSystemLabel(player = {}) {
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  if (!archetypeSystem) return null;
  return archetypeSystem.name || archetypeSystem.id || null;
}
