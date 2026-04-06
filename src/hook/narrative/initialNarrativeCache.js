import { resolvePlayerArchetypeSystem } from "../../systems/archetype/resolvePlayerArchetypeSystem.js";
import { resolveLocationId } from "../../world/WorldDataRegistry.js";

const initialNarrativeCache = new Map();

const resolveEntityKey = (value) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (typeof value.id === "string" && value.id.trim()) return value.id.trim();
    if (typeof value.name === "string" && value.name.trim()) return value.name.trim();
  }
  return null;
};

export function createInitialNarrativeCacheKey(currentState) {
  const player = currentState?.player || {};
  const activeQuests = Array.isArray(currentState?.quests?.active)
    ? currentState.quests.active
    : [];
  const activeSkills = Array.isArray(player?.activeSkills)
    ? player.activeSkills
    : [];
  const archetypeSystem = resolvePlayerArchetypeSystem(player);
  const locationRaw =
    currentState?.world?.location?.current ?? currentState?.world?.location ?? null;
  const locationKey =
    resolveLocationId(locationRaw) || resolveEntityKey(locationRaw);
  const cacheKeyParts = [
    currentState?.world?.vars?.startingSceneId ??
      currentState?.world?.flags?.startingSceneId,
    currentState?.world?.vars?.openingSceneChoicePending
      ? "opening-choice-pending"
      : null,
    currentState?.world?.vars?.openingSceneChoiceId ??
      currentState?.world?.flags?.openingSceneChoiceId,
    currentState?.world?.vars?.current_quest_id ??
      currentState?.world?.flags?.current_quest_id,
    ...activeQuests.map((quest) => resolveEntityKey(quest)).sort(),
    locationKey,
    typeof player?.name === "string" ? player.name.trim() : null,
    typeof player?.startingPrompt === "string" ? player.startingPrompt.trim() : null,
    resolveEntityKey(player?.race),
    resolveEntityKey(player?.class),
    resolveEntityKey(player?.profession),
    resolveEntityKey(archetypeSystem),
    typeof archetypeSystem?.category === "string"
      ? archetypeSystem.category.trim()
      : null,
    ...activeSkills
      .slice(0, 4)
      .map((skill) => resolveEntityKey(skill))
      .filter(Boolean),
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
