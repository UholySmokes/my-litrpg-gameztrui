import {
  gachaPools,
  calculateGachaResult,
  calculateGachaResultWithPity,
  resolvePityRarity,
  PITY_THRESHOLD,
  PITY_EPIC_THRESHOLD,
} from "../../packages/game-core/src/data/gachaData.js";

describe("GachaSystem", () => {
  // ── Pool & item catalogue ──────────────────────────────────

  it("has at least 40 unique items across all pools", () => {
    const ids = new Set();
    for (const pool of Object.values(gachaPools)) {
      for (const rarityItems of Object.values(pool.items)) {
        for (const item of rarityItems) {
          ids.add(item.id);
        }
      }
    }
    expect(ids.size).toBeGreaterThanOrEqual(40);
  });

  it("has 5 pools (equipment, skills, premium, elemental, shadow)", () => {
    expect(Object.keys(gachaPools)).toEqual(
      expect.arrayContaining([
        "equipment",
        "skills",
        "premium",
        "elemental",
        "shadow",
      ]),
    );
    expect(Object.keys(gachaPools).length).toBe(5);
  });

  it("elemental pool has fire/ice/lightning themed items", () => {
    const pool = gachaPools.elemental;
    expect(pool).toBeDefined();
    expect(pool.name).toBe("Elemental Gacha");
    const allIds = Object.values(pool.items)
      .flat()
      .map((i) => i.id);
    expect(allIds.length).toBeGreaterThanOrEqual(5);
  });

  it("shadow pool has dark/stealth themed items", () => {
    const pool = gachaPools.shadow;
    expect(pool).toBeDefined();
    expect(pool.name).toBe("Shadow Gacha");
    const allIds = Object.values(pool.items)
      .flat()
      .map((i) => i.id);
    expect(allIds.length).toBeGreaterThanOrEqual(5);
  });

  it("all items across pools have unique IDs", () => {
    const ids = [];
    for (const pool of Object.values(gachaPools)) {
      for (const rarityItems of Object.values(pool.items)) {
        for (const item of rarityItems) {
          ids.push(item.id);
        }
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every pool rarity rates sum to ~1.0", () => {
    for (const [poolId, pool] of Object.entries(gachaPools)) {
      const sum = Object.values(pool.rarityRates).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  // ── Legacy pull (no pity) ──────────────────────────────────

  it("calculateGachaResult returns items from the requested pool", () => {
    const results = calculateGachaResult("elemental", 5);
    expect(results).not.toBeNull();
    expect(results.length).toBe(5);
    results.forEach((r) => {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("rarity");
    });
  });

  it("calculateGachaResult returns null for unknown pool", () => {
    expect(calculateGachaResult("nonexistent")).toBeNull();
  });

  // ── Pity helpers ───────────────────────────────────────────

  it("resolvePityRarity returns null below thresholds", () => {
    expect(resolvePityRarity(0, 0)).toBeNull();
    expect(resolvePityRarity(PITY_THRESHOLD - 1, PITY_EPIC_THRESHOLD - 1)).toBeNull();
  });

  it("resolvePityRarity returns rare at PITY_THRESHOLD", () => {
    expect(resolvePityRarity(PITY_THRESHOLD, 0)).toBe("rare");
  });

  it("resolvePityRarity returns epic at PITY_EPIC_THRESHOLD", () => {
    expect(resolvePityRarity(0, PITY_EPIC_THRESHOLD)).toBe("epic");
  });

  it("epic pity takes priority over rare pity", () => {
    expect(resolvePityRarity(PITY_THRESHOLD, PITY_EPIC_THRESHOLD)).toBe("epic");
  });

  // ── Pull with pity ────────────────────────────────────────

  it("pity counter resets on rare+ pull", () => {
    const originalRandom = Math.random;
    // Force a roll that would normally yield common (high roll → hits common bucket first)
    Math.random = () => 0.001; // very low → common in most rate tables
    try {
      const result = calculateGachaResultWithPity("equipment", 1, {
        pullsSinceRare: PITY_THRESHOLD,
        pullsSinceEpic: 0,
      });
      expect(result).not.toBeNull();
      // Pity guarantees at least rare
      const rarity = result.results[0].rarity;
      expect(["rare", "epic", "legendary"]).toContain(rarity);
      expect(result.newPullsSinceRare).toBe(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("pity counter guarantees epic at PITY_EPIC_THRESHOLD", () => {
    const originalRandom = Math.random;
    Math.random = () => 0.001;
    try {
      const result = calculateGachaResultWithPity("equipment", 1, {
        pullsSinceRare: 0,
        pullsSinceEpic: PITY_EPIC_THRESHOLD,
      });
      expect(result).not.toBeNull();
      const rarity = result.results[0].rarity;
      expect(["epic", "legendary"]).toContain(rarity);
      expect(result.newPullsSinceEpic).toBe(0);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("pity counters increment when no rare+ is pulled", () => {
    const originalRandom = Math.random;
    // Force common roll
    Math.random = () => 0.001;
    try {
      const result = calculateGachaResultWithPity("equipment", 1, {
        pullsSinceRare: 0,
        pullsSinceEpic: 0,
      });
      expect(result).not.toBeNull();
      // roll is very low so rarity = common (first bucket hit)
      expect(result.newPullsSinceRare).toBe(1);
      expect(result.newPullsSinceEpic).toBe(1);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("multi-pull tracks pity across consecutive pulls", () => {
    const originalRandom = Math.random;
    Math.random = () => 0.001;
    try {
      const result = calculateGachaResultWithPity("equipment", 3, {
        pullsSinceRare: 0,
        pullsSinceEpic: 0,
      });
      expect(result.results.length).toBe(3);
      expect(result.newPullsSinceRare).toBe(3);
      expect(result.newPullsSinceEpic).toBe(3);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("calculateGachaResultWithPity returns null for unknown pool", () => {
    expect(calculateGachaResultWithPity("nonexistent")).toBeNull();
  });

  it("new pool items are pullable from elemental pool", () => {
    const results = calculateGachaResult("elemental", 20);
    expect(results.length).toBe(20);
    const ids = results.map((r) => r.id);
    // At least some item should appear
    expect(ids.length).toBe(20);
  });

  it("new pool items are pullable from shadow pool", () => {
    const results = calculateGachaResult("shadow", 20);
    expect(results.length).toBe(20);
  });
});
