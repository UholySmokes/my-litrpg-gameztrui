const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // npm install chokidar

const ROOT = process.cwd();
const HERMES_CMD = 'wsl.exe';
const HERMES_ARGS = ['hermes'];
const GENERATED_DIR = path.join(ROOT, 'docs/lore/generated');
const DATA_DIR = path.join(ROOT, 'src/data/lore');

function ensureDirs() {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function triggerHermes(skill, params = '') {
  console.log(`Triggering Hermes: load skill: ${skill}; ${params}`);
  const cmd = `${HERMES_CMD} ${HERMES_ARGS.join(' ')} "load skill: ${skill}; generate ${params}"`;
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT });
    console.log('Hermes command executed.');
  } catch (error) {
    console.error('Hermes exec error:', error.message);
  }
}

function processGeneratedFile(filePath) {
  if (!filePath.includes('.json')) return;
  console.log(`Processing ${filePath}`);
