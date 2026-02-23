import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

function spawnNpm(commandLine) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
      stdio: 'inherit',
      env: process.env,
    });
  }
  return spawn(commandLine, { shell: true, stdio: 'inherit', env: process.env });
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

const api = spawnNpm('npm run dev:api');
const web = spawnNpm('npm run dev -- --host 127.0.0.1 --port 5173 --strictPort');

let apiExited = false;
let webExited = false;
api.on('exit', () => { apiExited = true; });
web.on('exit', () => { webExited = true; });

const cleanup = async () => {
  for (const proc of [web, api]) {
    try { proc.kill('SIGTERM'); } catch {}
  }
  await sleep(1500);
};

try {
  const webReady = await waitForUrl('http://127.0.0.1:5173/', 150000);
  const apiReady = await waitForUrl('http://127.0.0.1:5000/api/health', 150000);
  if (apiExited || webExited) {
    throw new Error(`A dev process exited early (apiExited=${apiExited}, webExited=${webExited}).`);
  }
  if (!webReady || !apiReady) {
    throw new Error(`Stack readiness failed (webReady=${webReady}, apiReady=${apiReady}).`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err));
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 120000 });
  await sleep(2000);

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

  await browser.close();

  console.log('PW_CHECK_HEALTH_STATUS', checks.health.status);
  console.log('PW_CHECK_NARRATE_STATUS', checks.narrate.status);
  console.log('PW_CHECK_NARRATE_BODY', checks.narrate.body);
  console.log('PW_CONSOLE_ERRORS', JSON.stringify(consoleErrors));
  console.log('PW_PAGE_ERRORS', JSON.stringify(pageErrors));

  if (checks.health.status !== 200) throw new Error(`health failed ${checks.health.status}`);
  if (checks.narrate.status !== 200) throw new Error(`narrate failed ${checks.narrate.status}`);
} finally {
  await cleanup();
}
