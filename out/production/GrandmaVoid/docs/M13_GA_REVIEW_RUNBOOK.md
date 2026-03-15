# M13 GA Review Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Generate GA review notes and postmortem checklist after closeout dossier and operating playbook are available.

Required upstream artifacts:

- M13 closeout dossier (`PASS` + `COMPLETE`)
- M13 post-launch playbook (`PASS` + `OPS_READY`)
- M13 GA handoff package (`PASS` + `READY_FOR_GA`)
- M13 full enablement audit (`PASS` + `FULLY_ENABLED`)
- M13 sign-off register (`PASS` + `APPROVED`)

## Command

```bash
npm run report:ga:review -- --release-id <release-tag-or-id>
```

Output artifact:

- `docs/reports/m13_ga_review_notes_<YYYY-MM-DD>.md`

## Exit Criteria

- Review notes status is `PASS`.
- Decision is `GA_CONFIRMED`.
- Postmortem checklist is attached to handoff packet.
