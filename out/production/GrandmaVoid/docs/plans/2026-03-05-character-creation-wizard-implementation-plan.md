# Character Creation Wizard — Implementation Plan

Date: 2026-03-05  
Depends on: `docs/plans/2026-03-05-character-creation-wizard-design.md`

## Target Outcome (MVP)

- 8-step **Basic** wizard for first character in **Godot**.
- Always-visible **summary panel** with derived stats + warnings + synergy hints.
- Full reversibility until `Finish`.
- **Advanced mode hidden** until at least 1 character exists.

## Strategy

- Implement **data model + validators first**, then UI, then persistence/sync, then telemetry.
- Keep creation choices **low-coupling**; push deep chains to level-up later.

## Milestones / Slices

### Slice 1 — Blueprint schema + validation (shared contract)

- Define `CharacterBlueprint` schema (fields + version).
- Add validation rules (required fields, point-buy totals, allowed IDs).
- Add migrations hook (`version` field) for future changes.

**Deliverables**
- Contract doc update (schema version + fields).
- Unit tests for validation.

### Slice 2 — Godot wizard shell + navigation

- Create `CharacterCreationWizard.tscn` with:
  - stepper + navigation controls
  - summary panel (right side)
  - step container that swaps panels by step id

**Deliverables**
- Basic navigation works.
- “Reset step”, “Randomize”, “Back/Next”, “Finish” gated on validity.

### Slice 3 — Step panels (Basic)

Implement panels for:
- Name
- Race
- Class
- Origin
- Attributes (point-buy + presets)
- Skills (allocation)
- Feats/Perks (1–2 picks)
- Alignment

**Deliverables**
- Every step updates blueprint and summary live.
- No dead-end errors; invalid states are explained and recoverable.

### Slice 4 — Derived stats + warnings + synergy hints

- Compute derived stats from blueprint (initial formulas only).
- Hook synergy hints via existing archetype recommendation logic (or a Godot-port if needed).
- Add warnings (e.g., role mismatch) as non-blocking UI.

### Slice 5 — Persistence + “Advanced unlock”

- On `Finish`, emit a `character/create` command into the existing sync/command pipeline.
- Update canonical state to store:
  - `player_profile.characters_created += 1`
  - `characters[]` entry referencing stored blueprint
- Advanced unlock rule: `characters_created >= 1`.

### Slice 6 — Telemetry

- Emit step-level events and finish event via existing telemetry ingest.
- Add “drop-off” and “randomize usage” events.

## Testing

- Unit tests:
  - Blueprint validation (point-buy, required fields, ID constraints).
  - Deterministic replay: same blueprint command yields same canonical state hash.
- Godot headless:
  - Wizard open → complete with presets → finish emits command → state updates.

## Rollout / Guardrails

- Gate wizard behind a feature flag until stable.
- Default to Basic-only on first character; Advanced unlock requires at least one finish.

## Open Implementation Choices (pick during Slice 1)

- Where blueprint schema lives (JS-only + Godot mirror vs generated JSON schema).
- Point-buy curve (simple constant-cost vs escalating cost per point).
- Whether “Archetype system” is a direct choice now or purely a recommendation until later.

