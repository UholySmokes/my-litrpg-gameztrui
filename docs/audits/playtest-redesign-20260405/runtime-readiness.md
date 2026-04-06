# Runtime Readiness Brief

## Scope

- Task: T1 for `playtest-redesign-20260405`
- Target flow: current browser root flow at `/`
- Active shell boundary: `App.jsx -> GameUIRoot.jsx -> CharacterHub / CharacterCreationShell / AdventureShell`

## Likely Local URL

- Primary local target: `http://127.0.0.1:5173/`
  - Matches `docs/PRD.yaml` environment notes.
  - Matches `npm run dev` in `package.json` (`vite --host 127.0.0.1 --port 5173 --strictPort`).
- Paired local shell when Firebase emulators are running: `http://127.0.0.1:5000/`
  - Hosting emulator serves the same SPA root and rewrites `/api/**` through Firebase.
- Current environment check:
  - `http://127.0.0.1:5173/` responded and advanced from boot shell into the Arrival Chamber.
  - `http://127.0.0.1:5000/` also responded and showed the same Arrival Chamber shell.

## Browser Shell Launch Conditions

- Web gameplay gate:
  - In dev builds, browser gameplay is always enabled by `src/core/WebGameplayGate.js` because `import.meta.env.DEV` returns `true`.
  - Outside dev, gameplay stays enabled by default unless `VITE_WEB_GAMEPLAY_ENABLED` or `VITE_ENABLE_WEB_GAMEPLAY` is set explicitly to a false value in runtime or build config.
  - `public/runtime-config.js` currently sets `VITE_WEB_GAMEPLAY_ENABLED = "true"`.
- Entry behavior in `src/App.jsx`:
  - If gameplay is disabled, `/` stops at the disabled `EntryShell` and the playtest is blocked.
  - If gameplay is enabled and a user context exists, `/` proceeds into `GameUI`.
  - If gameplay is enabled but no user context exists, `/` shows auth/local-run entry via `AuthUI`.
- Current environment result:
  - The shell reached `CharacterHub` directly and displayed bound profile `local-dev@example.com`, which indicates a dev-user path is active and root launch is currently playable without interactive sign-in.

## Gating Conditions That Affect Playability

- Authentication gate:
  - Play can proceed immediately when a dev user is present (`VITE_DEV_USER_ID` / `VITE_DEV_USER_EMAIL`), when `localGame=true` is present in browser storage, or when Firebase auth is configured and signed in.
  - Without any of those, the user must clear the auth shell before gameplay starts.
- Save reset gate:
  - `GameUIRoot` blocks gameplay behind `SaveResetGate` until `useGameUiSaveController` reports `saveResetState.ready`.
  - Local or dev users are treated as local-ready and do not require remote save reset.
  - Authenticated non-dev users may be blocked if remote legacy progress reset fails.
- Narrative/runtime gate:
  - The shell itself does not require the narrator service to render the hub.
  - Character creation completion attempts to generate initial narrative, but it catches failure and falls back to a system message, so shell progression is still possible.
  - Early gameplay quality review depends on narrator endpoints being reachable if the team wants live narrative behavior rather than degraded fallback behavior.

## Relevant Flags And Paired Services

- Browser gameplay outside dev:
  - Explicit `true` values on `VITE_WEB_GAMEPLAY_ENABLED` or `VITE_ENABLE_WEB_GAMEPLAY` keep intent unambiguous, but they are not strictly required because the gate defaults to enabled unless one of those flags is set false.
- Required for no-sign-in local browser runs:
  - `VITE_DEV_USER_ID`
  - Optional: `VITE_DEV_USER_EMAIL`
- Required for same-origin narration/save APIs in local development:
  - Vite path: `npm run dev` on `127.0.0.1:5173`
  - API/emulator path: `npm run dev:api` on Firebase hosting/functions emulators
  - Combined path: `npm run dev:stack`
- API routing expectations:
  - Vite proxies `/api` to `http://localhost:5000` via `vite.config.js`.
  - Firebase hosting rewrites `/api/**` in `firebase.json` to functions routes.
  - `public/runtime-config.js` points narration at same-origin `/api/narrate`.

## Likely Blockers

- Hard blocker: web gameplay is explicitly disabled outside dev.
  - Result: `/` remains on the disabled `EntryShell` and no gameplay conclusions are valid.
- Hard blocker: authenticated non-dev run hits a failed remote save reset.
  - Result: `SaveResetGate` blocks progression until the reset succeeds or is retried.
- Practical blocker for full story-quality review: narrator endpoints are missing or unreachable.
  - Result: onboarding can still continue with fallback text, but story/narrative conclusions are limited.
- Practical blocker for auth-required cloud-save flow: Firebase auth is not configured and no dev/local path is supplied.
  - Result: run stalls at auth onboarding instead of entering gameplay.

## Stop-Point Framing

- Mandatory completion point: immediate post-creation level 1 readiness.
  - This is the minimum success bar for downstream playtest execution.
- Optional extended checkpoint: level 2 at 100 XP.
  - This is the first earned milestone and should be treated as additive evidence, not a prerequisite for the core audit.

## Readiness Verdict

- Root runtime at `/` is currently reachable and launches the active browser shell.
- The most likely local execution URL remains `http://127.0.0.1:5173/`.
- In the current environment, the browser shell is already entering via a dev-user path, so startup reachability is not the primary risk.
- The main downstream risk is not root boot failure; it is whether narration and any authenticated remote-save behavior are available for a full-fidelity early gameplay review.
