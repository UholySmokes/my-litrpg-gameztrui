# AI Orchestrator

A centralized system for coordinating multiple AI agents in the Voidverse game engine.

## Overview

The AI Orchestrator manages and coordinates various AI agents to handle complex game tasks that require multiple AI systems working together. It provides a unified interface for task execution, workflow management, and agent coordination.

## Supported Agents

| Agent Type | Purpose | Environment Variable |
|------------|---------|---------------------|
| `narrator` | Generates narrative content and story scenes | `NARRATOR_AGENT_ID` |
| `quest` | Creates and manages quests with objectives and rewards | `QUEST_AGENT_ID` |
| `combat` | Handles combat scenarios and turn resolution | `COMBAT_AGENT_ID` |
| `dialogue` | Manages NPC conversations and dialogue generation | `DIALOGUE_AGENT_ID` |
| `world` | Generates world events and lore | `WORLD_AGENT_ID` |
| `system` | Performs system-level operations and analysis | `SYSTEM_AGENT_ID` |
| `content_smith` | Generates bulk content drafts (items, NPCs, locations, etc.) | `CONTENT_SMITH_AGENT_ID` |

## API Endpoints

### POST /api/orchestrator

Execute single tasks or complex workflows.

#### Request Body

##### Single Task Operation

```json
{
  "operation": "single",
  "type": "narrator",
  "input": {
    "prompt": "Describe the ancient ruins at sunset",
    "context": {
      "location": "Forgotten Temple",
      "mood": "mysterious"
    },
    "style": "atmospheric",
    "length": "medium"
  },
  "priority": 1,
  "maxRetries": 3
}
```

##### Workflow Operation

```json
{
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
          "objectives": ["Find the artifact", "Defeat the guardian"],
          "rewards": {
            "gold": 1000,
            "experience": 500
          }
        },
        "priority": 1,
        "dependencies": ["task_id_1"]
      },
      {
        "type": "dialogue",
        "input": {
          "speaker": "Quest Giver",
          "listener": "Player",
          "topic": "The ancient artifact",
          "tone": "urgent"
        },
        "priority": 2,
        "dependencies": ["task_id_2"]
      }
    ]
  }
}
```

##### Status Check Operation

```json
{
  "operation": "status",
  "taskId": "task_abc123"
}
```

##### Queue Status Operation

```json
{
  "operation": "queue"
}
```

#### Response Format

##### Single Task Response

```json
{
  "ok": true,
  "taskId": "task_abc123",
  "status": "completed",
  "result": {
    "text": "The ancient ruins stand silhouetted against the burning sunset...",
    "structured": {
      "mood": "mysterious",
      "entities": ["ruins", "sunset"]
    },
    "threadId": "thread_xyz",
    "runId": "run_xyz",
    "outputHash": "abc123..."
  },
  "error": null
}
```

##### Workflow Response

```json
{
  "ok": true,
  "workflowId": "workflow_xyz",
  "status": "completed",
  "tasks": [
    {
      "id": "task_1",
      "type": "narrator",
      "status": "completed",
      "result": { ... },
      "error": null
    },
    {
      "id": "task_2",
      "type": "quest",
      "status": "completed",
      "result": { ... },
      "error": null
    }
  ]
}
```

## Task Priorities

| Priority | Value | Description |
|----------|-------|-------------|
| CRITICAL | 0 | Highest priority, executed first |
| HIGH | 1 | Important tasks |
| NORMAL | 2 | Standard priority (default) |
| LOW | 3 | Background tasks |

## Task Status

| Status | Description |
|--------|-------------|
| `pending` | Task is queued and waiting to execute |
| `running` | Task is currently being executed |
| `completed` | Task finished successfully |
| `failed` | Task failed after all retries |
| `cancelled` | Task was cancelled |

## Agent Input Formats

### Narrator Agent

```json
{
  "prompt": "Describe the scene",
  "context": {
    "location": "Forest",
    "time": "night",
    "characters": ["Player", "NPC"]
  },
  "style": "atmospheric",
  "length": "medium"
}
```

### Quest Agent

```json
{
  "type": "main|side|daily",
  "difficulty": "easy|medium|hard",
  "objectives": ["Objective 1", "Objective 2"],
  "rewards": {
    "gold": 100,
    "experience": 50,
    "items": ["item_id"]
  },
  "context": {
    "questGiver": "NPC Name",
    "location": "Town"
  }
}
```

### Combat Agent

```json
{
  "combatants": [
    {
      "id": "player",
      "name": "Hero",
      "stats": { "hp": 100, "attack": 15 }
    },
    {
      "id": "enemy",
      "name": "Goblin",
      "stats": { "hp": 30, "attack": 8 }
    }
  ],
  "environment": {
    "type": "forest",
    "conditions": ["rain"]
  },
  "turn": 1,
  "actions": [
    {
      "actor": "player",
      "type": "attack",
      "target": "enemy"
    }
  ]
}
```

