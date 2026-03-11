# M9 Telemetry SLO and Retry Policy

Status: Active  
Last updated: 2026-02-24

## 1. Scope

- Ingest endpoint: `POST /api/telemetry`
- Producers: Godot runtime (`godot/scripts/telemetry_reporter.gd`) and web tooling smoke harness
- Review window for M9 gate: trailing 10 nightly runs plus daily smoke checks

## 2. Service-Level Objectives

| SLI | Definition | Target |
|-----|------------|--------|
| Ingest success rate | `accepted / (accepted + dropped + failed)` batches | `>= 99.0%` |
| Ingest latency p95 | p95 request handling time at ingest edge | `<= 250ms` |
| Error budget burn | Failed ingest share against monthly budget | Within `1.0%` monthly budget |

Monthly error budget at 99.0% SLO:

- Availability allowance equivalent: `0.01 * 30 days = 7.2 hours` total budget
- Operational rule: if burn exceeds 50% by day 15, freeze non-critical telemetry changes and prioritize reliability fixes

## 3. Godot Client Retry Policy

Current implementation in `TelemetryReporter.flush(...)`:

1. Send at most `max_batch_size` (`50`) events per flush.
2. On `2xx`, remove sent events and reset retry state.
3. On retriable failures (transport errors, `5xx`, unknown non-2xx not in explicit drop list), keep events queued and apply exponential backoff:
   - Base backoff: `0.5s`
   - Max backoff: `8.0s`
4. On non-retriable status (`400`, `401`, `403`, `404`, `422`), drop current batch to avoid infinite resend loops.

## 4. Alert Thresholds

- Critical alert: ingest success rate `< 99.0%` for two consecutive daily windows.
- Warning alert: p95 ingest latency `> 250ms` for two consecutive nightly runs.
- Release-blocking condition for M9 close: unresolved critical telemetry ingest incidents.

## 5. Operational Checks

Daily:

```bash
npm run test:telemetry:smoke
```

Nightly:

```bash
# Executed by .github/workflows/nightly-replay-load.yml
npm test -- tests/unit/SyncCoreDeterminism.test.js tests/unit/SyncProgressionScenarioHarness.test.js tests/unit/SyncReplayRoute.test.js tests/unit/TelemetryRoute.test.js --runInBand
npm run simulate:nightly
npm run test:telemetry:smoke
```

## 6. Gate Evidence Mapping

- Smoke evidence: `docs/reports/telemetry_ingest_health_smoke_<date>.md`
- Nightly evidence bundle: `nightly-replay-load-artifacts`
- Security linkage: `docs/M9_SECURITY_CONTROLS_REGISTER.md`
