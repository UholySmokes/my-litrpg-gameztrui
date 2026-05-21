import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_PATH = path.resolve(process.cwd(), "godot");
const EXPORT_PRESETS_PATH = path.join(PROJECT_PATH, "export_presets.cfg");
const EXPORT_CREDENTIALS_PATH = path.join(PROJECT_PATH, "export_credentials.cfg");
const APPDATA = process.env.APPDATA || "";
const LOCALAPPDATA = process.env.LOCALAPPDATA || "";
const HOME = process.env.HOME || "";
const ANDROID_SDK_ROOT = path.resolve(resolveAndroidSdkRoot());
const GODOT_EDITOR_SETTINGS_PATH = resolveEditorSettingsPath();
const ANDROID_BUILD_TEMPLATE_PATH = path.join(PROJECT_PATH, "android", "build");
const ASSET_PACK_DIR = path.join(
  ANDROID_BUILD_TEMPLATE_PATH,
  "assetPackInstallTime",
  "src",
  "main",
  "assets",
);
const ASSET_PACK_PATH = path.join(ASSET_PACK_DIR, "assets.sparsepck");
const PROJECT_BINARY_PATH = path.join(ASSET_PACK_DIR, "project.binary");
const APP_ASSETS_DIR = path.join(ANDROID_BUILD_TEMPLATE_PATH, "src", "main", "assets");
const LOCAL_PROPERTIES_PATH = path.join(ANDROID_BUILD_TEMPLATE_PATH, "local.properties");
const SUPPORTED_JAVA_MAJOR = 21;
const DEFAULT_RELEASE_ALIAS = "androiddebugkey";
const STAGED_APK_RUNTIME_ASSETS = [
  path.join(APP_ASSETS_DIR, "_cl_"),
  path.join(APP_ASSETS_DIR, "project.binary"),
  path.join(APP_ASSETS_DIR, "assets.sparsepck"),
  path.join(APP_ASSETS_DIR, "game.pck"),
];

function parseArgs(argv) {
  const args = {
    preset: "",
    output: "",
    mode: "release",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--preset") args.preset = String(argv[i + 1] || "");
    if (token === "--output") args.output = String(argv[i + 1] || "");
    if (token === "--mode") args.mode = String(argv[i + 1] || "release").toLowerCase();
  }

  if (!args.preset || !args.output) {
    throw new Error("Usage: --preset <name> --output <path> [--mode debug|release]");
  }
  if (!["debug", "release"].includes(args.mode)) {
    throw new Error(`Invalid mode "${args.mode}". Use "debug" or "release".`);
  }
  return args;
}

function resolveAndroidSdkRoot() {
  if (process.env.ANDROID_SDK_ROOT) return process.env.ANDROID_SDK_ROOT;
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  if (process.platform === "win32") {
    return path.join(LOCALAPPDATA, "Android", "Sdk");
  }
  return path.join(HOME, "Android", "Sdk");
}

function resolveEditorSettingsPath() {
  if (process.platform === "win32") {
    return path.join(APPDATA, "Godot", "editor_settings-4.6.tres");
  }
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(HOME, ".config");
  return path.join(xdgConfigHome, "godot", "editor_settings-4.6.tres");
}

