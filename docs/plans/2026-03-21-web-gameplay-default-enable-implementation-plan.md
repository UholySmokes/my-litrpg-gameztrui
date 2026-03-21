# Web Gameplay Default Enable Implementation Plan

Date: 2026-03-21
Depends on: `docs/plans/2026-03-21-web-gameplay-default-enable-design.md`

## Target Outcome

- Non-dev web builds launch gameplay when no explicit gameplay flag is supplied.
- Tooling-only builds still disable gameplay by setting the env override to `false`.
- Tests and active docs reflect the new default.

## Implementation Steps

### Slice 1 - Gate Logic

- Update `src/core/WebGameplayGate.js` so the fallback path returns `true` instead of `false`.
- Preserve the current precedence order for explicit runtime/build flags.

### Slice 2 - Coverage

- Update `tests/unit/WebGameplayGate.test.js` to assert enabled-by-default outside dev.
- Keep explicit true/false parsing coverage intact.

### Slice 3 - Docs

- Refresh active docs or repo notes that still state production web gameplay is disabled by default.
- Leave historical rollout artifacts alone unless they are still used as current guidance.

### Slice 4 - Verification

- Run the focused unit test for `WebGameplayGate`.
- Summarize any remaining rollout risk around environments that depended on the old implicit default.

## Model Recommendation

- Optimal model: `gpt-5.4-mini`
- Reasoning strength: `medium`
- Execution location: `cloud`
