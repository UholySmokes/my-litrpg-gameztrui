Original prompt: PLEASE IMPLEMENT THIS PLAN:
# Void-Verse Web Frontend Rewrite Plan
#
## Summary
# Redesign the entire web product as a single responsive, mythic sci-fantasy app that feels like a shipped browser RPG, not a windowed toolbench. The implementation will be a big-bang frontend replacement on one branch, but it will preserve gameplay, narrative, save, and auth contracts so the rewrite changes presentation and flow rather than core game behavior.
#
## Implementation Changes
# - Replace the current split desktop/mobile frontend with one unified responsive shell:
#   - `EntryShell` for auth, local play, resume, PWA/install, and loading/error states.
#   - `CharacterHub` for character selection and entry into creation.
#   - `CharacterCreationFlow` as a dedicated full-screen onboarding journey, not a `WindowManager` layout.
#   - `AdventureShell` as the core in-run screen with a central narrative/action stage, anchored status/combat regions, and responsive drawers/modals for inventory, quests, shop, crafting, bestiary, titles, saves, and status.
# - Remove the floating-window metaphor from gameplay and creation entirely. No dock/drag/resize shell survives in the new UI.
# - Remove the separate mobile product branch. `GameModeShell` should converge to one responsive tree instead of choosing between desktop `GameMode` and `MobileGameMode`.
# - Keep these runtime contracts intact during the rewrite:
#   - `useGameEngine()` remains the gameplay/state source of truth.
#   - `useNarrative()` remains the input, AI narration, suggestion, and opening-scene runtime.
#   - save/reset/autosave/cloud-save behavior remains intact.
#   - existing interaction handlers remain the bridge between UI controls and gameplay events.
# - Refactor `GameUIRoot` into a thinner orchestration layer that builds explicit view models for entry, creation, and adventure instead of one large prop bag.
# - Hide internal tooling from the player surface by default. `AdminTools` becomes dev-only and never appears in the shipped player shell.
# - Keep the current holo/system identity, but mature it into a darker runic-codex visual system:
#   - obsidian and deep-metal surfaces
#   - luminous cyan/gold/system accents
#   - stronger hierarchy, less glass clutter
#   - bespoke typography/tokens for headers, body, HUD, and lore surfaces
# - Treat the current character-selection design intent as part of the live product, not an orphaned concept. The new onboarding must lead with strong character readability, clear CTA hierarchy, and fast first-run comprehension.
# - Clear or ignore legacy persisted layout keys when the new shell ships so old `WindowManager` state cannot corrupt the new experience.
# - No gameplay schema, canonical save-state, or engine contract changes are part of this rewrite unless a UI bug exposes a real contract defect.
#
## Public Interfaces / Contract Decisions
# - Preserve auth/local-play boot behavior in `src/App.jsx` conceptually, but move presentation into `EntryShell`.
# - Preserve creation finalization and character blueprint behavior; only the creation layout and interaction model change.
# - Preserve action submission semantics: command input, suggested actions, combat actions, item use, skill use, save/load, and autosave must keep working through the existing handlers.
# - End state:
#   - `WindowManager`, `useWindowLayout`, and the standalone mobile tab shell are removed from the active product path.
#   - the web client has one responsive information architecture across desktop and mobile.
#
## Delivery Shape
# - Build the new frontend as a full replacement branch, then swap the old shell out in one merge after parity is reached.
# - Implement in this order:
#   1. New design tokens and shared shell primitives.
#   2. `EntryShell` and auth/resume/PWA presentation.
#   3. `CharacterHub` and `CharacterCreationFlow`.
#   4. `AdventureShell` with narrative, command input, suggestions, vitals, combat, and quick actions.
#   5. Drawer/modal subsystem surfaces for inventory, quests, status, saves, crafting, shop, bestiary, titles, and system/progression.
#   6. Remove old window/mobile infrastructure and legacy layout persistence.
# - Use adapter wrappers during the rewrite so existing gameplay panels can be mounted inside the new shell until each surface is fully redesigned.
#
## Test Plan
# - Unit tests for shell mode selection, entry-state gating, and any new view-model selectors.
# - Integration tests for:
#   - auth vs local-play entry
#   - autosave resume and load-state restoration
#   - character creation completion
#   - command submission and narrative response flow
#   - combat entry/exit and quick actions
#   - opening subsystem drawers/modals from the unified shell
# - Playwright smoke coverage for desktop and mobile breakpoints across:
#   - first load
#   - sign-in/local start
#   - creation start-to-finish
#   - entering adventure
#   - combat visibility
#   - save/load access
# - Regression check that legacy mobile bugs are gone:
#   - submit handler works on small screens
#   - combat state detection matches desktop semantics
#   - menu/status/shop/save actions open correctly
# - Acceptance criteria:
#   - one responsive frontend tree
#   - no floating windows
#   - no player-visible admin tooling
#   - first-time player can reach playable adventure cleanly on desktop and mobile
#   - existing save/narrative/gameplay behavior remains functional

