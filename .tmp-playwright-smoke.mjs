import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

function startStack() {
  return spawn('npm', ['run', 'dev:stack'], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
}

async function waitForUrl(url, timeoutMs = 90000) {
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

const stack = startStack();
let logBuffer = '';
stack.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  logBuffer += text;
  process.stdout.write(text);
});
stack.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  logBuffer += text;
  process.stderr.write(text);
});

try {
  const ready = await waitForUrl('http://127.0.0.1:5173/', 120000);
  if (!ready) {
    throw new Error('Dev stack did not become ready on http://127.0.0.1:5173');
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err));
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 90000 });

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

  if (checks.health.status !== 200) {
    throw new Error(`health failed: ${checks.health.status}`);
  }
  if (checks.narrate.status !== 200) {
    throw new Error(`narrate failed: ${checks.narrate.status}`);
  }
} finally {
  try {
    stack.kill('SIGTERM');
  } catch {}
  await sleep(1000);
}
