# M13 Rollout Logs Summary Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Publish a consolidated M11-M13 rollout logs and incident summary artifact for archival and handoff.

## Command

```bash
npm run report:ga:rollout-logs
```

Output artifact:

- `docs/reports/m13_rollout_logs_summary_<YYYY-MM-DD>.md`

## Exit Criteria

- Summary report status is `PASS`.
- Canary, rollout, rollback, and GA review artifacts are present and healthy.
