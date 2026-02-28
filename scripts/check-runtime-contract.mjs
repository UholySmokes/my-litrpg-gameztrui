import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const requiredFiles = [
  { file: "functions/index.js", reason: "Firebase Functions entrypoint" },
  { file: "functions/lib/api-router.js", reason: "HTTP route dispatcher" },
  { file: "functions/lib/handlers.js", reason: "API route handlers" },
  { file: "godot/export_presets.cfg", reason: "Godot export presets required by export tooling" },
];

const failures = [];

const readJson = (relativePath) => {
  const fullPath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
};

for (const { file, reason } of requiredFiles) {
  if (!fs.existsSync(path.join(rootDir, file))) {
    failures.push(`Missing required file: ${file} (${reason})`);
  }
}

const functionsPackage = readJson("functions/package.json");
if (functionsPackage.main !== "index.js") {
  failures.push(
    `functions/package.json must set main=index.js (found: ${JSON.stringify(functionsPackage.main)})`,
  );
}
if (functionsPackage.type !== "commonjs") {
  failures.push(
    `functions/package.json must set type=commonjs (found: ${JSON.stringify(functionsPackage.type)})`,
  );
}

const typecheckScript = String(functionsPackage?.scripts?.typecheck || "");
if (!/tsconfig\.runtime\.json|tsconfig\.json/.test(typecheckScript)) {
  failures.push(
    "functions/package.json scripts.typecheck must target functions runtime tsconfig (tsconfig.runtime.json or tsconfig.json).",
  );
}

const runtimeTsconfig = readJson("functions/tsconfig.runtime.json");
const runtimeInclude = Array.isArray(runtimeTsconfig.include) ? runtimeTsconfig.include : [];
if (!runtimeInclude.includes("index.js")) {
  failures.push("functions/tsconfig.runtime.json must include index.js.");
}
if (!runtimeInclude.includes("lib/**/*.js")) {
  failures.push('functions/tsconfig.runtime.json must include "lib/**/*.js".');
}

const firebaseConfig = readJson("firebase.json");
const functionsSource = firebaseConfig?.functions?.source;
if (functionsSource !== "functions") {
  failures.push(
    `firebase.json functions.source must be "functions" (found: ${JSON.stringify(functionsSource)})`,
  );
}

if (failures.length > 0) {
  console.error("[runtime-contract] FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[runtime-contract] PASS");
