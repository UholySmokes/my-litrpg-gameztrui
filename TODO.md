# BLACKBOXAI-Hermes Collaboration Pipeline TODO

## Hermes Integration Pipeline

- [x] Create `scripts/hermes-integration.js`: Node script to trigger Hermes via `wsl.exe hermes`, monitor generated files, validate/load into src/data/. (Fixed ESLint)

- [ ] Create `src/data/lore-loader.js`: Import/validate Hermes JSON for game use (e.g., factions, quests).

- [ ] Create `docs/HERMES_BLACKBOX_PIPELINE.md`: Detailed workflow doc.

- [ ] Edit `PLAN.md`: Add Hermes integration milestone/section.

- [ ] Test pipeline: Trigger sample Hermes gen (e.g., faction), process data, run simulation.

- [ ] Git commit all changes: `git add . && git commit -m "feat: hermes-blackbox pipeline"`.

- [ ] Deploy validated lore to Firebase/Supabase if applicable.

- [ ] Update TODO with progress.

Next: Implement scripts/hermes-integration.js.
