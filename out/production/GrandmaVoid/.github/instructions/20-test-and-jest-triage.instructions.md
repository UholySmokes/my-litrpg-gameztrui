---
applyTo: "**/*.{js,mjs,cjs,ts,tsx,jsx}"
description: "Reliable test execution and clear Jest triage reporting."
---

# Test and Jest Triage

Use this order:
1. Run the most relevant test file(s) first.
2. If needed, run broader suites.
3. Only run full workspace tests when required.

When VS Code Jest shows `unknown` tests:
1. Run tests once outside watch mode to refresh results.
2. Restart Jest runner if status stays stale.
3. Report exact counts: passed, failed, skipped, unknown.

Reporting format (short):
- Command run
- Result counts
- Failing test names (if any)
- Next action

Important:
- Never say tests are green unless they actually ran and passed.
