# Fast Feedback Workflow (PR Fast + Post-Merge Quality Gates)

## Context / Problem

The repo has strong validation coverage (lint/typecheck/unit tests/contracts/Godot/perf/simulations), but running the entire suite on every pull request slows iteration and creates unnecessary CI work for docs-only changes.

## Goals

- Provide a **fast feedback loop** for most PRs (minutes, not tens of minutes).
- Keep a **high-confidence full suite** running automatically after merges.
- Make **docs-only changes** cheap (skip installs/checks).
- Reduce “works locally / fails in CI” drift by standardizing Node.

## Non-goals

- Changing test frameworks (Jest stays).
- Adding new deploy/release automation.
- Enforcing git hooks (checks remain manual + CI enforced).

## Proposed workflow

### Local developer loop

- Standard Node version via `.nvmrc`.
- One command for the common inner-loop:
  - `npm run check` (lint + typecheck + key validations + smoke tests)
- Targeted checks when needed:
  - `npm run check:functions`
  - `npm run check:godot:smoke`

### CI lanes

1) **PR Fast** (required merge gate)

- Runs on `pull_request`.
- Uses `dorny/paths-filter` to detect which parts changed.
- If docs-only: exits quickly without installing dependencies.
- If app code changed: runs `npm run check`.
- If `functions/**` changed: runs functions typecheck.
- If `firestore.rules` changed: runs emulator rules test (security gate).
- If `godot/**` changed: runs Godot headless smoke.

2) **Quality Gates** (post-merge full suite)

- Runs on `push` to `main`/`master` and `workflow_dispatch`.
- Contains the full existing battery: Godot headless + perf probe, full unit tests, Firestore emulator rules test, contract/registry/archetype validations, builds, and audits.

3) **Nightly Replay and Load**

- Keeps deterministic replay + simulation coverage on a schedule.

## Node version contract

- Standardize repo tooling on Node `20` via `.nvmrc`.
- GitHub Actions uses `node-version-file: .nvmrc` for consistency.

## Rollout / Repo settings

- In GitHub branch protection for `main`, require the **PR Fast** check.
- Do not require the post-merge **Quality Gates** check for PR merges; it is a post-merge safety net.
- Treat Quality Gates failures on `main` as release-blocking and fix-forward/revert quickly.
