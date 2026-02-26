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

function commandExists(cmd) {
  const result =
    process.platform === "win32"
      ? spawnSync("where", [cmd], { stdio: "ignore" })
      : spawnSync("which", [cmd], { stdio: "ignore" });
  return result.status === 0;
}

function resolveGodotBin() {
  const explicit = String(process.env.GODOT_BIN || "").trim();
  if (explicit && isExecutable(explicit)) return explicit;
  if (commandExists("godot4")) return "godot4";
  if (commandExists("godot")) return "godot";
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

