export {
  CREATION_SKILL_SELECTION_LIMITS,
  buildCharacterCreationLatticeProfile,
  buildCharacterCreationSkillPools,
  getCharacterCreationSkillSelectionLimits,
  resolveCharacterCreationSkillLoadout,
  validateCharacterCreationSkillSelections,
} from "./CharacterCreationSkillSelection.js";

import { listCharacterCreationSkillLoadouts as listResolvedCharacterCreationSkillLoadouts } from "./CharacterCreationSkillSelection.js";

const ALIGNMENTS = [
  { id: "lawful_good", name: "Lawful Good", description: "Order and compassion. You keep your word." },
  { id: "neutral_good", name: "Neutral Good", description: "Kindness first. Rules are tools, not chains." },
  { id: "chaotic_good", name: "Chaotic Good", description: "Freedom and mercy. You break cages." },
  { id: "lawful_neutral", name: "Lawful Neutral", description: "Structure above all. The system must stand." },
  { id: "true_neutral", name: "True Neutral", description: "Balance and pragmatism. Survive, adapt, endure." },
  { id: "chaotic_neutral", name: "Chaotic Neutral", description: "Impulse and independence. You choose your own path." },
];

const PERKS_CONFIG = {
  minPicks: 1,
  maxPicks: 2,
  options: [
    { id: "iron_stomach", name: "Iron Stomach", description: "Consumables are 10% more effective." },
    { id: "battle_focus", name: "Battle Focus", description: "+5% damage while above 80% HP." },
    { id: "cautious", name: "Cautious", description: "+5% dodge while below 30% HP." },
    { id: "scavenger", name: "Scavenger", description: "+10% gold from drops and rewards." },
    { id: "ritualist", name: "Ritualist", description: "Magic misfires sometimes gain a costly \"catch\" outcome instead of failing outright." },
    { id: "quick_learner", name: "Quick Learner", description: "+5% XP gain." },
    { id: "sturdy_grip", name: "Sturdy Grip", description: "Control resistance: 25% chance to shrug off stuns/roots; otherwise their duration is reduced." },
    { id: "arcane_sense", name: "Arcane Sense", description: "Reveals arcane traces when traveling and adds trace notes to essence sensing." },
  ],
};

const STARTER_TREES_CONFIG = {
  minPicks: 0,
  maxPicks: 1,
  options: [
    { id: "offense", name: "Offense", description: "Plan toward burst damage and crit synergies." },
    { id: "defense", name: "Defense", description: "Plan toward mitigation, sustain, and resistances." },
    { id: "utility", name: "Utility", description: "Plan toward mobility, control, and exploration perks." },
  ],
};

export function listCharacterCreationAlignments() {
  return ALIGNMENTS.map((entry) => ({ ...entry }));
}

export function listCharacterCreationPerks() {
  return PERKS_CONFIG.options.map((entry) => ({ ...entry }));
}

export function getCharacterCreationPerkLimits() {
  return {
    minPicks: PERKS_CONFIG.minPicks,
    maxPicks: PERKS_CONFIG.maxPicks,
  };
}

export function listCharacterCreationStarterTrees() {
  return STARTER_TREES_CONFIG.options.map((entry) => ({ ...entry }));
}

export function getCharacterCreationStarterTreeLimits() {
  return {
    minPicks: STARTER_TREES_CONFIG.minPicks,
    maxPicks: STARTER_TREES_CONFIG.maxPicks,
  };
}

export function listCharacterCreationSkillLoadouts(context = {}) {
  return listResolvedCharacterCreationSkillLoadouts(context);
}
