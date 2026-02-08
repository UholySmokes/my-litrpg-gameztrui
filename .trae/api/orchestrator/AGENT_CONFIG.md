# Agent Configuration Summary

## Overview

This document lists all the AI agents configured in the Voidverse game engine and their current deployment status.

## Agent Status

| Agent Name | Agent Type | Foundry ID | Status | Environment Variable |
|------------|------------|------------|--------|---------------------|
| NarratorAgent | narrator | `asst_U6Q1h9AOmHJohkxxHsIHPfCu` | ✅ Deployed | `NARRATOR_AGENT_ID` |
| QuestGiver | quest | `asst_WRpD1WfUjPaDtJnlx0RuKwaZ` | ✅ Deployed | `QUEST_AGENT_ID` |
| CombatAgent | combat | *Not deployed* | ⏳ Pending | `COMBAT_AGENT_ID` |
| DialogueAgent | dialogue | *Not deployed* | ⏳ Pending | `DIALOGUE_AGENT_ID` |
| WorldAgent | world | *Not deployed* | ⏳ Pending | `WORLD_AGENT_ID` |
| SystemAgent | system | *Not deployed* | ⏳ Pending | `SYSTEM_AGENT_ID` |
| ContentSmith | content_smith | `asst_YEfPvaWStWPtQPxr9SPPVbLO` | ✅ Deployed | `CONTENT_SMITH_AGENT_ID` |

## Current Configuration

### Deployed Agents (Ready to Use)

1. **NarratorAgent** (`asst_U6Q1h9AOmHJohkxxHsIHPfCu`)
   - Purpose: Generates narrative content and story scenes
   - Model: gpt-4.1
   - Temperature: 1.0
   - File: `.foundry/agents/NarratorAgent.agent.yaml`

2. **QuestGiver** (`asst_WRpD1WfUjPaDtJnlx0RuKwaZ`)
   - Purpose: Creates quests with objectives and rewards
   - Model: gpt-4.1
   - Temperature: 0.2
   - File: `.foundry/agents/QuestGiver.agent.yaml`

3. **ContentSmith** (`asst_YEfPvaWStWPtQPxr9SPPVbLO`)
   - Purpose: Generates bulk content drafts (items, NPCs, locations, etc.)
   - Model: gpt-4.1
   - Temperature: 0.3
   - File: `.foundry/agents/ContentSmith.agent.yaml`

### Pending Agents (Need Deployment)

4. **CombatAgent**
   - Purpose: Handles combat scenarios and turn resolution
   - Model: gpt-4.1
   - Temperature: 0.7
   - File: `.foundry/agents/CombatAgent.agent.yaml`
   - **Action Required**: Deploy in Foundry to get ID

5. **DialogueAgent**
   - Purpose: Manages NPC conversations and dialogue generation
   - Model: gpt-4.1
   - Temperature: 0.8
   - File: `.foundry/agents/DialogueAgent.agent.yaml`
   - **Action Required**: Deploy in Foundry to get ID

6. **WorldAgent**
   - Purpose: Generates world events and lore
   - Model: gpt-4.1
   - Temperature: 0.7
   - File: `.foundry/agents/WorldAgent.agent.yaml`
   - **Action Required**: Deploy in Foundry to get ID

7. **SystemAgent**
   - Purpose: Performs system-level operations and analysis
   - Model: gpt-4.1
   - Temperature: 0.3
   - File: `.foundry/agents/SystemAgent.agent.yaml`
   - **Action Required**: Deploy in Foundry to get ID

## Environment Variables

The following environment variables are configured in `api/local.settings.json`:

```json
{
  "NARRATOR_AGENT_ID": "asst_U6Q1h9AOmHJohkxxHsIHPfCu",
  "QUEST_AGENT_ID": "asst_WRpD1WfUjPaDtJnlx0RuKwaZ",
  "COMBAT_AGENT_ID": "",
  "DIALOGUE_AGENT_ID": "",
  "WORLD_AGENT_ID": "",
  "SYSTEM_AGENT_ID": "",
  "CONTENT_SMITH_AGENT_ID": "asst_YEfPvaWStWPtQPxr9SPPVbLO",
  "FACTORY_AGENT_ID": "asst_YEfPvaWStWPtQPxr9SPPVbLO"
}
```

## Deployment Instructions

To deploy the pending agents:

1. Open the agent YAML file in the Foundry VS Code extension
2. Click "Deploy" to deploy the agent to your Foundry project
3. Copy the generated assistant ID from the deployed agent
4. Update the corresponding environment variable in `api/local.settings.json`
5. Restart the Azure Functions runtime

### Example: Deploying CombatAgent

1. Open `.foundry/agents/CombatAgent.agent.yaml`
2. Deploy the agent in Foundry
3. Get the ID (e.g., `asst_abc123...`)
4. Update `api/local.settings.json`:
   ```json
   "COMBAT_AGENT_ID": "asst_abc123..."
   ```
5. Restart: `cd api && func start`

## Orchestrator Integration

All agents are integrated with the AI Orchestrator at `/api/orchestrator`. The orchestrator can:

- Execute single tasks with any agent
- Run workflows with multiple agents
- Handle task dependencies
- Manage priority queues
- Retry failed tasks automatically

### Usage Examples

#### Use NarratorAgent
```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "single",
    "type": "narrator",
    "input": {
      "prompt": "Describe the ancient temple"
    }
  }'
```

#### Use QuestGiver
```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type": "application/json" \
  -d '{
    "operation": "single",
    "type": "quest",
    "input": {
      "type": "side",
      "difficulty": "medium",
      "objectives": ["Find the lost key"]
    }
  }'
```

#### Use ContentSmith
```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type": "application/json" \
  -d '{
    "operation": "single",
    "type": "content_smith",
    "input": {
      "kind": "items",
      "quantity": 5,
      "context": {
        "location": "Ancient Ruins",
        "level": 10
      }
    }
  }'
```

## Testing

Test the deployed agents using the examples in `api/orchestrator/examples.js`:

```javascript
const {
  exampleGenerateNarrative,
  exampleCreateQuest,
  exampleContentSmithItems
} = require('./api/orchestrator/examples');

// Test each agent
await exampleGenerateNarrative();
await exampleCreateQuest();
await exampleContentSmithItems();
```

## Notes

- The `FACTORY_AGENT_ID` is aliased to `CONTENT_SMITH_AGENT_ID` as they refer to the same agent
- All agents use the gpt-4.1 model
- Temperature settings vary by agent type (creative agents use higher temps, structured agents use lower temps)
- Agent IDs are unique to your Foundry project and should not be shared

## Next Steps

1. Deploy the pending agents (CombatAgent, DialogueAgent, WorldAgent, SystemAgent)
2. Update the environment variables with the new IDs
3. Test all agents through the orchestrator
4. Monitor agent performance and adjust temperature/settings as needed
5. Add custom tools or file search to agents as needed

## Support

For issues with agent deployment or configuration:
- Check the Foundry VS Code extension logs
- Verify the agent YAML syntax
- Ensure the Foundry project endpoint and API key are correct
- Review the agent instructions for any issues
