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

function withApiFallbackBase(configText, apiBaseValue) {
  const serialized = JSON.stringify(apiBaseValue);
  const assignment =
    `globalThis.__RUNTIME_CONFIG__.VITE_API_FALLBACK_BASE_URL = ${serialized};`;
  const pattern =
    /globalThis\.__RUNTIME_CONFIG__\.VITE_API_FALLBACK_BASE_URL\s*=\s*[^;]+;/;
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

function hasApiFallbackBase(configText) {
  return /VITE_API_FALLBACK_BASE_URL|VITE_API_BASE_FALLBACK|VITE_FALLBACK_API_BASE_URL/.test(
    configText,
  );
}

function hasWebGameplayFlag(configText) {
  return /VITE_WEB_GAMEPLAY_ENABLED/.test(configText);
}

function isLocalHttpUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:") return false;
    return ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function sanitizePrimaryConfigValue(value, keyName) {
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

function sanitizeFallbackConfigValue(value, keyName) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) {
    console.warn(
      `[runtime-config] ignoring ${keyName} because protocol-relative URLs are not allowed: ${trimmed}`,
    );
    return "";
  }
  if (!EXTERNAL_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || isLocalHttpUrl(trimmed)) {
      return trimmed;
    }
  } catch {
    // Fall through to warning below.
  }

  console.warn(
    `[runtime-config] ignoring ${keyName} because only https (or local http) fallback URLs are allowed: ${trimmed}`,
  );
  return "";
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
  const envEndpoint = sanitizePrimaryConfigValue(
    process.env.VITE_NARRATE_ENDPOINT || "",
    "VITE_NARRATE_ENDPOINT",
  );
  const envApiBase = sanitizePrimaryConfigValue(
    process.env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE ||
    "",
    "VITE_API_BASE_URL",
  );
  const envApiFallbackBase = sanitizeFallbackConfigValue(
    process.env.VITE_API_FALLBACK_BASE_URL ||
    process.env.VITE_API_BASE_FALLBACK ||
    process.env.VITE_FALLBACK_API_BASE_URL ||
    "",
    "VITE_API_FALLBACK_BASE_URL",
  );
  const webGameplayFlag = parseWebGameplayFlag(
    process.env.VITE_WEB_GAMEPLAY_ENABLED ||
    process.env.VITE_ENABLE_WEB_GAMEPLAY ||
    "",
  );
  const publicConfig = await readPublicConfig();

  let output = publicConfig;
  let sourceLabel = "public";

  if (
    envEndpoint ||
    envApiBase ||
    envApiFallbackBase ||
    webGameplayFlag !== undefined
  ) {
    output = ensureBase(publicConfig);
    if (envEndpoint) {
      output = withEndpoint(output, envEndpoint);
    }
    if (envApiBase) {
      output = withApiBase(output, envApiBase);
    }
    if (envApiFallbackBase) {
      output = withApiFallbackBase(output, envApiFallbackBase);
    }
    if (webGameplayFlag !== undefined) {
      output = withWebGameplayFlag(output, webGameplayFlag);
    }
    sourceLabel = "env";
  } else if (
    !hasEndpoint(publicConfig) &&
    !hasApiBase(publicConfig) &&
    !hasApiFallbackBase(publicConfig) &&
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