function isExecutable(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
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
    if (isExecutable(candidate)) return candidate;
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

  const unique = [...new Set(discovered)].filter(isExecutable);
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
  if (explicit && isExecutable(explicit)) return explicit;
  const fromGodot4 = resolveCommand("godot4");
  if (fromGodot4) return fromGodot4;
  const fromGodot = resolveCommand("godot");
  if (fromGodot) return fromGodot;
  if (process.platform === "win32") {
    const windowsResolved = resolveWindowsGodotBin();
    if (windowsResolved) return windowsResolved;
  }
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

  const pushCandidate = (candidate) => {
    const normalized = String(candidate || "").trim();
    if (!normalized || seen.has(normalized)) return;
    if (!fs.existsSync(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  pushCandidate(process.env.JAVA_HOME || "");

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
        .forEach((entry) => pushCandidate(path.join(root, entry.name)));
    } catch {
      // ignore missing roots
    }
  }

  const javaExe = resolveCommand("java");
  if (javaExe) {
    pushCandidate(path.dirname(path.dirname(javaExe)));
  }

  return candidates;
}

function resolveJavaSdkPath() {
  const candidates = listJavaHomeCandidates();
  if (candidates.length === 0) return "";

  candidates.sort((left, right) => {
    const leftMajor = parseJavaMajorFromPath(left);
    const rightMajor = parseJavaMajorFromPath(right);
    const leftPreferred = leftMajor === SUPPORTED_JAVA_MAJOR ? 1 : 0;
    const rightPreferred = rightMajor === SUPPORTED_JAVA_MAJOR ? 1 : 0;
    if (leftPreferred !== rightPreferred) return rightPreferred - leftPreferred;
    const leftSupported = leftMajor >= SUPPORTED_JAVA_MAJOR ? 1 : 0;
    const rightSupported = rightMajor >= SUPPORTED_JAVA_MAJOR ? 1 : 0;
    if (leftSupported !== rightSupported) return rightSupported - leftSupported;
    const leftDiff = leftMajor > 0 ? Math.abs(leftMajor - SUPPORTED_JAVA_MAJOR) : 999;
    const rightDiff = rightMajor > 0 ? Math.abs(rightMajor - SUPPORTED_JAVA_MAJOR) : 999;
    if (leftDiff !== rightDiff) return leftDiff - rightDiff;
    return left.localeCompare(right);
  });

  return candidates[0] || "";
}

function upsertEditorSetting(content, key, value) {
  const line = `${key} = ${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} = .*?$`, "m");
  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }
  if (!content.trim()) {
    return `[gd_resource type="EditorSettings" format=3]\n\n[resource]\n${line}\n`;
  }
  if (!/\[resource\]/.test(content)) {
    return `${content.trimEnd()}\n\n[resource]\n${line}\n`;
  }
  return `${content.trimEnd()}\n${line}\n`;
}

function ensureAndroidEditorSettings(javaSdkPath) {
  if (!javaSdkPath || !fs.existsSync(javaSdkPath)) {
    throw new Error("Java SDK not found. Install or point JAVA_HOME to a valid JDK root.");
  }
  if (parseJavaMajorFromPath(javaSdkPath) < SUPPORTED_JAVA_MAJOR) {
    throw new Error(
      `Android export requires JDK ${SUPPORTED_JAVA_MAJOR} or newer. Resolved: ${javaSdkPath}`,
    );
  }
  if (!fs.existsSync(ANDROID_SDK_ROOT)) {
    throw new Error("Android SDK not found. Set ANDROID_SDK_ROOT or ANDROID_HOME.");
  }

  let content = "";
  if (fs.existsSync(GODOT_EDITOR_SETTINGS_PATH)) {
    content = fs.readFileSync(GODOT_EDITOR_SETTINGS_PATH, "utf8");
  }

  content = upsertEditorSetting(
    content,
    "export/android/java_sdk_path",
    javaSdkPath.replace(/\\/g, "/"),
  );
  content = upsertEditorSetting(
    content,
    "export/android/android_sdk_path",
    ANDROID_SDK_ROOT.replace(/\\/g, "/"),
  );

  fs.mkdirSync(path.dirname(GODOT_EDITOR_SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(GODOT_EDITOR_SETTINGS_PATH, content, "utf8");
  console.log(
    `[android-export] configured Godot editor settings -> ${GODOT_EDITOR_SETTINGS_PATH}`,
  );
}

function cleanupStaleGodotTempLibraries(projectPath) {
  const binPath = path.join(projectPath, "addons", "quarkphysics", "bin");
  let entries = [];
  try {
    entries = fs.readdirSync(binPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith("~libquarkphysics.")) continue;
    const fullPath = path.join(binPath, entry.name);
    try {
      fs.rmSync(fullPath, { force: true });
      console.log(`[android-export] removed stale temp library: ${fullPath}`);
    } catch {
      // Ignore cleanup failures and let export surface the root cause if it still fails.
    }
  }
}

function parseIniLikeConfig(content) {
  const sections = {};
  let currentSection = "";

  for (const rawLine of String(content || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections[currentSection] = sections[currentSection] || {};
      continue;
    }
    const separator = line.indexOf("=");
    if (separator === -1 || !currentSection) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    sections[currentSection] = sections[currentSection] || {};
    sections[currentSection][key] = value;
  }

  return sections;
}

function decodeConfigValue(rawValue) {
  if (rawValue == null) return "";
  if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue.slice(1, -1);
    }
  }
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  return rawValue;
}

function loadSections(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseIniLikeConfig(fs.readFileSync(filePath, "utf8"));
}

