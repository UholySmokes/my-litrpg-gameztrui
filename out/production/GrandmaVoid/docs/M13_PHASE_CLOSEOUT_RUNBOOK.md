# M13 Phase Closeout Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Publish a complete M13 closeout dossier with operating ownership and Phase 5 backlog triage.

## Inputs

- GA handoff package report from `npm run report:ga:handoff`
- Closeout input JSON with owners + backlog triage

Sample input:

- `docs/reports/m13_closeout_inputs_sample.json`

## Command

```bash
npm run report:ga:closeout -- --input docs/reports/m13_closeout_inputs_<YYYY-MM-DD>.json
```

Output artifact:

- `docs/reports/m13_phase_closeout_dossier_<YYYY-MM-DD>.md`

## Exit Criteria for M13 Closeout

- Dossier status is `PASS`.
- GA handoff linkage is healthy (`PASS` + `READY_FOR_GA`).
- Primary and secondary owners are assigned for core operating areas.
- Phase 5 backlog triage list has owners and priority bands.
