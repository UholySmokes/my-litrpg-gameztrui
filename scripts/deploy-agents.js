
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AGENTS_DIR = path.join(__dirname, '../.foundry/agents');
const SETTINGS_PATH = path.join(__dirname, '../api/local.settings.json');
const EXAMPLE_SETTINGS_PATH = path.join(__dirname, '../api/local.settings.example.json');

// Load settings from local.settings.json into process.env if available
if (fs.existsSync(SETTINGS_PATH)) {
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    if (settings.Values) {
      for (const [key, value] of Object.entries(settings.Values)) {
        if (!process.env[key] && value) {
          process.env[key] = value;
        }
      }
      console.log('Loaded settings from local.settings.json');
    }
  } catch (e) {
    console.warn('Failed to load local.settings.json:', e.message);
  }
}

// Helper functions
function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function getOptionalEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function normalizeEndpoint(endpoint) {
  return endpoint.replace(/\/+$/, "");
}

async function resolveAuth() {
  const apiKey = process.env.FOUNDRY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing environment variable: FOUNDRY_API_KEY");
  }
  return { apiKey };
}

async function fetchJson(url, options) {
  const { method, body, token, apiKey } = options;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (apiKey) headers['api-key'] = apiKey;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return response.json();
}

async function deployAgents() {
  console.log('Starting agent deployment...');

  // 1. Setup Auth and Endpoint
  const projectEndpoint = getRequiredEnv('FOUNDRY_PROJECT_ENDPOINT');
  const apiVersion = getOptionalEnv(
    'FOUNDRY_API_VERSION',
    getOptionalEnv('AZURE_AI_API_VERSION', '2025-05-01'),
  );
  const endpointBase = normalizeEndpoint(projectEndpoint);
  
  console.log(`Endpoint: ${endpointBase}`);
  
  const auth = await resolveAuth();
  console.log(`Using API Key: ${auth.apiKey.substring(0, 5)}...`);

  // 2. Read Agent Files
  if (!fs.existsSync(AGENTS_DIR)) {
    throw new Error(`Agents directory not found: ${AGENTS_DIR}`);
  }

  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.agent.yaml'));
  console.log(`Found ${files.length} agent definitions.`);

  const agentIds = {};

  // 3. Process each agent
  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const agentDef = yaml.load(content);

    console.log(`Deploying agent: ${agentDef.name} (${file})...`);

    // Prepare Assistant Payload
    const listUrl = `${endpointBase}/assistants?api-version=${apiVersion}&limit=100`;
    const listResponse = await fetchJson(listUrl, { method: 'GET', ...auth });
    
    // Check if listResponse.data exists, sometimes it might be just listResponse (array) or wrapped
    const assistants = Array.isArray(listResponse.data) ? listResponse.data : [];
    
    const existingAgent = assistants.find(a => a.name === agentDef.name);
    
    const payload = {
      model: agentDef.model.id,
      name: agentDef.name,
      description: agentDef.description,
      instructions: agentDef.instructions,
      temperature: agentDef.model.options?.temperature || 0.7,
      top_p: agentDef.model.options?.top_p || 1.0,
      metadata: agentDef.metadata || {},
    };

    let assistantId;
    if (existingAgent) {
      console.log(`  Updating existing assistant: ${existingAgent.id}`);
      const updateUrl = `${endpointBase}/assistants/${existingAgent.id}?api-version=${apiVersion}`;
      const response = await fetchJson(updateUrl, { method: 'POST', body: payload, ...auth });
      assistantId = response.id;
    } else {
      console.log(`  Creating new assistant...`);
      const createUrl = `${endpointBase}/assistants?api-version=${apiVersion}`;
      const response = await fetchJson(createUrl, { method: 'POST', body: payload, ...auth });
      assistantId = response.id;
    }

    console.log(`  Deployed with ID: ${assistantId}`);
    
    const envKey = `${agentDef.name.toUpperCase().replace(/AGENT$/, '')}_AGENT_ID`;
    agentIds[envKey] = assistantId;
    
    if (agentDef.name === 'CombatAgent') agentIds['COMBAT_AGENT_ID'] = assistantId;
    if (agentDef.name === 'NarratorAgent') agentIds['NARRATOR_AGENT_ID'] = assistantId;
    if (agentDef.name === 'QuestGiver') agentIds['QUEST_AGENT_ID'] = assistantId;
    if (agentDef.name === 'DialogueAgent') agentIds['DIALOGUE_AGENT_ID'] = assistantId;
    if (agentDef.name === 'WorldAgent') agentIds['WORLD_AGENT_ID'] = assistantId;
    if (agentDef.name === 'SystemAgent') agentIds['SYSTEM_AGENT_ID'] = assistantId;
    if (agentDef.name === 'ContentSmith') agentIds['CONTENT_SMITH_AGENT_ID'] = assistantId;
  }

  // 4. Update local.settings.json
  console.log('Updating local.settings.json...');
  
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {
      console.warn('Could not parse existing local.settings.json, starting fresh.');
    }
  } else if (fs.existsSync(EXAMPLE_SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(EXAMPLE_SETTINGS_PATH, 'utf8'));
    } catch (e) {
      console.warn('Could not parse local.settings.example.json.');
    }
  }

  if (!settings.Values) settings.Values = {};
  
  Object.assign(settings.Values, agentIds);

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  console.log(`Updated ${SETTINGS_PATH}`);
  
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  let envChanged = false;
  for (const [key, value] of Object.entries(agentIds)) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    envChanged = true;
  }
  
  if (envChanged) {
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`Updated ${envPath}`);
  }

  console.log('Deployment complete!');
}

deployAgents().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
