import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const INDEX_PATH = path.join(DIST_DIR, "index.html");
const MANIFEST_PATH = path.join(DIST_DIR, "manifest.webmanifest");
const SW_PATH = path.join(DIST_DIR, "sw.js");
const OFFLINE_PATH = path.join(DIST_DIR, "offline.html");
const RUNTIME_CONFIG_PATH = path.join(DIST_DIR, "runtime-config.js");

function readFileOrThrow(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required artifact: ${path.relative(process.cwd(), filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function parseExpectedGameplayFlag() {
  const arg = process.argv.find((value) => value.startsWith("--expect-web-gameplay="));
  if (!arg) return undefined;
  const value = arg.split("=")[1]?.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Invalid --expect-web-gameplay value "${value}"`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateManifest(manifest) {
  assert(typeof manifest.name === "string" && manifest.name.trim(), "Manifest requires name.");
  assert(
    typeof manifest.short_name === "string" && manifest.short_name.trim(),
    "Manifest requires short_name.",
  );
  assert(manifest.start_url === "/", "Manifest start_url must be '/'.");
  assert(manifest.display === "standalone", "Manifest display must be 'standalone'.");
  assert(
    typeof manifest.theme_color === "string" && manifest.theme_color.trim(),
    "Manifest requires theme_color.",
  );
  assert(
    Array.isArray(manifest.icons) && manifest.icons.length >= 2,
    "Manifest must include at least two icons.",
  );
}

function main() {
  const expectedGameplayFlag = parseExpectedGameplayFlag();
  const indexHtml = readFileOrThrow(INDEX_PATH);
  const runtimeConfig = readFileOrThrow(RUNTIME_CONFIG_PATH);

  const hasManifestLink =
    indexHtml.includes('rel="manifest"') && indexHtml.includes("manifest.webmanifest");
  const hasThemeColor = indexHtml.includes('meta name="theme-color"');
  assert(hasThemeColor, "index.html must include theme-color metadata.");

  if (expectedGameplayFlag === false) {
    assert(
      !hasManifestLink,
      "Tooling profile must not include an install manifest link.",
    );
    assert(!fs.existsSync(MANIFEST_PATH), "Tooling profile must not emit manifest.webmanifest.");
    assert(!fs.existsSync(SW_PATH), "Tooling profile must not emit sw.js.");
  } else {
    const manifestText = readFileOrThrow(MANIFEST_PATH);
    const serviceWorker = readFileOrThrow(SW_PATH);
    readFileOrThrow(OFFLINE_PATH);
    assert(hasManifestLink, "index.html must reference manifest.webmanifest.");

    const manifest = JSON.parse(manifestText);
    validateManifest(manifest);

    for (const icon of manifest.icons) {
      const src = String(icon.src || "").replace(/^\//, "");
      const iconPath = path.join(DIST_DIR, src);
      assert(
        fs.existsSync(iconPath),
        `Manifest icon is missing from dist: ${src}`,
      );
    }

    assert(
      serviceWorker.includes("self.addEventListener"),
      "sw.js must register service worker lifecycle listeners.",
    );
  }

  if (expectedGameplayFlag !== undefined) {
    const hasFlagTrue = runtimeConfig.includes(
      "globalThis.__RUNTIME_CONFIG__.VITE_WEB_GAMEPLAY_ENABLED = \"true\";",
    );
    const hasFlagFalse = runtimeConfig.includes(
      "globalThis.__RUNTIME_CONFIG__.VITE_WEB_GAMEPLAY_ENABLED = \"false\";",
    );
    if (expectedGameplayFlag) {
      assert(hasFlagTrue, "Expected runtime config gameplay flag to be true.");
    } else {
      assert(!hasFlagTrue, "Tooling profile must not enable gameplay flag true.");
      assert(!hasFlagFalse, "Tooling profile should rely on default disabled flag.");
    }
  }

  console.log("[pwa-installability] PASS");
}

try {
  main();
} catch (error) {
  console.error(`[pwa-installability] FAIL: ${error.message}`);
  process.exitCode = 1;
}
