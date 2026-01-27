const API_ENDPOINTS = [
  import.meta.env.VITE_NARRATE_ENDPOINT,
  "/api/narrate",
  "/api/narrative",
].filter(Boolean);

const MAX_NARRATIVE_LENGTH = 1200;
export const NARRATION_GUARD_FALLBACK =
  "The story presses onward, waiting for your next move.";
const TONE_BLOCKLIST = [
  /as an ai/i,
  /language model/i,
  /i cannot/i,
  /i can't/i,
  /unable to/i,
];

function stripToneViolations(text) {
  const sentences = String(text || "").match(/[^.!?]+[.!?]*/g) || [];
  const kept = sentences.filter(
    (sentence) => !TONE_BLOCKLIST.some((pattern) => pattern.test(sentence)),
  );
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

export function applyNarrationGuards(response) {
  const narrativeRaw =
    response && typeof response.narrative === "string" ? response.narrative : "";
  let narrative = narrativeRaw.trim();
  if (!narrative) {
    return { ...response, narrative: NARRATION_GUARD_FALLBACK };
  }

  narrative = stripToneViolations(narrative);
  if (!narrative) {
    return { ...response, narrative: NARRATION_GUARD_FALLBACK };
  }

  if (narrative.length > MAX_NARRATIVE_LENGTH) {
    narrative = narrative.slice(0, MAX_NARRATIVE_LENGTH).trim();
  }

  return { ...response, narrative };
}

/**
 * Calls OpenAI API to generate narrative response
 * @param {string} prompt - The complete prompt string
 * @returns {Promise<object>} The parsed JSON response with narrative, mood, and suggestions
 */
export async function generateNarrative(prompt) {
  let lastError = null;

  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          continue;
        }

        const message =
          typeof data?.error === "string"
            ? data.error
            : "Narrative generation failed.";
        throw new Error(message);
      }

      if (data && data.ok === false) {
        const message =
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : "Narrative generation failed.";
        throw new Error(message);
      }

      if (!data || typeof data.narrative !== "string") {
        throw new Error("Narrative response missing.");
      }

      return applyNarrationGuards({
        narrative: data.narrative || "Something happened.",
        mood: data.mood || "neutral",
        suggestions: Array.isArray(data.suggestions)
          ? data.suggestions.slice(0, 3)
          : ["Look around", "Check inventory", "Continue"],
      });
    } catch (error) {
      lastError = error;
      if (import.meta.env.DEV) {
        console.error("AI Service Error:", error);
      }
    }
  }

  if (lastError?.message?.includes("rate limit")) {
    throw new Error("Rate limit exceeded. Please wait a moment and try again.");
  }

  if (
    lastError?.message &&
    (lastError.message.includes("network") ||
      lastError.message.includes("fetch") ||
      lastError.message.includes("Connection error"))
  ) {
    throw new Error(
      "Narrator service unreachable. Check your connection or backend status.",
    );
  }

  throw new Error(lastError?.message || "Narrator service unavailable.");
}

/**
 * Generates an initial narrative for a new game
 * @param {string} initialPrompt - The initial prompt for game start
 * @returns {Promise<object>} The parsed JSON response
 */
export async function generateInitialNarrative(initialPrompt) {
  return generateNarrative(initialPrompt);
}