function getPresetDefinition(presetName) {
  const sections = loadSections(EXPORT_PRESETS_PATH);
  const presetSectionName = Object.keys(sections).find(
    (sectionName) =>
      /^preset\.\d+$/.test(sectionName) &&
      decodeConfigValue(sections[sectionName]?.name || "") === presetName,
  );
  if (!presetSectionName) return null;

  const optionsSectionName = `${presetSectionName}.options`;
  return {
    index: Number(presetSectionName.split(".")[1]),
    section: sections[presetSectionName] || {},
    options: sections[optionsSectionName] || {},
  };
}

function getPresetCredentials(index) {
  const sections = loadSections(EXPORT_CREDENTIALS_PATH);
  return sections[`preset.${index}.options`] || {};
}

function normalizeBoolean(rawValue, fallback = false) {
  const value = decodeConfigValue(rawValue);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function normalizeNumber(rawValue, fallback = 0) {
  const value = Number(decodeConfigValue(rawValue));
  return Number.isFinite(value) ? value : fallback;
}

function resolveEnabledAbis(options) {
  const abiEntries = [
    ["architectures/armeabi-v7a", "armeabi-v7a"],
    ["architectures/arm64-v8a", "arm64-v8a"],
    ["architectures/x86", "x86"],
    ["architectures/x86_64", "x86_64"],
  ];

  return abiEntries
    .filter(([key]) => normalizeBoolean(options[key], false))
    .map(([, abi]) => abi);
}

function ensureAndroidBuildLocalProperties() {
  const ndkRoot = path.join(ANDROID_SDK_ROOT, "ndk", "28.1.13356709");
  const lines = [`sdk.dir=${ANDROID_SDK_ROOT.replace(/\\/g, "/")}`];
  if (fs.existsSync(ndkRoot)) {
    lines.push(`ndk.dir=${ndkRoot.replace(/\\/g, "/")}`);
  }
  fs.writeFileSync(LOCAL_PROPERTIES_PATH, `${lines.join("\n")}\n`, "ascii");
  console.log(`[android-export] wrote ${LOCAL_PROPERTIES_PATH}`);
}

function ensurePathExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
}

function copyFileIfPresent(fromPath, toPath) {
  if (!fs.existsSync(fromPath)) return;
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
}

function stageApkRuntimeAssets(packPath) {
  fs.mkdirSync(APP_ASSETS_DIR, { recursive: true });

  copyFileIfPresent(path.join(ASSET_PACK_DIR, "_cl_"), path.join(APP_ASSETS_DIR, "_cl_"));
  copyFileIfPresent(PROJECT_BINARY_PATH, path.join(APP_ASSETS_DIR, "project.binary"));

  // Keep both canonical names so the runtime can resolve project data regardless of
  // whether it is reading from the base APK assets path or asset-pack wiring.
  copyFileIfPresent(packPath, path.join(APP_ASSETS_DIR, "assets.sparsepck"));
  copyFileIfPresent(packPath, path.join(APP_ASSETS_DIR, "game.pck"));
}

function cleanupApkRuntimeAssets() {
  for (const filePath of STAGED_APK_RUNTIME_ASSETS) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // ignore cleanup failures for staged base-APK assets
    }
  }
}

function withoutAssetPackInBuildGradle(runBuild) {
  const buildGradlePath = path.join(ANDROID_BUILD_TEMPLATE_PATH, "build.gradle");
  if (!fs.existsSync(buildGradlePath)) {
    return runBuild();
  }

  const originalContent = fs.readFileSync(buildGradlePath, "utf8");
  const patchedContent = originalContent.replace(
    /^\s*assetPacks\s*=\s*\[":assetPackInstallTime"\]\s*$/m,
    "    // assetPacks disabled for APK fallback so project data is packaged in base assets",
  );

  if (patchedContent === originalContent) {
    return runBuild();
  }

  fs.writeFileSync(buildGradlePath, patchedContent, "utf8");
  try {
    return runBuild();
  } finally {
    fs.writeFileSync(buildGradlePath, originalContent, "utf8");
  }
}

function buildSpawnEnv(javaSdkPath) {
  const javaBin = path.join(javaSdkPath, "bin");
  return {
    ...process.env,
    JAVA_HOME: javaSdkPath,
    ANDROID_HOME: ANDROID_SDK_ROOT,
    ANDROID_SDK_ROOT,
    PATH: `${javaBin}${path.delimiter}${process.env.PATH || ""}`,
  };
}

function emitProcessOutput(run) {
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
}

