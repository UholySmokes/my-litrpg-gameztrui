import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { DataRegistry } from "@voidverse/game-core/data/DataRegistry.js";
import {
  BEGINNER_QUESTS,
  MAIN_QUESTS,
  SIDE_QUESTS,
} from "@voidverse/game-core/data/QuestCatalog.js";

const CONTRACT_PATH = path.resolve(
  process.cwd(),
  "docs",
  "contracts",
  "balance_corridor_thresholds_v1.json",
);

function normalizeNumber(value, fallback = 0) {
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(num) ? num : fallback;
}

async function readThresholds() {
  const raw = await fs.readFile(CONTRACT_PATH, "utf8");
  const payload = JSON.parse(raw);
  return payload?.thresholds && typeof payload.thresholds === "object"
    ? payload.thresholds
    : {};
}

function sumNumbers(obj) {
  if (!obj || typeof obj !== "object") return 0;
  return Object.values(obj).reduce(
    (acc, value) => acc + (Number.isFinite(value) ? value : 0),
    0,
  );
}

function summarizeSpread(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return { min: 0, max: 0, spread: 0, avg: 0 };
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, spread: max - min, avg };
}

function collectQuestFavoredCoverage(quests) {
  const favoredRaces = new Set();
  const favoredClasses = new Set();

  for (const quest of quests) {
    for (const raceId of quest?.tags?.favoredRaces || []) {
      if (typeof raceId === "string" && raceId.trim().length > 0) {
        favoredRaces.add(raceId.trim());
      }
    }
    for (const classId of quest?.tags?.favoredClasses || []) {
      if (typeof classId === "string" && classId.trim().length > 0) {
        favoredClasses.add(classId.trim());
      }
    }
  }

  return { favoredRaces, favoredClasses };
}

function formatIssue(issue) {
  return `- ${issue.key}: expected ${issue.expected}, actual ${issue.actual}`;
}

async function main() {
  const thresholds = await readThresholds();
  const classes = DataRegistry.getClasses();
  const races = DataRegistry.getRaces();
  const quests = [...BEGINNER_QUESTS, ...MAIN_QUESTS, ...SIDE_QUESTS];

  const issues = [];

  const byTier = new Map();
  for (const c of classes) {
    const tier = normalizeNumber(c?.tier, 0);
    const sum = sumNumbers(c?.baseStats);
    const arr = byTier.get(tier) || [];
    arr.push(sum);
    byTier.set(tier, arr);
  }

  const tierSpreads = {};
  const spreadThresholds = thresholds?.classTierBaseStatSpreadMax || {};
  for (const [tier, sums] of [...byTier.entries()].sort((a, b) => a[0] - b[0])) {
    const summary = summarizeSpread(sums);
    tierSpreads[String(tier)] = summary;
    const expectedMax = normalizeNumber(spreadThresholds?.[String(tier)], null);
    if (expectedMax !== null && summary.spread > expectedMax) {
      issues.push({
        key: `classTierBaseStatSpreadMax[tier=${tier}]`,
        expected: `<= ${expectedMax}`,
        actual: summary.spread,
      });
    }
  }

  const raceStatSums = races.map((race) => sumNumbers(race?.statBonuses));
  const raceSummary = summarizeSpread(raceStatSums);
  const raceSpreadMax = normalizeNumber(thresholds?.raceStatBonusSpreadMax, null);
  if (raceSpreadMax !== null && raceSummary.spread > raceSpreadMax) {
    issues.push({
      key: "raceStatBonusSpreadMax",
      expected: `<= ${raceSpreadMax}`,
      actual: raceSummary.spread,
    });
  }

  const { favoredRaces, favoredClasses } = collectQuestFavoredCoverage(quests);
  const raceCoverageRatio = races.length ? favoredRaces.size / races.length : 0;
  const classCoverageRatio = classes.length
    ? favoredClasses.size / classes.length
    : 0;

  const minRaceCoverage = normalizeNumber(thresholds?.minFavoredRaceCoverageRatio, null);
  if (minRaceCoverage !== null && raceCoverageRatio < minRaceCoverage) {
    issues.push({
      key: "minFavoredRaceCoverageRatio",
      expected: `>= ${minRaceCoverage}`,
      actual: Number(raceCoverageRatio.toFixed(4)),
    });
  }

  const minClassCoverage = normalizeNumber(thresholds?.minFavoredClassCoverageRatio, null);
  if (minClassCoverage !== null && classCoverageRatio < minClassCoverage) {
    issues.push({
      key: "minFavoredClassCoverageRatio",
      expected: `>= ${minClassCoverage}`,
      actual: Number(classCoverageRatio.toFixed(4)),
    });
  }

  const questXpValues = quests.map((quest) => normalizeNumber(quest?.rewards?.xp, 0));
  const questXpSummary = summarizeSpread(questXpValues);
  const questXpMinAllowed = normalizeNumber(thresholds?.questXpMinAllowed, null);
  const questXpMaxAllowed = normalizeNumber(thresholds?.questXpMaxAllowed, null);

  if (questXpMinAllowed !== null && questXpSummary.min < questXpMinAllowed) {
    issues.push({
      key: "questXpMinAllowed",
      expected: `>= ${questXpMinAllowed}`,
      actual: questXpSummary.min,
    });
  }

  if (questXpMaxAllowed !== null && questXpSummary.max > questXpMaxAllowed) {
    issues.push({
      key: "questXpMaxAllowed",
      expected: `<= ${questXpMaxAllowed}`,
      actual: questXpSummary.max,
    });
  }

  if (issues.length > 0) {
    console.error(
      `[balance-corridors] FAIL issues=${issues.length} thresholds=${JSON.stringify(thresholds)}`,
    );
    for (const issue of issues) {
      console.error(formatIssue(issue));
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[balance-corridors] PASS tiers=${JSON.stringify(
      tierSpreads,
    )} races=${JSON.stringify(
      { count: races.length, ...raceSummary },
    )} coverage=${JSON.stringify({
      questCount: quests.length,
      favoredRaces: favoredRaces.size,
      favoredClasses: favoredClasses.size,
      raceCoverageRatio: Number(raceCoverageRatio.toFixed(4)),
      classCoverageRatio: Number(classCoverageRatio.toFixed(4)),
    })} questXp=${JSON.stringify(questXpSummary)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

