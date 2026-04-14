import {
  printSection,
  printStatus,
  commandInfo,
} from "./lib/ai-workspace.mjs";
import {
  detectHermesInWsl,
  detectHermesOnHost,
  getHermesWslReport,
  normalizeShellText,
} from "./lib/hermes-workspace.mjs";

function firstLine(value) {
  return normalizeShellText(value).split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

printSection("Hermes support");
if (process.platform === "win32") {
  printStatus("WARN", "native Windows", "Hermes Agent is supported through WSL2, not PowerShell-native installs");
} else {
  printStatus("OK", "host platform", process.platform);
}

if (process.platform === "win32") {
  const report = getHermesWslReport();

  printSection("WSL");
  printStatus(
    report.statusResult.status === 0 ? "OK" : "WARN",
    "wsl --status",
    firstLine(report.statusText) || "unable to query WSL",
  );

  if (report.distros.length === 0) {
    printStatus("WARN", "installed distros", "none");
  } else {
    printStatus(
      "INFO",
      "installed distros",
      report.distros
        .map((distro) =>
          `${distro.isDefault ? "*" : ""}${distro.name} (${distro.state}, v${distro.version})`,
        )
        .join(", "),
    );
  }

  if (report.candidateDistros.length === 0) {
    printStatus(
      "WARN",
      "usable Linux distro",
      "no non-docker WSL distro found; install Ubuntu or another dev distro first",
    );
  } else if (!report.healthyDistro) {
    const firstFailure = report.probes[0];
    printStatus(
      "WARN",
      "distro health",
      firstFailure?.probeStderr || "bash probe failed for all candidate distros",
    );
  } else {
    printStatus("OK", "healthy distro", report.healthyDistro.name);
    const hermes = detectHermesInWsl(report.healthyDistro.name);
    printStatus(
      hermes.status === 0 ? "OK" : "WARN",
      "hermes in WSL",
      hermes.status === 0
        ? firstLine(hermes.stdout) || "installed"
        : firstLine(hermes.stderr) || "not installed",
    );
  }
} else {
  printSection("Host tools");
  for (const command of ["bash", "curl", "git"]) {
    const info = commandInfo(command);
    printStatus(info.available ? "OK" : "WARN", command, info.path || "not found");
  }

  const hermes = detectHermesOnHost();
  printStatus(
    hermes.available && hermes.versionResult?.status === 0 ? "OK" : "WARN",
    "hermes",
    hermes.available
      ? firstLine(hermes.versionResult?.stdout || hermes.versionResult?.stderr) || hermes.path
      : "not installed",
  );
}

printSection("Next step");
printStatus("INFO", "setup command", "npm run hermes:setup");
