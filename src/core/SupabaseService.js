// =================================================================
// SUPABASE SERVICE
// Handles database operations for game state persistence
// =================================================================

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const env =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not configured. Persistence features will be disabled.",
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Saves game state to the database
 * @param {string} userId - The user's ID
 * @param {object} gameState - The game state object to save
 * @param {string} saveName - Optional name for the save
 * @returns {Promise<object>} Result object with success flag and save ID
 */
export async function saveGameState(userId, gameState, saveName = "Auto Save") {
  if (!supabase) {
    throw new Error(
      "Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
    );
  }

  if (!userId) {
    throw new Error("User ID is required to save game state.");
  }

  try {
    const { data, error } = await supabase
      .from("game_saves")
      .insert({
        user_id: userId,
        save_name: saveName,
        game_state: gameState,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving game state:", error);
      throw error;
    }

    return {
      success: true,
      saveId: data.id,
      data,
    };
  } catch (error) {
    console.error("Failed to save game state:", error);
    return {
      success: false,
      error: error.message || "Failed to save game state",
    };
  }
}

/**
 * Updates an existing save
 * @param {string} userId - The user's ID
 * @param {string} saveId - The save ID to update
 * @param {object} gameState - The updated game state
 * @returns {Promise<object>} Result object
 */
export async function updateGameState(userId, saveId, gameState) {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  try {
    const { data, error } = await supabase
      .from("game_saves")
      .update({
        game_state: gameState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", saveId)
      .eq("user_id", userId) // Ensure user owns this save
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Failed to update game state:", error);
    return {
      success: false,
      error: error.message || "Failed to update game state",
    };
  }
}

/**
 * Loads a game state from the database
 * @param {string} userId - The user's ID
 * @param {string} saveId - The save ID to load
 * @returns {Promise<object>} Result object with game state
 */
export async function loadGameState(userId, saveId) {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  try {
    const { data, error } = await supabase
      .from("game_saves")
      .select("*")
      .eq("id", saveId)
      .eq("user_id", userId) // Ensure user owns this save
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Save not found");
    }

    return {
      success: true,
      gameState: data.game_state,
      saveName: data.save_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Failed to load game state:", error);
    return {
      success: false,
      error: error.message || "Failed to load game state",
    };
  }
}

/**
 * Lists all saves for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<array>} Array of save objects
 */
export async function listSaves(userId) {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  try {
    const { data, error } = await supabase
      .from("game_saves")
      .select("id, save_name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      saves: data || [],
    };
  } catch (error) {
    console.error("Failed to list saves:", error);
    return {
      success: false,
      error: error.message || "Failed to list saves",
      saves: [],
    };
  }
}

/**
 * Deletes a save
 * @param {string} userId - The user's ID
 * @param {string} saveId - The save ID to delete
 * @returns {Promise<object>} Result object
 */
export async function deleteSave(userId, saveId) {
  if (!supabase) {
    throw new Error("Supabase not configured.");
  }

  try {
    const { error } = await supabase
      .from("game_saves")
      .delete()
      .eq("id", saveId)
      .eq("user_id", userId); // Ensure user owns this save

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete save:", error);
    return {
      success: false,
      error: error.message || "Failed to delete save",
    };
  }
}

/**
 * Checks if Supabase is configured
 * @returns {boolean} True if Supabase is configured
 */
export function isSupabaseConfigured() {
  return supabase !== null;
}
