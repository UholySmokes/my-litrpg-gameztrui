/**
 * Orchestrator Usage Examples
 *
 * This file demonstrates how to use the AI Orchestrator
 * for various game scenarios.
 */

// Example 1: Single Task - Generate Narrative
async function exampleGenerateNarrative() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'narrator',
      input: {
        prompt: 'The hero discovers an ancient artifact in the ruins',
        context: {
          location: 'Forgotten Temple',
          time: 'dawn',
          mood: 'mysterious'
        },
        style: 'atmospheric',
        length: 'medium'
      },
      priority: 1,
      maxRetries: 3
    })
  });

  const data = await response.json();
  console.log('Narrative:', data.result.text);
  return data;
}

// Example 2: Single Task - Create Quest
async function exampleCreateQuest() {
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
          'Find the entrance to the Shadow Realm',
          'Defeat the Shadow Guardian',
          'Retrieve the Crystal of Light'
        ],
        rewards: {
          gold: 5000,
          experience: 2000,
          items: ['crystal_of_light', 'shadow_key']
        },
        context: {
          questGiver: 'Elder Sage',
          location: 'Village of Light'
        }
      },
      priority: 0
    })
  });

  const data = await response.json();
  console.log('Quest:', data.result.structured);
  return data;
}

// Example 3: Single Task - Combat Resolution
async function exampleCombatResolution() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'combat',
      input: {
        combatants: [
          {
            id: 'player',
            name: 'Hero',
            stats: { hp: 100, maxHp: 100, attack: 25, defense: 15 }
          },
          {
            id: 'enemy',
            name: 'Shadow Beast',
            stats: { hp: 80, maxHp: 80, attack: 20, defense: 10 }
          }
        ],
        environment: {
          type: 'dark_forest',
          conditions: ['fog', 'night']
        },
        turn: 1,
        actions: [
          {
            actor: 'player',
            type: 'attack',
            target: 'enemy',
            ability: 'power_strike'
          }
        ]
      },
      priority: 0
    })
  });

  const data = await response.json();
  console.log('Combat Result:', data.result.structured);
  return data;
}

// Example 4: Single Task - Dialogue Generation
async function exampleDialogueGeneration() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'dialogue',
      input: {
        speaker: 'Mysterious Stranger',
        listener: 'Player',
        topic: 'The ancient prophecy',
        tone: 'enigmatic',
        history: [
          {
            speaker: 'Player',
            text: 'Who are you and what do you know about the prophecy?'
          }
        ]
      },
      priority: 1
    })
  });

  const data = await response.json();
  console.log('Dialogue:', data.result.structured);
  return data;
}

// Example 5: Workflow - Complete Quest Introduction
async function exampleQuestIntroductionWorkflow() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'workflow',
      workflow: {
        tasks: [
          {
            type: 'narrator',
            input: {
              prompt: 'Describe the player arriving at the village square where a crowd has gathered',
              context: {
                location: 'Village Square',
                time: 'afternoon',
                mood: 'tense'
              }
            },
            priority: 0
          },
          {
            type: 'dialogue',
            input: {
              speaker: 'Town Crier',
              listener: 'Crowd',
              topic: 'Urgent announcement',
              tone: 'urgent',
              history: []
            },
            priority: 1
          },
          {
            type: 'quest',
            input: {
              type: 'main',
              difficulty: 'medium',
              objectives: [
                'Speak with the Town Elder',
                'Investigate the strange occurrences',
                'Report findings'
              ],
              rewards: {
                gold: 500,
                experience: 300
              }
            },
            priority: 2
          },
          {
            type: 'narrator',
            input: {
              prompt: 'Describe the quest being accepted and the player setting out',
              context: {
                location: 'Village Square',
                mood: 'determined'
              }
            },
            priority: 3
          }
        ]
      }
    })
  });

  const data = await response.json();
  console.log('Workflow completed:', data.workflowId);
  console.log('Tasks:', data.tasks);
  return data;
}

// Example 6: Workflow - Combat Encounter
async function exampleCombatEncounterWorkflow() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'workflow',
      workflow: {
        tasks: [
          {
            type: 'narrator',
            input: {
              prompt: 'Describe the enemy appearing and the battle beginning',
              context: {
                location: 'Dark Cave',
                mood: 'dangerous'
              }
            },
            priority: 0
          },
          {
            type: 'combat',
            input: {
              combatants: [
                {
                  id: 'player',
                  name: 'Hero',
                  stats: { hp: 100, attack: 25, defense: 15 }
                },
                {
                  id: 'enemy',
                  name: 'Cave Troll',
                  stats: { hp: 150, attack: 30, defense: 10 }
                }
              ],
              environment: {
                type: 'cave',
                conditions: ['dark', 'cramped']
              },
              turn: 1,
              actions: [
                {
                  actor: 'player',
                  type: 'attack',
                  target: 'enemy'
                }
              ]
            },
            priority: 1
          },
          {
            type: 'narrator',
            input: {
              prompt: 'Describe the outcome of the battle',
              context: {
                mood: 'triumphant'
              }
            },
            priority: 2
          }
        ]
      }
    })
  });

  const data = await response.json();
  return data;
}

