# M13 Post-Launch Operating Playbook Runbook

Status: Draft (execution-ready baseline)  
Last updated: 2026-02-25

## Objective

Generate and publish the post-launch operating playbook used by on-call and release owners during the first production week.

## Inputs

- Closeout input JSON (`docs/reports/m13_closeout_inputs_<YYYY-MM-DD>.json`)
- M13 closeout dossier report

## Command

```bash
npm run report:ga:playbook -- --input docs/reports/m13_closeout_inputs_<YYYY-MM-DD>.json
```

Output artifact:

- `docs/reports/m13_post_launch_operating_playbook_<YYYY-MM-DD>.md`

## Exit Criteria

- Playbook status is `PASS`.
- Closeout dossier linkage is healthy (`PASS` + `COMPLETE`).
- Owner roster and escalation path are documented for first 7 days post-launch.
