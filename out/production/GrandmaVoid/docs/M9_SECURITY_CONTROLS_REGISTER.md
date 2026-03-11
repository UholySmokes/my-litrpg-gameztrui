# M9 Security Controls Register

Status: Active  
Last updated: 2026-02-24

## Scope

This register tracks M9 security control evidence for dependency audit findings, owner assignment, and remediation due dates.

## Audit Commands

```bash
npm audit --audit-level=moderate
npm --prefix functions audit --audit-level=moderate
```

Snapshot from 2026-02-24:

- Root workspace: `5` findings (`4` high, `1` moderate)
- `functions/`: `3` findings (`1` critical, `1` high, `1` moderate)

## Security Issue Register

| ID | Severity | Surface | Finding | Owner | Due date | Status | Mitigation plan |
|----|----------|---------|---------|-------|----------|--------|-----------------|
| SEC-2026-001 | High | Tooling/CI root dependency (`firebase-tools@14.27.0`) | `tar` transitive advisories (path traversal and overwrite classes) affecting versions currently pulled by CLI tooling | DevOps Lead | 2026-03-07 | Open | Upgrade to `firebase-tools@15.7.0`, validate emulator startup + CI jobs, then re-run audits |
| SEC-2026-002 | Critical | Backend runtime (`functions/`) and root runtime deps (`firebase-admin -> @google-cloud/storage -> fast-xml-parser`) | `fast-xml-parser` DoS/entity handling advisories (critical in `functions`) | Backend Lead | 2026-03-03 | Open (Blocker) | Upgrade dependency chain to patched `fast-xml-parser`; if upstream lag persists, pin patched transitive version and run functions regression suite |
| SEC-2026-003 | High | Tooling and lint/test graph (`eslint`, parser stacks, and related `minimatch` consumers) | `minimatch` ReDoS advisories in transitive dependency graph | Platform Engineer | 2026-03-14 | Open | Update eslint/parser stacks to versions with patched `minimatch`; verify lint + test lanes |
| SEC-2026-004 | Moderate | Schema/tooling dependency graph (`ajv` transitive) | `ajv` ReDoS advisory in transitive path | Platform Engineer | 2026-03-14 | Open | Upgrade affected dependency chains and confirm no schema validation regressions |

## Control Checklist

- [x] Security audit commands are executable in local and CI contexts.
- [x] Findings are triaged with severity, owner, and due date.
- [x] Critical findings are explicitly called out as release blockers.
- [ ] Remediation PRs merged for all open findings.
- [ ] Re-audit passes with no unresolved critical/high findings at gate close.

## Gate Rule for M9 -> M10

M9 is not ready to close while `SEC-2026-002` remains open because RC policy requires no unresolved critical findings.
