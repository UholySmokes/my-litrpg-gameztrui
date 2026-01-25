const API_ENDPOINT = "/api/narrate";

const OFFLINE_RESPONSE = {
  narrative:
    "The Aether is silent here. This realm runs without an oracle, so your story must unfold by your own hand. (AI Offline)",
  mood: "offline",
  suggestions: ["Look around", "Check status", "Continue"],
};

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
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 404) {
        return OFFLINE_RESPONSE;
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

    if (!data || typeof data.narrative !== "string") return applyNarrationGuards(OFFLINE_RESPONSE);

    return applyNarrationGuards({
      narrative: data.narrative || "Something happened.",
      mood: data.mood || "neutral",
      suggestions: Array.isArray(data.suggestions)
        ? data.suggestions.slice(0, 3)
        : ["Look around", "Check inventory", "Continue"],
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("AI Service Error:", error);
    }

    if (
      error.message &&
      (error.message.includes("rate limit") || error.message.includes("429"))
    ) {
      throw new Error(
        "Rate limit exceeded. Please wait a moment and try again.",
      );
    }

    if (
      error.message &&
      (error.message.includes("network") ||
        error.message.includes("fetch") ||
        error.message.includes("Connection error"))
    ) {
      console.warn("Network error detected, using fallback narrative.");
      return applyNarrationGuards({
        narrative:
          "The connection to the Aether (AI Service) seems unstable. The world wavers, but you remain grounded. (Network Error - Running in Offline Mode)",
        mood: "glitch",
        suggestions: ["Check Connection", "Look around", "Check status"],
      });
    }

    return applyNarrationGuards({
      narrative:
        "The world seems to shimmer for a moment, then stabilizes. Something unusual happened, but you cannot quite grasp what it was.",
      mood: "mysterious",
      suggestions: ["Try again", "Look around", "Check your status"],
    });
  }
}

/**
 * Generates an initial narrative for a new game
 * @param {string} initialPrompt - The initial prompt for game start
 * @returns {Promise<object>} The parsed JSON response
 */
export async function generateInitialNarrative(initialPrompt) {
  return generateNarrative(initialPrompt);
}
