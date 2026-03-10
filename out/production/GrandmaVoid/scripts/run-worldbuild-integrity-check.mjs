import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  buildWorldbuildIntegrityReport,
  buildWorldbuildIntegritySignature,
  compareIntegritySignature,
} from "@voidverse/game-core/util/worldbuildIntegrityAudit.js";

const BASELINE_PATH = path.resolve(
  process.cwd(),
  "docs",
  "contracts",
  "worldbuild_integrity_baseline_v1.json",
);
const REPORTS_DIR = path.resolve(process.cwd(), "docs", "reports");

function hasArg(flag) {
  return process.argv.includes(flag);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function maybeReadJson(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

function makeTimestampDate() {
  return new Date().toISOString().slice(0, 10);
}

function getStrictIssues(signature) {
  const keys = [
    "classesMissingSkills",
    "skillOwnersNotClassOrReserved",
    "missingRecipeIngredientCount",
    "missingRecipeResultCount",
    "missingQuestFavoredClassCount",
    "missingQuestFavoredRaceCount",
    "missingQuestFavoredProfessionCount",
    "missingQuestRewardItemCount",
    "manifestMismatchCount",
  ];
  return keys
    .filter((key) => Number(signature?.[key] || 0) > 0)
    .map((key) => ({
      key,
      expectedMax: 0,
      actual: Number(signature[key] || 0),
    }));
}

function formatMismatchList(mismatches) {
  if (!Array.isArray(mismatches) || mismatches.length === 0) {
    return "- none";
  }
  return mismatches
    .map(
      (entry) =>
        `- \`${entry.key}\`: expected <= \`${entry.expectedMax}\`, actual \`${entry.actual}\``,
    )
    .join("\n");
}

function renderMarkdownReport({
  mode,
  signature,
  baselineSignature,
  driftIssues,
  strictIssues,
  report,
}) {
  const pass = driftIssues.length === 0 && strictIssues.length === 0;
  const status = pass ? "PASS" : "FAIL";

  return `# Worldbuild Integrity Check (${makeTimestampDate()})

Status: ${status}  
Mode: ${mode}  
Generated: ${new Date().toISOString()}

## Current Signature

\`\`\`json
${JSON.stringify(signature, null, 2)}
\`\`\`

## Baseline Signature

\`\`\`json
${JSON.stringify(baselineSignature, null, 2)}
\`\`\`

## Drift Issues (regression vs baseline)

${formatMismatchList(driftIssues)}

## Strict Issues (non-zero checks)

${formatMismatchList(strictIssues)}

## Snapshot Summary

\`\`\`json
${JSON.stringify(
  {
    counts: report.counts,
    classTierCounts: report.classTierCounts,
    classResourceCounts: report.classResourceCounts,
    classesMissingSkills: report.classesMissingSkills,
    skillOwnersNotClassOrReserved: report.skillOwnersNotClassOrReserved,
    missingRecipeIngredientCount: report.missingRecipeIngredientCount,
    missingRecipeResultCount: report.missingRecipeResultCount,
    missingQuestFavoredClassCount: report.missingQuestFavoredClasses.length,
    missingQuestRewardItemCount: report.missingQuestRewardItemCount,
    manifestMismatchCount: report.manifests?.mismatchCount || 0,
  },
  null,
  2,
)}
\`\`\`
`;
}

async function writeReport(reportText) {
  const reportFile = `worldbuild_integrity_check_${makeTimestampDate()}.md`;
  const reportPath = path.join(REPORTS_DIR, reportFile);
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(reportPath, reportText, "utf8");
  return reportPath;
}

async function writeJsonReport(report) {
  const outputPath = path.resolve(process.cwd(), "audit_worldbuild_metrics.json");
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputPath;
}

function buildBaselinePayload(signature) {
  return {
    version: "worldbuild_integrity_baseline_v1",
    updatedAt: new Date().toISOString(),
    signature,
  };
}

async function updateBaseline(signature) {
  const payload = buildBaselinePayload(signature);
  await fs.mkdir(path.dirname(BASELINE_PATH), { recursive: true });
  await fs.writeFile(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

async function getManifests() {
  const godotPath = path.resolve(process.cwd(), "godot", "data", "world_manifest.json");
  const syncPath = path.resolve(
    process.cwd(),
    "functions",
    "lib",
    "sync-world-manifest.v1.json",
  );
  return {
    godot: await maybeReadJson(godotPath),
    sync: await maybeReadJson(syncPath),
  };
}

async function main() {
  const updateMode = hasArg("--update-baseline");
  const strictMode = hasArg("--strict");

  const manifests = await getManifests();
  const report = buildWorldbuildIntegrityReport({ manifests });
  const signature = buildWorldbuildIntegritySignature(report);
  const jsonPath = await writeJsonReport(report);

  if (updateMode) {
    const payload = await updateBaseline(signature);
    const reportPath = await writeReport(
      renderMarkdownReport({
        mode: "update-baseline",
        signature,
        baselineSignature: payload.signature,
        driftIssues: [],
        strictIssues: [],
        report,
      }),
    );
    console.log(
      `[worldbuild-integrity] BASELINE_UPDATED baseline=${path.relative(
        process.cwd(),
        BASELINE_PATH,
      )} report=${path.relative(process.cwd(), reportPath)} metrics=${path.relative(process.cwd(), jsonPath)}`,
    );
    return;
  }

  const baselinePayload = await maybeReadJson(BASELINE_PATH);
  const baselineSignature = baselinePayload?.signature || {};
  const driftIssues = compareIntegritySignature(signature, baselineSignature);
  const strictIssues = strictMode ? getStrictIssues(signature) : [];
  const reportPath = await writeReport(
    renderMarkdownReport({
      mode: strictMode ? "strict" : "check",
      signature,
      baselineSignature,
      driftIssues,
      strictIssues,
      report,
    }),
  );

  const pass = driftIssues.length === 0 && strictIssues.length === 0;
  console.log(
    `[worldbuild-integrity] ${pass ? "PASS" : "FAIL"} drift=${driftIssues.length} strict=${strictIssues.length} baseline=${path.relative(
      process.cwd(),
      BASELINE_PATH,
    )} report=${path.relative(process.cwd(), reportPath)} metrics=${path.relative(process.cwd(), jsonPath)}`,
  );
  if (!pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
