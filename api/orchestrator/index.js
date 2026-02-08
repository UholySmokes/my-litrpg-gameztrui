/**
 * AI Orchestrator - Coordinates multiple AI agents for complex game tasks
 *
 * This orchestrator manages:
 * - Narrator Agent: Generates narrative content
 * - Quest Agent: Creates and manages quests
 * - Combat Agent: Handles combat scenarios
 * - Dialogue Agent: Manages NPC conversations
 * - World Agent: Generates world events and lore
 */

const { initApiTracing, withTraceSpan } = require("../lib/tracing");
const {
  jsonResponse,
  toStringSafe,
  getRequiredEnv,
  generateId,
  hashContent,
  readJsonBody,
  rateLimit,
  fetchJson,
  extractAssistantText,
} = require("../lib/azure-ai-utils");
const { startFoundryRun, awaitFoundryRun } = require("../lib/foundry-run");

// Agent configurations
const AGENT_TYPES = {
  NARRATOR: "narrator",
  QUEST: "quest",
  COMBAT: "combat",
  DIALOGUE: "dialogue",
  WORLD: "world",
  SYSTEM: "system",
  CONTENT_SMITH: "content_smith",
};

// Task priorities
const TASK_PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

// Task status
const TASK_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// In-memory task queue (in production, use Redis or database)
const taskQueue = [];
const activeTasks = new Map();
const taskResults = new Map();

/**
 * Get agent ID from environment variables
 */
function getAgentId(agentType) {
  const envMap = {
    narrator: "NARRATOR_AGENT_ID",
    quest: "QUEST_AGENT_ID",
    combat: "COMBAT_AGENT_ID",
    dialogue: "DIALOGUE_AGENT_ID",
    world: "WORLD_AGENT_ID",
    system: "SYSTEM_AGENT_ID",
    content_smith: "CONTENT_SMITH_AGENT_ID",
  };
  const envVar = envMap[agentType];
  return getRequiredEnv(envVar);
}

/**
 * Create a task object
 */
function createTask(type, input, options = {}) {
  return {
    id: generateId("task"),
    type,
    input,
    priority: options.priority || TASK_PRIORITY.NORMAL,
    status: TASK_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
    retries: 0,
    maxRetries: options.maxRetries || 3,
    dependencies: options.dependencies || [],
    metadata: options.metadata || {},
  };
}

/**
 * Add task to queue
 */
function enqueueTask(task) {
  // Insert based on priority
  let insertIndex = taskQueue.length;
  for (let i = 0; i < taskQueue.length; i++) {
    if (task.priority < taskQueue[i].priority) {
      insertIndex = i;
      break;
    }
  }
  taskQueue.splice(insertIndex, 0, task);
  return task.id;
}

/**
 * Get next task from queue
 */
function getNextTask() {
  // Check for tasks with satisfied dependencies
  for (let i = 0; i < taskQueue.length; i++) {
    const task = taskQueue[i];
    const dependenciesMet = task.dependencies.every(depId => {
      const depResult = taskResults.get(depId);
      return depResult && depResult.status === TASK_STATUS.COMPLETED;
    });

    if (dependenciesMet) {
      taskQueue.splice(i, 1);
      return task;
    }
  }
  return null;
}

/**
 * Execute a single task
 */
