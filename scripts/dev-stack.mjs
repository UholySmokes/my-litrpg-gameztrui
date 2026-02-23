import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  child.__name = name;
  children.push(child);
  return child;
}

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill(signal);
      } catch {
        // Best-effort shutdown.
      }
    }
  }
}

function onChildExit(child, code, signal) {
  if (shuttingDown) return;
  const reason = typeof code === "number" ? `code ${code}` : `signal ${signal}`;
  console.error(`[dev-stack] ${child.__name} exited with ${reason}. Stopping others.`);
  stopAll();
  process.exit(typeof code === "number" ? code : 1);
}

const api = start("api", "npm", ["run", "dev:api"]);
const web = start("web", "npm", ["run", "dev"]);

api.on("exit", (code, signal) => onChildExit(api, code, signal));
web.on("exit", (code, signal) => onChildExit(web, code, signal));

process.on("SIGINT", () => {
  stopAll("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll("SIGTERM");
  process.exit(0);
});
