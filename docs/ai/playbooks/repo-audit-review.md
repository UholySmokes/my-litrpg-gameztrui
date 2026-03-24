# Repo Audit And Review Playbook

Use this for code review, discrepancy hunts, ground-truth audits, workflow drift checks, and repo-health validation.

## Default Setup

- Operator: Codex
- Model: `gpt-5.4`
- Reasoning: `high`
- Hosting: `cloud`
- Compatibility specialization: `.windsurf/skills/integrityaudit/SKILL.md`

## Working Rules

1. Findings come first, ordered by severity.
2. Prefer exact file citations and concrete behavioral risk over broad style commentary.
3. Use repo truth, not aspirational docs, as the deciding factor.
4. When the task is about AI workspace policy, run `npm run ai:check`.
