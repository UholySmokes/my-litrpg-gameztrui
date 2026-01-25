#!/usr/bin/env node

// =================================================================
// LitRPG Game Simulation Script - Fixed Version
// Simulates game runs from level 1 to 20
// =================================================================

import fs from "fs";
import path from "path";
import process from "node:process";

// Configuration
const CONFIG = {
  TOTAL_RUNS: 10,
  TARGET_LEVEL: 20,
  MAX_SIMULATION_TIME: 300000, // 5 minutes per run in ms
  OUTPUT_FORMAT: "json", // 'json' or 'csv'
  ENABLE_DETAILED_LOGS: true,
  PROGRESS_UPDATE_INTERVAL: 5, // Update progress every N runs
  SAVE_INTERMEDIATE_RESULTS: true,
  INTERMEDIATE_SAVE_INTERVAL: 25, // Save every N runs
  RANDOM_SEED: null, // Set to number for reproducible results
  MIN_FIGHT_TIME: 1000, // Minimum time per fight in ms
  MAX_FIGHT_TIME: 5000, // Maximum time per fight in ms
  DEATH_PENALTY_TIME: 5000, // Time penalty for death in ms
  BASE_XP_PER_FIGHT: 100,
  CRITICAL_FAILURE_RATE: 0.01, // 1% chance of critical failure
};

const CONFIG_KEYS = new Set(Object.keys(CONFIG));

function mergeConfig(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return;
  for (const [key, value] of Object.entries(source)) {
    if (CONFIG_KEYS.has(key)) {
      target[key] = value;
    }
  }
}

function loadConfigFile(filePath) {
  if (!filePath) {
    throw new Error("Missing value for --config");
  }

  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(resolved, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Config file must contain a JSON object.");
  }

  return parsed;
}

// Game state simulation
class GameSimulator {
  constructor(config = {}) {
    this.config = { ...CONFIG, ...config };
    this.currentRun = 0;
    this.results = [];
    this.startTime = Date.now();
    this.errors = [];

    // Initialize random seed if provided
    if (this.config.RANDOM_SEED !== null) {
      this.random = this.seededRandom(this.config.RANDOM_SEED);
    } else {
      this.random = Math.random;
    }
  }

  // Seeded random number generator for reproducible results
  seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Calculate XP required for level based on bracketed exponential system
  calculateXPForLevel(level) {
    let totalXP = 0;

    for (let i = 1; i < level; i++) {
      let baseXP, multiplier;

      if (i <= 10) {
        baseXP = 50;
        multiplier = 1.25;
      } else if (i <= 50) {
        baseXP = 200;
        multiplier = 1.15;
      } else if (i <= 100) {
        baseXP = 1000;
        multiplier = 1.12;
      } else if (i <= 500) {
        baseXP = 6000;
        multiplier = 1.08;
      } else {
        baseXP = 25000;
        multiplier = 1.05;
      }

      totalXP += Math.floor(
        baseXP *
          Math.pow(
            multiplier,
            i - (i <= 10 ? 1 : i <= 50 ? 11 : i <= 100 ? 51 : 101),
          ),
      );
    }

    return totalXP;
  }

  // Get enemy stats for level
  getEnemyForLevel(level) {
    const enemies = {
      1: { name: "Goblin", hp: 30, attack: 5, xp: 10 },
      2: { name: "Skeleton", hp: 50, attack: 8, xp: 15 },
      3: { name: "Orc", hp: 80, attack: 12, xp: 25 },
      4: { name: "Bandit", hp: 100, attack: 15, xp: 35 },
      5: { name: "Cave Troll", hp: 150, attack: 20, xp: 50 },
      6: { name: "Dark Mage", hp: 80, attack: 8, xp: 60 },
      7: { name: "Werewolf", hp: 120, attack: 18, xp: 75 },
      8: { name: "Dragon Whelp", hp: 200, attack: 25, xp: 100 },
      9: { name: "Stone Golem", hp: 250, attack: 30, xp: 125 },
      10: { name: "Fire Elemental", hp: 180, attack: 22, xp: 150 },
      11: { name: "Ice Giant", hp: 300, attack: 35, xp: 180 },
      12: { name: "Thunder Bird", hp: 220, attack: 28, xp: 210 },
      13: { name: "Shadow Assassin", hp: 160, attack: 40, xp: 245 },
      14: { name: "Crystal Spider", hp: 280, attack: 32, xp: 285 },
      15: { name: "Lava Beast", hp: 350, attack: 38, xp: 330 },
      16: { name: "Storm Elemental", hp: 320, attack: 35, xp: 380 },
      17: { name: "Death Knight", hp: 400, attack: 45, xp: 435 },
      18: { name: "Phoenix", hp: 380, attack: 42, xp: 495 },
      19: { name: "Ancient Dragon", hp: 500, attack: 50, xp: 560 },
      20: { name: "Demon Lord", hp: 600, attack: 55, xp: 630 },
    };

    return enemies[level] || enemies[20];
  }

