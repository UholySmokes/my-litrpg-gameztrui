import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const credentialsPath = path.resolve(process.cwd(), "godot", "export_credentials.cfg");

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function upsertOption(content, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}=.*$`, "gm");
  const replacement = `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  if (pattern.test(content)) {
    return content.replace(pattern, replacement);
  }
  return `${content.trimEnd()}\n${replacement}\n`;
}

function main() {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error("Missing godot/export_credentials.cfg");
  }

  const keystorePath = requireEnv("GODOT_ANDROID_KEYSTORE_PATH");
  const keystorePassword = requireEnv("GODOT_ANDROID_KEYSTORE_PASSWORD");
  const keyAlias = requireEnv("GODOT_ANDROID_KEY_ALIAS");
  const keyAliasPassword = requireEnv("GODOT_ANDROID_KEY_ALIAS_PASSWORD");

  let content = fs.readFileSync(credentialsPath, "utf8");
  content = upsertOption(content, "keystore/release", keystorePath);
  content = upsertOption(content, "keystore/release_password", keystorePassword);
  content = upsertOption(content, "keystore/release_user", keyAlias);
  content = upsertOption(content, "keystore/debug", keystorePath);
  content = upsertOption(content, "keystore/debug_password", keystorePassword);
  content = upsertOption(content, "keystore/debug_user", keyAlias);
  fs.writeFileSync(credentialsPath, content, "utf8");

  // Godot 4 also reads env vars for jarsigner in some export templates.
  process.env.ANDROID_KEYSTORE_PATH = keystorePath;
  process.env.ANDROID_KEYSTORE_PASSWORD = keystorePassword;
  process.env.ANDROID_KEY_ALIAS = keyAlias;
  process.env.ANDROID_KEY_ALIAS_PASSWORD = keyAliasPassword;

  console.log(`[android-signing] configured export credentials at ${credentialsPath}`);
}

try {
  main();
} catch (error) {
  console.error(`[android-signing] FAIL: ${error.message}`);
  process.exitCode = 1;
}
