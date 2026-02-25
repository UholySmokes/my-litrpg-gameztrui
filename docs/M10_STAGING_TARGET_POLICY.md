# M10 Staging Target Policy

Status: Active  
Last updated: 2026-02-24

## Scope

Defines which host to use for staging soak automation in the current Firebase project.

## Candidates

- Firebase-managed host: `https://my-litrpg-gameztrui-3416-da75c.web.app`
- Custom domain: `https://void-verse.com`

## Decision

- Primary staging automation target: `web.app` host.
- Secondary manual UX check target: custom domain.

## Rationale

1. Both hosts currently map to the same Hosting origin (`199.36.158.100`), but `web.app` is the Firebase canonical host.
2. `web.app` avoids custom-domain DNS/certificate drift as a hidden variable in reliability checks.
3. For long-term operations, this keeps staging automation focused on platform behavior rather than domain-management issues.

## Probe Command

```bash
npm run test:staging:endpoint-probe
```

Probe result artifact:

- `docs/reports/m10_staging_endpoint_probe_<YYYY-MM-DD>.md`

## Operational Rule

- Run endpoint probe before staging soak sign-off generation.
- If `web.app` probe fails and custom domain passes, block sign-off and investigate Hosting/domain config drift.
