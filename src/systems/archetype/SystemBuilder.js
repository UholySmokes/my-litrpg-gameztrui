import { getArchetypeSystemById, ARCHETYPE_SYSTEMS } from './ArchetypeSystemRegistry.js';

/**
 * Builder class for generating full player profiles with integrated Archetype Systems.
 */
export class SystemBuilder {
  constructor(baseProfile = {}) {
    this.playerProfile = {
      id: baseProfile.id || `player_${Date.now()}`,
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