  // Simulate a single fight
  simulateFight(playerLevel, enemyLevel) {
    const enemy = this.getEnemyForLevel(enemyLevel);

    // Simulate fight time
    const fightTime =
      this.config.MIN_FIGHT_TIME +
      this.random() * (this.config.MAX_FIGHT_TIME - this.config.MIN_FIGHT_TIME);

    // Calculate level delta bonus
    const levelDelta = enemyLevel - playerLevel;
    let xpMultiplier = 1.0;

    if (levelDelta > 0) {
      xpMultiplier = 1 + levelDelta * 0.2; // +20% per level above
    } else if (levelDelta < 0) {
      xpMultiplier = Math.max(0.1, 1 + levelDelta * 0.1); // -10% per level below, minimum 10%
    }

    const xpGained = Math.floor(this.config.BASE_XP_PER_FIGHT * xpMultiplier);

    // Simulate fight outcome (simplified)
    const winChance = this.calculateWinChance(playerLevel, enemyLevel);
    const won = this.random() < winChance;

    return {
      enemy: enemy.name,
      playerLevel,
      enemyLevel,
      xpGained: won ? xpGained : Math.floor(xpGained * 0.3), // 30% XP on loss
      won,
      fightTime: Math.round(fightTime),
      xpMultiplier,
    };
  }

  // Calculate win chance based on levels and stats
  calculateWinChance(playerLevel, enemyLevel) {
    const levelDiff = playerLevel - enemyLevel;
    let baseChance = 0.5;

    if (levelDiff > 0) {
      baseChance = Math.min(0.95, 0.5 + levelDiff * 0.1);
    } else if (levelDiff < 0) {
      baseChance = Math.max(0.05, 0.5 + levelDiff * 0.05);
    }

    return baseChance;
  }

