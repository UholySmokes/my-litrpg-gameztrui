import { describe, it, expect } from "@jest/globals";
import { initialGameState } from "../../src/data/initialState.js";
import { xpForNextLevel } from "../../src/systems/leveling/LevelingSystem.js";
import { performLevelUp } from "../../src/systems/leveling/LevelingManager.js";
import { calculateMaxHp, calculateMaxMana } from "../../src/utils/AttributeMath.js";
import { gameReducer } from "../../src/core/gameReducer.js";
import { normalizeGameState } from "../../src/core/StateNormalizer.js";
import {
  calculateGachaResult,
  getAdjustedRarityRates,
} from "../../src/data/gachaData.js";
import { getPurchasableTitles } from "../../src/systems/titles/TitleSystem.js";
import {
  startCombat,
  playerAttack,
  processEnemyTurns,
  executeSkill,
} from "../../src/systems/combat/CombatSystem.js";

describe("Leveling and combat invariants", () => {
  it("uses spec-aligned XP curve defaults", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(150);
    expect(xpForNextLevel(3)).toBe(225);
  });

  it("initialGameState derives XP/HP/Mana from config + attributes", () => {
    expect(initialGameState.player.xp.max).toBe(
      xpForNextLevel(1, initialGameState.config),
    );
    expect(initialGameState.player.hp.max).toBe(
      calculateMaxHp(initialGameState.player.attributes),
    );
    expect(initialGameState.player.mana.max).toBe(
      calculateMaxMana(initialGameState.player.attributes),
    );
  });

  it("performLevelUp grants free points and updates xp.max", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        xp: {
          ...initialGameState.player.xp,
          current: initialGameState.player.xp.max,
        },
      },
    };

    const next = performLevelUp(state);
    expect(next.player.level).toBe(2);
    expect(next.player.xp.current).toBe(0);
    expect(next.player.xp.max).toBe(xpForNextLevel(2, state.config));
    expect(next.player.attributes.freePoints).toBe(
      (state.player.attributes.freePoints ?? 0) +
        (state.config.attributePointsPerLevel ?? 0),
    );
  });

  it("basic combat remains deterministic under fixed RNG", () => {
    const originalRandom = Math.random;
    Math.random = () => 1;

    try {
      const state = startCombat(initialGameState, ["goblin"]);
      const attack = playerAttack(state, 0);

      expect(attack.success).toBe(true);
      expect(attack.state.combat.enemies[0].stats.hp.current).toBe(9);

      const afterEnemies = processEnemyTurns(attack.state);
      expect(afterEnemies.combat.turn).toBe("player");
      expect(afterEnemies.player.hp.current).toBe(
        initialGameState.player.hp.current - 2,
      );
    } finally {
      Math.random = originalRandom;
    }
  });

  it("executeSkill scales physical skills with STR + weapon attack", () => {
    const attacker = {
      name: "Hero",
      level: 1,
      attributes: { strength: 5 },
      equipment: { weapon: { stats: { attack: 10 } } },
      mana: { current: 999, max: 999 },
      talents: [],
    };
    const defender = { name: "Target Dummy", stats: { defense: 0 } };

    const result = executeSkill(attacker, defender, "knight_charge", {
      strToDamageMultiplier: 2,
      defenseReductionFactor: 0.5,
    });

    expect(result.insufficientMana).not.toBe(true);
    expect(result.damage).toBe(20);
  });
});