### Dialogue Agent

```json
{
  "speaker": "NPC Name",
  "listener": "Player",
  "topic": "Quest details",
  "tone": "friendly|hostile|neutral",
  "history": [
    {
      "speaker": "Player",
      "text": "Hello, can you help me?"
    }
  ]
}
```

### World Agent

```json
{
  "eventType": "disaster|discovery|political",
  "location": "Region Name",
  "participants": ["Faction A", "Faction B"],
  "impact": "low|medium|high"
}
```

### System Agent

```json
{
  "operation": "analyze|validate|optimize",
  "gameState": { ... },
  "parameters": { ... }
}
```

### ContentSmith Agent

```json
{
  "kind": "items|titles|npcs|locations|recipes|quests|encounters|mixed",
  "quantity": 5,
  "context": {
    "location": "Dungeon",
    "level": 10,
    "theme": "undead"
  },
  "tags": ["rare", "magical", "starter"]
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NARRATOR_AGENT_ID` | Yes | - | Foundry assistant ID for narrator |
| `QUEST_AGENT_ID` | No | - | Foundry assistant ID for quest generation |
| `COMBAT_AGENT_ID` | No | - | Foundry assistant ID for combat |
| `DIALOGUE_AGENT_ID` | No | - | Foundry assistant ID for dialogue |
| `WORLD_AGENT_ID` | No | - | Foundry assistant ID for world events |
| `SYSTEM_AGENT_ID` | No | - | Foundry assistant ID for system operations |
| `CONTENT_SMITH_AGENT_ID` | No | - | Foundry assistant ID for content generation |
| `ORCHESTRATOR_RATE_LIMIT_PER_MIN` | No | 10 | Rate limit per client per minute |
| `REDIS_URL` | No | - | Redis URL for distributed task queue (production) |
| `REQUIRE_REDIS_RATE_LIMIT` | No | false | Require Redis for rate limiting |

## Usage Examples

### Example 1: Generate Narrative

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'single',
    type: 'narrator',
    input: {
      prompt: 'The hero enters the ancient chamber',
      context: { location: 'Temple of Doom', mood: 'tense' }
    }
  })
});

const { result } = await response.json();
console.log(result.text);
```

### Example 2: Create Quest Workflow

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
          input: { prompt: 'Introduce the mysterious stranger' },
          priority: 0
        },
        {
          type: 'quest',
          input: {
            type: 'side',
            difficulty: 'medium',
            objectives: ['Investigate the ruins', 'Find the lost artifact']
          },
          priority: 1
        }
      ]
    }
  })
});

const { workflowId, tasks } = await response.json();
```

### Example 3: Check Task Status

```javascript
const response = await fetch('/api/orchestrator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operation: 'status',
    taskId: 'task_abc123'
  })
});

const { task } = await response.json();
console.log(`Task status: ${task.status}`);
```

## Error Handling

The orchestrator returns appropriate HTTP status codes:

| Status | Error Code | Description |
|--------|------------|-------------|
| 200 | - | Success |
| 400 | INVALID_OPERATION | Unknown operation type |
| 400 | INVALID_WORKFLOW | Invalid workflow structure |
| 400 | MISSING_TASK_ID | Task ID required for status check |
| 404 | TASK_NOT_FOUND | Task not found |
| 429 | RATE_LIMITED | Rate limit exceeded |
| 500 | UNEXPECTED_ERROR | Internal server error |
| 502 | NON_TEXT_OUTPUT | Agent returned empty output |
| 504 | UPSTREAM_TIMEOUT | Agent request timed out |

## Architecture

### Task Queue

The orchestrator uses an in-memory priority queue by default. For production deployments, configure Redis for distributed task management.

### Execution Flow

1. Task is created and added to queue based on priority
2. Task dependencies are checked before execution
3. Task is executed with the appropriate agent
4. On failure, task is retried with exponential backoff
5. Results are cached for dependency resolution

### Retry Logic

Tasks are automatically retried up to 3 times (configurable) with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay

## Production Considerations

1. **Redis Integration**: For production, configure `REDIS_URL` for distributed task queue
2. **Rate Limiting**: Set appropriate rate limits based on your API capacity
3. **Monitoring**: Implement logging and monitoring for task execution
4. **Timeout Configuration**: Adjust agent timeouts based on task complexity
5. **Error Recovery**: Implement dead letter queue for failed tasks

## Testing

```javascript
const orchestrator = require('./index');

// Create a test task
const task = orchestrator.createTask('narrator', {
  prompt: 'Test prompt'
}, { priority: 1 });

console.log(task.id);
```

## License

Part of the Voidverse game engine project.
