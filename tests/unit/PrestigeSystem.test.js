import { describe, it, expect } from "@jest/globals";
import {
  defaultPrestigeStats,
  calculatePrestigeShards,
  getUpgradeCost,
  performPrestigeReset,
  buyPrestigeUpgrade,
  PRESTIGE_MIN_LEVEL,
} from "../../packages/game-core/src/systems/PrestigeSystem.js";

describe("PrestigeSystem pure functions", () => {
  describe("defaultPrestigeStats", () => {
    it("returns a fresh default object each call", () => {
      const a = defaultPrestigeStats();
      const b = defaultPrestigeStats();
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(a.prestigeLevel).toBe(0);
      expect(a.soulShards).toBe(0);
      expect(a.xpMultiplier).toBe(1.0);
      expect(a.upgrades).toEqual({ damage: 0, gold: 0, mana: 0, health: 0 });
    });
  });

  describe("calculatePrestigeShards", () => {
    it("returns 0 below min level", () => {
      expect(calculatePrestigeShards(1)).toBe(0);
      expect(calculatePrestigeShards(49)).toBe(0);
    });

    it("returns shards at min level", () => {
      const shards = calculatePrestigeShards(PRESTIGE_MIN_LEVEL);
      expect(shards).toBeGreaterThan(0);
      expect(Number.isInteger(shards)).toBe(true);
    });

    it("returns more shards at higher levels", () => {
      const at50 = calculatePrestigeShards(50);
      const at100 = calculatePrestigeShards(100);
      expect(at100).toBeGreaterThan(at50);
    });
  });

  describe("getUpgradeCost", () => {
    it("scales linearly with current level", () => {
      expect(getUpgradeCost(0)).toBe(10);
      expect(getUpgradeCost(1)).toBe(20);
      expect(getUpgradeCost(4)).toBe(50);
    });
  });

  describe("performPrestigeReset", () => {
    it("returns null when player level is too low", () => {
      expect(performPrestigeReset({ level: 10 })).toBeNull();
    });

    it("resets player to level 1 and awards shards", () => {
      const result = performPrestigeReset({ level: 60 });
      expect(result).not.toBeNull();
      expect(result.level).toBe(1);
      expect(result.xp).toBe(0);
      expect(result.prestige.prestigeLevel).toBe(1);
      expect(result.prestige.soulShards).toBeGreaterThan(0);
      expect(result.prestige.xpMultiplier).toBeCloseTo(1.1);
    });

    it("accumulates shards across multiple prestiges", () => {
      const first = performPrestigeReset({ level: 60 });
      const second = performPrestigeReset({
        level: 70,
        prestige: first.prestige,
      });
      expect(second.prestige.prestigeLevel).toBe(2);
      expect(second.prestige.soulShards).toBeGreaterThan(
        first.prestige.soulShards,
      );
      expect(second.prestige.xpMultiplier).toBeCloseTo(1.2);
    });

    it("does not mutate the input player", () => {
      const player = { level: 60, prestige: defaultPrestigeStats() };
      const before = JSON.parse(JSON.stringify(player));
      performPrestigeReset(player);
      expect(player).toEqual(before);
    });
  });

  describe("buyPrestigeUpgrade", () => {
    it("returns null when shards are insufficient", () => {
      const prestige = { ...defaultPrestigeStats(), soulShards: 5 };
      expect(buyPrestigeUpgrade(prestige, "damage")).toBeNull();
    });

    it("deducts shards and increments upgrade level", () => {
      const prestige = { ...defaultPrestigeStats(), soulShards: 100 };
      const next = buyPrestigeUpgrade(prestige, "damage");
      expect(next).not.toBeNull();
      expect(next.upgrades.damage).toBe(1);
      expect(next.soulShards).toBe(90);
    });

    it("does not mutate the input prestige object", () => {
      const prestige = { ...defaultPrestigeStats(), soulShards: 100 };
      const before = JSON.parse(JSON.stringify(prestige));
      buyPrestigeUpgrade(prestige, "gold");
      expect(prestige).toEqual(before);
    });

    it("costs more at higher upgrade levels", () => {
      const p1 = { ...defaultPrestigeStats(), soulShards: 1000 };
      const p2 = buyPrestigeUpgrade(p1, "mana");
      const p3 = buyPrestigeUpgrade(p2, "mana");
      // First buy costs 10, second costs 20
      expect(p1.soulShards - p2.soulShards).toBe(10);
      expect(p2.soulShards - p3.soulShards).toBe(20);
    });
  });
});
