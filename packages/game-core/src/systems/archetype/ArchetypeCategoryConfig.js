export const CATEGORY_CONFIG = {
  System: {
    integrity: 100,
    label: "System",
    color: "#00F3FF",
    icon: "\u2699",
    description:
      "Structured progression frameworks with reliable, quantifiable growth mechanics.",
    statAffinities: { intelligence: 3, wisdom: 2 },
    narrativeTone: "analytical",
  },
  Authority: {
    integrity: 95,
    label: "Authority",
    color: "#FFD700",
    icon: "\u2655",
    description:
      "Sovereign mandates granting rule-level dominance over specific domains.",
    statAffinities: { strength: 2, vitality: 2, charisma: 1 },
    narrativeTone: "commanding",
  },
  Path: {
    integrity: 92,
    label: "Path",
    color: "#96F2D7",
    icon: "\u2726",
    description: "Ritualized ascension routes that evolve your fundamental nature.",
    statAffinities: { wisdom: 3, vitality: 1, luck: 1 },
    narrativeTone: "mystical",
  },
  Framework: {
    integrity: 90,
    label: "Framework",
    color: "#E599F7",
    icon: "\u25A6",
    description: "Meta-structural overlays that rewrite how game rules apply to you.",
    statAffinities: { intelligence: 2, agility: 2, luck: 1 },
    narrativeTone: "cerebral",
  },
  Privilege: {
    integrity: 88,
    label: "Privilege",
    color: "#8CE99A",
    icon: "\u2756",
    description: "Covert advantages that grant hidden knowledge and stealth benefits.",
    statAffinities: { agility: 3, luck: 2 },
    narrativeTone: "conspiratorial",
  },
  Overlay: {
    integrity: 85,
    label: "Overlay",
    color: "#FF8787",
    icon: "\u26A0",
    description: "Volatile system exploits with high reward and escalating instability.",
    statAffinities: { strength: 3, agility: 2 },
    narrativeTone: "chaotic",
  },
};

export const DEFAULT_CATEGORY_CONFIG = {
  integrity: 85,
  label: "Unknown",
  color: "#AAAAAA",
  icon: "\u2731",
  description: "An unclassified archetype system.",
  statAffinities: {},
  narrativeTone: "neutral",
};

export const CATEGORY_ORDER = [
  "System",
  "Authority",
  "Path",
  "Framework",
  "Privilege",
  "Overlay",
];

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
}
