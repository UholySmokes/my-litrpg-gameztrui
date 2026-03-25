import {
  ADAPTER_POLICIES,
  REQUIRED_DOCS,
  TOOL_READMES,
  TRACKED_LOCAL_EDITOR_FILES,
  countLines,
  fileExists,
  getTrackedFiles,
  readText,
} from "./lib/ai-workspace.mjs";

const errors = [];

for (const requiredDoc of REQUIRED_DOCS) {
  if (!fileExists(requiredDoc)) {
    errors.push(`missing required AI doc: ${requiredDoc}`);
  }
}

for (const readme of TOOL_READMES) {
  if (!fileExists(readme)) {
    errors.push(`missing compatibility readme: ${readme}`);
  }
}

const environmentToml = ".codex/environments/environment.toml";
if (!fileExists(environmentToml)) {
  errors.push(`missing Codex bootstrap file: ${environmentToml}`);
} else {
  const bootstrapText = readText(environmentToml);
  if (!bootstrapText.includes("scripts/ai-setup.mjs")) {
    errors.push(`${environmentToml} must invoke scripts/ai-setup.mjs`);
  }
  if (bootstrapText.includes('script = ""')) {
    errors.push(`${environmentToml} still has an empty setup script`);
  }
}

for (const policy of ADAPTER_POLICIES) {
  if (!fileExists(policy.path)) {
    errors.push(`missing ${policy.label}: ${policy.path}`);
    continue;
  }

  const content = readText(policy.path);
  for (const requiredRef of policy.requiredRefs) {
    if (!content.includes(requiredRef)) {
      errors.push(`${policy.path} must reference ${requiredRef}`);
    }
  }

  if (policy.maxLines && countLines(content) > policy.maxLines) {
    errors.push(`${policy.path} should remain a thin adapter (${policy.maxLines} lines max)`);
  }
}

const trackedLocalEditorFiles = getTrackedFiles(...TRACKED_LOCAL_EDITOR_FILES);
if (trackedLocalEditorFiles.length > 0) {
  errors.push(`tracked machine-local editor settings detected: ${trackedLocalEditorFiles.join(", ")}`);
}

const readmeText = fileExists("README.md") ? readText("README.md") : "";
for (const requiredSnippet of ["docs/ai/README.md", "npm run ai:setup", "npm run ai:check"]) {
  if (!readmeText.includes(requiredSnippet)) {
    errors.push(`README.md is missing AI workspace reference: ${requiredSnippet}`);
  }
}

if (errors.length > 0) {
  console.error("[ai-check] FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("[ai-check] PASS");
