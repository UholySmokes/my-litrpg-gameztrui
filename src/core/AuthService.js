// =================================================================
// AUTH SERVICE
// Handles user authentication with Supabase
// =================================================================

import { supabase } from './SupabaseService.js';

/**
 * Signs up a new user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} Result object with user data or error
 */
export async function signUp(email, password) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign up'
    };
  }
}

/**
 * Signs in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} Result object with user data or error
 */
export async function signIn(email, password) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in'
    };
  }
}

/**
 * Signs out the current user
 * @returns {Promise<object>} Result object
 */
export async function signOut() {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    };
  }
}

/**
 * Gets the current user session
 * @returns {Promise<object>} Current user or null
 */
export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Subscribes to auth state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, event);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Resets password for a user
 * @param {string} email - User's email
 * @returns {Promise<object>} Result object
 */
export async function resetPassword(email) {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase not configured'
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw error;
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email'
    };
  }
}
