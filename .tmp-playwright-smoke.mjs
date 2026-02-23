import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

function spawnNpm(commandLine) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
      stdio: 'ignore',
      env: process.env,
    });
  }
  return spawn(commandLine, { shell: true, stdio: 'ignore', env: process.env });
}

async function waitForUrl(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

const result = {
  startedAt: new Date().toISOString(),
  webReady: false,
  apiReady: false,
  healthStatus: null,
  narrateStatus: null,
  narrateBody: null,
  consoleErrors: [],
  pageErrors: [],
  success: false,
};

const api = spawnNpm('npm run dev:api');
const web = spawnNpm('npm run dev -- --host 127.0.0.1 --port 5173 --strictPort');

const cleanup = async () => {
  for (const proc of [web, api]) {
    try { proc.kill('SIGTERM'); } catch {}
  }
  await sleep(1200);
};

try {
  result.webReady = await waitForUrl('http://127.0.0.1:5173/', 150000);
  result.apiReady = await waitForUrl('http://127.0.0.1:5000/api/health', 150000);

  if (!result.webReady || !result.apiReady) {
    throw new Error(`Stack readiness failed (webReady=${result.webReady}, apiReady=${result.apiReady})`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') result.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    result.pageErrors.push(String(err?.message || err));
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 120000 });

  const checks = await page.evaluate(async () => {
    const health = await fetch('/api/health').then(async (r) => ({ status: r.status, body: await r.text() }));
    const narrate = await fetch('/api/narrate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-dev-user-id': 'pw-local-dev',
        'x-dev-user-email': 'pw-local-dev@example.com',
      },
      body: JSON.stringify({ prompt: 'Playwright smoke narration', mode: 'exploration' }),
    }).then(async (r) => ({ status: r.status, body: await r.text() }));
    return { health, narrate };
  });

  result.healthStatus = checks.health.status;
  result.narrateStatus = checks.narrate.status;
  result.narrateBody = checks.narrate.body;

  await browser.close();
  result.success = checks.health.status === 200 && checks.narrate.status === 200;
} catch (error) {
  result.error = String(error?.message || error);
} finally {
  await cleanup();
  result.finishedAt = new Date().toISOString();
  await fs.writeFile('.tmp-playwright-result.json', JSON.stringify(result, null, 2));
}
