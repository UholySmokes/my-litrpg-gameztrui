import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { buildPlaceholderItemCurationReport } from "@voidverse/game-core/util/placeholderItemCuration.js";
import { shopDatabase } from "../packages/game-core/src/data/shopData.js";

const DEFAULT_JSON_PATH = path.resolve(
  process.cwd(),
  "docs",
  "reports",
  "placeholder_item_curation_queue.json",
);

function hasArg(flag) {
  return process.argv.includes(flag);
}

function getArgValue(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function parseLimit() {
  const raw = getArgValue("--limit", "50");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 50;
  return Math.min(500, Math.floor(value));
}

function resolveOutputPath(flag, fallbackPath) {
  const raw = getArgValue(flag, "");
  if (!raw || !raw.trim()) return fallbackPath;
  return path.resolve(process.cwd(), raw.trim());
}

function makeDateStamp(iso = new Date().toISOString()) {
  return iso.slice(0, 10);
}

function makeMarkdownPath(report) {
  return path.resolve(
    process.cwd(),
    "docs",
    "reports",
    `placeholder_item_curation_queue_${makeDateStamp(report.generatedAt)}.md`,
  );
}

function renderPriorityCounts(priorityCounts = {}) {
  const critical = Number(priorityCounts.critical || 0);
  const high = Number(priorityCounts.high || 0);
  const medium = Number(priorityCounts.medium || 0);
  const low = Number(priorityCounts.low || 0);
  return `critical=${critical}, high=${high}, medium=${medium}, low=${low}`;
}

function renderMarkdown(report, limit) {
  const top = report.entries.slice(0, limit);
  const tableRows = top
    .map(
      (entry) =>
        `| ${entry.priority} | ${entry.itemId} | ${entry.score} | ${entry.playerFacingReferenceCount} | ${entry.resultReferenceCount} | ${entry.ingredientReferenceCount} | ${entry.recipeIds.length} |`,
    )
    .join("\n");

  const table =
    top.length > 0
      ? [
          "| Priority | Item ID | Score | Player-Facing Refs | Result Refs | Ingredient Refs | Recipe Count |",
          "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
          tableRows,
        ].join("\n")
      : "_No generated placeholders found._";

  return `# Placeholder Item Curation Queue (${makeDateStamp(report.generatedAt)})

Generated: ${report.generatedAt}

## Summary

- Placeholder items: ${report.summary.placeholderCount}
- Total recipe references: ${report.summary.totalRecipeReferenceCount}
- Player-facing placeholder references: ${report.summary.playerFacingReferenceCount}
- Player-facing placeholders: ${report.summary.playerFacingPlaceholderCount}
- Priority mix: ${renderPriorityCounts(report.summary.priorityCounts)}

## Top Queue (limit ${limit})

${table}

## Usage

- Generate queue JSON + markdown: \`npm run report:worldbuild:placeholders\`
- Generate with custom limit: \`npm run report:worldbuild:placeholders -- --limit 100\`
- Check priority recommendations in \`placeholder_item_curation_queue.json\` and replace entries by \`itemId\`.
`;
}

async function writeFile(filePath, body) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body, "utf8");
}

async function main() {
  const limit = parseLimit();
  const report = buildPlaceholderItemCurationReport({ shop: shopDatabase });
  const jsonPath = resolveOutputPath("--json-out", DEFAULT_JSON_PATH);
  const markdownPath = resolveOutputPath("--markdown-out", makeMarkdownPath(report));

  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  if (!hasArg("--json-only")) {
    await writeFile(markdownPath, renderMarkdown(report, limit));
  }

  console.log(
    `[placeholder-curation] PASS placeholders=${report.summary.placeholderCount} playerFacingPlaceholders=${report.summary.playerFacingPlaceholderCount} priorities=${renderPriorityCounts(
      report.summary.priorityCounts,
    )} json=${path.relative(process.cwd(), jsonPath)}${
      hasArg("--json-only") ? "" : ` markdown=${path.relative(process.cwd(), markdownPath)}`
    }`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