function quoteWindowsCmdArg(value) {
  const stringValue = String(value ?? "");
  if (stringValue.length === 0) return '""';
  if (!/[\s"&|<>^()]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function runGodotCommand(godotBin, args, env) {
  const run = spawnSync(godotBin, args, {
    encoding: "utf8",
    stdio: "pipe",
    env,
  });
  emitProcessOutput(run);
  if (run.error) throw run.error;
  return run;
}

function verifyArtifact(outputPath) {
  if (!fs.existsSync(outputPath)) {
    return false;
  }
  const stats = fs.statSync(outputPath);
  return stats.isFile() && stats.size > 0;
}

function runDirectGodotExport({ godotBin, env, presetName, mode, outputPath }) {
  const exportFlag = mode === "debug" ? "--export-debug" : "--export-release";
  const run = runGodotCommand(
    godotBin,
    ["--headless", "--path", PROJECT_PATH, exportFlag, presetName, outputPath],
    env,
  );

  if (run.status === 0 && verifyArtifact(outputPath)) {
    console.log(`[android-export] direct Godot export succeeded -> ${outputPath}`);
    return true;
  }
  return false;
}

function runGodotPackExport({ godotBin, env, presetName, packPath }) {
  const run = runGodotCommand(
    godotBin,
    ["--headless", "--path", PROJECT_PATH, "--export-pack", presetName, packPath],
    env,
  );

  if (!verifyArtifact(packPath)) {
    throw new Error(`Godot pack export failed for preset "${presetName}".`);
  }

  if (run.status !== 0) {
    console.warn(
      `[android-export] pack export returned status ${run.status}, but produced a valid pack. Continuing with Gradle fallback.`,
    );
  }
}

function buildGradleExportConfig({ presetName, outputPath, mode }) {
  const preset = getPresetDefinition(presetName);
  if (!preset) {
    throw new Error(`Preset "${presetName}" not found in ${EXPORT_PRESETS_PATH}.`);
  }

  const credentials = getPresetCredentials(preset.index);
  const options = preset.options || {};
  const exportFormat =
    normalizeNumber(options["gradle_build/export_format"], outputPath.endsWith(".aab") ? 1 : 0) === 1
      ? "aab"
      : "apk";
  const enabledAbis = resolveEnabledAbis(options);
  if (enabledAbis.length === 0) {
    enabledAbis.push("arm64-v8a");
  }

  const debugKeystore = decodeConfigValue(credentials["keystore/debug"] || "");
  const debugPassword = decodeConfigValue(credentials["keystore/debug_password"] || "android");
  const debugAlias = decodeConfigValue(credentials["keystore/debug_user"] || DEFAULT_RELEASE_ALIAS);
  const releaseKeystore = decodeConfigValue(credentials["keystore/release"] || "");
  const releasePassword = decodeConfigValue(credentials["keystore/release_password"] || "");
  const releaseAlias = decodeConfigValue(credentials["keystore/release_user"] || "");
  const useReleaseSigning = mode === "release";

  if (useReleaseSigning && (!releaseKeystore || !releasePassword || !releaseAlias)) {
    throw new Error(
      `Release preset "${presetName}" is missing release signing data in ${EXPORT_CREDENTIALS_PATH}.`,
    );
  }
  if (!useReleaseSigning && (!debugKeystore || !debugPassword || !debugAlias)) {
    throw new Error(
      `Debug preset "${presetName}" is missing debug signing data in ${EXPORT_CREDENTIALS_PATH}.`,
    );
  }

  return {
    gradleTask:
      mode === "release" && exportFormat === "aab"
        ? "bundleStandardRelease"
        : mode === "release"
          ? "assembleStandardRelease"
          : "assembleStandardDebug",
    copyTask: "copyAndRenameBinary",
    exportPath: path.dirname(outputPath).replace(/\\/g, "/"),
    exportFilename: path.basename(outputPath),
    packageName: String(decodeConfigValue(options["package/unique_name"] || "com.voidverse.app")),
    versionCode: String(normalizeNumber(options["version/code"], 1)),
    versionName: String(decodeConfigValue(options["version/name"] || "0.1.0")),
    buildType: mode,
    exportFormat,
    enabledAbis,
    signing: useReleaseSigning
      ? {
          keystore: String(releaseKeystore),
          password: String(releasePassword),
          alias: String(releaseAlias),
        }
      : {
          keystore: String(debugKeystore),
          password: String(debugPassword),
          alias: String(debugAlias),
        },
  };
}

function runGradleFallback({ javaSdkPath, presetName, outputPath, mode, packPath }) {
  ensurePathExists(ANDROID_BUILD_TEMPLATE_PATH, "Android build template");
  ensurePathExists(PROJECT_BINARY_PATH, "Android project.binary");

  const config = buildGradleExportConfig({ presetName, outputPath, mode });
  ensurePathExists(packPath, "temporary Android pack");

  fs.mkdirSync(ASSET_PACK_DIR, { recursive: true });
  fs.copyFileSync(packPath, ASSET_PACK_PATH);

  if (config.exportFormat === "apk") {
    stageApkRuntimeAssets(packPath);
  }

  ensureAndroidBuildLocalProperties();

  const gradleWrapper = path.join(
    ANDROID_BUILD_TEMPLATE_PATH,
    process.platform === "win32" ? "gradlew.bat" : "gradlew",
  );
  ensurePathExists(gradleWrapper, "Gradle wrapper");

  const env = buildSpawnEnv(javaSdkPath);
  const gradleArgs = [
    "-p",
    ANDROID_BUILD_TEMPLATE_PATH,
    config.gradleTask,
    config.copyTask,
    `-Pexport_path=${config.exportPath}`,
    `-Pexport_filename=${config.exportFilename}`,
    `-Pexport_package_name=${config.packageName}`,
    `-Pexport_version_code=${config.versionCode}`,
    `-Pexport_version_name=${config.versionName}`,
    `-Pexport_build_type=${config.buildType}`,
    "-Pexport_edition=standard",
    `-Pexport_format=${config.exportFormat}`,
    `-Pexport_enabled_abis=${config.enabledAbis.join(",")}`,
    `-Pdebug_keystore_file=${config.signing.keystore}`,
    `-Pdebug_keystore_password=${config.signing.password}`,
    `-Pdebug_keystore_alias=${config.signing.alias}`,
    `-Prelease_keystore_file=${config.signing.keystore}`,
    `-Prelease_keystore_password=${config.signing.password}`,
    `-Prelease_keystore_alias=${config.signing.alias}`,
    "-Pperform_signing=true",
    "-Pperform_zipalign=true",
  ];

  const runGradle = () =>
    process.platform === "win32"
      ? spawnSync(
          "cmd.exe",
          [
            "/d",
            "/s",
            "/c",
            [quoteWindowsCmdArg(gradleWrapper), ...gradleArgs.map(quoteWindowsCmdArg)].join(" "),
          ],
          {
            encoding: "utf8",
            stdio: "pipe",
            env,
          },
        )
      : spawnSync(gradleWrapper, gradleArgs, {
          encoding: "utf8",
          stdio: "pipe",
          env,
        });

  const run = (() => {
    if (config.exportFormat !== "apk") {
      return runGradle();
    }

    try {
      return withoutAssetPackInBuildGradle(runGradle);
    } finally {
      cleanupApkRuntimeAssets();
    }
  })();

  emitProcessOutput(run);
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`Gradle fallback build failed for preset "${presetName}".`);
  }
}

