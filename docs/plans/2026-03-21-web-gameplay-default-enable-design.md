# Web Gameplay Default Enable Design

Date: 2026-03-21

## Goal

Make hosted/runtime web builds start gameplay by default while preserving an explicit tooling-only disable path.

## Approved Direction

- Keep the existing `WebGameplayGate` helper as the source of truth.
- Treat dev builds as enabled.
- Treat explicit env flags as authoritative overrides.
- When no explicit flag is present outside dev, default to enabled.
- Keep the disabled screen for tooling-only builds that set `VITE_WEB_GAMEPLAY_ENABLED=false`.

## Scope

- Update the gate logic in `src/core/WebGameplayGate.js`.
- Update unit coverage in `tests/unit/WebGameplayGate.test.js`.
- Refresh any active docs that still describe the old default-disabled behavior.

## Non-Goals

- Removing the tooling-only mode.
- Reworking the disabled-state UI.
- Changing the build-profile behavior that explicitly forces tooling builds off.

## Risks And Mitigations

- Risk: an environment that previously relied on the implicit disabled default will now launch web gameplay.
- Mitigation: keep explicit `VITE_WEB_GAMEPLAY_ENABLED=false` and `VITE_ENABLE_WEB_GAMEPLAY=false` overrides working exactly as before.

## Validation

- Focused unit tests should show:
  - dev remains enabled
  - no-flag non-dev builds are enabled
  - explicit `true` enables
  - explicit `false` disables
