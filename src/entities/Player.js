// =================================================================
// CHARACTER DATA - Race, Class, Talent, and Skill Definitions
// =================================================================

import {
  getRaceById as getRaceByIdFromRegistry,
  races as racesFromRegistry,
} from "../systems/race/RaceRegistry.js";
import {
  classes as classesFromRegistry,
  getClassById as getClassByIdFromRegistry,
} from "../systems/class/ClassRegistry.js";
import {
  exRankTalents as talentsFromRegistry,
  getTalentById as getTalentByIdFromRegistry,
  getRandomTalents as getRandomTalentsFromRegistry,
} from "../systems/skills/TalentDefinitions.js";

// Re-export for backward compatibility
export const races = racesFromRegistry;
export const classes = classesFromRegistry;
export const exRankTalents = talentsFromRegistry;

export function getRaceById(id) {
  return getRaceByIdFromRegistry(id);
}

export function getClassById(id) {
  return getClassByIdFromRegistry(id);
}

export function getTalentById(id) {
  return getTalentByIdFromRegistry(id);
}

export function getRandomTalents(count = 3) {
  return getRandomTalentsFromRegistry(count);
}

/**
 * SKILLS DATABASE - Now references the comprehensive skills.js system
 * This is kept for backward compatibility but delegates to skills.js
 */
// Import skills functions from skills.js
import {
  getSkillsByClass as getSkillsByClassFromSkills,
  getSkillById as getSkillByIdFromSkills,
} from "../systems/skills/SkillRegistry.js";

export function getSkillsByClass(classId) {
  // Delegate to skills.js for the new system
  try {
    return getSkillsByClassFromSkills(classId);
  } catch (error) {
    console.warn(`Error getting skills for class ${classId}:`, error);
    return { active: [], passive: [] };
  }
}

export function getSkillById(skillId) {
  try {
    return getSkillByIdFromSkills(skillId);
  } catch (error) {
    console.warn(`Error getting skill by id ${skillId}:`, error);
    return null;
  }
}
