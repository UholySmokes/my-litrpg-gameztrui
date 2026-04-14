import { printSection, printStatus } from "./lib/ai-workspace.mjs";
import {
  detectHermesInWsl,
  detectHermesOnHost,
  getHermesWslReport,
  installHermesInWsl,
  installHermesOnHost,
  normalizeShellText,
} from "./lib/hermes-workspace.mjs";

function firstLine(value) {
  return normalizeShellText(value).split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function exitWithFailure(message, detail) {
  printStatus("WARN", message, detail);
  process.exitCode = 1;
}

printSection("Hermes setup");

if (process.platform === "win32") {
  const report = getHermesWslReport();

  if (report.candidateDistros.length === 0) {
    exitWithFailure("WSL distro", "No non-docker WSL2 distro found. Install Ubuntu, then rerun `npm run hermes:setup`.");
  } else if (!report.healthyDistro) {
    const firstFailure = report.probes[0];
    exitWithFailure(
      "WSL distro",
      firstFailure?.probeStderr ||
        "A Linux distro is installed, but bash could not start. Repair the distro user/session and rerun `npm run hermes:doctor`.",
    );
  } else {
    const distroName = report.healthyDistro.name;
    const existing = detectHermesInWsl(distroName);

    if (existing.status === 0) {
      printStatus("SKIP", "Hermes install", `${distroName} already has ${firstLine(existing.stdout) || "hermes"}`);
      printStatus("INFO", "Configure provider", `wsl -d ${distroName} -- bash -lc "hermes model"`);
    } else {
      printStatus("INFO", "Target distro", distroName);
      const install = installHermesInWsl(distroName);
      if (install.status !== 0) {
        exitWithFailure(
          "Hermes install",
          firstLine(install.stderr) || firstLine(install.stdout) || "installer failed",
        );
      } else {
        printStatus("OK", "Hermes install", firstLine(install.stdout) || "installed");
        printStatus("INFO", "Configure provider", `wsl -d ${distroName} -- bash -lc "hermes model"`);
      }
    }
  }
} else {
  const existing = detectHermesOnHost();
  if (existing.available && existing.versionResult?.status === 0) {
    printStatus("SKIP", "Hermes install", firstLine(existing.versionResult.stdout) || existing.path);
    printStatus("INFO", "Configure provider", "hermes model");
  } else {
    const install = installHermesOnHost();
    if (install.status !== 0) {
      exitWithFailure(
        "Hermes install",
        firstLine(install.stderr) || firstLine(install.stdout) || "installer failed",
      );
    } else {
      printStatus("OK", "Hermes install", firstLine(install.stdout) || "installed");
      printStatus("INFO", "Configure provider", "hermes model");
    }
  }
}
