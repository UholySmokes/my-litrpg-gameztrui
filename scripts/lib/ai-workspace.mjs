import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(moduleDir, "..", "..");

export const REQUIRED_DOCS = [
  "docs/ai/README.md",
  "docs/ai/tool-matrix.md",
  "docs/ai/playbooks/design-and-planning.md",
  "docs/ai/playbooks/gameplay-systems.md",
  "docs/ai/playbooks/balance.md",
  "docs/ai/playbooks/ui-frontend.md",
  "docs/ai/playbooks/firebase-api.md",
  "docs/ai/playbooks/content-worldbuild.md",
  "docs/ai/playbooks/repo-audit-review.md",
  "docs/ai/templates/vscode.settings.local.json",
];

export const ADAPTER_POLICIES = [
  {
    path: ".agent/skills/brainstorming/SKILL.md",
    requiredRefs: ["docs/ai/README.md", "docs/ai/playbooks/design-and-planning.md"],
    maxLines: 18,
    label: "legacy brainstorming adapter",
  },
  {
    path: ".agents/skills/brainstorming/SKILL.md",
    requiredRefs: ["docs/ai/README.md", "docs/ai/playbooks/design-and-planning.md"],
    maxLines: 18,
    label: "agent-pack brainstorming adapter",
  },
  {
    path: ".claude/agents/balancesmith-strict.md",
    requiredRefs: ["docs/ai/README.md", "docs/ai/playbooks/balance.md"],
    label: "Claude balance specialization",
  },
  {
    path: ".gemini/extensions/firebase/FIREBASE.md",
    requiredRefs: ["docs/ai/README.md", "docs/ai/playbooks/firebase-api.md"],
    label: "Gemini Firebase adapter",
  },
  {
    path: ".windsurf/skills/integrityaudit/SKILL.md",
    requiredRefs: ["docs/ai/README.md", "docs/ai/playbooks/repo-audit-review.md"],
    label: "Windsurf audit specialization",
  },
];

export const TOOL_READMES = [
  ".agent/README.md",
  ".agents/README.md",
  ".claude/README.md",
  ".gemini/README.md",
  ".windsurf/README.md",
];

export const TRACKED_LOCAL_EDITOR_FILES = [".vscode/settings.json"];

export function fromRoot(...parts) {
  return path.join(repoRoot, ...parts);
}

export function relPath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

export function fileExists(relativePath) {
  return fs.existsSync(fromRoot(relativePath));
}

export function readText(relativePath) {
  return fs.readFileSync(fromRoot(relativePath), "utf8");
}

export function writeText(relativePath, value) {
  fs.writeFileSync(fromRoot(relativePath), value, "utf8");
}

export function ensureDir(relativePath) {
  fs.mkdirSync(fromRoot(relativePath), { recursive: true });
}

export function countLines(value) {
  return value.split(/\r?\n/).length;
}

export function parseEnvText(rawText) {
  const values = new Map();
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

export function loadEnvFile(relativePath) {
  if (!fileExists(relativePath)) return new Map();
  return parseEnvText(readText(relativePath));
}

export function getDefaultFirebaseProjectId() {
  if (!fileExists(".firebaserc")) return null;
  try {
    const parsed = JSON.parse(readText(".firebaserc"));
    return parsed?.projects?.default || null;
  } catch {
    return null;
  }
}

export function ensureEnvAssignments(relativePath, assignments) {
  let content = fileExists(relativePath) ? readText(relativePath) : "";
  const hasTrailingNewline = content.endsWith("\n");
  let changed = false;

  for (const { key, value } of assignments) {
    if (!key || value == null) continue;
    const assignment = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=(.*)$`, "m");
    const match = content.match(pattern);

    if (!match) {
      if (content && !hasTrailingNewline && !content.endsWith("\n")) {
        content += "\n";
      }
      if (content && !content.endsWith("\n")) {
        content += "\n";
      }
      content += `${assignment}\n`;
      changed = true;
      continue;
    }

    if (!String(match[1] || "").trim()) {
      content = content.replace(pattern, assignment);
      changed = true;
    }
  }

  if (changed) {
    writeText(relativePath, content);
  }

  return changed;
}

export function commandInfo(command) {
  const locator = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(locator, [command], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    return { available: false, path: null };
  }

  const firstPath = result.stdout
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean);

  return {
    available: Boolean(firstPath),
    path: firstPath || null,
  };
}

export function runCommand(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function getTrackedFiles(...paths) {
  const raw = execFileSync("git", ["ls-files", "-z", ...paths], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return raw
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function printSection(title) {
  console.log(`\n== ${title} ==`);
}

export function printStatus(level, label, detail) {
  const suffix = detail ? `: ${detail}` : "";
  console.log(`[${level}] ${label}${suffix}`);
}

export function parseEnvPresence(...envMaps) {
  return {
    hasOpenAiKey: envMaps.some((map) => Boolean(map.get("OPENAI_API_KEY"))) || Boolean(process.env.OPENAI_API_KEY),
    hasCerebrasKey:
      envMaps.some((map) => Boolean(map.get("CEREBRAS_API_KEY"))) || Boolean(process.env.CEREBRAS_API_KEY),
    hasGeminiKey:
      envMaps.some((map) => Boolean(map.get("GOOGLE_GENAI_API_KEY"))) || Boolean(process.env.GOOGLE_GENAI_API_KEY),
    provider:
      envMaps.find((map) => map.get("AI_TEXT_PROVIDER"))?.get("AI_TEXT_PROVIDER") ||
      process.env.AI_TEXT_PROVIDER ||
      null,
    openAiModel:
      envMaps.find((map) => map.get("OPENAI_MODEL"))?.get("OPENAI_MODEL") || process.env.OPENAI_MODEL || null,
    cerebrasModel:
      envMaps.find((map) => map.get("CEREBRAS_MODEL"))?.get("CEREBRAS_MODEL") ||
      process.env.CEREBRAS_MODEL ||
      null,
    geminiModel:
      envMaps.find((map) => map.get("GEMINI_MODEL"))?.get("GEMINI_MODEL") || process.env.GEMINI_MODEL || null,
    firebaseProjectId:
      envMaps.find((map) => map.get("VITE_FIREBASE_PROJECT_ID"))?.get("VITE_FIREBASE_PROJECT_ID") ||
      getDefaultFirebaseProjectId() ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      null,
    authProvider:
      envMaps.find((map) => map.get("VITE_AUTH_PROVIDER"))?.get("VITE_AUTH_PROVIDER") ||
      process.env.VITE_AUTH_PROVIDER ||
      null,
    devUserId:
      envMaps.find((map) => map.get("VITE_DEV_USER_ID"))?.get("VITE_DEV_USER_ID") ||
      process.env.VITE_DEV_USER_ID ||
      null,
  };
}