// Example 7: Check Task Status
async function exampleCheckTaskStatus(taskId) {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'status',
      taskId: taskId
    })
  });

  const data = await response.json();
  console.log('Task Status:', data.task.status);
  console.log('Result:', data.task.result);
  return data;
}

// Example 8: Check Queue Status
async function exampleCheckQueueStatus() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'queue'
    })
  });

  const data = await response.json();
  console.log('Queue Status:', data.queue);
  return data;
}

// Example 9: World Event Generation
async function exampleWorldEvent() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'world',
      input: {
        eventType: 'discovery',
        location: 'Northern Mountains',
        participants: ['Explorers Guild', 'Royal Army'],
        impact: 'high'
      },
      priority: 1
    })
  });

  const data = await response.json();
  console.log('World Event:', data.result.structured);
  return data;
}

// Example 10: System Analysis
async function exampleSystemAnalysis() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'system',
      input: {
        operation: 'analyze',
        gameState: {
          playerLevel: 15,
          completedQuests: 23,
          currentLocation: 'Capital City'
        },
        parameters: {
          analysisType: 'progression',
          recommendations: true
        }
      },
      priority: 2
    })
  });

  const data = await response.json();
  console.log('System Analysis:', data.result.structured);
  return data;
}

// Example 11: ContentSmith - Generate Items
async function exampleContentSmithItems() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'content_smith',
      input: {
        kind: 'items',
        quantity: 5,
        context: {
          location: 'Ancient Ruins',
          level: 10,
          theme: 'undead'
        },
        tags: ['rare', 'magical', 'cursed']
      },
      priority: 1
    })
  });

  const data = await response.json();
  console.log('Generated Items:', data.result.structured);
  return data;
}

// Example 12: ContentSmith - Generate NPCs
async function exampleContentSmithNPCs() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'content_smith',
      input: {
        kind: 'npcs',
        quantity: 3,
        context: {
          location: 'Thieves Guild',
          role: 'quest_giver'
        },
        tags: ['shadowy', 'mysterious', 'rogue']
      },
      priority: 1
    })
  });

  const data = await response.json();
  console.log('Generated NPCs:', data.result.structured);
  return data;
}

// Example 13: ContentSmith - Generate Mixed Content
async function exampleContentSmithMixed() {
  const response = await fetch('/api/orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation: 'single',
      type: 'content_smith',
      input: {
        kind: 'mixed',
        quantity: 10,
        context: {
          location: 'Dark Forest',
          level: 5
        },
        tags: ['starter', 'nature', 'beasts']
      },
      priority: 1
    })
  });

  const data = await response.json();
  console.log('Generated Mixed Content:', data.result.structured);
  return data;
}

// Export examples for use in tests or other modules
module.exports = {
  exampleGenerateNarrative,
  exampleCreateQuest,
  exampleCombatResolution,
  exampleDialogueGeneration,
  exampleQuestIntroductionWorkflow,
  exampleCombatEncounterWorkflow,
  exampleCheckTaskStatus,
  exampleCheckQueueStatus,
  exampleWorldEvent,
  exampleSystemAnalysis,
  exampleContentSmithItems,
  exampleContentSmithNPCs,
  exampleContentSmithMixed
};

// Run examples if executed directly
if (require.main === module) {
  console.log('Orchestrator Examples');
  console.log('=====================\n');

  console.log('Available examples:');
  console.log('1. exampleGenerateNarrative()');
  console.log('2. exampleCreateQuest()');
  console.log('3. exampleCombatResolution()');
  console.log('4. exampleDialogueGeneration()');
  console.log('5. exampleQuestIntroductionWorkflow()');
  console.log('6. exampleCombatEncounterWorkflow()');
  console.log('7. exampleCheckTaskStatus(taskId)');
  console.log('8. exampleCheckQueueStatus()');
  console.log('9. exampleWorldEvent()');
  console.log('10. exampleSystemAnalysis()');
  console.log('11. exampleContentSmithItems()');
  console.log('12. exampleContentSmithNPCs()');
  console.log('13. exampleContentSmithMixed()');
  console.log('\nImport and call these functions to test the orchestrator.');
}
