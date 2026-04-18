const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GENERATED_DIR = path.join(ROOT, 'docs/lore/generated');
const DATA_DIR = path.join(ROOT, 'src/data/lore');

function ensureDirs() {
  if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function triggerHermes(skill, params = '') {
  console.log(`Triggering Hermes: load skill: ${skill}; ${params}`);
  const cmd = `wsl.exe hermes "load skill: ${skill}; generate ${params}"`;
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
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const targetFile = path.join(DATA_DIR, path.basename(filePath));
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2));
    console.log(`Copied to ${targetFile}`);
  } catch (error) {
    console.error('Process error:', error.message);
  }
}

function watchGenerated() {
  ensureDirs();
  console.log('Watching docs/lore/generated/ for new .json files...');
  fs.watch(GENERATED_DIR, { recursive: true }, (event, filename) => {
    if (event === 'rename' && filename && filename.endsWith('.json')) {
      const fullPath = path.join(GENERATED_DIR, filename);
      if (fs.existsSync(fullPath)) {
        processGeneratedFile(fullPath);
      }
    }
  });
}

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watchGenerated();
} else if (args[0] === '--generate') {
  const skill = args[1] || 'lore-faction-generator';
  const params = args.slice(2).join(' ') || '';
  triggerHermes(skill, params);
} else {
  console.log('Usage: node scripts/hermes-integration.js [--generate <skill> <params> | --watch]');
  console.log('Example: node scripts/hermes-integration.js --generate lore-faction-generator faction --name "Shadow Guild"');
}

