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
    { id: "scavenger", name: "Scavenger", description: "+10% gold from drops." },
    { id: "ritualist", name: "Ritualist", description: "Story rituals have an extra outcome option (placeholder)." },
    { id: "quick_learner", name: "Quick Learner", description: "+5% XP gain." },
    { id: "sturdy_grip", name: "Sturdy Grip", description: "Reduced knockback and stagger (placeholder)." },
    { id: "arcane_sense", name: "Arcane Sense", description: "Detect magical traces on maps (placeholder)." },
  ],
};

const STARTER_TREES_CONFIG = {
  maxPicks: 1,
  options: [
    { id: "offense", name: "Offense", description: "Plan toward burst damage and crit synergies." },
    { id: "defense", name: "Defense", description: "Plan toward mitigation, sustain, and resistances." },
    { id: "utility", name: "Utility", description: "Plan toward mobility, control, and exploration perks." },
  ],
};

const SKILL_LOADOUTS = [];

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
    maxPicks: STARTER_TREES_CONFIG.maxPicks,
  };
}

export function listCharacterCreationSkillLoadouts() {
  return SKILL_LOADOUTS.map((entry) => ({ ...entry }));
}
