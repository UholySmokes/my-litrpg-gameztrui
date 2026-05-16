/**
 * DataRegistry.js
 * Centralized access point for all static game data.
 * Implements the Facade pattern to hide the complexity of multiple registry files.
 */

import { applyVoidGeneratorPatches, loadVoidGeneratorData } from "./voidverse-adapter.js";

// Apply VoidGenerator content patches at module load time.
// Safe to call even if the JSON files are absent — adapter logs a warning and skips.
let _patched = false;
async function ensureVoidGeneratorPatch() {
  if (_patched) return;
  _patched = true;
  await loadVoidGeneratorData();
  applyVoidGeneratorPatches();
}
// Fire and forget — races/classes/items are extended before first game use.
ensureVoidGeneratorPatch().catch(console.warn);

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
  origins,
  getOriginById as getOriginByIdFromRegistry,
} from "./registries/OriginDataRegistry.js";
import {
  itemDatabase,
  getItemsByType as getItemsByTypeFromRegistry,
  getItemsByRarity as getItemsByRarityFromRegistry,
  getEquipmentBySlot as getEquipmentBySlotFromRegistry,
  getItemSummaries as getItemSummariesFromRegistry,
  getItemSummaryById as getItemSummaryByIdFromRegistry,
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

  static getOrigins() {
    return origins || [];
  }

  static getItems() {
    return itemDatabase || {};
  }

  static getItemSummaries() {
    return getItemSummariesFromRegistry();
  }

  static getItemSummaryById(id) {
    return getItemSummaryByIdFromRegistry(id);
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

  static getOriginById(id) {
    return getOriginByIdFromRegistry(id);
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
