// =================================================================
// ARCHETYPE SYSTEM REGISTRY
// LitRPG framework selection (Systems / Authorities / Privileges / Paths / Overlays / Frameworks)
// =================================================================

import systemsData from '../../data/archetypes/systems.json' with { type: 'json' };
import authoritiesData from '../../data/archetypes/authorities.json' with { type: 'json' };
import pathsData from '../../data/archetypes/paths.json' with { type: 'json' };
import frameworksData from '../../data/archetypes/frameworks.json' with { type: 'json' };
import privilegesData from '../../data/archetypes/privileges.json' with { type: 'json' };
import overlaysData from '../../data/archetypes/overlays.json' with { type: 'json' };

// -----------------------------------------------------------------
// Category configuration: integrity baselines, stat affinities,
// flavor text, and visual theming for each archetype category.
// -----------------------------------------------------------------
export const CATEGORY_CONFIG = {
  System: {
    integrity: 100,
    label: "System",
    color: "#00F3FF",
    icon: "\u2699",       // gear
    description: "Structured progression frameworks with reliable, quantifiable growth mechanics.",
    statAffinities: { intelligence: 3, wisdom: 2 },
    narrativeTone: "analytical",
  },
  Authority: {
    integrity: 95,
    label: "Authority",
    color: "#FFD700",
    icon: "\u2655",       // crown
    description: "Sovereign mandates granting rule-level dominance over specific domains.",
    statAffinities: { strength: 2, vitality: 2, charisma: 1 },
    narrativeTone: "commanding",
  },
  Path: {
    integrity: 92,
    label: "Path",
    color: "#96F2D7",
    icon: "\u2726",       // star
    description: "Ritualized ascension routes that evolve your fundamental nature.",
    statAffinities: { wisdom: 3, vitality: 1, luck: 1 },
    narrativeTone: "mystical",
  },
  Framework: {
    integrity: 90,
    label: "Framework",
    color: "#E599F7",
    icon: "\u25A6",       // grid
    description: "Meta-structural overlays that rewrite how game rules apply to you.",
    statAffinities: { intelligence: 2, agility: 2, luck: 1 },
    narrativeTone: "cerebral",
  },
  Privilege: {
    integrity: 88,
    label: "Privilege",
    color: "#8CE99A",
    icon: "\u2756",       // diamond
    description: "Covert advantages that grant hidden knowledge and stealth benefits.",
    statAffinities: { agility: 3, luck: 2 },
    narrativeTone: "conspiratorial",
  },
  Overlay: {
    integrity: 85,
    label: "Overlay",
    color: "#FF8787",
    icon: "\u26A0",       // warning
    description: "Volatile system exploits with high reward and escalating instability.",
    statAffinities: { strength: 3, agility: 2 },
    narrativeTone: "chaotic",
  },
};

const DEFAULT_CATEGORY_CONFIG = {
  integrity: 85,
  label: "Unknown",
  color: "#AAAAAA",
  icon: "\u2731",
  description: "An unclassified archetype system.",
  statAffinities: {},
  narrativeTone: "neutral",
};

/**
 * Returns the category configuration for a given category string.
 * @param {string} category
 * @returns {object}
 */
export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
}

class ArchetypeSystem {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Builds an active system instance for a character.
   * Uses CATEGORY_CONFIG for integrity baselines and stat affinities.
   * @param {Object} context - Character context, seed, or snapshot.
   * @returns {Object} The initialized system instance.
   */
  build(context = {}) {
    const catConfig = getCategoryConfig(this.category);
    const integrity = catConfig.integrity;

    // Use archetype-specific tone if available, otherwise category default
    // If definition has simple string narrativeTone (legacy), map it to object
    let tone = this.narrativeTone;
    if (!tone || typeof tone === 'string') {
        tone = {
            voice: catConfig.narrativeTone || "neutral",
            vocabulary: [],
            sentenceStyle: "standard"
        };
    }

    const instance = {
      archetypeId: this.id,
      name: this.name,
      category: this.category,
      active: true,
      systemIntegrity: integrity,
      narrativeTone: tone,
      categoryIcon: catConfig.icon,
      categoryColor: catConfig.color,
      tags: Array.isArray(this.tags) ? [...this.tags] : [],
      state: { ...context },
      definition: this,
    };

    // Initialize resource if defined
    if (this.archetypeResource) {
      instance.resource = {
        name: this.archetypeResource.name,
        current: this.archetypeResource.startValue,
        max: this.archetypeResource.maxValue,
        regenRate: this.archetypeResource.regenRate || 0,
        color: this.archetypeResource.color
      };
    }

    return instance;
  }

  /**
   * Applies stat adjustments to the player profile based on category affinity.
   * Each category boosts different stats, scaled by system integrity.
   * @param {Object} profile - The player profile to adjust.
   * @param {number} integrity - The integrity value of the system instance.
   */
  applyBonuses(profile, integrity) {
    const catConfig = getCategoryConfig(this.category);
    // Prefer specific modifiers, fallback to category affinities
    const affinities = this.statModifiers || catConfig.statAffinities || {};
    const integrityScale = Math.max(0, integrity) / 100;

    for (const [stat, bonus] of Object.entries(affinities)) {
      if (profile.attributes && typeof profile.attributes[stat] === "number") {
        profile.attributes[stat] += Math.round(bonus * integrityScale);
      }
    }

    // Derived stat bonuses scale with integrity
    if (profile.derivedStats) {
      if (integrity >= 95) {
        profile.derivedStats.mp = (profile.derivedStats.mp || 0) + 15;
      }
      if (integrity >= 100) {
        profile.derivedStats.hp = (profile.derivedStats.hp || 0) + 10;
      }
    }
  }
}

export let ARCHETYPE_DEFINITIONS = [
  ...systemsData,
  ...authoritiesData,
  ...pathsData,
  ...frameworksData,
  ...privilegesData,
  ...overlaysData
];

export let ARCHETYPE_SYSTEMS = ARCHETYPE_DEFINITIONS.map(def => new ArchetypeSystem(def));

export function setArchetypeDefinitions(nextDefinitions) {
  if (!Array.isArray(nextDefinitions)) return;
  ARCHETYPE_DEFINITIONS = nextDefinitions;
  ARCHETYPE_SYSTEMS = ARCHETYPE_DEFINITIONS.map(def => new ArchetypeSystem(def));
}

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEMS.find((system) => system.id === id) || null;
}

/**
 * Returns all archetype systems belonging to a given category.
 * @param {string} category - e.g. "System", "Authority", "Path"
 * @returns {ArchetypeSystem[]}
 */
export function getArchetypesByCategory(category) {
  if (!category) return [];
  return ARCHETYPE_SYSTEMS.filter((s) => s.category === category);
}

/**
 * Returns a deduplicated, sorted list of all archetype categories present.
 * @returns {string[]}
 */
export function getArchetypeCategories() {
  const cats = new Set(ARCHETYPE_SYSTEMS.map((s) => s.category).filter(Boolean));
  // Sort so primary categories come first
  const order = ["System", "Authority", "Path", "Framework", "Privilege", "Overlay"];
  return [...cats].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function getAllArchetypeSystems() {
  return ARCHETYPE_SYSTEMS;
}
