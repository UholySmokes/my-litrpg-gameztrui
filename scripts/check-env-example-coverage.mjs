import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const requiredByFile = {
  ".env.example": [
    "VITE_NARRATE_ENDPOINT",
    "VITE_API_BASE_URL",
    "TRACE_ENABLED",
    "OTEL_TRACES_ENABLED",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
  ],
  "functions/.env.example": [
    "GENKIT_VERTEX_LOCATION",
    "GEMINI_MODEL",
    "GEMINI_TEMPERATURE",
    "OTEL_NODE_RESOURCE_DETECTORS",
    "NARRATE_RUNS_COLLECTION",
    "NARRATE_RUNS_FILE_PATH",
    "NARRATE_RUN_TTL_MS",
  ],
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasEnvKey = (content, key) => {
  const pattern = new RegExp(`^\\s*(?:#\\s*)?${escapeRegex(key)}\\s*=`, "m");
  return pattern.test(content);
};

const failures = [];

for (const [relativePath, requiredKeys] of Object.entries(requiredByFile)) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing required file: ${relativePath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  for (const key of requiredKeys) {
    if (!hasEnvKey(content, key)) {
      failures.push(`Missing ${key} in ${relativePath}`);
    }
  }
}

if (failures.length > 0) {
  console.error("[env-example-coverage] FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("[env-example-coverage] PASS");
