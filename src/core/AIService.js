// =================================================================
// AI SERVICE
// Handles OpenAI API calls for narrative generation
// =================================================================

import OpenAI from "openai";

// Initialize OpenAI client
const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : typeof globalThis !== "undefined" && globalThis.process
      ? globalThis.process.env
      : {};
function getClient() {
  return new OpenAI({
    apiKey: env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
}

/**
 * Calls OpenAI API to generate narrative response
 * @param {string} prompt - The complete prompt string
 * @returns {Promise<object>} The parsed JSON response with narrative, mood, and suggestions
 */
export async function generateNarrative(prompt) {
  try {
    // Check if API key is configured
    if (
      !env.VITE_OPENAI_API_KEY ||
      env.VITE_OPENAI_API_KEY === "your_openai_api_key_here"
    ) {
      throw new Error(
        "OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.",
      );
    }

    // Try models in order of preference (fallback if one doesn't have access)
    // Updated with specific enabled models provided by configuration
    const models = [
      "gpt-4.1",
      "gpt-4.1-2025-04-14",
      "gpt-4o-2024-05-13",
      "gpt-4o",
      "gpt-4o-2024-08-06",
      "gpt-4",
      "gpt-4-0613",
    ];
    let lastError = null;

    for (const model of models) {
      try {
        // Prepare request parameters
        const params = {
          model: model,
          messages: [
            {
              role: "system",
              content:
                'You are a LitRPG narrator. Always respond with valid JSON only. The JSON must follow this schema: { "narrative": "string", "mood": "string", "suggestions": ["string"] }.',
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          // Removed explicit temperature to use standard default (1) for all models
        };

        // Handle parameter compatibility for newer models (o1, gpt-5 series)
        // These models use 'max_completion_tokens' instead of 'max_tokens'
        if (model.includes("o1-") || model.startsWith("gpt-5")) {
          params.max_completion_tokens = 1000;
        } else {
          params.max_tokens = 1000;
        }

        const completion = await getClient().chat.completions.create(params);

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
          throw new Error("No response from OpenAI API");
        }

        // Clean response text (remove Markdown code blocks if present)
        const cleanedResponseText = responseText
          .replace(/```json\n?|\n?```/g, "")
          .trim();

        // Parse JSON response
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanedResponseText);
        } catch (err) {
          console.error("Failed to parse AI response:", responseText, err);
          throw new Error("Invalid JSON response from AI");
        }

        // Validate response structure
        if (!parsedResponse.narrative) {
          throw new Error('AI response missing required "narrative" field');
        }

        // Ensure all required fields exist with defaults
        return {
          narrative: parsedResponse.narrative || "Something happened.",
          mood: parsedResponse.mood || "neutral",
          suggestions: Array.isArray(parsedResponse.suggestions)
            ? parsedResponse.suggestions.slice(0, 3) // Ensure max 3 suggestions
            : ["Look around", "Check inventory", "Continue"],
        };
      } catch (error) {
        // If it's a model access error, model not found, bad request, or invalid response, try next model
        if (
          error.message &&
          (error.message.includes("does not have access") ||
            error.message.includes("403") ||
            error.message.includes("not a chat model") ||
            error.message.includes("404") ||
            error.message.includes("400") ||
            error.message.includes("No response") ||
            error.message.includes("Invalid JSON") ||
            error.message.includes("missing required"))
        ) {
          console.warn(
            `Model ${model} issue (${error.message}), trying next...`,
          );
          lastError = error;
          continue; // Try next model
        }
        // If it's a different error (e.g. network), throw it
        throw error;
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error("All models failed");
  } catch (error) {
    console.error("OpenAI API Error:", error);

    // Return fallback response on error
    if (error.message && error.message.includes("API key")) {
      throw new Error(
        "OpenAI API key not configured. Please check your .env file.",
      );
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

    if (
      error.message &&
      (error.message.includes("does not have access") ||
        error.message.includes("403"))
    ) {
      throw new Error(
        "Your OpenAI API key does not have access to the requested models. Please check your OpenAI account settings or use a different API key.",
      );
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

/**
 * Validates that the API key is configured (for UI feedback)
 * @returns {boolean} True if API key appears to be configured
 */
function isApiKeyConfigured() {
  const apiKey = env.VITE_OPENAI_API_KEY;
  return apiKey && apiKey !== "your_openai_api_key_here" && apiKey.length > 10;
}
