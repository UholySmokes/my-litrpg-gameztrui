// =================================================================
// XP SYSTEM (Hybrid): main XP for milestones + life-skill XP for repeatables
// Includes simple anti-exploit hooks (once-only flags, cooldown stubs).
// =================================================================

import { addXp } from './gamelogic';

/**
 * Awards main XP for milestone-style events.
 * onceKey: optional flag to prevent repeat XP (stored in world.flags.milestones)
 */
export function awardMainXp(state, { xp = 0, onceKey = null }) {
  if (!xp || xp <= 0) return state;

  if (onceKey) {
    const already = state.world?.flags?.milestones?.[onceKey];
    if (already) return state;
  }

  let newState = addXp(state, xp);
  if (onceKey) {
    newState = {
      ...newState,
      world: {
        ...newState.world,
        flags: {
          ...newState.world.flags,
          milestones: {
            ...(newState.world.flags?.milestones || {}),
            [onceKey]: true
          }
        }
      }
    };
  }

  return newState;
}

/**
 * Awards life-skill XP for repeatable actions (crafting/gathering/etc).
 * Very light scaffold: tracks XP per lifeSkillId on state.player.lifeSkills.
 * onceKey: optional once-only flag to avoid repeat rewards.
 */
export function awardLifeSkillXp(state, { lifeSkillId, xp = 0, onceKey = null }) {
  if (!lifeSkillId || !xp || xp <= 0) return state;

  if (onceKey) {
    const already = state.world?.flags?.lifeSkillMilestones?.[onceKey];
    if (already) return state;
  }

  const existing = state.player.lifeSkills?.[lifeSkillId] || { xp: 0 };
  const updatedLifeSkills = {
    ...(state.player.lifeSkills || {}),
    [lifeSkillId]: {
      ...existing,
      xp: existing.xp + xp
    }
  };

  let newState = {
    ...state,
    player: {
      ...state.player,
      lifeSkills: updatedLifeSkills
    }
  };

  if (onceKey) {
    newState = {
      ...newState,
      world: {
        ...newState.world,
        flags: {
          ...newState.world.flags,
          lifeSkillMilestones: {
            ...(newState.world.flags?.lifeSkillMilestones || {}),
            [onceKey]: true
          }
        }
      }
    };
  }

  return newState;
}
