# AI Orchestrator - Quick Start Guide

## Setup Instructions

### 1. Configure Environment Variables

Create or update your `local.settings.json` file with the required agent IDs:

```json
{
  "Values": {
    "NARRATOR_AGENT_ID": "your-narrator-assistant-id",
    "QUEST_AGENT_ID": "your-quest-assistant-id",
    "COMBAT_AGENT_ID": "your-combat-assistant-id",
    "DIALOGUE_AGENT_ID": "your-dialogue-assistant-id",
    "WORLD_AGENT_ID": "your-world-assistant-id",
    "SYSTEM_AGENT_ID": "your-system-assistant-id",
    "ORCHESTRATOR_RATE_LIMIT_PER_MIN": "10"
  }
}
```

### 2. Start the Azure Functions Runtime

```bash
cd api
npm install
func start
```

The orchestrator will be available at: `http://localhost:7071/api/orchestrator`

## Quick Examples

### Generate a Narrative

```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "single",
    "type": "narrator",
    "input": {
      "prompt": "The hero enters the ancient temple",
      "context": {
        "location": "Temple of Shadows",
        "mood": "mysterious"
      }
    }
  }'
```

### Create a Quest

```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "single",
    "type": "quest",
    "input": {
      "type": "side",
      "difficulty": "medium",
      "objectives": ["Find the lost key", "Open the ancient door"],
      "rewards": {
        "gold": 500,
        "experience": 200
      }
    }
  }'
```

### Run a Workflow

```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "workflow",
    "workflow": {
      "tasks": [
        {
          "type": "narrator",
          "input": {
            "prompt": "Introduce the quest giver"
          },
          "priority": 0
        },
        {
          "type": "quest",
          "input": {
            "type": "main",
            "difficulty": "hard",
            "objectives": ["Defeat the dragon"]
          },
          "priority": 1
        }
      ]
    }
  }'
```

### Check Task Status

```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "status",
    "taskId": "task_abc123"
  }'
```

### Check Queue Status

```bash
curl -X POST http://localhost:7071/api/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "queue"
  }'
```

## Common Use Cases

### 1. Story Generation

Use the narrator agent to generate immersive story content:

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'single',
    type: 'narrator',
    input: {
      prompt: 'Describe the player discovering a hidden passage',
      context: {
        location: 'Ancient Castle',
        time: 'midnight',
        mood: 'suspenseful'
      },
      style: 'atmospheric'
    }
  })
});
```

### 2. Quest Creation

Generate quests with objectives and rewards:

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'single',
    type: 'quest',
    input: {
      type: 'main',
      difficulty: 'hard',
      objectives: [
        'Investigate the mysterious disappearances',
        'Find the culprit',
        'Rescue the villagers'
      ],
      rewards: {
        gold: 2000,
        experience: 1000,
        items: ['hero_medal']
      }
    }
  })
});
```

### 3. Combat Resolution

Handle combat scenarios with AI:

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'single',
    type: 'combat',
    input: {
      combatants: [
        { id: 'player', name: 'Hero', stats: { hp: 100, attack: 25 } },
        { id: 'enemy', name: 'Orc', stats: { hp: 50, attack: 15 } }
      ],
      turn: 1,
      actions: [
        { actor: 'player', type: 'attack', target: 'enemy' }
      ]
    }
  })
});
```

### 4. NPC Dialogue

Generate natural NPC conversations:

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'single',
    type: 'dialogue',
    input: {
      speaker: 'Shopkeeper',
      listener: 'Player',
      topic: 'Buying supplies',
      tone: 'friendly',
      history: [
        { speaker: 'Player', text: 'Hello, do you have any potions?' }
      ]
    }
  })
});
```

### 5. Complex Workflows

Chain multiple tasks together:

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'workflow',
    workflow: {
      tasks: [
        {
          type: 'narrator',
          input: { prompt: 'Scene setup' },
          priority: 0
        },
        {
          type: 'dialogue',
          input: { speaker: 'NPC', topic: 'Quest offer' },
          priority: 1,
          dependencies: ['task_1_id']
        },
        {
          type: 'quest',
          input: { type: 'main', objectives: ['Complete task'] },
          priority: 2,
          dependencies: ['task_2_id']
        }
      ]
    }
  })
});
```

## Testing

Run the examples to test the orchestrator:

```bash
node api/orchestrator/examples.js
```

## Troubleshooting

### Agent Not Found

If you get an error about missing agent IDs, make sure you've configured all required environment variables in `local.settings.json`.

### Rate Limiting

If you're rate limited, adjust the `ORCHESTRATOR_RATE_LIMIT_PER_MIN` value or wait before making more requests.

### Timeout Issues

If requests timeout, increase the `AZURE_AI_HTTP_TIMEOUT_MS` value in your configuration.

### Empty Responses

If an agent returns empty output, check the agent configuration in Foundry and ensure it's properly set up to generate responses.

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [examples.js](./examples.js) for more usage examples
- Configure additional agents as needed
- Set up Redis for production deployments

## Support

For issues or questions, refer to the main project documentation or create an issue in the project repository.
