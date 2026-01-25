const API_ENDPOINT = "/api/narrative";

const OFFLINE_RESPONSE = {
  narrative:
    "The Aether is silent here. This realm runs without an oracle, so your story must unfold by your own hand. (AI Offline)",
  mood: "offline",
  suggestions: ["Look around", "Check status", "Continue"],
};

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

    if (!data || typeof data.narrative !== "string") return OFFLINE_RESPONSE;

    return {
      narrative: data.narrative || "Something happened.",
      mood: data.mood || "neutral",
      suggestions: Array.isArray(data.suggestions)
        ? data.suggestions.slice(0, 3)
        : ["Look around", "Check inventory", "Continue"],
    };
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
      return {
        narrative:
          "The connection to the Aether (AI Service) seems unstable. The world wavers, but you remain grounded. (Network Error - Running in Offline Mode)",
        mood: "glitch",
        suggestions: ["Check Connection", "Look around", "Check status"],
      };
    }

    // Generic error fallback
    return {
      narrative:
        "The world seems to shimmer for a moment, then stabilizes. Something unusual happened, but you cannot quite grasp what it was.",
      mood: "mysterious",
      suggestions: ["Try again", "Look around", "Check your status"],
    };
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
