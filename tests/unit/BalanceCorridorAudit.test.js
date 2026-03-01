import { describe, expect, it } from "@jest/globals";
import {
  buildBalanceCorridorReport,
  evaluateBalanceCorridorThresholds,
} from "@voidverse/game-core/util/balanceCorridorAudit.js";

describe("balance corridor audit", () => {
  it("builds default report with class combat, economy, and race relevance sections", () => {
    const report = buildBalanceCorridorReport();
    expect(report).toBeTruthy();
    expect(typeof report.generatedAt).toBe("string");
    expect(report.classCombat.globalMedianTTK).toBeGreaterThan(0);
    expect(report.classCombat.globalMedianTTF).toBeGreaterThan(0);
    expect(report.classCombat.globalMedianWinRatio).toBeGreaterThan(0);
    expect(report.economy.questCount).toBeGreaterThan(0);
    expect(report.economy.enemyCount).toBeGreaterThan(0);
    expect(report.raceRelevance.raceCount).toBeGreaterThan(0);
  });

  it("evaluates threshold violations and passes when corridors are met", () => {
    const failingReport = {
      classCombat: {
        globalMedianTTK: 10,
        globalMedianTTF: 2,
        globalMedianWinRatio: 0.4,
        tierSummary: [{ tier: 1, classPowerSpread: 20 }],
      },
      economy: {
        questToEnemyGoldRatio: 0.7,
        questToEnemyXpRatio: 10,
      },
      raceRelevance: {
        relevanceSpread: 25,
      },
    };
    const thresholds = {
      maxMedianTTK: 8,
      minMedianTTF: 4,
      minMedianWinRatio: 0.8,
      maxMedianWinRatio: 6,
      minQuestToEnemyGoldRatio: 1.2,
      maxQuestToEnemyGoldRatio: 20,
      minQuestToEnemyXpRatio: 1.1,
      maxQuestToEnemyXpRatio: 5,
      maxRaceRelevanceSpread: 18,
      maxTierClassPowerSpread: 14,
    };

    const fail = evaluateBalanceCorridorThresholds(failingReport, thresholds);
    expect(fail.pass).toBe(false);
    expect(fail.issues.length).toBeGreaterThanOrEqual(6);

    const passingReport = {
      classCombat: {
        globalMedianTTK: 3,
        globalMedianTTF: 8,
        globalMedianWinRatio: 2.3,
        tierSummary: [{ tier: 1, classPowerSpread: 9.5 }],
      },
      economy: {
        questToEnemyGoldRatio: 4.2,
        questToEnemyXpRatio: 2.1,
      },
      raceRelevance: {
        relevanceSpread: 12.5,
      },
    };
    const pass = evaluateBalanceCorridorThresholds(passingReport, thresholds);
    expect(pass.pass).toBe(true);
    expect(pass.issues).toHaveLength(0);
  });
});
