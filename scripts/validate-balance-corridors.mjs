import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildBalanceCorridorReport,
  evaluateBalanceCorridorThresholds,
} from "@voidverse/game-core/util/balanceCorridorAudit.js";

const CONTRACT_PATH = path.resolve(
  process.cwd(),
  "docs",
  "contracts",
  "balance_corridor_thresholds_v1.json",
);

async function readContract() {
  const raw = await fs.readFile(CONTRACT_PATH, "utf8");
  const payload = JSON.parse(raw);
  return payload?.thresholds && typeof payload.thresholds === "object"
    ? payload.thresholds
    : {};
}

function formatIssue(issue) {
  const min = issue.expectedMin == null ? "-inf" : issue.expectedMin;
  const max = issue.expectedMax == null ? "+inf" : issue.expectedMax;
  return `- ${issue.key}: expected [${min}, ${max}], actual ${issue.actual}`;
}

async function main() {
  const thresholds = await readContract();
  const report = buildBalanceCorridorReport();
  const evaluation = evaluateBalanceCorridorThresholds(report, thresholds);

  if (!evaluation.pass) {
    console.error(
      `[balance-corridor-contract] FAIL thresholds=${JSON.stringify(thresholds)}`,
    );
    for (const issue of evaluation.issues) {
      console.error(formatIssue(issue));
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[balance-corridor-contract] PASS thresholds=${JSON.stringify(
      thresholds,
    )} summary=${JSON.stringify({
      globalMedianTTK: report.classCombat.globalMedianTTK,
      globalMedianTTF: report.classCombat.globalMedianTTF,
      globalMedianWinRatio: report.classCombat.globalMedianWinRatio,
      questToEnemyGoldRatio: report.economy.questToEnemyGoldRatio,
      questToEnemyXpRatio: report.economy.questToEnemyXpRatio,
      raceRelevanceSpread: report.raceRelevance.relevanceSpread,
    })}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
