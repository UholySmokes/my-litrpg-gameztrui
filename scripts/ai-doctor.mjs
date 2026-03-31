import {
  TRACKED_LOCAL_EDITOR_FILES,
  commandInfo,
  fileExists,
  getTrackedFiles,
  loadEnvFile,
  parseEnvPresence,
  printSection,
  printStatus,
  runCommand,
} from "./lib/ai-workspace.mjs";

const rootEnv = loadEnvFile(".env.local");
const functionsEnv = loadEnvFile("functions/.env.local");
const functionsSecretEnv = loadEnvFile("functions/.secret.local");
const envPresence = parseEnvPresence(rootEnv, functionsEnv, functionsSecretEnv);

printSection("Core tools");
for (const command of ["git", "node", "npm", "codex"]) {
  const info = commandInfo(command);
  printStatus(info.available ? "OK" : "WARN", command, info.path || "not found");
}

printSection("Optional AI tools");
for (const command of ["firebase", "claude", "ollama"]) {
  const info = commandInfo(command);
  printStatus(info.available ? "OK" : "WARN", command, info.path || "not found");
}

printSection("Environment files");
printStatus(fileExists(".env.local") ? "OK" : "WARN", ".env.local", fileExists(".env.local") ? "present" : "missing");
printStatus(
  fileExists("functions/.env.local") ? "OK" : "WARN",
  "functions/.env.local",
  fileExists("functions/.env.local") ? "present" : "missing",
);
printStatus(
  fileExists("functions/.secret.local") ? "OK" : "WARN",
  "functions/.secret.local",
  fileExists("functions/.secret.local") ? "present" : "missing",
);

printSection("AI provider posture");
printStatus(envPresence.provider ? "OK" : "WARN", "AI_TEXT_PROVIDER", envPresence.provider || "unset");
printStatus(envPresence.openAiModel ? "OK" : "WARN", "OPENAI_MODEL", envPresence.openAiModel || "unset");
printStatus(envPresence.geminiModel ? "OK" : "WARN", "GEMINI_MODEL", envPresence.geminiModel || "unset");
printStatus(envPresence.authProvider ? "OK" : "WARN", "VITE_AUTH_PROVIDER", envPresence.authProvider || "unset");
printStatus(envPresence.devUserId ? "OK" : "WARN", "VITE_DEV_USER_ID", envPresence.devUserId || "unset");
printStatus(envPresence.hasOpenAiKey ? "OK" : "WARN", "OPENAI_API_KEY", envPresence.hasOpenAiKey ? "configured" : "missing");
printStatus(
  envPresence.hasGeminiKey ? "OK" : "WARN",
  "GOOGLE_GENAI_API_KEY",
  envPresence.hasGeminiKey ? "configured" : "missing",
);
printStatus(
  envPresence.firebaseProjectId ? "OK" : "WARN",
  "VITE_FIREBASE_PROJECT_ID",
  envPresence.firebaseProjectId || "unset",
);

printSection("Workspace policy");
const trackedLocalEditorFiles = getTrackedFiles(...TRACKED_LOCAL_EDITOR_FILES);
printStatus(
  trackedLocalEditorFiles.length === 0 ? "OK" : "WARN",
  "tracked local editor files",
  trackedLocalEditorFiles.length === 0 ? "none" : trackedLocalEditorFiles.join(", "),
);
printStatus(
  fileExists(".vscode/settings.json") ? "OK" : "WARN",
  "local VS Code settings",
  fileExists(".vscode/settings.json") ? "present (local-only)" : "not seeded yet",
);

printSection("Local model reality check");
const gpuInfo = commandInfo("nvidia-smi");
if (!gpuInfo.available) {
  printStatus("WARN", "GPU probe", "nvidia-smi not found; assume cloud-primary");
} else {
  const result = runCommand("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"]);
  const summary = result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : "unable to query GPU";
  printStatus("INFO", "Detected GPU", summary);
  printStatus("INFO", "Recommended hosting", "cloud-primary for frontier coding models on this machine");
}
