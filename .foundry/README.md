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

- Edit the YAML files here.
- Deploy/update the agents using the Azure AI Foundry VS Code extension or your preferred deployment workflow.
- Keep secrets out of this repo. Put API keys in `api/local.settings.json` (gitignored) or your host environment variables.

