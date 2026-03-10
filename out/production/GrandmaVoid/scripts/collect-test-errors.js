import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_OUTPUT_FILE = "errors.json";

const DEFAULT_IGNORED_DIRS = new Set([
  ".git",
  ".vercel",
  ".vscode",
  ".windsurf",
  ".cursor",
  ".trae",
  "dist",
  "build",
  "coverage",
  "node_modules",
]);

function printHelp() {
  console.log(
    [
      "Collect test errors across project folders and write a JSON report.",
      "",
      "Usage:",
      "  node scripts/collect-test-errors.js [--output <file>] [--root <dir>]",
      "",
      "Options:",
      `  --output, -o   Output file path (default: ${DEFAULT_OUTPUT_FILE})`,
      "  --root         Root directory to scan (default: cwd)",
      "  --help, -h     Show help",
      "",
      "Exit code matches overall test status (0 = all passed, 1 = any failures).",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const parsed = { output: DEFAULT_OUTPUT_FILE, root: process.cwd() };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      const value = argv[index + 1];
      if (!value) throw new Error("Missing value for --output");
      parsed.output = value;
      index += 1;
      continue;
    }
    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("Missing value for --root");
      parsed.root = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function safeRelative(fromDir, toPath) {
  try {
    const rel = path.relative(fromDir, toPath);
    return rel.startsWith("..") ? toPosixPath(toPath) : toPosixPath(rel);
  } catch {
    return toPosixPath(toPath);
  }
}

function splitMessageAndStack(text) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { message: "", stack: "" };

  const lines = trimmed.split(/\r?\n/);
  const stackStartIndex = lines.findIndex((line) => line.trimStart().startsWith("at "));
  if (stackStartIndex === -1) return { message: trimmed, stack: trimmed };

  const message = lines.slice(0, stackStartIndex).join("\n").trim();
  const stack = lines.slice(stackStartIndex).join("\n").trim();
  return { message: message || trimmed, stack: stack || trimmed };
}

function isLikelyJestScript(testScript) {
  if (!testScript) return false;
  return /\bjest\b/i.test(testScript) || /jest[\\/]/i.test(testScript);
}

async function findTestPackages(rootDir) {
  const packages = [];
  const visited = new Set();

  async function walk(currentDir) {
    let realDir = currentDir;
    try {
      realDir = await fs.realpath(currentDir);
    } catch {
      // ignore realpath failures; proceed with currentDir
    }
    if (visited.has(realDir)) return;
    visited.add(realDir);

    const base = path.basename(currentDir);
    if (DEFAULT_IGNORED_DIRS.has(base)) return;

    const packageJsonPath = path.join(currentDir, "package.json");
    if (await pathExists(packageJsonPath)) {
      try {
        const packageJson = await readJsonFile(packageJsonPath);
        if (packageJson?.scripts?.test) {
          packages.push({
            dir: currentDir,
            packageJsonPath,
            packageJson,
          });
        }
      } catch {
        // Ignore broken package.json files; treat them as non-test packages.
      }
    }

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => walk(path.join(currentDir, entry.name))),
    );
  }

  await walk(rootDir);
  packages.sort((a, b) => a.dir.localeCompare(b.dir));
  return packages;
}

function npmCommand() {
  return "npm";
}

