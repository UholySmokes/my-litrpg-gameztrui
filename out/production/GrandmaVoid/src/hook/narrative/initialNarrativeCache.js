const initialNarrativeCache = new Map();

const resolveEntityId = (value) =>
  typeof value === "string" ? value : value?.id || null;

export function createInitialNarrativeCacheKey(currentState) {
  const cacheKeyParts = [
    currentState?.world?.vars?.startingSceneId ??
      currentState?.world?.flags?.startingSceneId,
    currentState?.world?.vars?.current_quest_id ??
      currentState?.world?.flags?.current_quest_id,
    ...(currentState?.quests?.active || []).map((quest) => quest?.id).sort(),
    resolveEntityId(currentState?.player?.race),
    resolveEntityId(currentState?.player?.class),
    resolveEntityId(currentState?.player?.profession),
  ];

  return cacheKeyParts.filter(Boolean).join("|");
}

export function getInitialNarrativeCache(key) {
  return initialNarrativeCache.get(key);
}

export function setInitialNarrativeCache(key, value) {
  if (!key) return value;
  initialNarrativeCache.set(key, value);
  return value;
}

export function hasInitialNarrativeCache(key) {
  return initialNarrativeCache.has(key);
}

export function clearInitialNarrativeCache() {
  initialNarrativeCache.clear();
}
