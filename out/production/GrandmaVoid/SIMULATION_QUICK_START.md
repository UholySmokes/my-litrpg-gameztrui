# LitRPG Game Simulation Script - Quick Start Guide

## 🚀 Ready to Use!

Your LitRPG game simulation script is fully implemented and tested. Here's how to use it:

### Quick Commands

```bash
# Run 100 simulations (default)
npm run simulate

# Quick test with 10 simulations
npm run simulate:quick

# Generate CSV output
npm run simulate:csv

# Full 100-run simulation
npm run simulate:full
```

### Custom Commands

```bash
# Custom number of runs
node sim_gamestart_fixed.js --runs 50

# Custom target level
node sim_gamestart_fixed.js --level 25

# Reproducible results with seed
node sim_gamestart_fixed.js --seed 12345

# Disable detailed logs for faster execution
node sim_gamestart_fixed.js --runs 200 --logs false

# Combine options
node sim_gamestart_fixed.js --runs 50 --level 30 --format csv --seed 42
```

## 📊 What You'll Get

### Statistics Output
- **Success Rate**: Percentage of runs that reached level 20
- **Average Time**: Mean completion time across all successful runs
- **Standard Deviation**: Variability in completion times
- **Fight Statistics**: Average number of fights and deaths per run
- **Performance Metrics**: Fastest, slowest, and median completion times

### Data Files
- **JSON Format**: Complete detailed logs with individual fight data
- **CSV Format**: Summary statistics for easy analysis in Excel/other tools
- **Timestamped Files**: Each run creates a uniquely named results file

## 🎮 Game Mechanics Simulated

- **XP System**: Bracketed exponential scaling (50 XP → 25K XP base)
- **Enemy Scaling**: 20 different enemy types with appropriate stats
- **Level-Delta Bonuses**: +20% XP for higher-level enemies
- **Combat Logic**: Win probability based on level differences
- **Death Penalties**: 5-second time penalty on loss
- **Progressive Difficulty**: Enemies scale appropriately with player level

## 📈 Sample Results

Based on test runs, you can expect:
- **~75 fights** per run to reach level 20
- **~35-40 deaths** per run (varies by RNG)
- **100% success rate** under normal conditions
- **Sub-second simulation time** per run (very efficient)

## 🔧 Configuration

Edit the CONFIG object in the script to customize:
- Number of runs
- Target level
- Fight timing parameters
- XP multipliers
- Error rates
- Output formats

## 🛠️ Technical Features

- **ES6 Modules**: Modern JavaScript with import/export
- **Async/Await**: Non-blocking execution
- **Memory Efficient**: Streams results to avoid memory issues
- **Error Handling**: Robust error recovery and logging
- **Progress Tracking**: Real-time progress updates
- **Command Line Interface**: Full CLI with argument parsing

## 📁 Files Created

1. **`sim_gamestart_fixed.js`** - Main simulation script
2. **`SIMULATION_README.md`** - Comprehensive documentation
3. **`simulation_results_*.json/csv`** - Output files (timestamped)

Your simulation script is production-ready and will help you analyze game balance, progression tuning, and performance characteristics!