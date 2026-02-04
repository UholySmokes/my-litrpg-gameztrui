/**
 * DataRegistry.js
 * Centralized access point for all static game data.
 * Implements the Facade pattern to hide the complexity of multiple registry files.
 */

import { races } from "./registries/RaceRegistry.js";
import { classes } from "./registries/ClassRegistry.js";
import { itemDatabase } from "./registries/ItemRegistry.js";
import { enemies } from "./registries/EnemyRegistry.js";
import { gachaData } from "./registries/GachaRegistry.js";
import { shopData } from "./registries/ShopRegistry.js";
import { titleData } from "./registries/TitleRegistry.js";

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

  static getEnemies() {
    return enemies || [];
  }

  static getGachaItems() {
    return gachaData || [];
  }

  static getShopItems() {
    return shopData || [];
  }

  static getTitles() {
    return titleData || [];
  }

  static getRaceById(id) {
    return this.getRaces().find((r) => r.id === id);
  }

  static getClassById(id) {
    return this.getClasses().find((c) => c.id === id);
  }

  static getItemById(id) {
    return this.getItems()[id];
  }

  static getEnemyById(id) {
    return this.getEnemies().find((e) => e.id === id);
  }
}