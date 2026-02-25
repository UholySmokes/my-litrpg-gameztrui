# M10 Staging Reliability Soak Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-24

## Objective

Execute staging reliability checks required for M10:

1. 100-run parity confidence checks remain green.
2. Auth expiry/retry path stays stable.
3. Reconnect/reconcile loop does not corrupt canonical sequence.
4. Rollback drill can restore last known-good behavior.

## Entry Criteria

- M9 security register reviewed (`docs/M9_SECURITY_CONTROLS_REGISTER.md`)
- Telemetry SLO policy active (`docs/M9_TELEMETRY_SLO_RETRY_POLICY.md`)
- Nightly replay/load lane green in latest run

## Baseline Smoke Harness

Target probe (required before soak run):

```bash
npm run test:staging:endpoint-probe
```

Target selection policy:

- Primary automation host: `https://my-litrpg-gameztrui-3416-da75c.web.app`
- Manual custom-domain checks: `https://void-verse.com`
- See `docs/M10_STAGING_TARGET_POLICY.md`

Command:

```bash
npm run test:staging:soak-smoke
```

Artifacts:

- `docs/reports/m10_staging_soak_smoke_<YYYY-MM-DD>.md`
- `docs/reports/m10_staging_endpoint_probe_<YYYY-MM-DD>.md`
- `docs/reports/telemetry_ingest_health_smoke_<YYYY-MM-DD>.md`

Generate sign-off packet:

```bash
npm run report:staging:signoff
```

## Manual Drill Checklist

1. Auth expiry drill:
   - Force token refresh path and verify one retry on `401`.
   - Confirm safe mode toggles and recoveries are emitted.
2. Reconnect storm drill:
   - Simulate repeated disconnect/reconnect cycles while commands queue.
   - Validate no duplicate command application and no sequence rewind.
3. Rollback drill:
   - Revert to last known-good deployment package.
   - Run soak smoke harness and compare parity hash stability.
   - Validate rollback signature parity:

```bash
npm run test:rollback:parity
```

## Exit Criteria for M10

- Smoke harness PASS on staging branch.
- No unresolved Sev-1/Sev-2 incidents during soak window.
- Rollback rehearsal completed and documented with timestamps.
