# M13 GA Handoff Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Finalize GA launch handoff with complete stage evidence and ownership documentation.

## Entry Criteria

- M12 rollout gate checklist decision is `ADVANCE`.
- Latest live rollback verification is `PASS`.
- M11 canary decision memo is available and healthy.
- M13 full enablement audit decision is `FULLY_ENABLED`.

Generate full enablement audit before GA handoff:

```bash
npm run report:ga:enablement
```

## Generate GA Handoff Package

Command:

```bash
npm run report:ga:handoff -- --release-id <release-tag-or-id>
```

Output artifact:

- `docs/reports/m13_ga_handoff_package_<YYYY-MM-DD>.md`

The generator links latest M10/M11/M12/M13 readiness artifacts and computes an initial `READY_FOR_GA` or `HOLD` decision.

## Exit Criteria for M13

- GA handoff package status `PASS`.
- Release timestamp + owners recorded.
- Phase 5 backlog triage documented.
- Operating runbooks linked with named owners.

Integrated validation command:

```bash
npm run test:ga:readiness
```