async function executeTask(task, context) {
  const agentId = getAgentId(task.type);

  if (!agentId) {
    throw new Error(`No agent ID configured for type: ${task.type}`);
  }

  context.log?.(`Executing task ${task.id} with agent ${task.type} (${agentId})`);

  // Prepare instruction based on task type
  let instruction = "";

  switch (task.type) {
    case AGENT_TYPES.NARRATOR:
      instruction = buildNarratorInstruction(task);
      break;
    case AGENT_TYPES.QUEST:
      instruction = buildQuestInstruction(task);
      break;
    case AGENT_TYPES.COMBAT:
      instruction = buildCombatInstruction(task);
      break;
    case AGENT_TYPES.DIALOGUE:
      instruction = buildDialogueInstruction(task);
      break;
    case AGENT_TYPES.WORLD:
      instruction = buildWorldInstruction(task);
      break;
    case AGENT_TYPES.SYSTEM:
      instruction = buildSystemInstruction(task);
      break;
    case AGENT_TYPES.CONTENT_SMITH:
      instruction = buildContentSmithInstruction(task);
      break;
    default:
      instruction = JSON.stringify(task.input);
  }

  // Start Foundry run
  const { threadId, runId } = await startFoundryRun(instruction, agentId);

  // Wait for completion
  const result = await awaitFoundryRun(threadId, runId, {
    logger: context?.log?.bind(context),
  });

  const assistantText = result.text;

  if (!assistantText) {
    throw new Error(`Agent ${task.type} returned empty output`);
  }

  // Parse structured output if available
  let structuredOutput = null;
  try {
    // Try to extract JSON from the response
    const jsonMatch = assistantText.match(/```json\s*([\s\S]*?)\s*```/) ||
                     assistantText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structuredOutput = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (e) {
    // If parsing fails, use raw text
  }

  return {
    text: assistantText,
    structured: structuredOutput,
    threadId,
    runId,
    outputHash: hashContent(assistantText),
  };
}

/**
 * Build instruction for narrator agent
 */
function buildNarratorInstruction(task) {
  const { prompt, context, style, length } = task.input;
  return `Generate a narrative scene with the following parameters:
${prompt ? `Prompt: ${prompt}` : ''}
${context ? `Context: ${JSON.stringify(context)}` : ''}
${style ? `Style: ${style}` : 'Style: Immersive, descriptive'}
${length ? `Length: ${length}` : 'Length: Medium (2-3 paragraphs)}

Provide the narrative as engaging prose. If you need to include structured data (like choices, mood, etc.), wrap it in a JSON code block.`;
}

/**
 * Build instruction for quest agent
 */
function buildQuestInstruction(task) {
  const { type, difficulty, objectives, rewards, context } = task.input;
  return `Create a ${type || 'side'} quest with the following parameters:
${difficulty ? `Difficulty: ${difficulty}` : 'Difficulty: Medium'}
${objectives ? `Objectives: ${JSON.stringify(objectives)}` : ''}
${rewards ? `Rewards: ${JSON.stringify(rewards)}` : ''}
${context ? `Context: ${JSON.stringify(context)}` : ''}

Provide the quest details in JSON format with fields: title, description, objectives (array), rewards (object), and any additional metadata.`;
}

/**
 * Build instruction for combat agent
 */
function buildCombatInstruction(task) {
  const { combatants, environment, turn, actions } = task.input;
  return `Process combat turn with the following parameters:
${combatants ? `Combatants: ${JSON.stringify(combatants)}` : ''}
${environment ? `Environment: ${JSON.stringify(environment)}` : ''}
${turn ? `Turn: ${turn}` : ''}
${actions ? `Actions: ${JSON.stringify(actions)}` : ''}

Provide combat resolution in JSON format with fields: outcomes, damage, statusEffects, and narrative description.`;
}

/**
 * Build instruction for dialogue agent
 */
function buildDialogueInstruction(task) {
  const { speaker, listener, topic, tone, history } = task.input;
  return `Generate dialogue with the following parameters:
Speaker: ${speaker || 'NPC'}
${listener ? `Listener: ${listener}` : ''}
${topic ? `Topic: ${topic}` : ''}
${tone ? `Tone: ${tone}` : 'Tone: Natural, character-appropriate'}
${history ? `Conversation History: ${JSON.stringify(history)}` : ''}

Provide the dialogue response. Include speaker name, dialogue text, and any emotional cues or actions in JSON format.`;
}

/**
 * Build instruction for world agent
 */
function buildWorldInstruction(task) {
  const { eventType, location, participants, impact } = task.input;
  return `Generate a world event with the following parameters:
${eventType ? `Event Type: ${eventType}` : ''}
${location ? `Location: ${location}` : ''}
${participants ? `Participants: ${JSON.stringify(participants)}` : ''}
${impact ? `Impact Level: ${impact}` : ''}

Provide the world event details in JSON format with fields: title, description, consequences, affectedEntities, and narrative text.`;
}

/**
 * Build instruction for system agent
 */
function buildSystemInstruction(task) {
  const { operation, gameState, parameters } = task.input;
  return `Perform system operation: ${operation || 'analyze'}
${gameState ? `Game State: ${JSON.stringify(gameState)}` : ''}
${parameters ? `Parameters: ${JSON.stringify(parameters)}` : ''}

Provide the result in JSON format with appropriate fields for the operation type.`;
}

/**
 * Build instruction for ContentSmith agent
 */
function buildContentSmithInstruction(task) {
  const { kind, quantity, context, tags } = task.input;
  return `Generate ${quantity || 5} ${kind || 'mixed'} content drafts.
${context ? `Context: ${JSON.stringify(context)}` : ''}
${tags ? `Tags: ${JSON.stringify(tags)}` : ''}

Output MUST be valid JSON only. No markdown. No extra text.
Follow this schema exactly:
{
  "ok": true,
  "kind": "items|titles|npcs|locations|recipes|quests|encounters|mixed",
  "drafts": [
    {
      "id": "d_<short_id>",
      "type": "item|title|npc|location|recipe|quest|encounter",
      "name": "string",
      "summary": "string",
      "details": {
        "tags": ["string"],
        "notes": ["string"]
      }
    }
  ]
}`;
}

/**
 * Process task with retry logic
 */
async function processTask(task, context) {
  task.status = TASK_STATUS.RUNNING;
  task.startedAt = new Date().toISOString();
  activeTasks.set(task.id, task);

  let lastError = null;

  while (task.retries <= task.maxRetries) {
    try {
      const result = await executeTask(task, context);

      task.status = TASK_STATUS.COMPLETED;
      task.completedAt = new Date().toISOString();
      task.result = result;

      activeTasks.delete(task.id);
      taskResults.set(task.id, task);

      context.log?.(`Task ${task.id} completed successfully`);
      return task;
    } catch (error) {
      lastError = error;
      task.retries++;

      context.log?.(`Task ${task.id} failed (attempt ${task.retries}): ${error.message}`);

      if (task.retries <= task.maxRetries) {
        // Exponential backoff
        const delay = Math.min(5000, 1000 * Math.pow(2, task.retries - 1));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  task.status = TASK_STATUS.FAILED;
  task.completedAt = new Date().toISOString();
  task.error = lastError?.message || "Unknown error";

  activeTasks.delete(task.id);
  taskResults.set(task.id, task);

  context.log?.(`Task ${task.id} failed after ${task.maxRetries} retries`);
  return task;
}

/**
 * Execute workflow - multiple tasks with dependencies
 */
async function executeWorkflow(workflow, context) {
  const workflowId = generateId("workflow");
  const taskMap = new Map();
  const results = [];

  context.log?.(`Starting workflow ${workflowId} with ${workflow.tasks.length} tasks`);

  // Create all tasks
  for (const taskDef of workflow.tasks) {
    const task = createTask(taskDef.type, taskDef.input, {
      priority: taskDef.priority,
      dependencies: taskDef.dependencies,
      metadata: taskDef.metadata,
    });
    taskMap.set(task.id, task);
    enqueueTask(task);
  }

  // Process tasks until all are complete
  let completedCount = 0;
  const totalTasks = workflow.tasks.length;

  while (completedCount < totalTasks) {
    const task = getNextTask();

    if (!task) {
      // Check if there are tasks waiting for dependencies
      if (activeTasks.size === 0 && taskQueue.length > 0) {
        // Circular dependency or failed dependency
        throw new Error("Workflow stalled: unable to resolve task dependencies");
      }
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    const processedTask = await processTask(task, context);
    results.push(processedTask);
    completedCount++;
  }

  context.log?.(`Workflow ${workflowId} completed with ${results.length} tasks`);

  return {
    workflowId,
    tasks: results,
    status: results.every(t => t.status === TASK_STATUS.COMPLETED)
      ? "completed"
      : "partial",
  };
}

/**
 * Main orchestrator endpoint
 */
module.exports = async function orchestrator(context, req) {
  initApiTracing({ serviceName: "void-verse-orchestrator" });

  try {
    const requestId = generateId("orch");
    return await withTraceSpan(
      "api.orchestrator",
      { "app.request_id": requestId },
      async () => {
        const rateLimitPerMin = Number.parseInt(
          getRequiredEnv("ORCHESTRATOR_RATE_LIMIT_PER_MIN") || "10",
          10,
        );

        const clientKey = toStringSafe(
          req?.headers?.["x-forwarded-for"] ||
            req?.headers?.["x-client-id"] ||
            "anonymous",
        );

        const canProceed = await rateLimit(clientKey, rateLimitPerMin, {
          logger: context?.log?.bind(context),
        });

        if (!canProceed) {
          context.res = jsonResponse(429, {
            ok: false,
            errorCode: "RATE_LIMITED",
            message: "Rate limit exceeded.",
          });
          return;
        }

        const body = await readJsonBody(req);
        const operation = body?.operation || "single";

        context.log?.(`Orchestrator request ${requestId}: operation=${operation}`);

        if (operation === "single") {
          // Execute single task
          const task = createTask(body?.type, body?.input, {
            priority: body?.priority,
            maxRetries: body?.maxRetries,
          });

          const result = await processTask(task, context);

          context.res = jsonResponse(200, {
            ok: true,
            taskId: result.id,
            status: result.status,
            result: result.result,
            error: result.error,
          });
        } else if (operation === "workflow") {
          // Execute workflow
          if (!body?.workflow || !Array.isArray(body.workflow.tasks)) {
            context.res = jsonResponse(400, {
              ok: false,
              errorCode: "INVALID_WORKFLOW",
              message: "Workflow must contain a tasks array",
            });
            return;
          }

          const result = await executeWorkflow(body.workflow, context);

          context.res = jsonResponse(200, {
            ok: true,
            workflowId: result.workflowId,
            status: result.status,
            tasks: result.tasks.map(t => ({
              id: t.id,
              type: t.type,
              status: t.status,
              result: t.result,
              error: t.error,
            })),
          });
        } else if (operation === "status") {
          // Get task status
          const taskId = body?.taskId;
          if (!taskId) {
            context.res = jsonResponse(400, {
              ok: false,
              errorCode: "MISSING_TASK_ID",
              message: "taskId is required for status operation",
            });
            return;
          }

          const task = activeTasks.get(taskId) || taskResults.get(taskId);

          if (!task) {
            context.res = jsonResponse(404, {
              ok: false,
              errorCode: "TASK_NOT_FOUND",
              message: "Task not found",
            });
            return;
          }

          context.res = jsonResponse(200, {
            ok: true,
            task: {
              id: task.id,
              type: task.type,
              status: task.status,
              createdAt: task.createdAt,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
              result: task.result,
              error: task.error,
              retries: task.retries,
            },
          });
        } else if (operation === "queue") {
          // Get queue status
          context.res = jsonResponse(200, {
            ok: true,
            queue: {
              pending: taskQueue.length,
              active: activeTasks.size,
              completed: taskResults.size,
            },
          });
        } else {
          context.res = jsonResponse(400, {
            ok: false,
            errorCode: "INVALID_OPERATION",
            message: `Unknown operation: ${operation}`,
          });
        }
      },
    );
  } catch (error) {
    context.log.error("Orchestrator error:", error);
    const parsedStatus = Number(error?.status) || 500;
    const errorCode = error?.code || "UNEXPECTED_ERROR";

    context.res = jsonResponse(parsedStatus, {
      ok: false,
      errorCode,
      message: String(error?.message || error || "Unknown error"),
      detail: error?.detail,
    });
  }
};

// Export utilities for testing and internal use
module.exports.AGENT_TYPES = AGENT_TYPES;
module.exports.TASK_PRIORITY = TASK_PRIORITY;
module.exports.TASK_STATUS = TASK_STATUS;
module.exports.createTask = createTask;
module.exports.enqueueTask = enqueueTask;
module.exports.executeWorkflow = executeWorkflow;
