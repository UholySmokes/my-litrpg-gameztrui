import { readFileSync } from "fs";
import { join } from "path";
import { validateArchetypes } from "../packages/game-core/src/systems/archetype/archetypeSchema.js";

const DATA_DIR = join(process.cwd(), "packages/game-core/src/data/archetypes");
const modeArgIndex = process.argv.findIndex((arg) => arg === "--mode");
const mode =
  modeArgIndex >= 0 && process.argv[modeArgIndex + 1] === "authoring"
    ? "authoring"
    : "runtime";

const categoryFiles = [
  "systems.json",
  "authorities.json",
  "paths.json",
  "frameworks.json",
  "privileges.json",
  "overlays.json",
];

let totalArchetypes = 0;
let totalValid = 0;
let hasErrors = false;

console.log(`Validating archetype definitions (${mode} mode)...\n`);

for (const filename of categoryFiles) {
  const filepath = join(DATA_DIR, filename);
  try {
    const content = readFileSync(filepath, "utf-8");
    const archetypes = JSON.parse(content);
    const result = validateArchetypes(archetypes, { mode });

    totalArchetypes += result.total;
    totalValid += result.validCount;

    if (result.valid) {
      console.log(`OK ${filename}: ${result.total} archetypes valid`);
      continue;
    }

    hasErrors = true;
    console.log(`FAIL ${filename}: ${result.validCount}/${result.total} valid`);

    for (const [id, errors] of Object.entries(result.errors)) {
      console.log(`  ${id}:`);
      errors.forEach((err) => console.log(`    - ${err}`));
    }
  } catch (err) {
    console.error(`Failed to process ${filename}: ${err.message}`);
    hasErrors = true;
  }
}

console.log(`\nSummary: ${totalValid}/${totalArchetypes} archetypes valid`);

if (hasErrors) {
  console.log("\nValidation failed!");
  process.exit(1);
}

console.log("\nAll archetypes valid!");
