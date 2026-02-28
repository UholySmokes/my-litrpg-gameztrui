import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildPlaceholderItemCurationReport,
  evaluatePlaceholderCurationThresholds,
} from "@voidverse/game-core/util/placeholderItemCuration.js";
import { shopDatabase } from "../packages/game-core/src/data/shopData.js";

const CONTRACT_PATH = path.resolve(
  process.cwd(),
  "docs",
  "contracts",
  "placeholder_curation_thresholds_v1.json",
);

async function readContract() {
  const raw = await fs.readFile(CONTRACT_PATH, "utf8");
  const payload = JSON.parse(raw);
  return payload?.thresholds && typeof payload.thresholds === "object"
    ? payload.thresholds
    : {};
}

function formatIssue(issue) {
  return `- ${issue.key}: expected <= ${issue.expectedMax}, actual ${issue.actual}`;
}

async function main() {
  const thresholds = await readContract();
  const report = buildPlaceholderItemCurationReport({ shop: shopDatabase });
  const evaluation = evaluatePlaceholderCurationThresholds(report, thresholds);

  if (!evaluation.pass) {
    console.error(
      `[placeholder-curation-contract] FAIL thresholds=${JSON.stringify(thresholds)}`,
    );
    for (const issue of evaluation.issues) {
      console.error(formatIssue(issue));
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[placeholder-curation-contract] PASS thresholds=${JSON.stringify(thresholds)} summary=${JSON.stringify(
      {
        critical: report.summary?.priorityCounts?.critical || 0,
        high: report.summary?.priorityCounts?.high || 0,
        playerFacingPlaceholders: report.summary?.playerFacingPlaceholderCount || 0,
      },
    )}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
