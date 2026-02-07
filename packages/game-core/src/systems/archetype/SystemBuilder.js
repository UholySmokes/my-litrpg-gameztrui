import { getArchetypeSystemById, ARCHETYPE_SYSTEMS } from './ArchetypeSystemRegistry.js';

/**
 * Generates a deterministic player ID using a provided random number generator.
 * Falls back to Math.random() if no RNG is provided (for backwards compatibility).
 * @param {Object} context - Optional context with RNG
 * @returns {string} A unique player ID
 */
function generatePlayerId(context) {
  if (context && context.rng && typeof context.rng.range === 'function') {
    // Use deterministic RNG from context
    const randomSuffix = context.rng.range(100000, 999999);
    return `player_${randomSuffix}`;
  }
  // Fallback for backwards compatibility (non-deterministic)
  const randomSuffix = Math.floor(Math.random() * 900000) + 100000;
  return `player_${randomSuffix}`;
}

/**
 * Builder class for generating full player profiles with integrated Archetype Systems.
 */
export class SystemBuilder {
  constructor(baseProfile = {}, context = {}) {
    this.playerProfile = {
      id: baseProfile.id || generatePlayerId(context),
      name: baseProfile.name || "Adventurer",
      attributes: {
        strength: 10,
        agility: 10,
        intelligence: 10,
        vitality: 10,
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
   * Assigns an archetype system to the player profile and adjusts stats based on integrity.
   * @param {string} archetypeId - The ID of the archetype to assign.
   * @param {Object} context - Context data for the system build.
   * @returns {SystemBuilder}
   */
  assignArchetype(archetypeId, context = {}) {
    const archetype = getArchetypeSystemById(archetypeId);
    if (!archetype) {
      throw new Error(`Archetype ID '${archetypeId}' not found.`);
    }

    // Build the system using the archetype's logic
    const systemInstance = archetype.build(context);
    this.playerProfile.system = systemInstance;

    // Adjust profile based on system integrity
    if (systemInstance.systemIntegrity >= 100) {
      // Perfect system: Bonus to mental stats
      this.playerProfile.attributes.intelligence += 5;
      this.playerProfile.derivedStats.mp += 20;
    } else if (systemInstance.systemIntegrity < 90) {
      // Unstable system: High risk (Strength), high cost (Vitality)
      this.playerProfile.attributes.strength += 8;
      this.playerProfile.attributes.vitality -= 2;
    }
    // Adjust profile based on system integrity via the archetype class
    archetype.applyBonuses(this.playerProfile, systemInstance.systemIntegrity);

    return this;
  }

  build() {
    // Default to the first archetype if none selected
    if (!this.playerProfile.system && ARCHETYPE_SYSTEMS.length > 0) {
      this.assignArchetype(ARCHETYPE_SYSTEMS[0].id);
    }
    return this.playerProfile;
  }
}
