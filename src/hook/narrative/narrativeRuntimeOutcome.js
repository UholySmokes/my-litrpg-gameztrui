import { buildFallbackNarrative } from "./fallbackNarrative.js";
import {
  buildActionSuggestions,
  inferMood,
  resolveActionSuggestions,
} from "./narrativeSuggestions.js";

export function resolveNarrativeRuntimeOutcome({
  aiResult,
  state,
  userInput,
  actionResult,
  isInitial = false,
  variantSeed,
}) {
  const fallbackSuggestions = buildActionSuggestions(state);
  const hasNarrative =
    typeof aiResult?.narrative === "string" && aiResult.narrative.trim().length > 0;

  if (hasNarrative) {
    return {
      narrative: aiResult.narrative.trim(),
      mood:
        typeof aiResult?.mood === "string" && aiResult.mood.trim()
          ? aiResult.mood.trim()
          : inferMood(aiResult.narrative),
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
    narrative: fallbackNarrative,
    mood: inferMood(fallbackNarrative),
    suggestions: resolveActionSuggestions({
      fallbackSuggestions,
      state,
    }),
    source: "fallback",
  };
}
