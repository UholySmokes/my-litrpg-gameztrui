## Objectives
- Fix parsing and hydration issues in AppWithHydrationFix.jsx
- Verify SSR/SSG safety and hydration stability across scenarios
- Triage and resolve lint diagnostics that materially affect correctness and maintainability

## Findings
- AppWithHydrationFix.jsx uses useRef without importing it, causing parser errors and breaking builds.
- Imports in AppWithHydrationFix.jsx omit file extensions, violating strict ESM rule and risking resolution issues.
- Hydration logic is generally sound (effects isolated to useEffect, window/localStorage guarded), but initial render and auth/localGame transitions need deterministic behavior to avoid flashes.
- Lint diagnostics for tests/performanceEffects.test.js appear to be parser-related (multiple ", expected" and "Unterminated template literal" on perfectly valid lines), suggesting ESLint parser misconfiguration for JS tests rather than code issues.

## Changes (AppWithHydrationFix.jsx)
- Import useRef from react to resolve parsing errors.
- Convert relative component imports to extension-suffixed ESM imports: ./GameUI.jsx and ./AuthUI.jsx.
- Keep localStorage interactions strictly within useEffect and guarded by typeof window checks.
- Maintain single initialization effect: read localGame flag first, then resolve getCurrentUser; clear localGame on successful authentication.
- Ensure auth subscription clears localGame on logout and prevents race conditions via isMounted ref checks.
- Add JSDoc for state (user, isLocalGame, loading) and handler signatures to improve readability and tooling.

## Verification (Hydration/SSR)
- SSR baseline: server render returns loading skeleton; client hydration runs initAuth in useEffect (no server-side window/localStorage usage).
- Scenarios:
  - Local Game active: isLocalGame set from localStorage in effect, user null → AuthUI suppressed; later auth remains null.
  - Authenticated user: getCurrentUser resolves, sets user, clears localGame; GameUI renders; no intermediate flicker.
  - Logout: onAuthStateChange sets user null and clears localGame deterministically.
- Manual checks: enable localStorage localGame=true, then authenticate → localGame removed; logout → localGame cleared.

## Lint Diagnostics Triage
- Critical: AppWithHydrationFix.jsx parsing errors → fixed by importing useRef and adding ESM extensions.
- Tests/performanceEffects.test.js diagnostics likely due to ESLint parser mismatch for JS in tests:
  - Configure ESLint overrides for tests/**/*.js: parser "espree" or babel-eslint, env { jest: true, node: true }, globals { performance: readonly }.
  - Re-run lint; if errors persist, inspect for hidden characters or CRLF issues and normalize line endings.

## Planned ESLint Config Updates
- Add overrides:
  - files: ["tests/**/*.js"], env: { jest: true, node: true }, parserOptions: { ecmaVersion: 2022, sourceType: "module" }, globals: { performance: "readonly" }.
- Keep strict ESM rule; enforce import extensions for source files.

## Commit Messages
- feat(components): import useRef and enforce ESM extensions in AppWithHydrationFix.jsx; stabilize hydration with guarded localStorage and auth subscription cleanup
- chore(eslint): add test overrides for JS parser/env; declare performance global; normalize CRLF line endings in tests to resolve false-positive parser errors

## Next Steps
- Apply the above code changes to AppWithHydrationFix.jsx.
- Update ESLint config with test overrides.
- Validate by running unit tests and a SSR dev build; quickly smoke test localGame/auth flows.
- If further diagnostics arise, iterate on parser options or per-file ignores for known benign patterns.