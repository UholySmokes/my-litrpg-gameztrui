# Azure AI Foundry Assets

This folder stores Azure AI Foundry agent definitions checked into the repo so they are not lost in VS Code temp export directories.

## Agents

Agent YAML exports live in `.foundry/agents/`:

### Core Agents (Deployed)
- `.foundry/agents/NarratorAgent.agent.yaml` (maps to `NARRATOR_AGENT_ID`)
  - Narrates scenes, actions, combat outcomes, and world reactions
  - Immersive, vivid storytelling in second-person perspective

- `.foundry/agents/QuestGiver.agent.yaml` (maps to `QUEST_AGENT_ID`)
  - Creates quests based on game state and player requests
  - Returns structured JSON quest definitions

- `.foundry/agents/ContentSmith.agent.yaml` (maps to `FACTORY_AGENT_ID`)
  - Generates bulk content drafts (items, titles, NPCs, locations, recipes, encounters)
  - Returns structured JSON content lists

### Orchestrator Agents (Ready for Deployment)
- `.foundry/agents/CombatAgent.agent.yaml` (maps to `COMBAT_AGENT_ID`)
  - Provides tactical descriptions and combat flow narratives
  - Analyzes enemy behaviors and battlefield dynamics

- `.foundry/agents/DialogueAgent.agent.yaml` (maps to `DIALOGUE_AGENT_ID`)
  - Generates NPC dialogue and character interactions
  - Creates contextual conversations with character-appropriate voices

- `.foundry/agents/WorldAgent.agent.yaml` (maps to `WORLD_AGENT_ID`)
  - Generates world descriptions and environmental narratives
  - Creates immersive location details and atmospheric elements

- `.foundry/agents/SystemAgent.agent.yaml` (maps to `SYSTEM_AGENT_ID`)
  - Explains game systems, mechanics, and rules
  - Provides clear educational content about character progression and gameplay

The backend calls Foundry's Threads/Messages/Runs APIs and references the agent IDs via environment variables (see `api/local.settings.example.json`).

## Workflow

### Editing Agents
- Edit the YAML files in `.foundry/agents/` to modify agent behavior.
- Each agent's `instructions` field defines its role, constraints, and output style.
- Temperature settings control creativity: lower (0.2-0.3) for consistent/factual, higher (0.7-0.8) for creative/varied.

### Deploying Agents
1. **Using Azure AI Foundry VS Code Extension:**
   - Open the YAML file in VS Code
   - Use the extension to deploy/update the agent
   - The `id` field will be populated automatically after deployment
   - Copy the agent ID to your environment variables

2. **After Deployment:**
   - Add the agent ID to `api/local.settings.json` (local development):
     - `COMBAT_AGENT_ID`: CombatAgent ID
     - `DIALOGUE_AGENT_ID`: DialogueAgent ID
     - `WORLD_AGENT_ID`: WorldAgent ID
     - `SYSTEM_AGENT_ID`: SystemAgent ID
   - Add the same IDs to your production environment (Azure Function App settings)
   - Also ensure `ORCHESTRATOR_RATE_LIMIT_PER_MIN` is configured

### Security
- Keep secrets out of this repo
- Store API keys in `api/local.settings.json` (gitignored) or environment variables
- Use managed identity in production when possible

### Testing New Agents
Once deployed, test each agent by:
1. Verifying the agent responds to test inputs
2. Checking that outputs match the expected format and style
3. Ensuring agents respect their constraints (no mechanical changes, staying in role)


