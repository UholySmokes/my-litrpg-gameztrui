import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const projectPath = path.resolve(cwd, "godot");
const presetsPath = path.join(projectPath, "export_presets.cfg");
const exportCredentialsPath = path.join(projectPath, "export_credentials.cfg");
const appData = process.env.APPDATA || "";
const localAppData = process.env.LOCALAPPDATA || "";
const home = process.env.HOME || "";
const sdkRoot = path.resolve(resolveAndroidSdkRoot());
const templatesRoot = resolveTemplatesRoot();
const buildTemplateRoot = path.join(projectPath, "android", "build");
const editorSettingsPath = resolveEditorSettingsPath();
const supportedJavaMajor = 17;

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

function resolveAndroidSdkRoot() {
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.platform === "win32") {
    return path.join(localAppData, "Android", "Sdk");
  }
  return path.join(home, "Android", "Sdk");
}

function resolveTemplatesRoot() {
  if (process.platform === "win32") {
    return path.join(appData, "Godot", "export_templates", "4.6.1.stable");
  }
  const xdgDataHome = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
  return path.join(xdgDataHome, "godot", "export_templates", "4.6.1.stable");
}

function resolveEditorSettingsPath() {
  if (process.platform === "win32") {
    return path.join(appData, "Godot", "editor_settings-4.6.tres");
  }
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(xdgConfigHome, "godot", "editor_settings-4.6.tres");
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
    // ignore missing winget cache
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

function parseJavaMajorFromPath(javaHome) {
  const normalized = String(javaHome || "").replace(/\\/g, "/");
  const pathMatch = normalized.match(/(?:jdk|java|temurin|openjdk)[-_]?(\d+)(?:[._-]|$)/i);
  if (pathMatch) {
    return Number(pathMatch[1]);
  }

  try {
    const javaReleasePath = path.join(javaHome, "release");
    const releaseContent = fs.readFileSync(javaReleasePath, "utf8");
    const releaseMatch = releaseContent.match(/JAVA_VERSION="(\d+)(?:[.][^"]+)?"/);
    if (releaseMatch) {
      return Number(releaseMatch[1]);
    }
  } catch {
    // ignore non-standard java layouts
  }

  return 0;
}

function listJavaHomeCandidates() {
  const candidates = [];
  const seen = new Set();

  const push = (candidate) => {
    const normalized = String(candidate || "").trim();
    if (!normalized || seen.has(normalized) || !exists(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  push(process.env.JAVA_HOME || "");

  const roots = [
    path.join(String(process.env.ProgramFiles || "C:\\Program Files"), "Microsoft"),
    path.join(String(process.env.ProgramFiles || "C:\\Program Files"), "Java"),
    "/usr/lib/jvm",
  ];

  for (const root of roots) {
    try {
      const entries = fs.readdirSync(root, { withFileTypes: true });
      entries
        .filter((entry) => entry.isDirectory() && /(jdk|java|temurin|openjdk)/i.test(entry.name))
        .forEach((entry) => push(path.join(root, entry.name)));
    } catch {
      // ignore missing roots
    }
  }

  const javaExe = resolveCommand("java");
  if (javaExe) {
    push(path.dirname(path.dirname(javaExe)));
  }

  return candidates;
}

function resolveJavaSdkPath() {
  const candidates = listJavaHomeCandidates();
  if (candidates.length === 0) return "";

  candidates.sort((left, right) => {
    const leftMajor = parseJavaMajorFromPath(left);
    const rightMajor = parseJavaMajorFromPath(right);
    const leftPreferred = leftMajor === supportedJavaMajor ? 1 : 0;
    const rightPreferred = rightMajor === supportedJavaMajor ? 1 : 0;
    if (leftPreferred !== rightPreferred) return rightPreferred - leftPreferred;
    const leftSupported = leftMajor >= supportedJavaMajor ? 1 : 0;
    const rightSupported = rightMajor >= supportedJavaMajor ? 1 : 0;
    if (leftSupported !== rightSupported) return rightSupported - leftSupported;
    const leftDiff = leftMajor > 0 ? Math.abs(leftMajor - supportedJavaMajor) : 999;
    const rightDiff = rightMajor > 0 ? Math.abs(rightMajor - supportedJavaMajor) : 999;
    if (leftDiff !== rightDiff) return leftDiff - rightDiff;
    return left.localeCompare(right);
  });

  return candidates[0] || "";
}

const requiredSdkEntries = [
  path.join(sdkRoot, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb"),
  path.join(sdkRoot, "build-tools", "35.0.1"),
  path.join(sdkRoot, "platforms", "android-35"),
  path.join(sdkRoot, "ndk", "28.1.13356709"),
  path.join(sdkRoot, "cmdline-tools", "latest"),
  path.join(sdkRoot, "licenses"),
];

const godotBin = resolveGodotBin();
const javaSdkPath = resolveJavaSdkPath();

check("Godot CLI available", Boolean(godotBin), godotBin || "not found");
check("Java SDK root", Boolean(javaSdkPath) && exists(javaSdkPath), javaSdkPath || "not found");
check(
  `Java SDK major >= ${supportedJavaMajor}`,
  parseJavaMajorFromPath(javaSdkPath) >= supportedJavaMajor,
  javaSdkPath || "not found",
);

check("Godot project directory", exists(projectPath), projectPath);
check("export_presets.cfg exists", exists(presetsPath), presetsPath);
check("export_credentials.cfg exists", exists(exportCredentialsPath), exportCredentialsPath);

let presetsContent = "";
if (exists(presetsPath)) {
  presetsContent = fs.readFileSync(presetsPath, "utf8");
}

check(
  'preset "Android Developer Singleplayer" exists',
  presetsContent ? ensurePreset(presetsContent, "Android Developer Singleplayer") : false,
  presetsPath,
);
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
check("Godot editor settings file", exists(editorSettingsPath), editorSettingsPath);
for (const entry of [
  "build.gradle",
  "gradlew.bat",
  "config.gradle",
  path.join("libs", "debug", "godot-lib.template_debug.aar"),
  path.join("libs", "release", "godot-lib.template_release.aar"),
  path.join("assetPackInstallTime", "src", "main", "assets", "project.binary"),
]) {
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
