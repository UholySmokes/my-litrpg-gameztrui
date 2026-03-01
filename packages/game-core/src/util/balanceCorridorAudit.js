import { classes } from "../data/registries/ClassDataRegistry.js";
import { races } from "../data/registries/RaceDataRegistry.js";
import { enemies } from "../data/registries/EnemyDataRegistry.js";
import { itemDatabase } from "../data/registries/ItemDataRegistry.js";
import { BEGINNER_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from "../data/QuestCatalog.js";

const DEFAULT_QUESTS = [...BEGINNER_QUESTS, ...MAIN_QUESTS, ...SIDE_QUESTS];

const ENEMY_WINDOWS_BY_TIER = {
  1: { min: 1, maxExclusive: 4 },
  2: { min: 3, maxExclusive: 7 },
  3: { min: 6, maxExclusive: 11 },
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + toNumber(value, 0), 0);
  return total / values.length;
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = values.map((value) => toNumber(value, 0)).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function normalizeClassStats(baseStats = {}) {
  return {
    str: toNumber(baseStats.strength, 0),
    dex: toNumber(baseStats.dexterity, 0),
    int: toNumber(baseStats.intelligence, 0),
    wis: toNumber(baseStats.wisdom, 0),
    con: toNumber(baseStats.constitution, 0),
    cha: toNumber(baseStats.charisma, 0),
  };
}

function normalizeRaceStats(statBonuses = {}) {
  return {
    str: toNumber(statBonuses.str, 0),
    agi: toNumber(statBonuses.agi, 0),
    dex: toNumber(statBonuses.dex, 0),
    int: toNumber(statBonuses.int, 0),
    cha: toNumber(statBonuses.cha, 0),
    will: toNumber(statBonuses.will, 0),
    luck: toNumber(statBonuses.luck, 0),
    soul: toNumber(statBonuses.soul, 0),
  };
}

function deriveClassCombatProfile(classEntry) {
  const tier = Math.max(1, toNumber(classEntry?.tier, 1));
  const stats = normalizeClassStats(classEntry?.baseStats || {});
  const attack =
    7 +
    stats.str * 1.7 +
    stats.dex * 1.15 +
    stats.int * 1.45 +
    stats.wis * 0.45 +
    tier * 1.2;
  const defense = 4 + stats.con * 1.9 + stats.str * 0.55 + stats.wis * 0.5 + tier * 0.8;
  const hp = 70 + stats.con * 18 + stats.str * 5 + stats.wis * 4 + tier * 10;
  const evasion = Math.min(0.35, 0.05 + stats.dex * 0.02);

  return {
    id: classEntry?.id || "unknown_class",
    tier,
    attack,
    defense,
    hp,
    evasion,
    classPowerIndex:
      Object.values(stats).reduce((sum, value) => sum + value, 0) +
      toNumber(classEntry?.coreMechanics?.length, 0) * 0.6,
  };
}

function deriveEnemyCombatProfile(enemyEntry) {
  const base = enemyEntry?.baseStats || {};
  const speed = toNumber(base.speed, 1);
  return {
    id: enemyEntry?.id || "unknown_enemy",
    level: Math.max(1, toNumber(enemyEntry?.level, 1)),
    attack: Math.max(1, toNumber(base.attack, 1)),
    defense: Math.max(0, toNumber(base.defense, 0)),
    hp: Math.max(1, toNumber(base.hp, 1)),
    accuracy: Math.min(0.97, 0.82 + Math.min(0.15, speed * 0.01)),
    xpReward: Math.max(0, toNumber(enemyEntry?.xpReward, 0)),
    goldReward: Math.max(0, toNumber(enemyEntry?.goldReward, 0)),
  };
}

function estimateCombatPair(classProfile, enemyProfile) {
  const playerBaseHit = classProfile.attack - enemyProfile.defense * 0.55;
  const playerDamage = Math.max(
    1,
    playerBaseHit * (1 + Math.min(0.45, classProfile.evasion + 0.08)),
  );

  const enemyBaseHit = enemyProfile.attack - classProfile.defense * 0.45;
  const enemyDamage = Math.max(
    1,
    enemyBaseHit * Math.max(0.55, enemyProfile.accuracy - classProfile.evasion * 0.6),
  );

  const ttk = enemyProfile.hp / playerDamage;
  const ttf = classProfile.hp / enemyDamage;
  const winRatio = ttf / ttk;

  return {
    classId: classProfile.id,
    enemyId: enemyProfile.id,
    enemyLevel: enemyProfile.level,
    ttk,
    ttf,
    winRatio,
  };
}

function getTierEnemyPool(enemyProfiles, tier) {
  const window = ENEMY_WINDOWS_BY_TIER[tier] || ENEMY_WINDOWS_BY_TIER[1];
  const filtered = enemyProfiles.filter(
    (enemy) => enemy.level >= window.min && enemy.level < window.maxExclusive,
  );
  return filtered.length > 0 ? filtered : enemyProfiles;
}

function buildClassCombatRows(classEntries, enemyEntries) {
  const classProfiles = classEntries.map(deriveClassCombatProfile);
  const enemyProfiles = enemyEntries.map(deriveEnemyCombatProfile);
  const rows = [];

  for (const classProfile of classProfiles) {
    const tierEnemyPool = getTierEnemyPool(enemyProfiles, classProfile.tier);
    const pairings = tierEnemyPool.map((enemy) => estimateCombatPair(classProfile, enemy));
    rows.push({
      classId: classProfile.id,
      tier: classProfile.tier,
      medianTTK: Number(median(pairings.map((row) => row.ttk)).toFixed(3)),
      medianTTF: Number(median(pairings.map((row) => row.ttf)).toFixed(3)),
      medianWinRatio: Number(median(pairings.map((row) => row.winRatio)).toFixed(3)),
      classPowerIndex: Number(classProfile.classPowerIndex.toFixed(3)),
    });
  }

  return rows;
}

function buildTierCombatSummary(classCombatRows) {
  const tiers = [1, 2, 3];
  return tiers.map((tier) => {
    const rows = classCombatRows.filter((row) => row.tier === tier);
    const powerValues = rows.map((row) => row.classPowerIndex);
    const maxPower = powerValues.length > 0 ? Math.max(...powerValues) : 0;
    const minPower = powerValues.length > 0 ? Math.min(...powerValues) : 0;

    return {
      tier,
      classCount: rows.length,
      medianTTK: Number(median(rows.map((row) => row.medianTTK)).toFixed(3)),
      medianTTF: Number(median(rows.map((row) => row.medianTTF)).toFixed(3)),
      medianWinRatio: Number(median(rows.map((row) => row.medianWinRatio)).toFixed(3)),
      classPowerSpread: Number((maxPower - minPower).toFixed(3)),
    };
  });
}

function buildEconomySummary(quests, enemyEntries) {
  const questRows = (Array.isArray(quests) ? quests : []).map((quest) => {
    const rewards = quest?.rewards || {};
    const rewardItems = Array.isArray(rewards.items) ? rewards.items : [];
    const itemValue = rewardItems.reduce((sum, rewardItem) => {
      const itemId = String(rewardItem?.id || rewardItem?.itemId || "").trim();
      if (!itemId) return sum;
      const quantity = Math.max(1, toNumber(rewardItem?.quantity, 1));
      const value = toNumber(itemDatabase?.[itemId]?.value, 0);
      return sum + value * quantity;
    }, 0);

    return {
      questId: quest?.id || "unknown_quest",
      xp: Math.max(0, toNumber(rewards.xp, 0)),
      gold: Math.max(
        0,
        Math.max(toNumber(rewards.gold, 0), toNumber(rewards.goldCoins, 0)),
      ),
      itemValue,
    };
  });

  const enemyProfiles = (Array.isArray(enemyEntries) ? enemyEntries : []).map(
    deriveEnemyCombatProfile,
  );

  const avgQuestXp = mean(questRows.map((row) => row.xp));
  const avgQuestValue = mean(questRows.map((row) => row.gold + row.itemValue));
  const avgEnemyXp = mean(enemyProfiles.map((row) => row.xpReward));
  const avgEnemyGold = mean(enemyProfiles.map((row) => row.goldReward));

  return {
    questCount: questRows.length,
    enemyCount: enemyProfiles.length,
    avgQuestXp: Number(avgQuestXp.toFixed(3)),
    avgQuestValue: Number(avgQuestValue.toFixed(3)),
    avgEnemyXp: Number(avgEnemyXp.toFixed(3)),
    avgEnemyGold: Number(avgEnemyGold.toFixed(3)),
    questToEnemyXpRatio: Number((avgQuestXp / Math.max(1, avgEnemyXp)).toFixed(3)),
    questToEnemyGoldRatio: Number((avgQuestValue / Math.max(1, avgEnemyGold)).toFixed(3)),
  };
}

function buildRaceRelevanceSummary(raceEntries) {
  const rows = (Array.isArray(raceEntries) ? raceEntries : []).map((race) => {
    const stats = normalizeRaceStats(race?.statBonuses || {});
    const statScore = Object.values(stats).reduce((sum, value) => sum + value, 0);
    const passiveWeight = race?.passiveAbility ? 2 : 0;
    const hiddenWeight = race?.hiddenTrait ? 1 : 0;
    return {
      raceId: race?.id || "unknown_race",
      relevanceScore: Number((statScore + passiveWeight + hiddenWeight).toFixed(3)),
    };
  });
  const scores = rows.map((row) => row.relevanceScore);
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  return {
    raceCount: rows.length,
    minRelevanceScore: minScore,
    maxRelevanceScore: maxScore,
    relevanceSpread: Number((maxScore - minScore).toFixed(3)),
  };
}

export function buildBalanceCorridorReport({
  classEntries = classes,
  raceEntries = races,
  enemyEntries = enemies,
  quests = DEFAULT_QUESTS,
} = {}) {
  const classCombatRows = buildClassCombatRows(classEntries, enemyEntries);
  const tierCombat = buildTierCombatSummary(classCombatRows);

  return {
    generatedAt: new Date().toISOString(),
    classCombat: {
      rows: classCombatRows,
      tierSummary: tierCombat,
      globalMedianTTK: Number(median(classCombatRows.map((row) => row.medianTTK)).toFixed(3)),
      globalMedianTTF: Number(median(classCombatRows.map((row) => row.medianTTF)).toFixed(3)),
      globalMedianWinRatio: Number(
        median(classCombatRows.map((row) => row.medianWinRatio)).toFixed(3),
      ),
    },
    economy: buildEconomySummary(quests, enemyEntries),
    raceRelevance: buildRaceRelevanceSummary(raceEntries),
  };
}

function thresholdIssue(key, actual, expectedMin = null, expectedMax = null) {
  return {
    key,
    actual: Number(toNumber(actual, 0).toFixed(3)),
    expectedMin: expectedMin == null ? null : Number(toNumber(expectedMin, 0).toFixed(3)),
    expectedMax: expectedMax == null ? null : Number(toNumber(expectedMax, 0).toFixed(3)),
  };
}

export function evaluateBalanceCorridorThresholds(report, thresholds = {}) {
  const issues = [];

  const classCombat = report?.classCombat || {};
  const economy = report?.economy || {};
  const raceRelevance = report?.raceRelevance || {};

  const globalMedianTTK = toNumber(classCombat.globalMedianTTK, 0);
  const globalMedianTTF = toNumber(classCombat.globalMedianTTF, 0);
  const globalMedianWinRatio = toNumber(classCombat.globalMedianWinRatio, 0);
  const questToEnemyGoldRatio = toNumber(economy.questToEnemyGoldRatio, 0);
  const questToEnemyXpRatio = toNumber(economy.questToEnemyXpRatio, 0);
  const raceSpread = toNumber(raceRelevance.relevanceSpread, 0);

  const maxMedianTTK = toNumber(thresholds.maxMedianTTK, Number.POSITIVE_INFINITY);
  const minMedianTTF = toNumber(thresholds.minMedianTTF, 0);
  const minMedianWinRatio = toNumber(thresholds.minMedianWinRatio, 0);
  const maxMedianWinRatio = toNumber(thresholds.maxMedianWinRatio, Number.POSITIVE_INFINITY);
  const minQuestToEnemyGoldRatio = toNumber(thresholds.minQuestToEnemyGoldRatio, 0);
  const maxQuestToEnemyGoldRatio = toNumber(
    thresholds.maxQuestToEnemyGoldRatio,
    Number.POSITIVE_INFINITY,
  );
  const minQuestToEnemyXpRatio = toNumber(thresholds.minQuestToEnemyXpRatio, 0);
  const maxQuestToEnemyXpRatio = toNumber(
    thresholds.maxQuestToEnemyXpRatio,
    Number.POSITIVE_INFINITY,
  );
  const maxRaceRelevanceSpread = toNumber(
    thresholds.maxRaceRelevanceSpread,
    Number.POSITIVE_INFINITY,
  );
  const maxTierClassPowerSpread = toNumber(
    thresholds.maxTierClassPowerSpread,
    Number.POSITIVE_INFINITY,
  );

  if (globalMedianTTK > maxMedianTTK) {
    issues.push(thresholdIssue("globalMedianTTK", globalMedianTTK, null, maxMedianTTK));
  }
  if (globalMedianTTF < minMedianTTF) {
    issues.push(thresholdIssue("globalMedianTTF", globalMedianTTF, minMedianTTF, null));
  }
  if (globalMedianWinRatio < minMedianWinRatio) {
    issues.push(
      thresholdIssue("globalMedianWinRatio", globalMedianWinRatio, minMedianWinRatio, null),
    );
  }
  if (globalMedianWinRatio > maxMedianWinRatio) {
    issues.push(
      thresholdIssue("globalMedianWinRatio", globalMedianWinRatio, null, maxMedianWinRatio),
    );
  }
  if (questToEnemyGoldRatio < minQuestToEnemyGoldRatio) {
    issues.push(
      thresholdIssue(
        "questToEnemyGoldRatio",
        questToEnemyGoldRatio,
        minQuestToEnemyGoldRatio,
        null,
      ),
    );
  }
  if (questToEnemyGoldRatio > maxQuestToEnemyGoldRatio) {
    issues.push(
      thresholdIssue(
        "questToEnemyGoldRatio",
        questToEnemyGoldRatio,
        null,
        maxQuestToEnemyGoldRatio,
      ),
    );
  }
  if (questToEnemyXpRatio < minQuestToEnemyXpRatio) {
    issues.push(
      thresholdIssue("questToEnemyXpRatio", questToEnemyXpRatio, minQuestToEnemyXpRatio, null),
    );
  }
  if (questToEnemyXpRatio > maxQuestToEnemyXpRatio) {
    issues.push(
      thresholdIssue("questToEnemyXpRatio", questToEnemyXpRatio, null, maxQuestToEnemyXpRatio),
    );
  }
  if (raceSpread > maxRaceRelevanceSpread) {
    issues.push(
      thresholdIssue("raceRelevanceSpread", raceSpread, null, maxRaceRelevanceSpread),
    );
  }

  const tierSummary = Array.isArray(classCombat.tierSummary) ? classCombat.tierSummary : [];
  for (const row of tierSummary) {
    const spread = toNumber(row.classPowerSpread, 0);
    if (spread > maxTierClassPowerSpread) {
      issues.push(
        thresholdIssue(
          `tier${toNumber(row.tier, 0)}ClassPowerSpread`,
          spread,
          null,
          maxTierClassPowerSpread,
        ),
      );
    }
  }

  return {
    pass: issues.length === 0,
    issues,
  };
}
