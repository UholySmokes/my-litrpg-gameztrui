import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import { initialGameState } from "../src/data/initialState.js";
import { normalizeGameState } from "../src/core/StateNormalizer.js";
import { gameReducer } from "../src/core/gameReducer.js";
import {
  startCombat,
  playerAttack,
  processEnemyTurns,
} from "../src/systems/combat/CombatSystem.js";
import { DataRegistry } from "../src/data/DataRegistry.js";

const ROOT = process.cwd();
const REPORTS_DIR = path.resolve(ROOT, "docs", "reports");
const DIST_ASSETS_DIR = path.resolve(ROOT, "dist", "assets");
const DATE_STAMP = new Date().toISOString().slice(0, 10);
const MARKDOWN_PATH = path.join(
  REPORTS_DIR,
  `code_optimization_baseline_${DATE_STAMP}.md`,
);
const JSON_PATH = path.join(
  REPORTS_DIR,
  `code_optimization_baseline_${DATE_STAMP}.json`,
);

const CODE_DIRS = [
  path.resolve(ROOT, "src"),
  path.resolve(ROOT, "packages", "game-core", "src"),
  path.resolve(ROOT, "functions", "lib"),
];

const CODE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const IGNORE_MARKERS = [
  `${path.sep}dataconnect-generated${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}coverage${path.sep}`,
  `${path.sep}build${path.sep}`,
  `${path.sep}tmp${path.sep}`,
  `${path.sep}out${path.sep}`,
];

function walkFiles(dirPath, collected = []) {
  if (!fs.existsSync(dirPath)) return collected;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const resolved = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(resolved, collected);
      continue;
    }
    if (entry.isFile()) {
      collected.push(resolved);
    }
  }

  return collected;
}

function shouldIncludeCodeFile(filePath) {
  if (!CODE_EXTENSIONS.has(path.extname(filePath))) return false;
  return !IGNORE_MARKERS.some((marker) => filePath.includes(marker));
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function formatKb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );
  return sorted[index];
}

function measureProbe(name, fn, iterations = 40) {
  for (let i = 0; i < 5; i += 1) {
    fn();
  }

  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }

  const total = samples.reduce((sum, value) => sum + value, 0);
  return {
    name,
    iterations,
    avgMs: Number((total / samples.length).toFixed(4)),
    p95Ms: Number(percentile(samples, 0.95).toFixed(4)),
  };
}

function withFixedRandom(fn) {
  const originalRandom = Math.random;
  Math.random = () => 1;
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

function createLevelReadyState() {
  const state = structuredClone(initialGameState);
  state.player.xp.current = state.player.xp.max;
  return state;
}

function collectHotspots() {
  const files = CODE_DIRS.flatMap((dirPath) =>
    walkFiles(dirPath).filter(shouldIncludeCodeFile),
  ).map((filePath) => {
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/).length;
    return {
      file: toRelative(filePath),
      lines,
    };
  });

  return files.sort((left, right) => right.lines - left.lines);
}

function collectDistAssets() {
  if (!fs.existsSync(DIST_ASSETS_DIR)) return [];

  return fs.readdirSync(DIST_ASSETS_DIR)
    .map((name) => path.join(DIST_ASSETS_DIR, name))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .map((filePath) => {
      const buffer = fs.readFileSync(filePath);
      return {
        asset: path.basename(filePath),
        rawBytes: buffer.length,
        gzipBytes: gzipSync(buffer).length,
      };
    })
    .sort((left, right) => right.rawBytes - left.rawBytes);
}

function collectMetrics() {
  const hotspots = collectHotspots();
  const totalLines = hotspots.reduce((sum, entry) => sum + entry.lines, 0);
  const top10Lines = hotspots.slice(0, 10).reduce((sum, entry) => sum + entry.lines, 0);
  const distAssets = collectDistAssets();

  const probes = [
    measureProbe("normalizeGameState", () => {
      normalizeGameState(initialGameState);
    }),
    measureProbe("gameReducer:LEVEL_UP", () => {
      gameReducer(createLevelReadyState(), { type: "LEVEL_UP" });
    }),
    measureProbe("combatRound:goblin", () =>
      withFixedRandom(() => {
        const combatState = startCombat(initialGameState, ["goblin"]);
        const attackResult = playerAttack(combatState, 0);
        processEnemyTurns(attackResult.state);
      })),
    measureProbe("DataRegistry:getClassById", () => {
      DataRegistry.getClassById("knight");
    }, 120),
  ];

  return {
    generatedAt: new Date().toISOString(),
    reportSource: "output/pdf/code-optimization-report-2026-03-10.pdf",
    reviewedPages: [15, 16, 17, 20],
    totalCodeLines: totalLines,
    top10HotspotSharePct: totalLines
      ? Number(((top10Lines / totalLines) * 100).toFixed(1))
      : 0,
    hotspots: hotspots.slice(0, 12),
    distAssets: distAssets.slice(0, 12),
    probes,
  };
}

function writeReports(metrics) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const markdown = [
    `# Code Optimization Baseline (${DATE_STAMP})`,
    "",
    "Report-first source:",
    "- `output/pdf/code-optimization-report-2026-03-10.pdf`",
    "- Reviewed pages before generation: 15, 16, 17, 20",
    "",
    "## Hotspots",
    "",
    "| File | Lines |",
    "|------|-------|",
    ...metrics.hotspots.map((entry) => `| ${entry.file} | ${entry.lines} |`),
    "",
    `Top 10 hotspot share: ${metrics.top10HotspotSharePct}% of ${metrics.totalCodeLines} counted lines.`,
    "",
    "## Built Assets",
    "",
    "| Asset | Raw KB | Gzip KB |",
    "|-------|--------|---------|",
    ...(metrics.distAssets.length
      ? metrics.distAssets.map(
          (entry) =>
            `| ${entry.asset} | ${formatKb(entry.rawBytes)} | ${formatKb(entry.gzipBytes)} |`,
        )
      : ["| (missing dist/assets) | 0.0 | 0.0 |"]),
    "",
    "## Timing Probes",
    "",
    "| Probe | Iterations | Avg ms | P95 ms |",
    "|-------|------------|--------|--------|",
    ...metrics.probes.map(
      (probe) =>
        `| ${probe.name} | ${probe.iterations} | ${probe.avgMs.toFixed(4)} | ${probe.p95Ms.toFixed(4)} |`,
    ),
    "",
    "Notes:",
    "- These probes are deterministic regression anchors, not lab-grade benchmarks.",
    "- Bundle budgets are reporting-only in this wave; no CI fail thresholds are enforced yet.",
    "",
  ].join("\n");

  fs.writeFileSync(MARKDOWN_PATH, markdown, "utf8");
  fs.writeFileSync(JSON_PATH, JSON.stringify(metrics, null, 2), "utf8");
}

const metrics = collectMetrics();
writeReports(metrics);

console.log(
  JSON.stringify(
    {
      markdown: toRelative(MARKDOWN_PATH),
      json: toRelative(JSON_PATH),
    },
    null,
    2,
  ),
);
