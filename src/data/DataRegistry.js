// =================================================================
// DATA REGISTRY - Unified Data Access Layer
// Provides centralized access to all game data with factory pattern
// Replaces scattered data files across src/lib/, src/entities/, src/systems/
// =================================================================

import {
  races as raceData,
  RACE_TRAITS,
  getPassiveAbility,
  getHiddenTraits,
  hasRaceTag,
  getRaceEffectTags,
  getRaceEntityTags,
  getRaceRebirth,
  canRaceRebirth,
} from "./registries/RaceDataRegistry.js";
import { classes as classData } from "./registries/ClassDataRegistry.js";
import {
  getEquipmentBySlot,
  getItemData,
  getItems,
  getItemsByRarity,
  getItemsByType,
  itemDatabase,
} from "./registries/ItemDataRegistry.js";
import { enemies as enemyData } from "./registries/EnemyDataRegistry.js";
import { getQuestById } from "../data/QuestCatalog.js";

/**
 * DataRegistry - Unified access point for all game data
 *
 * Benefits:
 * - Single import point for all data
 * - Consistent API across all data types
 * - Easy to add caching/validation
 * - Generator-ready architecture
 */
export class DataRegistry {
  // ============================================
  // RACE DATA ACCESS
  // ============================================

  /**
   * Get all races
   * @returns {Array} All race definitions
   */
  static getRaces() {
    return raceData;
  }

  /**
   * Get race by ID
   * @param {string} raceId - The race ID
   * @returns {object|null} Race definition or null
   */
  static getRaceById(raceId) {
    return raceData.find((r) => r.id === raceId) || null;
  }

  /**
   * Get race traits (passive + hidden)
   * @param {string} raceId - The race ID
   * @returns {object|null} Race traits or null
   */
  static getRaceTraits(raceId) {
    return RACE_TRAITS[raceId] || null;
  }

  /**
   * Get race passive ability
   * @param {string} raceId - The race ID
   * @returns {object|null} Passive ability or null
   */
  static getRacePassive(raceId) {
    return getPassiveAbility(raceId);
  }

  /**
   * Get race hidden traits
   * @param {string} raceId - The race ID
   * @returns {object|null} Hidden traits or null
   */
  static getRaceHidden(raceId) {
    return getHiddenTraits(raceId);
  }

  /**
   * Check if race has specific tag
   * @param {string} raceId - The race ID
   * @param {string} tag - The effect tag
   * @returns {boolean} True if race has tag
   */
  static hasRaceTag(raceId, tag) {
    return hasRaceTag(raceId, tag);
  }

  /**
   * Get all effect tags for a race
   * @param {string} raceId - The race ID
   * @returns {Array} Array of effect tags
   */
  static getRaceEffectTags(raceId) {
    return getRaceEffectTags(raceId);
  }

  /**
   * Get entity tags for a race
   * @param {string} raceId - The race ID
   * @returns {Array} Array of entity tags
   */
  static getRaceEntityTags(raceId) {
    return getRaceEntityTags(raceId);
  }

  /**
   * Get race rebirth configuration
   * @param {string} raceId - The race ID
   * @returns {object|null} Rebirth config or null
   */
  static getRaceRebirth(raceId) {
    return getRaceRebirth(raceId);
  }

  /**
   * Check if race can rebirth
   * @param {string} raceId - The race ID
   * @param {number} lastRebirthTime - Timestamp of last rebirth
   * @returns {object} { canRebirth: boolean, remainingCooldown: number }
   */
  static canRaceRebirth(raceId, lastRebirthTime = 0) {
    return canRaceRebirth(raceId, lastRebirthTime);
  }

  // ============================================
  // CLASS DATA ACCESS
  // ============================================

  /**
   * Get all classes
   * @returns {Array} All class definitions
   */
  static getClasses() {
    return classData;
  }

  /**
   * Get class by ID
   * @param {string} classId - The class ID
   * @returns {object|null} Class definition or null
   */
  static getClassById(classId) {
    return classData.find((c) => c.id === classId) || null;
  }

  /**
   * Get classes by upgrade path
   * @param {string} upgradePath - The upgrade path ID
   * @returns {Array} Classes with matching upgrade path
   */
  static getClassesByUpgradePath(upgradePath) {
    return classData.filter((c) => c.upgradePath === upgradePath);
  }

  // ============================================
  // ITEM DATA ACCESS
  // ============================================

  /**
   * Get all items
   * @returns {object} Item database object
   */
  static getItems() {
    return itemDatabase;
  }

