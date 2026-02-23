import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

function spawnNpm(commandLine) {
  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', commandLine], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
  }
  return spawn(commandLine, { shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
}

async function fetchText(url, options) {
  try {
    const res = await fetch(url, options);
    return { ok: true, status: res.status, body: await res.text() };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

const result = {
  startedAt: new Date().toISOString(),
  checks: [],
  logs: '',
};

const proc = spawnNpm('npm run dev:api');
proc.stdout.on('data', (chunk) => { result.logs += chunk.toString(); });
proc.stderr.on('data', (chunk) => { result.logs += chunk.toString(); });

const cleanup = async () => {
  try { proc.kill('SIGTERM'); } catch {}
  await sleep(1000);
};

try {
  for (let i = 0; i < 8; i++) {
    await sleep(1500);
    result.checks.push({ kind: `health_attempt_${i+1}`, ...(await fetchText('http://127.0.0.1:5000/api/health')) });
  }

  result.checks.push({ kind: 'narrate_with_dev_headers', ...(await fetchText('http://127.0.0.1:5000/api/narrate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dev-user-id': 'debug-dev',
      'x-dev-user-email': 'debug-dev@example.com',
    },
    body: JSON.stringify({ prompt: 'debug run', mode: 'exploration' }),
  }))});

  result.checks.push({ kind: 'narrate_without_auth', ...(await fetchText('http://127.0.0.1:5000/api/narrate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'debug run', mode: 'exploration' }),
  }))});
} finally {
  await cleanup();
  result.finishedAt = new Date().toISOString();
  await fs.writeFile('.tmp-devapi-debug-result.json', JSON.stringify(result, null, 2));
}
