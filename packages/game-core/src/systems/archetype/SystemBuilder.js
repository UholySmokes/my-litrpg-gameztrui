import { getArchetypeSystemById, ARCHETYPE_SYSTEMS, getCategoryConfig } from './ArchetypeSystemRegistry.js';

/**
 * Generates a deterministic player ID using a provided random number generator.
 * Falls back to Math.random() if no RNG is provided (for backwards compatibility).
 * @param {Object} context - Optional context with RNG
 * @returns {string} A unique player ID
 */
function generatePlayerId(context) {
  if (context && context.rng && typeof context.rng.range === 'function') {
    const randomSuffix = context.rng.range(100000, 999999);
    return `player_${randomSuffix}`;
  }
  const randomSuffix = Math.floor(Math.random() * 900000) + 100000;
  return `player_${randomSuffix}`;
}

/**
 * Builder class for generating full player profiles with integrated Archetype Systems.
 * Stat bonuses are now driven entirely by the archetype's category config,
 * eliminating the duplicated hard-coded logic that previously existed in both
 * the builder and the ArchetypeSystem class.
 */
export class SystemBuilder {
  constructor(baseProfile = {}, context = {}) {
    this.context = context;
    this.playerProfile = {
      id: baseProfile.id || generatePlayerId(context),
      name: baseProfile.name || "Adventurer",
      attributes: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        vitality: 10,
        wisdom: 10,
        charisma: 10,
        luck: 10,
        ...baseProfile.attributes
      },
      system: null,
      derivedStats: {
        hp: 100,
        mp: 50
      },
      ...baseProfile
    };
  }

  /**
   * Assigns an archetype system to the player profile.
   * Stat adjustments are delegated to the archetype's applyBonuses method,
   * which uses CATEGORY_CONFIG for category-specific scaling.
   * @param {string} archetypeId - The ID of the archetype to assign.
   * @param {Object} context - Context data for the system build.
   * @returns {SystemBuilder}
   */
  assignArchetype(archetypeId, context = {}) {
    const archetype = getArchetypeSystemById(archetypeId);
    if (!archetype) {
      throw new Error(`Archetype ID '${archetypeId}' not found.`);
    }

    // Build the system instance using the archetype's category-aware logic
    const systemInstance = archetype.build(context);
    this.playerProfile.system = systemInstance;

    // Delegate all stat adjustments to the archetype - single source of truth
    archetype.applyBonuses(this.playerProfile, systemInstance.systemIntegrity);

    return this;
  }

  /**
   * Returns the category config for the currently assigned system.
   * @returns {object|null}
   */
  getCategoryInfo() {
    const category = this.playerProfile.system?.category;
    return category ? getCategoryConfig(category) : null;
  }

  build() {
    // Default to the first archetype if none selected
    if (!this.playerProfile.system && ARCHETYPE_SYSTEMS.length > 0) {
      this.assignArchetype(ARCHETYPE_SYSTEMS[0].id);
    }
    return this.playerProfile;
  }
}
