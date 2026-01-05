// =================================================================
// AI SERVICE
// Handles OpenAI API calls for narrative generation
// =================================================================

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

/**
 * Calls OpenAI API to generate narrative response
 * @param {string} prompt - The complete prompt string
 * @returns {Promise<object>} The parsed JSON response with narrative, mood, and suggestions
 */
export async function generateNarrative(prompt) {
  try {
    // Check if API key is configured
    if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    // Try models in order of preference (fallback if one doesn't have access)
    // Updated to use models available in the user's OpenAI account
    const models = [
      'gpt-4o-2024-11-20',      // Latest GPT-4o
      'gpt-4o-2024-05-13',      // GPT-4o
      'chatgpt-4o-latest',       // ChatGPT 4o latest
      'gpt-4.1',                 // GPT-4.1
      'gpt-4.1-2025-04-14',      // GPT-4.1 specific version
      'gpt-4.1-mini',            // GPT-4.1 mini
      'gpt-4.1-mini-2025-04-14', // GPT-4.1 mini specific version
      'gpt-4.1-nano-2025-04-14', // GPT-4.1 nano
      'gpt-3.5-turbo-instruct',  // GPT-3.5 turbo instruct
      'gpt-3.5-turbo-instruct-0914' // GPT-3.5 turbo instruct specific version
    ];
    let lastError = null;
    
    for (const model of models) {
      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a LitRPG narrator. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8, // Higher temperature for more creative narrative
          max_tokens: 300 // Limit response length to control costs
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (!responseText) {
          throw new Error('No response from OpenAI API');
        }

        // Clean response text (remove Markdown code blocks if present)
        const cleanedResponseText = responseText.replace(/```json\n?|\n?```/g, '').trim();

        // Parse JSON response
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(cleanedResponseText);
        } catch (parseError) {
          console.error('Failed to parse AI response:', responseText);
          throw new Error('Invalid JSON response from AI');
        }

        // Validate response structure
        if (!parsedResponse.narrative) {
          throw new Error('AI response missing required "narrative" field');
        }

        // Ensure all required fields exist with defaults
        return {
          narrative: parsedResponse.narrative || 'Something happened.',
          mood: parsedResponse.mood || 'neutral',
          suggestions: Array.isArray(parsedResponse.suggestions) 
            ? parsedResponse.suggestions.slice(0, 3) // Ensure max 3 suggestions
            : ['Look around', 'Check inventory', 'Continue']
        };
      } catch (error) {
        // If it's a model access error, try next model
        if (error.message && (error.message.includes('does not have access') || error.message.includes('403'))) {
          console.warn(`Model ${model} not available, trying next...`);
          lastError = error;
          continue; // Try next model
        }
        // If it's a different error, throw it
        throw error;
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error('All models failed');

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Return fallback response on error
    if (error.message && error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured. Please check your .env file.');
    }
    
    if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    if (error.message && (error.message.includes('does not have access') || error.message.includes('403'))) {
      throw new Error('Your OpenAI API key does not have access to the requested models. Please check your OpenAI account settings or use a different API key.');
    }
    
    // Generic error fallback
    return {
      narrative: 'The world seems to shimmer for a moment, then stabilizes. Something unusual happened, but you cannot quite grasp what it was.',
      mood: 'mysterious',
      suggestions: ['Try again', 'Look around', 'Check your status']
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
export function isApiKeyConfigured() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.length > 10;
}
