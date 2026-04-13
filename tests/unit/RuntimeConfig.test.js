import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "@jest/globals";

const execFileAsync = promisify(execFile);
const runtimeConfigPath = path.resolve(process.cwd(), "public", "runtime-config.js");
const generateRuntimeConfigScript = path.resolve(
  process.cwd(),
  "scripts",
  "generate-runtime-config.js",
);

async function loadRuntimeConfig(hostname) {
  const script = await fs.readFile(runtimeConfigPath, "utf8");
  const runtime = {
    location: { hostname },
  };
  runtime.globalThis = runtime;
  vm.runInNewContext(script, runtime);
  return runtime.__RUNTIME_CONFIG__;
}

describe("runtime config", () => {
  it("keeps void-verse on same-origin primary routes without a baked-in external fallback", async () => {
    const config = await loadRuntimeConfig("void-verse.com");

    expect(config.VITE_API_BASE_URL).toBe("/");
    expect(config.VITE_NARRATE_ENDPOINT).toBe("/api/narrate");
    expect(config.VITE_ALLOW_EXTERNAL_API_BASE_URL).toBeUndefined();
    expect(config.VITE_API_FALLBACK_BASE_URL).toBeUndefined();
  });

  it("ignores absolute primary env overrides while allowing an explicit fallback base", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "runtime-config-test-"));

    try {
      await fs.mkdir(path.join(tempDir, "public"), { recursive: true });
      await fs.copyFile(
        runtimeConfigPath,
        path.join(tempDir, "public", "runtime-config.js"),
      );

      await execFileAsync(process.execPath, [generateRuntimeConfigScript], {
        cwd: tempDir,
        env: {
          ...process.env,
          VITE_API_BASE_URL: "https://bad.example.com",
          VITE_NARRATE_ENDPOINT: "https://bad.example.com/api/narrate",
          VITE_API_FALLBACK_BASE_URL:
            "https://my-litrpg-gameztrui-3416-da75c.web.app",
        },
      });

      const distConfig = await fs.readFile(
        path.join(tempDir, "dist", "runtime-config.js"),
        "utf8",
      );

      expect(distConfig).toContain('VITE_API_BASE_URL = "/"');
      expect(distConfig).toContain('VITE_NARRATE_ENDPOINT = "/api/narrate"');
      expect(distConfig).toContain(
        'VITE_API_FALLBACK_BASE_URL = "https://my-litrpg-gameztrui-3416-da75c.web.app"',
      );
      expect(distConfig).not.toContain("bad.example.com");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
