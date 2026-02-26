import { spawnSync } from "node:child_process";
import process from "node:process";

const profile = String(process.argv[2] || "tooling").trim().toLowerCase();
const validProfiles = new Set(["tooling", "pwa"]);

if (!validProfiles.has(profile)) {
  console.error(`Unknown build profile "${profile}". Use "tooling" or "pwa".`);
  process.exitCode = 1;
} else {
  const env = { ...process.env };

  if (profile === "pwa") {
    env.VITE_WEB_GAMEPLAY_ENABLED = "true";
  } else {
    delete env.VITE_WEB_GAMEPLAY_ENABLED;
    delete env.VITE_ENABLE_WEB_GAMEPLAY;
  }

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCmd, ["run", "build"], {
    stdio: "inherit",
    env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exitCode = 1;
  } else {
    process.exitCode = Number.isInteger(result.status) ? result.status : 1;
  }
}