function removeFileIfPresent(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // ignore cleanup failures for temp artifacts
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  ensurePathExists(EXPORT_PRESETS_PATH, "Godot export presets");

  const godotBin = resolveGodotBin();
  if (!godotBin) {
    throw new Error("Godot CLI not found. Set GODOT_BIN to your Godot executable.");
  }

  const javaSdkPath = resolveJavaSdkPath();
  cleanupStaleGodotTempLibraries(PROJECT_PATH);
  ensureAndroidEditorSettings(javaSdkPath);

  const outputPath = path.resolve(process.cwd(), args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const env = buildSpawnEnv(javaSdkPath);
  const directSuccess = runDirectGodotExport({
    godotBin,
    env,
    presetName: args.preset,
    mode: args.mode,
    outputPath,
  });

  if (!directSuccess) {
    console.warn(
      `[android-export] direct Godot export failed for "${args.preset}". Falling back to Gradle assembly.`,
    );
    const tempPackPath = path.join(
      path.dirname(outputPath),
      `.${path.basename(outputPath).replace(/\.[^.]+$/, "")}.android-export.pck`,
    );

    try {
      runGodotPackExport({
        godotBin,
        env,
        presetName: args.preset,
        packPath: tempPackPath,
      });
      runGradleFallback({
        javaSdkPath,
        presetName: args.preset,
        outputPath,
        mode: args.mode,
        packPath: tempPackPath,
      });
    } finally {
      removeFileIfPresent(tempPackPath);
    }
  }

  if (!verifyArtifact(outputPath)) {
    throw new Error(`Expected artifact not found or empty: ${outputPath}`);
  }

  console.log(`[android-export] ${args.mode} preset "${args.preset}" -> ${outputPath}`);
}

try {
  main();
} catch (error) {
    console.error(`[android-export] FAIL: ${error.message}`);
    process.exitCode = 1;
}
