# M11 Canary Enablement Policy

Status: Active  
Last updated: 2026-02-25

## Purpose

Define how internal canary access is enforced for sync gameplay routes during M11.

## Scope

Canary enforcement applies to:

- `POST /api/sync/commit`
- `POST /api/sync/commit-batch`
- `POST /api/sync/command`
- `POST /api/sync/action`
- `GET /api/sync/pull`
- `GET /api/sync/replay`

## Environment Controls

- `INTERNAL_CANARY_MODE`
  - `off`: no canary access restriction.
  - `monitor`: reserved for observability-only mode (no blocking).
  - `enforce`: block all non-allowlisted users.
- `INTERNAL_CANARY_ALLOWLIST`
  - Comma-separated user IDs and/or emails.
  - Required when `INTERNAL_CANARY_MODE=enforce`.
- `RUNTIME_ROLLOUT_STAGE` (or `ROLLOUT_STAGE`)
  - Optional stage label included in error responses.
  - If `INTERNAL_CANARY_MODE` is unset and rollout stage is `m11_canary`, mode infers to `enforce`.

## Enforcement Behavior

When `INTERNAL_CANARY_MODE=enforce`:

1. If allowlist is empty, sync routes return `503` with `CANARY_ALLOWLIST_EMPTY`.
2. If user is not allowlisted, sync routes return `403` with `CANARY_ACCESS_DENIED`.
3. Allowlisted users proceed normally.

## Operational Notes

- Fail-closed behavior is intentional during internal canary to avoid accidental broad exposure.
- Keep allowlist changes audited (PR + change ticket) and time-bound to canary window.
- After M11, switch `INTERNAL_CANARY_MODE=off` before M12 percentage rollout controls take over.
