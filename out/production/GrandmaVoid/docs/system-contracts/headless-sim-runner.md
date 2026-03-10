# Headless Simulation Runner Contract

## Purpose
- Run deterministic, headless progression simulations for balance checks.

## Inputs
- CLI flags such as `--runs`, `--level`, `--format`, `--seed`, `--logs`, `--max-time`.
- Optional `--config` JSON file with CONFIG keys.

## Outputs
- Writes results file (`simulation_results_*.json` or `.csv`) to the working directory.
- Logs progress and summary statistics to stdout.
- Exits with code 0 on high success rate, 1 otherwise.

## Events Emitted
- None.

## State Touches
- Read: CLI args, config file.
- Write: output result files.

## Dependencies
- Node.js `fs`, `path`, `process`.

## Forbidden Dependencies
- Browser APIs, UI components, network calls.

## Error Handling
- Throws on missing/invalid config file or critical simulation failures.

## Tests
- Manual execution via `npm run simulate`.
