# M11 Alert Tuning Profile

Status: Active  
Last updated: 2026-02-25

## Goal

Define warning and critical thresholds used to monitor internal canary stability and decide whether to hold or advance.

## Thresholds

Critical thresholds (canary-blocking when sustained):

- Command latency p95 `> 350ms`
- Sync error rate `> 1.00%`
- State hash divergence `> 0.10%`
- Telemetry ingest success `< 99.00%`

Warning thresholds (early trend detection):

- Command latency p95 `> 300ms`
- Sync error rate `> 0.75%`
- State hash divergence `> 0.05%`
- Telemetry ingest success `< 99.30%`

## Escalation Windows

- Warning escalation: warning threshold breached on 2 consecutive days.
- Critical escalation: critical threshold breached on 2 consecutive days or any unresolved Sev-1/Sev-2 incident.

## Reporting Command

```bash
npm run report:canary:alerts -- --input docs/reports/m11_canary_inputs_<YYYY-MM-DD>.json
```

Output artifact:

- `docs/reports/m11_alert_tuning_<YYYY-MM-DD>.md`
