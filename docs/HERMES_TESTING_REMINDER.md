# Hermes Testing Reminder

Status: deferred by explicit user choice (`Skip testing`).

## Context

Current prioritization identified a planning/process inconsistency risk:
- `TODO.md` tracks Hermes-related work items.
- `PLAN.md` should remain the single active roadmap source and must explicitly include Hermes integration status/evidence if Hermes work is considered active.

No runtime or pipeline execution tests were performed in this pass.

## Deferred Test Coverage (Reminder Checklist)

### 1) Critical-path verification (minimum)

- [ ] Confirm `PLAN.md` contains a Hermes integration milestone/section with:
  - [ ] status checkbox
  - [ ] evidence file references
  - [ ] verification command(s)
- [ ] Confirm `TODO.md` Hermes line items are consistent with `PLAN.md`.

### 2) Artifact presence/integrity

- [ ] Verify these files exist and are non-stub/usable:
  - [ ] `scripts/hermes-integration.js`
  - [ ] `src/data/lore-loader.js`
  - [ ] `docs/HERMES_BLACKBOX_PIPELINE.md`

### 3) Functional pipeline verification (thorough)

- [ ] Run Hermes integration trigger (per pipeline doc/script usage).
- [ ] Validate generated content is accepted/loaded into `src/data/` via loader.
- [ ] Run the referenced simulation/validation command(s) after import.
- [ ] Record outcome and update roadmap evidence links.

## Suggested Verification Commands (adapt to repo scripts)

Use whichever command names are defined in `package.json` and `docs/HERMES_BLACKBOX_PIPELINE.md`:

```bash
npm run lint
npm test -- --runInBand
npm run build
# Hermes/pipeline command(s) from docs:
# npm run hermes:integrate
# npm run simulate
```

## Exit Criteria Before Marking Hermes Work Complete

- [ ] Plan/TODO consistency verified.
- [ ] Pipeline run completed at least once with successful data load.
- [ ] Post-load validation/simulation completed.
- [ ] Evidence captured in docs and linked from `PLAN.md`.
