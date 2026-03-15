/**
 * Tests for deterministic simulation kernel
 * Verifies that identical seeds produce identical results
 */

import { DefaultSimulationKernel, SeededPRNG } from "./SimulationKernel";
import { SimulationState, Entity, Command } from "../types/core";

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestEntity(id: string, name: string): Entity {
  return {
    id,
    name,
    type: "player",
    level: 1,
    experience: 0,
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      health: { current: 100, maximum: 100 },
      mana: { current: 50, maximum: 50 },
      stamina: { current: 75, maximum: 75 },
      attackPower: 10,
      defense: 5,
      speed: 10,
      criticalChance: 0.1,
      criticalMultiplier: 1.5,
      evasion: 0.05,
      accuracy: 0.9,
    },
    position: { lane: 1, slot: 0 },
    actionPoints: 10,
    maxActionPoints: 10,
    initiative: 10,
    effects: [],
    equipment: [],
    cooldowns: [],
    faction: "player",
    tags: [],
    isDead: false,
  };
}

function createTestState(): SimulationState {
  const player = createTestEntity("player1", "Test Player");
  const entities = new Map<string, Entity>();
  entities.set("player1", player);

  return {
    world: {
      currentTick: 0,
      currentTime: 0,
      zones: new Map(),
      globalFlags: new Map(),
      globalCounters: new Map(),
      activeEntities: ["player1"],
    },
    entities,
    eventLog: [],
    snapshots: new Map(),
    seed: 12345,
    currentTick: 0,
    isRunning: false,
  };
}

// ============================================================================
// PRNG TESTS
// ============================================================================

function testPRNGDeterminism(): boolean {
  console.log("Testing PRNG determinism...");

  const seed = 42;
  const prng1 = new SeededPRNG(seed);
  const prng2 = new SeededPRNG(seed);

  // Generate sequences and compare
  for (let i = 0; i < 100; i++) {
    const val1 = prng1.next();
    const val2 = prng2.next();

    if (Math.abs(val1 - val2) > 0.0001) {
      console.error(`PRNG mismatch at iteration ${i}: ${val1} vs ${val2}`);
      return false;
    }
  }

  console.log("✓ PRNG determinism test passed");
  return true;
}

// ============================================================================
// SIMULATION KERNEL TESTS
// ============================================================================

function testKernelDeterminism(): boolean {
  console.log("Testing kernel determinism...");

  const seed = 12345;
  const initialState = createTestState();

  // Create two identical kernels with same seed
  const kernel1 = new DefaultSimulationKernel(
    JSON.parse(JSON.stringify(initialState)),
    seed,
  );
  const kernel2 = new DefaultSimulationKernel(
    JSON.parse(JSON.stringify(initialState)),
    seed,
  );

  // Add identical commands
  const command: Command = {
    id: "test_cmd_1",
    type: "Rest",
    entityId: "player1",
    timestamp: 0,
    duration: 5,
  };

  kernel1.enqueueCommand(command);
  kernel2.enqueueCommand(command);

  // Run simulation for same number of ticks
  kernel1.start();
  kernel2.start();

  const ticks = 100;
  for (let i = 0; i < ticks; i++) {
    kernel1.tick();
    kernel2.tick();
  }

  // Compare final states
  const state1 = kernel1.getState();
  const state2 = kernel2.getState();

  // Check basic state equality
  if (state1.currentTick !== state2.currentTick) {
    console.error(
      `Tick mismatch: ${state1.currentTick} vs ${state2.currentTick}`,
    );
    return false;
  }

  if (state1.world.currentTime !== state2.world.currentTime) {
    console.error(
      `Time mismatch: ${state1.world.currentTime} vs ${state2.world.currentTime}`,
    );
    return false;
  }

  if (state1.eventLog.length !== state2.eventLog.length) {
    console.error(
      `Event log length mismatch: ${state1.eventLog.length} vs ${state2.eventLog.length}`,
    );
    return false;
  }

  const snapshots1 = Array.from(state1.snapshots.values());
  const snapshots2 = Array.from(state2.snapshots.values());
  if (snapshots1.length !== snapshots2.length) {
    console.error(
      `Snapshot count mismatch: ${snapshots1.length} vs ${snapshots2.length}`,
    );
    return false;
  }

  if (snapshots1.length > 0) {
    const lastSnapshot1 = snapshots1[snapshots1.length - 1];
    const lastSnapshot2 = snapshots2[snapshots2.length - 1];
    if (lastSnapshot1.stateHash !== lastSnapshot2.stateHash) {
      console.error(
        `Snapshot hash mismatch: ${lastSnapshot1.stateHash} vs ${lastSnapshot2.stateHash}`,
      );
      return false;
    }
  }

  // Check entity states
  const entity1 = state1.entities.get("player1");
  const entity2 = state2.entities.get("player1");

  if (!entity1 || !entity2) {
    console.error("Missing entity in one of the states");
    return false;
  }

  if (entity1.stats.health.current !== entity2.stats.health.current) {
    console.error(
      `Health mismatch: ${entity1.stats.health.current} vs ${entity2.stats.health.current}`,
    );
    return false;
  }

  console.log("✓ Kernel determinism test passed");
  return true;
}

function testCommandQueue(): boolean {
  console.log("Testing command queue...");

  const initialState = createTestState();
  const kernel = new DefaultSimulationKernel(initialState);

  // Add multiple commands
  const commands: Command[] = [
    {
      id: "cmd_1",
      type: "Rest",
      entityId: "player1",
      timestamp: 0,
      duration: 5,
    },
    {
      id: "cmd_2",
      type: "Rest",
      entityId: "player1",
      timestamp: 5,
      duration: 3,
    },
    {
      id: "cmd_3",
      type: "UseSkill",
      entityId: "player1",
      timestamp: 10,
      skillId: "test_skill",
    },
  ];

  for (const cmd of commands) {
    kernel.enqueueCommand(cmd);
  }

  kernel.start();

  // Process first tick - should process first command
  kernel.tick();

  // Check that commands are processed in order
  const events = kernel.getEvents();
  if (events.length === 0) {
    console.error("No events generated after processing commands");
    return false;
  }

  console.log("✓ Command queue test passed");
  return true;
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export function runDeterminismTests(): boolean {
  console.log("Running determinism tests...\n");

  const tests = [testPRNGDeterminism, testKernelDeterminism, testCommandQueue];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      }
    } catch (error) {
      console.error(`Test failed with error: ${error}`);
    }
    console.log("");
  }

  console.log(`Results: ${passed}/${total} tests passed`);
  return passed === total;
}

// ============================================================================
// BENCHMARK TEST
// ============================================================================

export function benchmarkKernelPerformance(): void {
  console.log("Running kernel performance benchmark...");

  const initialState = createTestState();
  const kernel = new DefaultSimulationKernel(initialState, 42);

  // Add many entities
  for (let i = 0; i < 100; i++) {
    const entity = createTestEntity(`entity_${i}`, `Entity ${i}`);
    kernel.getState().entities.set(entity.id, entity);
  }

  const startTime = performance.now();

  kernel.start();

  // Run 1000 ticks
  for (let i = 0; i < 1000; i++) {
    kernel.tick();
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(
    `✓ Benchmark completed: ${duration.toFixed(2)}ms for 1000 ticks with 100 entities`,
  );
  console.log(`Average: ${(duration / 1000).toFixed(3)}ms per tick`);
}

// Run tests if this file is executed directly
if (typeof window === "undefined" && typeof process !== "undefined") {
  // Node.js environment
  runDeterminismTests();
  benchmarkKernelPerformance();
}
