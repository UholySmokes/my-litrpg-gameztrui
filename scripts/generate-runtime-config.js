import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DIST_CONFIG_PATH = path.resolve(process.cwd(), "dist", "runtime-config.js");
const PUBLIC_CONFIG_PATH = path.resolve(process.cwd(), "public", "runtime-config.js");
const BASE_CONFIG = "globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};\n";
const AZURE_HOST_PATTERN = /azure/i;

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

function sanitizeEndpoint(value, keyName) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (AZURE_HOST_PATTERN.test(trimmed)) {
    // eslint-disable-next-line no-console
    console.warn(`[runtime-config] ignoring ${keyName} because it points to legacy host: ${trimmed}`);
    return "";
  }
  return trimmed;
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
  const publicConfig = await readPublicConfig();

  let output = publicConfig;
  let sourceLabel = "public";

  if (envEndpoint || envApiBase) {
    output = ensureBase(publicConfig);
    if (envEndpoint) {
      output = withEndpoint(output, envEndpoint);
    }
    if (envApiBase) {
      output = withApiBase(output, envApiBase);
    }
    sourceLabel = "env";
  } else if (!hasEndpoint(publicConfig) && !hasApiBase(publicConfig)) {
    output = ensureBase(publicConfig);
    sourceLabel = "base";
  }

  await fs.mkdir(path.dirname(DIST_CONFIG_PATH), { recursive: true });
  await fs.writeFile(DIST_CONFIG_PATH, output, "utf8");

  // eslint-disable-next-line no-console
  console.log(`[runtime-config] wrote dist/runtime-config.js from ${sourceLabel}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