  // Simulate a single game run
  async simulateGameRun(runNumber) {
    const runStartTime = Date.now();
    const runData = {
      runNumber,
      startTime: runStartTime,
      fights: [],
      level: 1,
      totalXP: 0,
      targetXP: this.calculateXPForLevel(this.config.TARGET_LEVEL),
      totalTime: 0,
      deaths: 0,
      status: "running",
      error: null,
    };

    try {
      // Check for critical failure
      if (this.random() < this.config.CRITICAL_FAILURE_RATE) {
        throw new Error("Critical failure occurred");
      }

      while (runData.level < this.config.TARGET_LEVEL) {
        // Check timeout
        if (Date.now() - runStartTime > this.config.MAX_SIMULATION_TIME) {
          runData.status = "timeout";
          break;
        }

        // Choose enemy level (usually same level, sometimes higher for challenge)
        let enemyLevel = runData.level;
        if (this.random() < 0.3) {
          // 30% chance to fight higher level
          enemyLevel = Math.min(runData.level + 1, this.config.TARGET_LEVEL);
        }

        // Simulate fight
        const fight = this.simulateFight(runData.level, enemyLevel);
        runData.fights.push(fight);
        runData.totalXP += fight.xpGained;
        runData.totalTime += fight.fightTime;

        if (!fight.won) {
          runData.deaths++;
          runData.totalTime += this.config.DEATH_PENALTY_TIME;
        }

        // Check for level up
        const nextLevelXP = this.calculateXPForLevel(runData.level + 1);
        if (runData.totalXP >= nextLevelXP) {
          runData.level++;
        }

        // Small delay to prevent blocking
        if (runData.fights.length % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }

      // Final status
      if (runData.level >= this.config.TARGET_LEVEL) {
        runData.status = "success";
      }
    } catch (error) {
      runData.status = "error";
      runData.error = error.message;
      this.errors.push({
        runNumber,
        error: error.message,
        timestamp: Date.now(),
      });
    }

    runData.endTime = Date.now();
    runData.totalTime = runData.endTime - runStartTime;

    return runData;
  }

  // Calculate statistics across all runs
  calculateStatistics() {
    const successfulRuns = this.results.filter((r) => r.status === "success");
    const failedRuns = this.results.filter((r) => r.status !== "success");

    if (successfulRuns.length === 0) {
      return {
        totalRuns: this.results.length,
        successfulRuns: 0,
        successRate: 0,
        averageTime: 0,
        medianTime: 0,
        standardDeviation: 0,
        minTime: 0,
        maxTime: 0,
        averageFights: 0,
        averageDeaths: 0,
        errors: this.errors.length,
      };
    }

    const times = successfulRuns.map((r) => r.totalTime);
    const fights = successfulRuns.map((r) => r.fights.length);
    const deaths = successfulRuns.map((r) => r.deaths);

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const medianTime = times.sort((a, b) => a - b)[
      Math.floor(times.length / 2)
    ];
    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) /
      times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      totalRuns: this.results.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successRate: (successfulRuns.length / this.results.length) * 100,
      averageTime: Math.round(averageTime),
      medianTime: Math.round(medianTime),
      standardDeviation: Math.round(standardDeviation),
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      averageFights: Math.round(
        fights.reduce((a, b) => a + b, 0) / fights.length,
      ),
      averageDeaths:
        Math.round((deaths.reduce((a, b) => a + b, 0) / deaths.length) * 10) /
        10,
      errors: this.errors.length,
      errorRate: (this.errors.length / this.results.length) * 100,
    };
  }

  // Format time in human-readable format
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  // Simple progress indicator (no console manipulation)
  showProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    console.log(`Progress: ${current}/${total} (${percentage}%)`);
  }

  // Save results to file
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `simulation_results_${timestamp}`;

    const data = {
      metadata: {
        timestamp: new Date().toISOString(),
        config: this.config,
        scriptVersion: "1.0.0",
      },
      statistics: this.calculateStatistics(),
      results: this.config.ENABLE_DETAILED_LOGS
        ? this.results
        : this.results.map((r) => ({
            runNumber: r.runNumber,
            status: r.status,
            totalTime: r.totalTime,
            level: r.level,
            deaths: r.deaths,
            fights: r.fights.length,
            error: r.error,
          })),
      errors: this.errors,
    };

    let output;
    let extension;

    if (this.config.OUTPUT_FORMAT === "csv") {
      output = this.convertToCSV(data);
      extension = "csv";
    } else {
      output = JSON.stringify(data, null, 2);
      extension = "json";
    }

    const filepath = path.join(process.cwd(), `${filename}.${extension}`);
    fs.writeFileSync(filepath, output);

    return filepath;
  }

  // Convert results to CSV format
  convertToCSV(data) {
    const headers = [
      "runNumber",
      "status",
      "totalTime",
      "level",
      "deaths",
      "fights",
      "error",
    ];
    const csvRows = [headers.join(",")];

    data.results.forEach((result) => {
      const row = [
        result.runNumber,
        result.status,
        result.totalTime,
        result.level,
        result.deaths,
        result.fights.length,
        result.error || "",
      ];
      csvRows.push(row.map((field) => `"${field}"`).join(","));
    });

    return csvRows.join("\n");
  }

  // Run all simulations
  async runSimulations() {
    console.log(`🎮 Starting LitRPG Game Simulation`);
    console.log(`📊 Configuration:`);
    console.log(`   - Total Runs: ${this.config.TOTAL_RUNS}`);
    console.log(`   - Target Level: ${this.config.TARGET_LEVEL}`);
    console.log(
      `   - Max Time per Run: ${this.formatTime(this.config.MAX_SIMULATION_TIME)}`,
    );
    console.log(`   - Output Format: ${this.config.OUTPUT_FORMAT}`);
    console.log(`   - Detailed Logs: ${this.config.ENABLE_DETAILED_LOGS}`);
    console.log(`   - Random Seed: ${this.config.RANDOM_SEED || "Random"}`);
    console.log(`\n🚀 Starting simulations...\n`);

    for (let i = 1; i <= this.config.TOTAL_RUNS; i++) {
      this.currentRun = i;

      try {
        console.log(`Starting run ${i}...`);
        const result = await this.simulateGameRun(i);
        this.results.push(result);

        // Show progress
        if (
          i % this.config.PROGRESS_UPDATE_INTERVAL === 0 ||
          i === this.config.TOTAL_RUNS
        ) {
          this.showProgress(i, this.config.TOTAL_RUNS);
        }

        console.log(
          `Run ${i} completed: ${result.status} (${result.fights.length} fights, ${result.totalTime}ms)`,
        );
      } catch (error) {
        console.error(`❌ Error in run ${i}:`, error.message);
        this.errors.push({
          runNumber: i,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }

    console.log(`\n📈 Simulation Complete!`);

    // Calculate and display statistics
    const stats = this.calculateStatistics();
    this.displayStatistics(stats);

    // Save results
    const outputFile = this.saveResults();
    console.log(`\n💾 Results saved to: ${outputFile}`);

    return { stats, results: this.results, errors: this.errors };
  }

  // Display statistics in a formatted way
  displayStatistics(stats) {
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total Runs: ${stats.totalRuns}`);
    console.log(
      `   Successful Runs: ${stats.successfulRuns}/${stats.totalRuns} (${stats.successRate.toFixed(1)}%)`,
    );
    console.log(`   Failed Runs: ${stats.failedRuns}`);
    console.log(`   Error Rate: ${stats.errorRate.toFixed(1)}%`);
    console.log(`   Average Time: ${this.formatTime(stats.averageTime)}`);
    console.log(`   Median Time: ${this.formatTime(stats.medianTime)}`);
    console.log(
      `   Standard Deviation: ${this.formatTime(stats.standardDeviation)}`,
    );
    console.log(`   Fastest Run: ${this.formatTime(stats.minTime)}`);
    console.log(`   Slowest Run: ${this.formatTime(stats.maxTime)}`);
    console.log(`   Average Fights: ${stats.averageFights}`);
    console.log(`   Average Deaths: ${stats.averageDeaths}`);
  }
}

// Main execution
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const config = {};

    const configIndex = args.indexOf("--config");
    if (configIndex !== -1) {
      const fileConfig = loadConfigFile(args[configIndex + 1]);
      mergeConfig(config, fileConfig);
    }

    for (let i = 0; i < args.length; i += 2) {
      const rawKey = args[i];
      if (!rawKey) continue;
      if (rawKey === "--config") continue;

      const value = args[i + 1];
      if (value === undefined) {
        throw new Error(`Missing value for ${rawKey}`);
      }

      const key = rawKey.replace("--", "");

      switch (key) {
        case "runs":
          config.TOTAL_RUNS = Number.parseInt(value, 10);
          break;
        case "level":
          config.TARGET_LEVEL = Number.parseInt(value, 10);
          break;
        case "format":
          config.OUTPUT_FORMAT = value;
          break;
        case "seed":
          config.RANDOM_SEED = Number.parseInt(value, 10);
          break;
        case "logs":
          config.ENABLE_DETAILED_LOGS = value === "true";
          break;
        case "max-time":
          config.MAX_SIMULATION_TIME = Number.parseInt(value, 10) * 1000;
          break;
      }
    }

    const simulator = new GameSimulator(config);
    const results = await simulator.runSimulations();

    // Exit with appropriate code
    process.exit(results.stats.successRate > 80 ? 0 : 1);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run main function
main();
