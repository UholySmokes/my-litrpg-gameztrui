import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ALLOWED_FILES = new Set([
  path.normalize("packages/game-core/src/systems/skills/SkillRegistry.js"),
  path.normalize("scripts/validate-skill-owner-schema.mjs"),
  path.normalize("tools/buildAbilityCatalog.mjs"),
]);

const INCLUDE_DIRS = [
  "api",
  "functions",
  "packages",
  "scripts",
  "src",
  "tools",
].map((dir) => path.resolve(process.cwd(), dir));

const EXCLUDE_DIR_NAMES = new Set([
  ".git",
  "coverage",
  "dist",
  "node_modules",
  "tmp",
]);

const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);

function toRepoRelative(filePath) {
  return path.normalize(path.relative(process.cwd(), filePath));
}

async function walk(dirPath, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (!entry?.name) continue;
    if (EXCLUDE_DIR_NAMES.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, out);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    out.push(fullPath);
  }

  return out;
}

function collectLineNumbers(source, regex) {
  const lineNumbers = [];
  const lines = source.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx += 1) {
    if (regex.test(lines[idx])) {
      lineNumbers.push(idx + 1);
    }
    regex.lastIndex = 0;
  }
  return lineNumbers;
}

async function main() {
  const regex = /\bskill\.class\b/g;

  const files = [];
  for (const includeDir of INCLUDE_DIRS) {
    await walk(includeDir, files);
  }

  const hits = [];
  for (const filePath of files) {
    const relativePath = toRepoRelative(filePath);
    const content = await fs.readFile(filePath, "utf8");
    if (!regex.test(content)) {
      regex.lastIndex = 0;
      continue;
    }
    regex.lastIndex = 0;
    hits.push({
      path: relativePath,
      lines: collectLineNumbers(content, regex),
    });
  }

  const violations = hits.filter((hit) => !ALLOWED_FILES.has(path.normalize(hit.path)));

  if (violations.length > 0) {
    console.error(
      `[skill-owner-schema] FAIL disallowed=${violations.length} allowed=${ALLOWED_FILES.size}`,
    );
    console.error("- Disallowed `skill.class` reads:");
    for (const hit of violations.slice(0, 50)) {
      console.error(`  - ${hit.path}:${hit.lines.join(",")}`);
    }
    console.error("- Allowed files:");
    for (const allowed of [...ALLOWED_FILES]) {
      console.error(`  - ${allowed}`);
    }
    process.exitCode = 1;
    return;
  }

  const totalMatches = hits.reduce((acc, hit) => acc + hit.lines.length, 0);
  const filesWithMatches = hits.length;
  console.log(
    `[skill-owner-schema] PASS matches=${totalMatches} files=${filesWithMatches} allowed=${ALLOWED_FILES.size}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
