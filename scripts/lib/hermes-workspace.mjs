import { commandInfo, runCommand } from "./ai-workspace.mjs";

const WSL_PROBE_TOKEN = "__HERMES_WSL_OK__";
const HERMES_INSTALLER_URL =
  "https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh";
const HERMES_INSTALL_COMMAND = `set -euo pipefail; curl -fsSL ${HERMES_INSTALLER_URL} | bash -s -- --skip-setup; source ~/.bashrc >/dev/null 2>&1 || true; source ~/.zshrc >/dev/null 2>&1 || true; hermes version`;
const HERMES_VERSION_COMMAND =
  "source ~/.bashrc >/dev/null 2>&1 || true; source ~/.zshrc >/dev/null 2>&1 || true; hermes version";

export function normalizeShellText(value) {
  return String(value || "").replace(/\u0000/g, "");
}

function parseWslDistroLine(rawLine) {
  const line = normalizeShellText(rawLine).trim();
  if (!line || /^name\s+state\s+version$/i.test(line)) return null;

  const isDefault = line.startsWith("*");
  const clean = line.replace(/^\*/, "").trim();
  const parts = clean.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) return null;

  return {
    name: parts.slice(0, -2).join(" "),
    state: parts.at(-2),
    version: parts.at(-1),
    isDefault,
  };
}

function rankDistro(distro) {
  const lowered = distro.name.toLowerCase();
  let score = 0;
  if (distro.isDefault) score += 100;
  if (lowered === "ubuntu") score += 50;
  if (lowered.startsWith("ubuntu")) score += 25;
  return score;
}

export function listWslDistros() {
  const result = runCommand("wsl", ["-l", "-v"]);
  const stdout = normalizeShellText(result.stdout);
  const distros = stdout
    .split(/\r?\n/)
    .map(parseWslDistroLine)
    .filter(Boolean);

  return {
    result,
    stdout,
    distros,
  };
}

export function probeWslDistro(name) {
  return runCommand("wsl", [
    "-d",
    name,
    "--",
    "bash",
    "-lc",
    `printf ${WSL_PROBE_TOKEN}`,
  ]);
}

export function detectHermesInWsl(name) {
  return runCommand("wsl", ["-d", name, "--", "bash", "-lc", HERMES_VERSION_COMMAND]);
}

export function installHermesInWsl(name) {
  return runCommand("wsl", ["-d", name, "--", "bash", "-lc", HERMES_INSTALL_COMMAND]);
}

export function detectHermesOnHost() {
  const info = commandInfo("hermes");
  if (!info.available) {
    return {
      available: false,
      path: null,
      versionResult: null,
    };
  }

  return {
    available: true,
    path: info.path,
    versionResult: runCommand("hermes", ["version"]),
  };
}

export function installHermesOnHost() {
  return runCommand("bash", ["-lc", HERMES_INSTALL_COMMAND]);
}

export function getHermesWslReport() {
  const statusResult = runCommand("wsl", ["--status"]);
  const statusText = normalizeShellText(
    [statusResult.stdout, statusResult.stderr].filter(Boolean).join("\n"),
  ).trim();

  const list = listWslDistros();
  const candidateDistros = list.distros
    .filter((distro) => !distro.name.toLowerCase().includes("docker-desktop"))
    .sort((left, right) => rankDistro(right) - rankDistro(left));

  const probes = candidateDistros.map((distro) => {
    const probe = probeWslDistro(distro.name);
    const output = normalizeShellText(probe.stdout);
    return {
      ...distro,
      probeStatus: probe.status,
      probeStdout: output,
      probeStderr: normalizeShellText(probe.stderr).trim(),
      healthy: probe.status === 0 && output.includes(WSL_PROBE_TOKEN),
    };
  });

  return {
    statusResult,
    statusText,
    listResult: list.result,
    distros: list.distros,
    candidateDistros,
    probes,
    healthyDistro: probes.find((probe) => probe.healthy) || null,
  };
}
