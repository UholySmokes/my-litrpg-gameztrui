# LitRPG Game Simulation Script

A comprehensive simulation script for testing game progression from level 1 to 20 in the LitRPG game.

## Features

- **100 Sequential Simulations**: Runs 100 complete game simulations
- **Progress Tracking**: Real-time progress bar with ETA
- **Comprehensive Statistics**: Average time, standard deviation, success rates
- **Multiple Output Formats**: JSON and CSV export
- **Error Handling**: Robust error handling with detailed logging
- **Configurable Parameters**: Customizable simulation settings
- **Intermediate Saves**: Saves progress every 25 runs
- **Performance Metrics**: Detailed timing and resource tracking

## Usage

### Basic Usage
```bash
# Run default simulation (100 runs to level 20)
node sim_gamestart.js
```

### Command Line Options
```bash
# Custom number of runs
node sim_gamestart.js --runs 50

# Custom target level
node sim_gamestart.js --level 30

# CSV output format
node sim_gamestart.js --format csv

# Reproducible results with seed
node sim_gamestart.js --seed 12345

# Disable detailed logs
node sim_gamestart.js --logs false

# Custom max time per run (in seconds)
node sim_gamestart.js --max-time 180

# Combine options
node sim_gamestart.js --runs 200 --level 25 --format csv --seed 42
```

### Package.json Script
Add to your `package.json`:
```json
{
  "scripts": {
    "simulate": "node sim_gamestart.js",
    "simulate:quick": "node sim_gamestart.js --runs 10 --logs false",
    "simulate:csv": "node sim_gamestart.js --format csv"
  }
}
```

## Configuration

Edit the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  TOTAL_RUNS: 100,              // Number of simulation runs
  TARGET_LEVEL: 20,             // Target level to reach
  MAX_SIMULATION_TIME: 300000,  // Max time per run (ms)
  OUTPUT_FORMAT: 'json',        // 'json' or 'csv'
  ENABLE_DETAILED_LOGS: true,   // Detailed logging per run
  PROGRESS_UPDATE_INTERVAL: 10,  // Progress update frequency
  SAVE_INTERMEDIATE_RESULTS: true,
  INTERMEDIATE_SAVE_INTERVAL: 25,
  RANDOM_SEED: null,            // Set for reproducible results
  MIN_FIGHT_TIME: 1000,         // Minimum fight duration (ms)
  MAX_FIGHT_TIME: 5000,         // Maximum fight duration (ms)
  DEATH_PENALTY_TIME: 5000,     // Death penalty (ms)
  BASE_XP_PER_FIGHT: 100,       // Base XP per fight
  CRITICAL_FAILURE_RATE: 0.01,  // Critical failure chance
};
```

## Output

### JSON Format
```json
{
  "metadata": {
    "timestamp": "2024-01-06T12:00:00.000Z",
    "config": { ... },
    "scriptVersion": "1.0.0"
  },
  "statistics": {
    "totalRuns": 100,
    "successfulRuns": 98,
    "successRate": 98.0,
    "averageTime": 45000,
    "medianTime": 42000,
    "standardDeviation": 8000,
    "minTime": 35000,
    "maxTime": 65000,
    "averageFights": 45,
    "averageDeaths": 2.3,
    "errors": 2,
    "errorRate": 2.0
  },
  "results": [
    {
      "runNumber": 1,
      "status": "success",
      "totalTime": 42000,
      "level": 20,
      "deaths": 1,
      "fights": 42,
      "fights": [
        {
          "enemy": "Goblin",
          "playerLevel": 1,
          "enemyLevel": 1,
          "xpGained": 100,
          "won": true,
          "fightTime": 2500,
          "xpMultiplier": 1.0
        }
        // ... more fights
      ]
    }
    // ... more runs
  ],
  "errors": []
}
```

### CSV Format
```csv
runNumber,status,totalTime,level,deaths,fights,error
1,"success",42000,20,1,42,""
2,"success",38000,20,0,38,""
3,"error",15000,12,3,25,"Critical failure occurred"
```

## Game Mechanics

The simulation implements the actual LitRPG game mechanics:

### XP System
- **Bracketed exponential scaling**: Different XP requirements per level bracket
- **Level-delta bonuses**: +20% XP for higher-level enemies, -10% for lower-level
- **Minimum XP**: 10% of base XP even on loss

### Combat System
- **Enemy scaling**: Enemies scale with level with increasing difficulty
- **Win probability**: Based on level difference and stats
- **Death penalty**: 5-second time penalty on death
- **Fight duration**: Random between 1-5 seconds per fight

### Level Progression
- **Target**: Reach level 20 from level 1
- **XP requirements**: Based on actual game XP curve
- **Level-ups**: Automatic when XP threshold reached

## Performance

- **Memory efficient**: Streams results to avoid memory issues
- **Non-blocking**: Uses async/await to prevent UI freezing
- **Progress tracking**: Real-time progress with ETA calculation
- **Error recovery**: Continues simulation even if individual runs fail

## Error Handling

The script handles various error scenarios:
- **Timeout conditions**: Individual runs timeout after 5 minutes
- **Critical failures**: 1% chance of critical failure per run
- **Invalid states**: Graceful handling of invalid game states
- **File I/O errors**: Safe file operations with error logging

## Analysis

Use the generated data for:
- **Performance benchmarking**: Track average completion times
- **Balance testing**: Verify level progression feels right
- **Regression testing**: Compare results across game updates
- **Statistical analysis**: Use standard deviation to identify outliers

## Troubleshooting

### Common Issues
1. **Script hangs**: Check if `MAX_SIMULATION_TIME` is too high
2. **Memory issues**: Disable detailed logs with `--logs false`
3. **Slow performance**: Reduce `TOTAL_RUNS` or increase `PROGRESS_UPDATE_INTERVAL`
4. **File permissions**: Ensure write access to current directory

### Debug Mode
```bash
# Enable verbose logging
DEBUG=1 node sim_gamestart.js

# Run with Node.js debug flags
node --inspect sim_gamestart.js
```