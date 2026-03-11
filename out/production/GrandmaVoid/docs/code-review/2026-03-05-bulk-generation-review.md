# Code Review: Bulk Generation API & Workers

**Ready for Production**: Yes (with configured env guardrails)  
**Critical Issues**: 0

## Scope

- `functions/lib/bulk-generation-service.js`
- `functions/lib/bulk-generation-handlers.js`
- `functions/lib/bulk-gen-store.js`
- `functions/lib/api-router.js`

Review framework used:

- OWASP Top 10 focus for API access control and external integrations
- Zero Trust checks for internal endpoints

## Priority 1 (Must Fix)

None found after hardening pass.

## Priority 2 (Fixed in this pass)

1. Internal token compare was plain string equality.
   - Risk: side-channel leakage potential.
   - Fix: switched to constant-time comparison with `crypto.timingSafeEqual`.

2. Run start accepted unbounded generation counts.
   - Risk: abuse or accidental oversized runs.
   - Fix: added hard max caps (`BULK_GEN_MAX_*`) and clamped requested counts.

## Recommended Operational Controls

- Keep `BULK_GEN_INTERNAL_TOKEN` set and rotated.
- Set `BULK_GEN_ALLOWED_USER_IDS` explicitly.
- Set `BULK_GEN_CREDIT_EXPIRY_DATE` and `BULK_GEN_STOP_THRESHOLD_EUR`.
- Keep Cloud Billing alerts at 85/90/95% and route to budget alert endpoint.

## Validation

- `npm --prefix functions run lint` passed.
- `npm --prefix functions run typecheck` passed.