async function spawnAndCapture(command, args, options) {
  return await new Promise((resolve) => {
    const startTime = Date.now();
    let child;
    try {
      const isWindows = process.platform === "win32";
      const spawnCommand = isWindows ? (process.env.COMSPEC ?? "cmd.exe") : command;
      const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;

      child = spawn(spawnCommand, spawnArgs, {
        ...options,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (err) {
      resolve({
        code: 1,
        signal: null,
        stdout: "",
        stderr: String(err?.stack ?? err),
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (code, signal) => {
      resolve({
        code: code ?? 0,
        signal: signal ?? null,
        stdout,
        stderr,
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
    });

    child.on("error", (err) => {
      resolve({
        code: 1,
        signal: null,
        stdout,
        stderr: [stderr, String(err?.stack ?? err)].filter(Boolean).join("\n"),
        startedAt: new Date(startTime).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
    });
  });
}

async function getNpmVersion() {
  try {
    const result = await spawnAndCapture(npmCommand(), ["-v"], { cwd: process.cwd() });
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function getInstalledJestVersion(packageDir) {
  const jestPkg = path.join(packageDir, "node_modules", "jest", "package.json");
  if (!(await pathExists(jestPkg))) return null;
  try {
    const pkg = await readJsonFile(jestPkg);
    return pkg?.version ?? null;
  } catch {
    return null;
  }
}

function newErrorId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : crypto.createHash("sha256").update(String(Date.now()) + Math.random()).digest("hex");
}

function buildEnvironmentDetails(rootDir, npmVersion) {
  return {
    rootDir: toPosixPath(path.resolve(rootDir)),
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    os: {
      type: os.type(),
      release: os.release(),
      hostname: os.hostname(),
    },
    npm: {
      version: npmVersion,
    },
    ci: {
      value: process.env.CI ?? null,
    },
  };
}

function errorFromRunnerFailure({ rootDir, packageDirRel, runner, output, context }) {
  const timestamp = new Date().toISOString();
  const combined = [output?.stdout?.trim(), output?.stderr?.trim()].filter(Boolean).join("\n\n");
  const { message, stack } = splitMessageAndStack(combined);

  return {
    id: newErrorId(),
    timestamp,
    severity: "critical",
    type: "runner",
    message: message || "Test runner failed",
    stack: stack || combined,
    testFile: { path: null, line: null, column: null },
    testCase: { name: null, description: null, fullName: null, ancestorTitles: [] },
    packageDir: packageDirRel,
    environment: context.environment,
    runner,
    rootDir: toPosixPath(path.resolve(rootDir)),
  };
}

function warningFromMissingNodeModules({ rootDir, packageDirRel, runner, context }) {
  const timestamp = new Date().toISOString();

  return {
    id: newErrorId(),
    timestamp,
    severity: "warning",
    type: "setup",
    message: "Skipping tests: node_modules not found",
    stack: null,
    testFile: { path: null, line: null, column: null },
    testCase: { name: null, description: null, fullName: null, ancestorTitles: [] },
    packageDir: packageDirRel,
    environment: context.environment,
    runner,
    rootDir: toPosixPath(path.resolve(rootDir)),
  };
}

function errorsFromJestJson({ rootDir, packageDirRel, runner, jestJson, context }) {
  const timestamp = new Date().toISOString();
  const errors = [];
  const testResults = Array.isArray(jestJson?.testResults) ? jestJson.testResults : [];

  for (const fileResult of testResults) {
    const testFilePath = fileResult?.name ? safeRelative(rootDir, fileResult.name) : null;
    const assertionResults = Array.isArray(fileResult?.assertionResults)
      ? fileResult.assertionResults
      : [];

    const failingAssertions = assertionResults.filter((a) => a?.status === "failed");
    for (const assertion of failingAssertions) {
      const failureText = Array.isArray(assertion?.failureMessages)
        ? assertion.failureMessages.join("\n\n").trim()
        : "";
      const { message, stack } = splitMessageAndStack(failureText);
      const location = assertion?.location ?? null;

      errors.push({
        id: newErrorId(),
        timestamp,
        severity: "error",
        type: "test",
        message: message || failureText || "Test failed",
        stack: stack || failureText,
        testFile: {
          path: testFilePath,
          line: location?.line ?? null,
          column: location?.column ?? null,
        },
        testCase: {
          name: assertion?.title ?? null,
          description: assertion?.fullName ?? null,
          fullName: assertion?.fullName ?? null,
          ancestorTitles: Array.isArray(assertion?.ancestorTitles) ? assertion.ancestorTitles : [],
        },
        packageDir: packageDirRel,
        environment: context.environment,
        runner,
        rootDir: toPosixPath(path.resolve(rootDir)),
      });
    }

    const hasOnlySuiteFailure = fileResult?.status === "failed" && failingAssertions.length === 0;
    if (hasOnlySuiteFailure) {
      const suiteText = (fileResult?.message ?? "").trim();
      const { message, stack } = splitMessageAndStack(suiteText);

      errors.push({
        id: newErrorId(),
        timestamp,
        severity: "error",
        type: "suite",
        message: message || suiteText || "Test suite failed",
        stack: stack || suiteText,
        testFile: { path: testFilePath, line: null, column: null },
        testCase: { name: null, description: null, fullName: null, ancestorTitles: [] },
        packageDir: packageDirRel,
        environment: context.environment,
        runner,
        rootDir: toPosixPath(path.resolve(rootDir)),
      });
    }
  }

  return errors;
}

async function runPackageTests({ rootDir, packageDir, packageJson, context }) {
  const packageDirRel = safeRelative(rootDir, packageDir);
  const testScript = packageJson?.scripts?.test ?? null;

  const runner = {
    name: isLikelyJestScript(testScript) ? "jest" : "unknown",
    version: null,
  };
  if (runner.name === "jest") {
    runner.version = await getInstalledJestVersion(packageDir);
  }

  const nodeModulesDir = path.join(packageDir, "node_modules");
  if (!(await pathExists(nodeModulesDir))) {
    return {
      packageDir: toPosixPath(packageDirRel),
      packageName: packageJson?.name ?? null,
      command: npmCommand(),
      args: ["test"],
      runner,
      timing: {
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: 0,
      },
      exitCode: null,
      status: "skipped",
      errors: [
        warningFromMissingNodeModules({
          rootDir,
          packageDirRel,
          runner,
          context,
        }),
      ],
    };
  }

  const tempOutputFile = path.join(
    os.tmpdir(),
    `test-errors-${crypto.randomUUID?.() ?? Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.json`,
  );

  const jestArgs = ["--json", "--outputFile", tempOutputFile, "--testLocationInResults"];
  const args =
    runner.name === "jest" ? ["test", "--", ...jestArgs] : ["test"];

  const output = await spawnAndCapture(npmCommand(), args, { cwd: packageDir });

  let jestJson = null;
  if (runner.name === "jest" && (await pathExists(tempOutputFile))) {
    try {
      jestJson = await readJsonFile(tempOutputFile);
    } catch {
      jestJson = null;
    }
  }
  if (await pathExists(tempOutputFile)) {
    try {
      await fs.unlink(tempOutputFile);
    } catch {
      // best-effort cleanup
    }
  }

  const errors =
    runner.name === "jest" && jestJson
      ? errorsFromJestJson({ rootDir, packageDirRel, runner, jestJson, context })
      : output.code === 0
        ? []
        : [
            errorFromRunnerFailure({
              rootDir,
              packageDirRel,
              runner,
              output,
              context,
            }),
          ];

  const status = output.code === 0 ? "passed" : errors.length ? "failed" : "error";

  return {
    packageDir: toPosixPath(packageDirRel),
    packageName: packageJson?.name ?? null,
    command: npmCommand(),
    args,
    runner,
    timing: {
      startedAt: output.startedAt,
      endedAt: output.endedAt,
      durationMs: output.durationMs,
    },
    exitCode: output.code,
    status,
    errors,
  };
}

function buildSummary(results) {
  const errors = results.flatMap((r) => r.errors);
  const byType = errors.reduce((acc, err) => {
    const key = err.type ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const packagesWithErrors = results.filter((r) => r.errors.length > 0).length;

  return {
    packages: results.length,
    packagesWithErrors,
    errors: errors.length,
    errorsByType: byType,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }

  const rootDir = path.resolve(args.root);
  const npmVersion = await getNpmVersion();
  const environment = buildEnvironmentDetails(rootDir, npmVersion);
  const context = { environment };

  const testPackages = await findTestPackages(rootDir);
  const results = [];
  for (const pkg of testPackages) {
    // Sequential on purpose to preserve existing runner behavior and output.
    const result = await runPackageTests({
      rootDir,
      packageDir: pkg.dir,
      packageJson: pkg.packageJson,
      context,
    });
    results.push(result);
  }

  const flattenedErrors = results.flatMap((r) => r.errors);
  const report = {
    schemaVersion: 1,
    runId: newErrorId(),
    generatedAt: new Date().toISOString(),
    environment,
    results,
    errors: flattenedErrors,
    summary: buildSummary(results),
  };

  const outputPath = path.resolve(rootDir, args.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  const hasFailures = results.some((r) => typeof r.exitCode === "number" && r.exitCode !== 0);
  return hasFailures ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
