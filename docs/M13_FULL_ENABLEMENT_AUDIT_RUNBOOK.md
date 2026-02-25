# M13 Full Enablement Audit Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Capture explicit evidence that runtime rollout gates are configured for 100% enablement.

## Command

```bash
npm run report:ga:enablement
```

Output artifact:

- `docs/reports/m13_full_enablement_audit_<YYYY-MM-DD>.md`

## Pass Criteria

- Decision is `FULLY_ENABLED`.
- `INTERNAL_CANARY_MODE` is not `enforce`.
- `LIMITED_ROLLOUT_MODE` is `off`, or `enforce` with `100%`.
- Stage label is not stuck on M11/M12 phases.
