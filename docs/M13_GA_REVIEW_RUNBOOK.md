# M13 GA Review Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Generate GA review notes and postmortem checklist after closeout dossier and operating playbook are available.

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
