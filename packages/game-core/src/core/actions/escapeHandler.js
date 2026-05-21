import {escapeCombat} from "../../systems/combat/CombatSystem.js";

/**
 * Handle escape actions — attempt to flee from combat.
 * @param {object} state - Current game state
 * @param {object} _action - The action object (unused)
 * @returns {{ newState: object, description: string, changes: object, incrementsTurn: boolean }|{ earlyReturn: object }}
 */
// eslint-disable-next-line no-unused-vars
export function handleEscape(state, _action) {
  if (!state.combat || state.combat.status !== "active") {
    return {
      earlyReturn: {
        success: false,
        reason: "Not in combat",
        state,
      },
    };
  }

  const result = escapeCombat(state);
  if (result.success) {
    return {
      newState: result.state || state,
      description: "Escaped from combat.",
      changes: { escaped: true },
      incrementsTurn: false,
    };
  }

  if (result.state && result.state !== state) {
    // Preserve failed-escape side effects (combat log + enemy turn).
    return {
      newState: result.state,
      description: result.reason || "Escape attempt failed.",
      changes: { escapeFailed: true },
      incrementsTurn: false,
    };
  }

  return {
    earlyReturn: {
      success: false,
      reason: result.reason || "Escape failed",
      state,
    },
  };
}
