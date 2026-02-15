/**
 * DataRegistry.js
 * Centralized access point for all static game data.
 * Implements the Facade pattern to hide the complexity of multiple registry files.
 */

import {
  races,
  getRaceEvolutionOptions,
  getRaceEvolutionOption,
} from "./registries/RaceDataRegistry.js";
import {
  classes,
  getClassEvolutionOptions,
  getClassEvolutionOption,
} from "./registries/ClassDataRegistry.js";
import {
  itemDatabase,
  getItemsByType as getItemsByTypeFromRegistry,
  getItemsByRarity as getItemsByRarityFromRegistry,
  getEquipmentBySlot as getEquipmentBySlotFromRegistry,
} from "./registries/ItemDataRegistry.js";
import { enemies } from "./registries/EnemyDataRegistry.js";
import { gachaPools } from "./gachaData.js";
import { getShopItemsByCategory } from "./shopData.js";
import { titleDatabase } from "./titleData.js";
import { getQuestById as getQuestByIdFromCatalog } from "./QuestCatalog.js";

export class DataRegistry {
  static getRaces() {
    return races || [];
  }

  static getClasses() {
    return classes || [];
  }

  static getItems() {
    return itemDatabase || {};
  }

  static getItemsByType(type) {
    return getItemsByTypeFromRegistry(type);
  }

  static getItemsByRarity(rarity) {
    return getItemsByRarityFromRegistry(rarity);
  }

  static getEquipmentBySlot(slot) {
    return getEquipmentBySlotFromRegistry(slot);
  }

  static getEnemies() {
    return enemies || [];
  }

  static getGachaItems() {
    return gachaPools || {};
  }

  static getShopItems() {
    return getShopItemsByCategory("all");
  }

  static getTitles() {
    return titleDatabase || [];
  }

  static getRaceById(id) {
    return this.getRaces().find((r) => r.id === id);
  }

  static getClassById(id) {
    return this.getClasses().find((c) => c.id === id);
  }

  static getClassEvolutionOptions(classId) {
    return getClassEvolutionOptions(classId);
  }

  static getClassEvolutionOption(classId, optionIdOrTargetId) {
    return getClassEvolutionOption(classId, optionIdOrTargetId);
  }

  static getRaceEvolutionOptions(raceRef, stageOverride = null) {
    return getRaceEvolutionOptions(raceRef, stageOverride);
  }

  static getRaceEvolutionOption(raceRef, optionIdOrName, stageOverride = null) {
    return getRaceEvolutionOption(raceRef, optionIdOrName, stageOverride);
  }

  static getItemById(id) {
    return this.getItems()[id];
  }

  static getEnemyById(id) {
    return this.getEnemies().find((e) => e.id === id);
  }

  static getQuestById(id) {
    return getQuestByIdFromCatalog(id);
  }
}
