# Magic System Physics Workout TODO

## Step 1: Create Test Scenarios
- Create `magic_physics_scenarios.json` with 20+ cases (biomes, stances, action seqs).

## Step 2: Implement Simulator
- [x] Create `magic_physics_sim.js`: core formulas (mana, draw, refine, compress, shape/weave, RNG risks).
- [ ] Support CLI: `node magic_physics_sim.js --scenarios=magic_physics_scenarios.json --runs=1000`.
- Support CLI: `node magic_physics_sim.js --scenarios=magic_physics_scenarios.json --runs=1000`.

## Step 3: Run Sims & Generate Report
- Exec sim for all scenarios.
- Create `magic_physics_sim_report.md`: stats (success%, magnitude, stability delta, balance insights).

## Step 4: Analyze & Suggest Tweaks
- Review results (e.g., high-density misfires, opposed weave balance).
- Propose spec edits (e.g., adjust backlashBase).

## Step 5: Sample magicProfiles & Integrate
- Gen class spell mappings (e.g., Fireball profile).
- Update unification plans if needed.

## Step 6: Complete
- Demo cmd, attempt_completion.

[x] Step 1
