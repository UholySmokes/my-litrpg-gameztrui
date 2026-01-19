## Root Cause
- npm fails due to invalid JSON caused by Git merge conflict markers in package.json at lines 10–20: see [package.json](file:///d:/ai%20t6ext%23/my-litrpg-gameztrui/package.json#L10-L20).
- Additional merge markers exist in source files and will likely break build/runtime:
  - [TalentDefinitions.js](file:///d:/ai%20t6ext%23/my-litrpg-gameztrui/src/systems/skills/TalentDefinitions.js)
  - [GameUI.jsx](file:///d:/ai%20t6ext%23/my-litrpg-gameztrui/src/components/GameUI.jsx)
  - [App.jsx](file:///d:/ai%20t6ext%23/my-litrpg-gameztrui/src/App.jsx)

## Plan
1. Fix package.json JSON
- Remove all conflict markers and merge scripts, keeping a superset:
  - dev: vite
  - build: vite build
  - preview: vite preview
  - lint: eslint .
  - test and simulate scripts from HEAD preserved (jest + sim_*).
- Keep "type": "module" for strict ESM. Validate JSON with a quick parse.

2. Resolve remaining merge conflicts in source files
- Open each conflicted file, reconcile HEAD vs parent segments, and remove markers.
- Ensure imports include file extensions to comply with strict ESM.
- Maintain decoupling between combat logic and UI; avoid UI side effects.

3. Verify local dev server
- Run npm run dev to start Vite and confirm successful compile.
- Open the preview URL and check for hydration issues, logging any SSR-unsafe usages guarded by isMounted.

4. Lint and test
- Run eslint to confirm clean state; fix obvious issues.
- Run jest via script to confirm tests execute with --experimental-vm-modules.

5. Hardening pass (quick)
- Scan for missing ESM extensions and fix.
- Confirm React 19 compatibility in JSX files and hooks usage.

## Outcome
- package.json becomes valid JSON and npm commands work.
- All merge markers removed; repo builds and runs via Vite dev server.
- Lint/tests pass; SSR safety patterns in place.