import { execFileSync } from "node:child_process";

const BANNED_PATH_RULES = [
  { label: "coverage output", test: (path) => path.startsWith("coverage/") },
  { label: "Visual Studio workspace state", test: (path) => path.startsWith(".vs/") },
  { label: "JetBrains run configs", test: (path) => path.startsWith(".run/") },
  {
    label: "local Data Connect state",
    test: (path) => path.startsWith("dataconnect/.dataconnect/"),
  },
  {
    label: "Firebase export snapshots",
    test: (path) => /^firebase-export-[^/]+\//.test(path),
  },
  { label: "temporary Godot docs", test: (path) => path.startsWith("tmp/godot-docs/") },
  {
    label: "developer-local Android properties",
    test: (path) => path === "godot/android/build/local.properties",
  },
  {
    label: "generated nested Android build output",
    test: (path) => /^godot\/android\/build\/.+\/build\//.test(path),
  },
];

function getTrackedFiles() {
  const raw = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return raw
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const trackedFiles = getTrackedFiles();
const violations = trackedFiles
  .map((path) => ({
    path,
    rule: BANNED_PATH_RULES.find((entry) => entry.test(path)) || null,
  }))
  .filter((entry) => entry.rule);

if (violations.length > 0) {
  console.error("[repo-hygiene] FAIL tracked files matched banned patterns");
  for (const violation of violations.slice(0, 50)) {
    console.error(`- ${violation.path} (${violation.rule.label})`);
  }
  if (violations.length > 50) {
    console.error(`- ... ${violations.length - 50} more`);
  }
  process.exit(1);
}

console.log("[repo-hygiene] PASS");
