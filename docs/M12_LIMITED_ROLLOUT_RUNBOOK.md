# M12 Limited Rollout Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Execute controlled percentage expansion (`10% -> 25% -> 50%`) with live rollback verification and explicit gate approvals.

## Entry Criteria

- M11 canary decision is `ADVANCE`.
- Limited rollout controls are configured (`docs/M12_LIMITED_ROLLOUT_POLICY.md`).
- Rollback drill command and owner on-call are confirmed.
- Step input artifact is prepared for gate reporting.

## Rollout Controls

Set rollout stage and percentage gate:

```bash
LIMITED_ROLLOUT_MODE=enforce
LIMITED_ROLLOUT_PERCENTAGE=<10|25|50>
RUNTIME_ROLLOUT_STAGE=m12_limited
```

Optional bypass for internal responders:

```bash
LIMITED_ROLLOUT_ALLOWLIST=<comma-separated-uid-or-email-list>
```

## Checklist Report

Generate gate checklist from structured step inputs:

```bash
npm run report:rollout:m12 -- --input docs/reports/m12_rollout_inputs_<YYYY-MM-DD>.json
```

Sample input reference: `docs/reports/m12_rollout_inputs_sample.json`

Output artifact:

- `docs/reports/m12_rollout_gate_checklist_<YYYY-MM-DD>.md`

## Exit Criteria for M12

- All three steps (`10%`, `25%`, `50%`) pass guardrails.
- No unresolved Sev-1/Sev-2 incidents at each step close.
- Rollback verification completed for each step.
- Rollout gate checklist signed by SRE + PM + Release Manager.
