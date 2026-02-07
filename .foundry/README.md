# Azure AI Foundry Assets

This folder stores Azure AI Foundry agent definitions checked into the repo so they are not lost in VS Code temp export directories.

## Agents

Agent YAML exports live in `.foundry/agents/`:

- `.foundry/agents/NarratorAgent.agent.yaml` (maps to `NARRATOR_AGENT_ID`)
- `.foundry/agents/QuestGiver.agent.yaml` (maps to `QUEST_AGENT_ID`)
- `.foundry/agents/ContentSmith.agent.yaml` (maps to `FACTORY_AGENT_ID`)

The backend calls Foundry's Threads/Messages/Runs APIs and references the agent IDs via environment variables (see `api/local.settings.example.json`).

## Workflow

- Edit the YAML files here.
- Deploy/update the agents using the Azure AI Foundry VS Code extension or your preferred deployment workflow.
- Keep secrets out of this repo. Put API keys in `api/local.settings.json` (gitignored) or your host environment variables.

