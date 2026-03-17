import fs from "node:fs";
import path from "node:path";

import { listCharacterCreationPerks } from "@voidverse/game-core/characterCreation/CharacterCreationOptionsRegistry.js";

const PLACEHOLDER_RE = /\(placeholder\)/i;

function checkOptions(options, label, errors) {
  (Array.isArray(options) ? options : []).forEach((entry) => {
    const id = typeof entry?.id === "string" ? entry.id : "unknown";
    const description = typeof entry?.description === "string" ? entry.description : "";
    if (PLACEHOLDER_RE.test(description)) {
      errors.push(`${label}: ${id} contains placeholder copy`);
    }
  });
}

const errors = [];
checkOptions(listCharacterCreationPerks(), "characterCreation.perks", errors);

const godotCharacterOptionsPath = path.resolve(
  process.cwd(),
  "godot",
  "data",
  "character_options.json",
);
if (fs.existsSync(godotCharacterOptionsPath)) {
  const text = fs.readFileSync(godotCharacterOptionsPath, "utf8");
  if (PLACEHOLDER_RE.test(text)) {
    errors.push("godot/data/character_options.json contains placeholder copy");
  }
}

if (errors.length > 0) {
  console.error("[validate-character-creation-copy] FAIL");
  errors.forEach((err) => console.error(`- ${err}`));
  process.exit(1);
}

console.log("[validate-character-creation-copy] PASS");