describe("Title system", () => {
  it("initialGameState starts with Novice Adventurer unlocked", () => {
    expect(initialGameState.player.unlockedTitles).toContain("novice_adventurer");
    expect(initialGameState.player.equippedTitle).toBe(null);
  });

  it("normalizeGameState upgrades legacy player shapes", () => {
    const normalized = normalizeGameState({
      config: {},
      player: {
        level: 1,
        xp: 50,
        hp: 10,
        mana: 5,
        attributes: { strength: 5, vitality: 5, intelligence: 5 },
      },
    });

    expect(normalized.player.xp).toEqual({ current: 50, max: 100 });
    expect(normalized.player.hp.max).toBe(125);
    expect(normalized.player.mana.max).toBe(65);
    expect(normalized.player.unlockedTitles).toContain("novice_adventurer");
  });

  it("normalizeGameState auto-unlocks non-purchase titles when eligible", () => {
    const normalized = normalizeGameState({
      config: {},
      player: {
        level: 20,
        xp: { current: 0, max: 1 },
        attributes: { strength: 5, vitality: 5, intelligence: 5 },
      },
      quests: { active: [], completed: [] },
    });

    expect(normalized.player.unlockedTitles).toContain("legendary_hero");
  });

  it("auto-unlocks Wealthy Merchant based on totalGoldEarned", () => {
    const normalized = normalizeGameState({
      config: {},
      player: {
        level: 5,
        xp: { current: 0, max: 1 },
        currency: { goldCoins: 1000, soulpoints: 0 },
        gold: 1000,
        attributes: { strength: 5, vitality: 5, intelligence: 5 },
      },
      quests: { active: [], completed: [] },
    });

    expect(normalized.player.unlockedTitles).toContain("wealthy_merchant");
  });

  it("PURCHASE_TITLE deducts currency and unlocks", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        gold: 500,
        currency: { ...initialGameState.player.currency, goldCoins: 500 },
      },
    };

    const next = gameReducer(state, {
      type: "PURCHASE_TITLE",
      payload: { titleId: "shop_owner" },
    });

    expect(next.player.unlockedTitles).toContain("shop_owner");
    expect(next.player.currency.goldCoins).toBe(0);
    expect(next.player.gold).toBe(0);
  });

  it("EQUIP_TITLE recalculates derived vitals", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        unlockedTitles: [
          ...(initialGameState.player.unlockedTitles || []),
          "legendary_hero",
        ],
        titles: [...(initialGameState.player.titles || []), "legendary_hero"],
      },
    };

    const equipped = gameReducer(state, {
      type: "EQUIP_TITLE",
      payload: { titleId: "legendary_hero" },
    });

    expect(equipped.player.hp.max).toBe(150);
    expect(equipped.player.mana.max).toBe(116);

    const unequipped = gameReducer(equipped, {
      type: "UNEQUIP_TITLE",
      payload: { titleId: "legendary_hero" },
    });

    expect(unequipped.player.hp.max).toBe(initialGameState.player.hp.max);
    expect(unequipped.player.mana.max).toBe(71);
  });

  it("executeSkill applies title attack and skill power bonuses", () => {
    const baseAttacker = {
      name: "Hero",
      level: 1,
      attributes: { strength: 5 },
      equipment: { weapon: { stats: { attack: 10 } } },
      mana: { current: 999, max: 999 },
      talents: [],
    };
    const defender = { name: "Target Dummy", stats: { defense: 0 } };
    const config = { strToDamageMultiplier: 2, defenseReductionFactor: 0.5 };

    const attackTitle = executeSkill(
      {
        ...baseAttacker,
        unlockedTitles: ["monster_slayer"],
        equippedTitle: "monster_slayer",
      },
      defender,
      "knight_charge",
      config,
    );
    expect(attackTitle.damage).toBe(31);

    const skillPowerTitle = executeSkill(
      {
        ...baseAttacker,
        unlockedTitles: ["skill_master"],
        equippedTitle: "skill_master",
      },
      defender,
      "knight_charge",
      config,
    );
    expect(skillPowerTitle.damage).toBe(23);
  });

  it("auto-unlocks titles after combat milestones (killCount + killType)", () => {
    const originalRandom = Math.random;
    Math.random = () => 1;

    try {
      const monsterSlayerState = normalizeGameState({
        ...initialGameState,
        player: {
          ...initialGameState.player,
          level: 3,
          attributes: { ...initialGameState.player.attributes, strength: 100 },
          progress: {
            ...initialGameState.player.progress,
            totalKills: 9,
            killsByEnemyId: {},
          },
        },
      });
      const monsterCombat = startCombat(monsterSlayerState, ["goblin"]);
      const afterMonsterKill = gameReducer(monsterCombat, {
        type: "PLAYER_ATTACK",
        payload: { enemyIndex: 0 },
      });
      expect(afterMonsterKill.player.unlockedTitles).toContain("monster_slayer");

      const dragonState = normalizeGameState({
        ...initialGameState,
        player: {
          ...initialGameState.player,
          level: 8,
          attributes: { ...initialGameState.player.attributes, strength: 1000 },
          progress: {
            ...initialGameState.player.progress,
            totalKills: 0,
            killsByEnemyId: {},
          },
        },
      });
      const dragonCombat = startCombat(dragonState, ["dragon_whelp"]);
      const afterDragonKill = gameReducer(dragonCombat, {
        type: "PLAYER_ATTACK",
        payload: { enemyIndex: 0 },
      });
      expect(afterDragonKill.player.unlockedTitles).toContain("dragon_slayer");
    } finally {
      Math.random = originalRandom;
    }
  });

  it("getPurchasableTitles respects non-purchase conditions", () => {
    const base = normalizeGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        currency: { ...initialGameState.player.currency, soulpoints: 1000 },
        soulpoints: 1000,
        progress: {
          ...initialGameState.player.progress,
          gachaPulls: 99,
        },
      },
    });

    expect(getPurchasableTitles(base).some((t) => t.id === "gacha_master")).toBe(
      false,
    );

    const eligible = normalizeGameState({
      ...base,
      player: {
        ...base.player,
        progress: {
          ...base.player.progress,
          gachaPulls: 100,
        },
      },
    });

    expect(
      getPurchasableTitles(eligible).some((t) => t.id === "gacha_master"),
    ).toBe(true);
  });

  it("PURCHASE_TITLE enforces non-purchase conditions", () => {
    const state = normalizeGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        currency: { ...initialGameState.player.currency, soulpoints: 1000 },
        soulpoints: 1000,
        progress: {
          ...initialGameState.player.progress,
          gachaPulls: 0,
        },
      },
    });

    const next = gameReducer(state, {
      type: "PURCHASE_TITLE",
      payload: { titleId: "gacha_master" },
    });

    expect(next.player.unlockedTitles).not.toContain("gacha_master");
    expect(next.player.currency.soulpoints).toBe(1000);
  });

  it("combat gold rewards apply title goldGain bonus", () => {
    const originalRandom = Math.random;
    Math.random = () => 1;

    try {
      const state = {
        ...initialGameState,
        player: {
          ...initialGameState.player,
          gold: 0,
          currency: { ...initialGameState.player.currency, goldCoins: 0 },
          attributes: { ...initialGameState.player.attributes, strength: 100 },
          unlockedTitles: [
            ...(initialGameState.player.unlockedTitles || []),
            "wealthy_merchant",
          ],
          titles: [...(initialGameState.player.titles || []), "wealthy_merchant"],
          equippedTitle: "wealthy_merchant",
        },
      };

      const combat = startCombat(state, ["goblin"]);
      const attack = playerAttack(combat, 0);
      expect(attack.success).toBe(true);
      expect(attack.state.player.currency.goldCoins).toBe(6);
      expect(attack.state.player.gold).toBe(6);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("quest gold rewards apply title goldGain bonus", () => {
    const state = normalizeGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        level: 5,
        gold: 0,
        currency: { ...initialGameState.player.currency, goldCoins: 0 },
        unlockedTitles: [
          ...(initialGameState.player.unlockedTitles || []),
          "wealthy_merchant",
        ],
        titles: [...(initialGameState.player.titles || []), "wealthy_merchant"],
        equippedTitle: "wealthy_merchant",
      },
      quests: {
        active: [{ id: "quest_1" }],
        completed: [],
      },
    });

    const next = gameReducer(state, {
      type: "COMPLETE_QUEST",
      payload: {
        questId: "quest_1",
        reward: { gold: 5 },
      },
    });

    expect(next.player.currency.goldCoins).toBe(6);
    expect(next.player.gold).toBe(6);
    expect(next.player.progress.totalGoldEarned).toBe(6);
  });

  it("gachaBonus shifts rates away from common", () => {
    const baseRates = {
      common: 0.5,
      uncommon: 0.3,
      rare: 0.15,
      epic: 0.04,
      legendary: 0.01,
    };

    const adjusted = getAdjustedRarityRates(baseRates, 0.05);
    expect(adjusted.common).toBeCloseTo(0.45, 5);
    expect(adjusted.legendary).toBeGreaterThan(baseRates.legendary);
  });

  it("calculateGachaResult uses gachaBonus when rolling rarity", () => {
    const originalRandom = Math.random;
    const sequence = [0.45, 0];
    Math.random = () => (sequence.length ? sequence.shift() : 0);

    try {
      const results = calculateGachaResult("equipment", 1, { gachaBonus: 0.1 });
      expect(results[0].rarity).toBe("uncommon");
    } finally {
      Math.random = originalRandom;
    }
  });
});
