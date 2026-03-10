/**
 * Basic validation utilities for simulation types
 * Simplified version to avoid TypeScript complexity issues
 */

import { Entity, Command, Event, SimulationState } from "../types/core";

// ============================================================================
// BASIC VALIDATION FUNCTIONS
// ============================================================================

export function isValidEntity(entity: any): entity is Entity {
  return (
    entity &&
    typeof entity === "object" &&
    typeof entity.id === "string" &&
    typeof entity.name === "string" &&
    ["player", "enemy", "npc", "object"].includes(entity.type) &&
    typeof entity.level === "number" &&
    entity.level > 0 &&
    entity.stats &&
    typeof entity.stats === "object"
  );
}

export function isValidCommand(command: any): command is Command {
  return (
    command &&
    typeof command === "object" &&
    typeof command.id === "string" &&
    typeof command.type === "string" &&
    typeof command.entityId === "string" &&
    typeof command.timestamp === "number" &&
    [
      "UseSkill",
      "Move",
      "EquipItem",
      "UseItem",
      "Rest",
      "MagicSense",
      "MagicAttune",
      "MagicDraw",
      "MagicRefine",
      "MagicCompress",
      "MagicShape",
      "MagicWeave",
      "MagicAnchor",
      "MagicPurge",
      "MagicRelease",
    ].includes(command.type)
  );
}

export function isValidEvent(event: any): event is Event {
  return (
    event &&
    typeof event === "object" &&
    typeof event.id === "string" &&
    typeof event.type === "string" &&
    typeof event.tick === "number" &&
    typeof event.timestamp === "number" &&
    [
      "Damage",
      "Heal",
      "EffectApplied",
      "EffectRemoved",
      "StatChanged",
      "EntityDeath",
      "SkillUsed",
      "StateChanged",
      "CombatAction",
      "TurnStarted",
      "APGained",
      "APSpent",
      "Error",
    ].includes(event.type)
  );
}

export function isValidSimulationState(state: any): state is SimulationState {
  return (
    state &&
    typeof state === "object" &&
    state.world &&
    typeof state.world === "object" &&
    state.entities &&
    Array.isArray(state.eventLog) &&
    typeof state.seed === "number" &&
    typeof state.currentTick === "number" &&
    typeof state.isRunning === "boolean"
  );
}

// ============================================================================
// SIMULATION BOUNDARY RULES
// ============================================================================

/**
 * These rules define what belongs inside vs outside the simulation boundary.
 * Any code that violates these rules should be moved outside the simulation.
 */

export const SIMULATION_BOUNDARY_RULES = {
  // INSIDE (pure, deterministic):
  INSIDE: [
    "State mutations",
    "Random number generation (via seeded PRNG only)",
    "Game logic and rules",
    "Event generation and logging",
    "Command validation",
    "Mathematical calculations",
    "Data transformations",
  ],

  // OUTSIDE (side effects):
  OUTSIDE: [
    "UI rendering",
    "User input handling",
    "Network requests",
    "File I/O operations",
    "Database operations",
    "External API calls",
    "Console logging (use events instead)",
    "DOM manipulation",
    "Browser APIs",
    "Time/date functions (use simulation time)",
  ],
};

/**
 * Check if a function name suggests it belongs outside the simulation boundary
 */
export function isOutsideBoundaryFunction(functionName: string): boolean {
  const outsideKeywords = [
    "render",
    "draw",
    "display",
    "show",
    "hide",
    "fetch",
    "request",
    "axios",
    "http",
    "save",
    "load",
    "storage",
    "database",
    "console",
    "log",
    "debug",
    "dom",
    "element",
    "node",
    "event",
    "listener",
    "handler",
  ];

  const lowerName = functionName.toLowerCase();
  return outsideKeywords.some((keyword) => lowerName.includes(keyword));
}

/**
 * Validate that a simulation function respects boundary rules
 */
export function validateSimulationBoundary(
  functionName: string,
  functionBody: string,
): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (isOutsideBoundaryFunction(functionName)) {
    violations.push(
      `Function name '${functionName}' suggests it belongs outside simulation boundary`,
    );
  }

  // Check for common boundary violations in function body
  const violationPatterns = [
    {
      pattern: /console\./,
      message: "Console logging detected - use events instead",
    },
    {
      pattern: /fetch\(/,
      message: "Network request detected - belongs outside simulation",
    },
    {
      pattern: /localStorage/,
      message: "Local storage access detected - belongs outside simulation",
    },
    {
      pattern: /document\./,
      message: "DOM access detected - belongs outside simulation",
    },
    {
      pattern: /window\./,
      message: "Window API access detected - belongs outside simulation",
    },
    {
      pattern: /Date\.now\(\)/,
      message: "Date.now() detected - use simulation time instead",
    },
    {
      pattern: /Math\.random\(\)/,
      message: "Math.random() detected - use seeded PRNG instead",
    },
  ];

  for (const { pattern, message } of violationPatterns) {
    if (pattern.test(functionBody)) {
      violations.push(message);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
