import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const profile = String(process.argv[2] || "tooling").trim().toLowerCase();
const validProfiles = new Set(["tooling", "pwa"]);

if (!validProfiles.has(profile)) {
  console.error(`Unknown build profile "${profile}". Use "tooling" or "pwa".`);
  process.exitCode = 1;
} else {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) =>
        typeof key === "string" &&
        key.length > 0 &&
        !key.startsWith("=") &&
        typeof value === "string",
    ),
  );

  if (profile === "pwa") {
    env.VITE_WEB_GAMEPLAY_ENABLED = "true";
  } else {
    delete env.VITE_WEB_GAMEPLAY_ENABLED;
    delete env.VITE_ENABLE_WEB_GAMEPLAY;
  }

  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm run build"], {
          stdio: "inherit",
          env,
        })
      : spawnSync("npm", ["run", "build"], {
          stdio: "inherit",
          env,
        });

  if (result.error) {
    console.error(result.error.message);
    process.exitCode = 1;
  } else {
    if (result.status === 0 && profile === "tooling") {
      const distDir = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        const source = fs.readFileSync(indexPath, "utf8");
        const withoutManifest = source.replace(
          /\s*<link rel="manifest" href="\/manifest\.webmanifest"\s*\/?>/i,
          "",
        );
        fs.writeFileSync(indexPath, withoutManifest, "utf8");
      }
      for (const file of ["manifest.webmanifest", "sw.js"]) {
        const filePath = path.join(distDir, file);
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath);
        }
      }
      console.log("[build-profile] tooling profile removed installable PWA artifacts.");
    }
    process.exitCode = Number.isInteger(result.status) ? result.status : 1;
  }
}
