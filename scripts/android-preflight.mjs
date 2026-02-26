import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

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

function resolveCommand(cmd) {
  const tool = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(tool, [cmd], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0 || !result.stdout) return "";
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

function listMatchingFiles(rootPath, pattern) {
  try {
    return fs
      .readdirSync(rootPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => path.join(rootPath, entry.name));
  } catch {
    return [];
  }
}

function resolveWindowsGodotBin() {
  const localAppData = String(process.env.LOCALAPPDATA || "");
  const winGetLinksRoot = path.join(localAppData, "Microsoft", "WinGet", "Links");
  const winGetPackagesRoot = path.join(localAppData, "Microsoft", "WinGet", "Packages");

  const directCandidates = [
    path.join(winGetLinksRoot, "godot4.exe"),
    path.join(winGetLinksRoot, "godot.exe"),
  ];
  for (const candidate of directCandidates) {
    if (exists(candidate)) return candidate;
  }

  const discovered = [];
  try {
    const packageDirs = fs
      .readdirSync(winGetPackagesRoot, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          entry.name.toLowerCase().startsWith("godotengine.godotengine_"),
      )
      .map((entry) => path.join(winGetPackagesRoot, entry.name));

    for (const packageDir of packageDirs) {
      discovered.push(
        ...listMatchingFiles(packageDir, /godot_v.*_win64_console\.exe$/i),
        ...listMatchingFiles(packageDir, /godot_v.*_win64\.exe$/i),
      );
    }
  } catch {
    // ignore: fallback scanning may fail on machines without WinGet installs.
  }

  const programFiles = String(process.env.ProgramFiles || "C:\\Program Files");
  const programFilesGodot = path.join(programFiles, "Godot");
  discovered.push(
    ...listMatchingFiles(programFilesGodot, /godot_v.*_win64_console\.exe$/i),
    ...listMatchingFiles(programFilesGodot, /godot_v.*_win64\.exe$/i),
  );

  const unique = [...new Set(discovered)].filter(exists);
  if (unique.length === 0) return "";

  unique.sort((left, right) => {
    const leftConsole = left.toLowerCase().includes("_console.exe") ? 1 : 0;
    const rightConsole = right.toLowerCase().includes("_console.exe") ? 1 : 0;
    if (leftConsole !== rightConsole) return rightConsole - leftConsole;
    const leftMtime = fs.statSync(left).mtimeMs;
    const rightMtime = fs.statSync(right).mtimeMs;
    return rightMtime - leftMtime;
  });

  return unique[0] || "";
}

function resolveGodotBin() {
  const explicit = String(process.env.GODOT_BIN || "").trim();
  if (explicit && exists(explicit)) return explicit;
  const fromGodot4 = resolveCommand("godot4");
  if (fromGodot4) return fromGodot4;
  const fromGodot = resolveCommand("godot");
  if (fromGodot) return fromGodot;
  if (process.platform === "win32") return resolveWindowsGodotBin();
  return "";
}

const requiredSdkEntries = [
  path.join(sdkRoot, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb"),
  path.join(sdkRoot, "build-tools"),
  path.join(sdkRoot, "platforms"),
];

const godotBin = resolveGodotBin();
check("Godot CLI available", Boolean(godotBin), godotBin || "not found");

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
