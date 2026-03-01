import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "packages", "tests", "scripts"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const ALLOWED_FILES = new Set([
  "packages/game-core/src/systems/skills/SkillRegistry.js",
  "tests/unit/SkillRegistryCanonicalization.test.js",
  "scripts/validate-skill-owner-schema.mjs",
]);
const FORBIDDEN_TOKEN = "skill.class";

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(abs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!EXTENSIONS.has(ext)) continue;
    out.push(abs);
  }
  return out;
}

async function main() {
  const files = [];
  for (const dir of TARGET_DIRS) {
    const abs = path.join(ROOT, dir);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isDirectory()) continue;
      await walk(abs, files);
    } catch {
      // Optional directory in some environments.
    }
  }

  const violations = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
    const content = await fs.readFile(abs, "utf8");
    if (!content.includes(FORBIDDEN_TOKEN)) continue;
    if (ALLOWED_FILES.has(rel)) continue;
    violations.push(rel);
  }

  if (violations.length > 0) {
    console.error(
      `[skill-owner-schema] FAIL found '${FORBIDDEN_TOKEN}' outside allowlist (${violations.length})`,
    );
    for (const rel of violations.slice(0, 50)) {
      console.error(`- ${rel}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[skill-owner-schema] PASS token='${FORBIDDEN_TOKEN}' allowlist=${ALLOWED_FILES.size} scanned=${files.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
