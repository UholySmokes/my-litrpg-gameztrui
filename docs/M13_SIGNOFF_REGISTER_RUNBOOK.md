# M13 Sign-off Register Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Capture named M13 approvals against the final GA artifact set.

## Command

```bash
npm run report:ga:signoff -- --release-id <release-id> --tech-lead <name> --sre <name> --pm <name> --release-manager <name>
```

Output artifact:

- `docs/reports/m13_signoff_register_<YYYY-MM-DD>.md`

## Exit Criteria

- Sign-off register status is `PASS`.
- Decision is `APPROVED`.
- All mandatory signers are recorded.
