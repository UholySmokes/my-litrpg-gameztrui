import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const projectPath = path.resolve(cwd, "godot");
const presetsPath = path.join(projectPath, "export_presets.cfg");
const appData = process.env.APPDATA || "";
const localAppData = process.env.LOCALAPPDATA || "";
const sdkRoot = path.resolve(
  process.env.ANDROID_SDK_ROOT ||
    process.env.ANDROID_HOME ||
    path.join(localAppData, "Android", "Sdk"),
);
const templatesRoot = path.join(appData, "Godot", "export_templates", "4.6.1.stable");
const buildTemplateRoot = path.join(projectPath, "android", "build");

const results = [];

function check(name, passed, details) {
  results.push({ name, passed, details });
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function ensurePreset(content, presetName) {
  return new RegExp(`name="${presetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(
    content,
  );
}

const requiredSdkEntries = [
  path.join(sdkRoot, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb"),
  path.join(sdkRoot, "build-tools"),
  path.join(sdkRoot, "platforms"),
];

check("Godot project directory", exists(projectPath), projectPath);
check("export_presets.cfg exists", exists(presetsPath), presetsPath);

let presetsContent = "";
if (exists(presetsPath)) {
  presetsContent = fs.readFileSync(presetsPath, "utf8");
}

check(
  'preset "Android Internal Debug" exists',
  presetsContent ? ensurePreset(presetsContent, "Android Internal Debug") : false,
  presetsPath,
);
check(
  'preset "Android Release Candidate" exists',
  presetsContent ? ensurePreset(presetsContent, "Android Release Candidate") : false,
  presetsPath,
);

check("ANDROID_SDK_ROOT/ANDROID_HOME", exists(sdkRoot), sdkRoot);
for (const entry of requiredSdkEntries) {
  check(`SDK entry: ${path.relative(sdkRoot, entry)}`, exists(entry), entry);
}

check("Godot export templates directory", exists(templatesRoot), templatesRoot);
for (const template of ["android_debug.apk", "android_release.apk", "android_source.zip"]) {
  const templatePath = path.join(templatesRoot, template);
  check(`Template: ${template}`, exists(templatePath), templatePath);
}

check("Android build template installed", exists(buildTemplateRoot), buildTemplateRoot);
for (const entry of ["build.gradle", "gradlew.bat", path.join("libs", "debug", "godot-lib.template_debug.aar")]) {
  const templatePath = path.join(buildTemplateRoot, entry);
  check(`Build template file: ${entry}`, exists(templatePath), templatePath);
}

const failed = results.filter((result) => !result.passed);
for (const result of results) {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`[android-preflight] ${status} ${result.name} -> ${result.details}`);
}

if (failed.length > 0) {
  console.error(`[android-preflight] ${failed.length} checks failed.`);
  process.exitCode = 1;
} else {
  console.log("[android-preflight] all checks passed.");
}