Notes:
- Dirty worktree existed before implementation; avoid reverting unrelated generated/DataConnect changes.
- Active rewrite boundary: UI shell/composition only; preserve engine, narrative, save contracts.

Progress update:
- Added the runic shell rewrite across entry, hub, creation, and adventure surfaces.
- Removed the active `WindowManager`/mobile split from the player path and replaced it with one responsive shell tree.
- Added shell helpers and tests:
  - `src/components/shell/`
  - `src/styles/runic-shell.css`
  - `tests/unit/ShellState.test.js`
- Reworked `CharacterCreationMode` into a full-screen flow and kept the existing creation/runtime hooks intact.
- Reworked `GameUIRoot` into hub/creation/adventure orchestration and kept save, autosave, narrative, and interaction handlers wired through.

Validation update:
- Fixed the PWA install banner so it only appears on the hub surface and no longer intercepts creation-flow clicks.
- Fixed `NarrativeMemoryPanel` key/latest-entry handling so creation memory no longer duplicates the latest line or throws React key warnings.
- Fixed the creation-to-adventure handoff so the creation shell unmounts after avatar initialization instead of rendering alongside adventure.
- Verified with live Playwright/browser runs:
  - desktop auth -> hub -> full creation -> adventure
  - mobile auth -> hub -> full creation -> adventure
  - status modal opens from adventure
  - save/load modal opens from adventure
  - command terminal recovers to `EXECUTE` after initial scene generation
  - local-play command submission still produces offline fallback narration when the proxied narrator API rejects dev auth
- Generated screenshots/artifacts under `output/web-game/`, including:
  - `auth-desktop.png`
  - `hub-desktop.png`
  - `creation-desktop.png`
  - `adventure-desktop.png`
  - `creation-mobile.png`
  - `adventure-mobile.png`

Verification commands run:
- `npx eslint src/App.jsx src/components/gameui/GameUIRoot.jsx src/components/PwaInstallPrompt.jsx src/ui/panels/NarrativeMemoryPanel.jsx src/components/gameui/CharacterCreationShell.jsx src/components/shell/AdventureShell.jsx src/components/shell/CharacterCreationFlow.jsx src/components/shell/CharacterHub.jsx src/components/shell/EntryShell.jsx src/components/shell/SurfaceDialog.jsx src/components/shell/shellState.js src/ui/modes/CharacterCreationMode.jsx tests/unit/ShellState.test.js`
- `node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/ShellState.test.js tests/unit/GameUiSelectors.test.js --runInBand`
- `npm run build`

Environment note:
- Browser requests in local-play mode correctly send `x-dev-user-id: local` and `x-dev-user-email: local@game.dev`.
- The proxied narrator backend on `localhost:5000` still returns `401` for those dev headers in this environment, so local no-login runs currently use the frontend's offline narrative fallback rather than live AI narration.
- This is not a frontend shell blocker anymore, but if live local narration is desired the `/api` server needs dev auth enabled or a signed-in session.

---

## Swarm Review Update (2026-03-26)

Executed a repository-wide swarm-style review focusing on gameplay readiness, integration debt, and release polish.

Top consensus priorities:
1. Fix local narration auth mismatch (`/api` currently returning `401` for local dev headers) so local-play validation uses live narration paths.
2. Complete placeholder art replacement pipeline and enforce replacement thresholds in CI.
3. Finish Godot archetype/system alignment against canonical registry-generated subsets.
4. Reintegrate or formally retire currently ignored Jest suites (`skillEffects`, `endToEndEffects`, `magnitudeCapsFusion`) to reduce hidden regression risk.
5. Add bootstrap guardrails around test commands so missing local dependencies fail with actionable setup guidance.

Outcome: architecture direction remains strong; next cycle should emphasize completion + integration hardening over net-new feature breadth.
