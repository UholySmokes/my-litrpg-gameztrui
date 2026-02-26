import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_PATH = path.resolve(process.cwd(), "godot");
const EXPORT_PRESETS_PATH = path.join(PROJECT_PATH, "export_presets.cfg");

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

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(EXPORT_PRESETS_PATH)) {
    throw new Error("Missing godot/export_presets.cfg. Android export preset is required.");
  }

  const godotBin = resolveGodotBin();
  if (!godotBin) {
    throw new Error("Godot CLI not found. Set GODOT_BIN to your Godot executable.");
  }

  const outputPath = path.resolve(process.cwd(), args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const exportFlag = args.mode === "debug" ? "--export-debug" : "--export-release";
  const run = spawnSync(
    godotBin,
    ["--headless", "--path", PROJECT_PATH, exportFlag, args.preset, outputPath],
    {
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`Godot export failed for preset "${args.preset}".`);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Expected artifact not found: ${outputPath}`);
  }

  const stats = fs.statSync(outputPath);
  if (!stats.isFile() || stats.size === 0) {
    throw new Error(`Export artifact is empty: ${outputPath}`);
  }

  console.log(`[android-export] ${args.mode} preset "${args.preset}" -> ${outputPath}`);
}

try {
  main();
} catch (error) {
  console.error(`[android-export] FAIL: ${error.message}`);
  process.exitCode = 1;
}