  /**
   * Get item by ID
   * @param {string} itemId - The item ID
   * @returns {object|null} Item definition or null
   */
  static getItemById(itemId) {
    return getItemData(itemId);
  }

  /**
   * Get items by type
   * @param {string} type - Item type (consumable, equipment, material, etc.)
   * @returns {Array} Items of specified type
   */
  static getItemsByType(type) {
    return getItemsByType(type);
  }

  /**
   * Get items by rarity
   * @param {string} rarity - Item rarity (common, uncommon, rare, epic, legendary)
   * @returns {Array} Items of specified rarity
   */
  static getItemsByRarity(rarity) {
    return getItemsByRarity(rarity);
  }

  /**
   * Get equipment by slot
   * @param {string} slot - Equipment slot (weapon, armor, etc.)
   * @returns {Array} Equipment for specified slot
   */
  static getEquipmentBySlot(slot) {
    return getEquipmentBySlot(slot);
  }

  // ============================================
  // ENEMY DATA ACCESS
  // ============================================

  /**
   * Get all enemies
   * @returns {Array} All enemy definitions
   */
  static getEnemies() {
    return enemyData;
  }

  /**
   * Get enemy by ID
   * @param {string} enemyId - The enemy ID
   * @returns {object|null} Enemy definition or null
   */
  static getEnemyById(enemyId) {
    return enemyData.find((e) => e.id === enemyId) || null;
  }

  /**
   * Get quest metadata by ID
   * @param {string} questId
   * @returns {object|null}
   */
  static getQuestById(questId) {
    return getQuestById(questId);
  }

  /**
   * Get enemies by level range
   * @param {number} minLevel - Minimum level
   * @param {number} maxLevel - Maximum level
   * @returns {Array} Enemies in level range
   */
  static getEnemiesByLevelRange(minLevel, maxLevel) {
    return enemyData.filter((e) => e.level >= minLevel && e.level <= maxLevel);
  }

  /**
   * Get enemies by type
   * @param {string} type - Enemy type (beast, undead, demon, etc.)
   * @returns {Array} Enemies of specified type
   */
  static getEnemiesByType(type) {
    return enemyData.filter((e) => e.type === type || e.tags?.includes(type));
  }

  // ============================================
  // VALIDATION & UTILITY
  // ============================================

  /**
   * Validate race ID exists
   * @param {string} raceId - The race ID
   * @returns {boolean} True if valid
   */
  static isValidRaceId(raceId) {
    return raceData.some((r) => r.id === raceId);
  }

  /**
   * Validate class ID exists
   * @param {string} classId - The class ID
   * @returns {boolean} True if valid
   */
  static isValidClassId(classId) {
    return classData.some((c) => c.id === classId);
  }

  /**
   * Validate item ID exists
   * @param {string} itemId - The item ID
   * @returns {boolean} True if valid
   */
  static isValidItemId(itemId) {
    return itemId in itemDatabase;
  }

  /**
   * Validate enemy ID exists
   * @param {string} enemyId - The enemy ID
   * @returns {boolean} True if valid
   */
  static isValidEnemyId(enemyId) {
    return enemyData.some((e) => e.id === enemyId);
  }

  // ============================================
  // SEARCH & FILTER
  // ============================================

  /**
   * Search races by name or description
   * @param {string} query - Search query
   * @returns {Array} Matching races
   */
  static searchRaces(query) {
    const lowerQuery = query.toLowerCase();
    return raceData.filter(
      (r) =>
        r.name.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Search classes by name or description
   * @param {string} query - Search query
   * @returns {Array} Matching classes
   */
  static searchClasses(query) {
    const lowerQuery = query.toLowerCase();
    return classData.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Search items by name or description
   * @param {string} query - Search query
   * @returns {Array} Matching items
   */
  static searchItems(query) {
    const lowerQuery = query.toLowerCase();
    return getItems().filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery),
    );
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get data statistics
   * @returns {object} Statistics about all data
   */
  static getStatistics() {
    return {
      races: {
        total: raceData.length,
        byEvolutionStage: this._groupBy(raceData, "evolutionStage"),
      },
      classes: {
        total: classData.length,
        byUpgradePath: this._groupBy(classData, "upgradePath"),
      },
      items: {
        total: Object.keys(itemDatabase).length,
        byType: this._groupBy(getItems(), "type"),
        byRarity: this._groupBy(getItems(), "rarity"),
      },
      enemies: {
        total: enemyData.length,
        byType: this._groupBy(enemyData, "type"),
      },
    };
  }

  /**
   * Helper: Group array by property
   * @private
   */
  static _groupBy(array, property) {
    return array.reduce((acc, item) => {
      const key = item[property] || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
}
