// Auto-generated from docs/non_combat_abilities_spells_paragraphs.txt
// Source: Diverse Non-Combat Abilities and Spells (Functions, Elements, Synergies).docx
// Now loaded from JSON data

import nonCombatSkillsData from "../../data/skills/non_combat.json" with { type: "json" };

export const nonCombatSkills = nonCombatSkillsData;

export const getNonCombatSkillById = (skillId) => {
  if (!skillId) return null;
  return nonCombatSkills.find((skill) => skill.id === skillId) || null;
};
