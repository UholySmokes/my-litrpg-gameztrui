# M12 Limited Percentage Rollout Policy

Status: Active  
Last updated: 2026-02-25

## Purpose

Control external exposure during M12 by enforcing deterministic percentage gating on sync routes.

## Route Scope

- `POST /api/sync/commit`
- `POST /api/sync/commit-batch`
- `POST /api/sync/command`
- `POST /api/sync/action`
- `GET /api/sync/pull`
- `GET /api/sync/replay`

## Environment Controls

- `LIMITED_ROLLOUT_MODE`
  - `off`: no percentage restriction.
  - `monitor`: reserved for observability-only mode (no blocking).
  - `enforce`: apply rollout percentage gate.
- `LIMITED_ROLLOUT_PERCENTAGE` (or `ROLLOUT_PERCENTAGE`)
  - Integer `0..100`.
  - Required when `LIMITED_ROLLOUT_MODE=enforce`.
- `LIMITED_ROLLOUT_ALLOWLIST`
  - Comma-separated user IDs/emails that bypass percentage gating.
- `LIMITED_ROLLOUT_SALT`
  - Optional hash salt for stable bucketing.
- `RUNTIME_ROLLOUT_STAGE` / `ROLLOUT_STAGE`
  - If set to `m12_limited` or `m12_percentage` and mode is unset, enforcement is inferred.

## Enforcement Semantics

1. Missing/invalid percentage in enforce mode returns `503` (`LIMITED_ROLLOUT_PERCENTAGE_INVALID`).
2. Each user is assigned to a stable bucket `0..99`.
3. Request is allowed when `bucket < LIMITED_ROLLOUT_PERCENTAGE`.
4. Non-allowlisted users outside the window return `403` (`LIMITED_ROLLOUT_DENIED`).
5. Allowlisted users always bypass the percentage gate.

## Operational Ramp

- Step 1: `LIMITED_ROLLOUT_PERCENTAGE=10`
- Step 2: `LIMITED_ROLLOUT_PERCENTAGE=25`
- Step 3: `LIMITED_ROLLOUT_PERCENTAGE=50`

For each step, advance only after guardrails hold and rollback verification remains green.
