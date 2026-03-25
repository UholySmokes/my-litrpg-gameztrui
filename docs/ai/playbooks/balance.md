# Balance Playbook

Use this for evidence-based balance tuning, formula corrections, scaling adjustments, and conservative economy or progression changes.

## Default Setup

- Operator: Codex
- Model: `gpt-5.4`
- Reasoning: `high`
- Hosting: `cloud`
- Compatibility specialization: `.claude/agents/balancesmith-strict.md`

## Working Rules

1. Start from repo evidence: reports, tests, data files, configs, or player-facing balance docs.
2. Prefer parameter tuning over structural redesign.
3. Preserve save compatibility and class identity unless explicitly approved otherwise.
4. Validate with the narrowest useful smoke tests or simulation scripts.

## High-Value Sources

- `packages/game-core/src/data/`
- `packages/game-core/src/systems/`
- `docs/xp_balance.md`
- `audit_report.md`
- simulation and validation scripts under `scripts/`
