import fs from "node:fs";
import path from "node:path";
import {
  ensureEnvAssignments,
  ensureDir,
  fileExists,
  fromRoot,
  getDefaultFirebaseProjectId,
  printSection,
  printStatus,
  readText,
  writeText,
} from "./lib/ai-workspace.mjs";

const COPY_STEPS = [
  {
    source: ".env.example",
    destination: ".env.local",
    label: "Seeded root .env.local",
  },
  {
    source: "functions/.env.example",
    destination: "functions/.env.local",
    label: "Seeded functions/.env.local",
  },
  {
    source: "docs/ai/templates/vscode.settings.local.json",
    destination: ".vscode/settings.json",
    label: "Seeded local VS Code settings",
  },
];

printSection("AI workspace setup");

for (const step of COPY_STEPS) {
  const sourcePath = fromRoot(step.source);
  const destinationPath = fromRoot(step.destination);

  if (!fs.existsSync(sourcePath)) {
    printStatus("WARN", step.label, `missing template ${step.source}`);
    continue;
  }

  if (fs.existsSync(destinationPath)) {
    printStatus("SKIP", step.label, `${step.destination} already exists`);
    continue;
  }

  ensureDir(path.dirname(step.destination));
  writeText(step.destination, readText(step.source));
  printStatus("OK", step.label, step.destination);
}

const rootDefaultsApplied = ensureEnvAssignments(".env.local", [
  { key: "VITE_AUTH_PROVIDER", value: "microsoft.com" },
  { key: "VITE_DEV_USER_ID", value: "local-dev" },
  { key: "VITE_DEV_USER_EMAIL", value: "local-dev@example.com" },
  { key: "VITE_FIREBASE_PROJECT_ID", value: getDefaultFirebaseProjectId() },
]);
printStatus(
  rootDefaultsApplied ? "OK" : "SKIP",
  "Root env defaults",
  rootDefaultsApplied ? "filled safe local defaults in .env.local" : "safe local defaults already present",
);

const bootstrapFile = ".codex/environments/environment.toml";
if (!fileExists(bootstrapFile)) {
  printStatus("WARN", "Codex bootstrap", `${bootstrapFile} is missing`);
} else {
  printStatus("OK", "Codex bootstrap", bootstrapFile);
}

const functionsSecretFile = "functions/.secret.local";
if (fileExists(functionsSecretFile)) {
  printStatus("SKIP", "Functions secret file", `${functionsSecretFile} already exists`);
} else {
  const secretLines = [];
  if (process.env.OPENAI_API_KEY) {
    secretLines.push(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`);
  }
  if (process.env.CEREBRAS_API_KEY) {
    secretLines.push(`CEREBRAS_API_KEY=${process.env.CEREBRAS_API_KEY}`);
  }
  if (process.env.GOOGLE_GENAI_API_KEY) {
    secretLines.push(`GOOGLE_GENAI_API_KEY=${process.env.GOOGLE_GENAI_API_KEY}`);
  }

  if (secretLines.length > 0) {
    writeText(functionsSecretFile, `${secretLines.join("\n")}\n`);
    printStatus("OK", "Functions secret file", `seeded ${functionsSecretFile} from shell environment`);
  } else {
    printStatus(
      "WARN",
      "Functions secret file",
      `${functionsSecretFile} not created because OPENAI_API_KEY / CEREBRAS_API_KEY / GOOGLE_GENAI_API_KEY are not set in the shell`,
    );
  }
}

printSection("Next steps");
printStatus("INFO", "Review local editor settings", ".vscode/settings.json is intentionally local-only");
printStatus(
  "INFO",
  "Add emulator AI secrets",
  "put OPENAI_API_KEY or CEREBRAS_API_KEY in functions/.secret.local for live local narrator calls",
);
printStatus("INFO", "Run diagnostics", "npm run ai:doctor");
printStatus("INFO", "Run policy validation", "npm run ai:check");
