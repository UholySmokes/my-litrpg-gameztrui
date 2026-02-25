# M11 Internal Canary Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Operate the internal canary window with explicit guardrails and evidence collection:

1. Keep canary metrics inside production guardrails for at least 5 consecutive days.
2. Run and record on-call drills before and during canary.
3. Capture incident handling in a structured log.
4. Produce a canary decision memo (`ADVANCE` or `HOLD`) from auditable inputs.

## Entry Criteria

- M10 staging sign-off packet decision is `ADVANCE`.
- Telemetry ingest SLO policy is active (`docs/M9_TELEMETRY_SLO_RETRY_POLICY.md`).
- On-call rotation and escalation paths are staffed for the canary window.
- Canary input JSON exists for the current review window.

## Guardrails

- Command latency p95: `<= 350ms`
- Sync error rate: `<= 1.00%`
- State hash divergence rate: `<= 0.10%`
- Telemetry ingest success rate: `>= 99.00%`
- Unresolved Sev-1/Sev-2 incidents: `0`
- Successful on-call drills during prep/early canary: `>= 2`

## Input Artifact

Create `docs/reports/m11_canary_inputs_<YYYY-MM-DD>.json` with:

- `window.startDate`, `window.endDate`
- `dailyMetrics` (at least 5 consecutive days)
- `incidents`
- `onCallDrills`

Reference sample: `docs/reports/m11_canary_inputs_sample.json`

## Commands

Generate canary report + incident log:

```bash
npm run report:canary:m11 -- --input docs/reports/m11_canary_inputs_<YYYY-MM-DD>.json
```

Generated artifacts:

- `docs/reports/m11_canary_incident_log_<YYYY-MM-DD>.md`
- `docs/reports/m11_canary_decision_memo_<YYYY-MM-DD>.md`

## Exit Criteria for M11

- 5 consecutive canary days meet all guardrails.
- No unresolved Sev-1/Sev-2 incidents.
- On-call drill evidence recorded with outcomes.
- Canary decision memo signed by Tech Lead + SRE + Release Manager.
