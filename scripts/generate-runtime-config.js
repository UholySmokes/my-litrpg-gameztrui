import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DIST_CONFIG_PATH = path.resolve(process.cwd(), "dist", "runtime-config.js");
const PUBLIC_CONFIG_PATH = path.resolve(process.cwd(), "public", "runtime-config.js");
const BASE_CONFIG = "globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};\n";
const EXTERNAL_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

async function readPublicConfig() {
  try {
    return await fs.readFile(PUBLIC_CONFIG_PATH, "utf8");
  } catch {
    return "";
  }
}

function ensureBase(configText) {
  if (configText && configText.includes("__RUNTIME_CONFIG__")) {
    return configText;
  }
  return BASE_CONFIG;
}

function withEndpoint(configText, endpointValue) {
  const serialized = JSON.stringify(endpointValue);
  const assignment = `globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_ENDPOINT = ${serialized};`;
  const pattern =
    /globalThis\.__RUNTIME_CONFIG__\.VITE_NARRATE_ENDPOINT\s*=\s*[^;]+;/;
  if (pattern.test(configText)) {
    return configText.replace(pattern, assignment);
  }
  const trimmed = ensureBase(configText).replace(/\s*$/, "");
  return `${trimmed}\n${assignment}\n`;
}

function withApiBase(configText, apiBaseValue) {
  const serialized = JSON.stringify(apiBaseValue);
  const assignment = `globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL = ${serialized};`;
  const pattern =
    /globalThis\.__RUNTIME_CONFIG__\.VITE_API_BASE_URL\s*=\s*[^;]+;/;
  if (pattern.test(configText)) {
    return configText.replace(pattern, assignment);
  }
  const trimmed = ensureBase(configText).replace(/\s*$/, "");
  return `${trimmed}\n${assignment}\n`;
}

function hasEndpoint(configText) {
  return /VITE_NARRATE_ENDPOINT/.test(configText);
}

function hasApiBase(configText) {
  return /VITE_API_BASE_URL|VITE_API_BASE/.test(configText);
}

function hasWebGameplayFlag(configText) {
  return /VITE_WEB_GAMEPLAY_ENABLED/.test(configText);
}

function sanitizeEndpoint(value, keyName) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (EXTERNAL_URL_PATTERN.test(trimmed) || trimmed.startsWith("//")) {
    console.warn(
      `[runtime-config] ignoring ${keyName} because only same-origin paths are allowed: ${trimmed}`,
    );
    return "";
  }
  return trimmed;
}

function parseWebGameplayFlag(value) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "on"].includes(normalized)) return "true";
  if (["0", "false", "no", "off"].includes(normalized)) return "false";
  return undefined;
}

function withWebGameplayFlag(configText, boolLiteral) {
  const assignment =
    `globalThis.__RUNTIME_CONFIG__.VITE_WEB_GAMEPLAY_ENABLED = "${boolLiteral}";`;
  const pattern =
    /globalThis\.__RUNTIME_CONFIG__\.VITE_WEB_GAMEPLAY_ENABLED\s*=\s*[^;]+;/;
  if (pattern.test(configText)) {
    return configText.replace(pattern, assignment);
  }
  const trimmed = ensureBase(configText).replace(/\s*$/, "");
  return `${trimmed}\n${assignment}\n`;
}

async function main() {
  const envEndpoint = sanitizeEndpoint(
    process.env.VITE_NARRATE_ENDPOINT || "",
    "VITE_NARRATE_ENDPOINT",
  );
  const envApiBase = sanitizeEndpoint(
    process.env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE ||
    "",
    "VITE_API_BASE_URL",
  );
  const webGameplayFlag = parseWebGameplayFlag(
    process.env.VITE_WEB_GAMEPLAY_ENABLED ||
    process.env.VITE_ENABLE_WEB_GAMEPLAY ||
    "",
  );
  const publicConfig = await readPublicConfig();

  let output = publicConfig;
  let sourceLabel = "public";

  if (envEndpoint || envApiBase || webGameplayFlag !== undefined) {
    output = ensureBase(publicConfig);
    if (envEndpoint) {
      output = withEndpoint(output, envEndpoint);
    }
    if (envApiBase) {
      output = withApiBase(output, envApiBase);
    }
    if (webGameplayFlag !== undefined) {
      output = withWebGameplayFlag(output, webGameplayFlag);
    }
    sourceLabel = "env";
  } else if (
    !hasEndpoint(publicConfig) &&
    !hasApiBase(publicConfig) &&
    !hasWebGameplayFlag(publicConfig)
  ) {
    output = ensureBase(publicConfig);
    sourceLabel = "base";
  }

  await fs.mkdir(path.dirname(DIST_CONFIG_PATH), { recursive: true });
  await fs.writeFile(DIST_CONFIG_PATH, output, "utf8");

  console.log(`[runtime-config] wrote dist/runtime-config.js from ${sourceLabel}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
