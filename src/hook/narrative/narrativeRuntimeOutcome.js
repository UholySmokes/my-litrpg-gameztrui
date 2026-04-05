import { buildFallbackNarrative } from "./fallbackNarrative.js";
import {
  buildActionSuggestions,
  inferMood,
  resolveActionSuggestions,
} from "./narrativeSuggestions.js";
import { deriveStateIntentsFromNarrative } from "./narrativeStateIntentExtraction.js";

function mergeStateIntents(explicitIntents, derivedIntents) {
  const merged = [];
  const seen = new Set();

  [...(Array.isArray(explicitIntents) ? explicitIntents : []), ...(derivedIntents || [])].forEach(
    (intent) => {
      if (!intent || typeof intent !== "object") return;
      const key = JSON.stringify(intent);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(intent);
    },
  );

  return merged.length ? merged : undefined;
}

export function resolveNarrativeRuntimeOutcome({
  aiResult,
  state,
  userInput,
  actionResult,
  isInitial = false,
  variantSeed,
}) {
  const fallbackSuggestions = buildActionSuggestions(state);
  const storyText =
    typeof aiResult?.story === "string"
      ? aiResult.story
      : typeof aiResult?.narrative === "string"
        ? aiResult.narrative
        : "";
  const hasStory = storyText.trim().length > 0;

  if (hasStory) {
    const story = storyText.trim();
    const derivedStateIntents = deriveStateIntentsFromNarrative(story);
    return {
      story,
      narrative: story,
      mood:
        typeof aiResult?.mood === "string" && aiResult.mood.trim()
          ? aiResult.mood.trim()
          : inferMood(story),
      suggestions: resolveActionSuggestions({
        preferredSuggestions: aiResult?.suggestions,
        preferredChoiceMeta: aiResult?.choiceMeta,
        fallbackSuggestions,
        state,
      }),
      source:
        typeof aiResult?.source === "string" && aiResult.source.trim()
          ? aiResult.source.trim()
          : "ai",
      sceneMemory:
        aiResult?.sceneMemory &&
        typeof aiResult.sceneMemory === "object" &&
        !Array.isArray(aiResult.sceneMemory)
          ? aiResult.sceneMemory
          : undefined,
      choiceMeta: Array.isArray(aiResult?.choiceMeta) ? aiResult.choiceMeta : undefined,
      stateIntents: mergeStateIntents(aiResult?.stateIntents, derivedStateIntents),
    };
  }

  const fallbackNarrative = buildFallbackNarrative({
    userInput,
    actionResult,
    state,
    isInitial,
    variantSeed,
  });

  return {
    story: fallbackNarrative,
    narrative: fallbackNarrative,
    mood: inferMood(fallbackNarrative),
    suggestions: resolveActionSuggestions({
      fallbackSuggestions,
      state,
    }),
    source: "fallback",
  };
}
