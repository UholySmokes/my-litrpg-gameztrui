---
applyTo: "**/*"
description: "Simple collaboration workflow for a small team (you + Copilot)."
---

# Solo Workflow (Beginner-Friendly)

Use this workflow for all tasks:

1. Understand the request in one sentence before changing code.
2. Make the smallest safe change that solves the request.
3. Avoid unrelated refactors unless asked.
4. Run focused validation first (targeted test, lint, or build check).
5. Report results clearly: what changed, what passed, what is still risky.

Communication rules:
- Keep updates short and concrete.
- If blocked, explain the blocker and propose 1 clear next action.
- For reviews, list findings first (highest risk first).

Change hygiene:
- Prefer editing existing patterns over introducing new patterns.
- Keep comments short and only where logic is non-obvious.
- Do not claim success without verification.
