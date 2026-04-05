---
plan_id: playtest-redesign-20260405
artifact_type: clean-session protocol
document_status: active reference
---

# Clean Session Protocol For Browser Playtests

## Purpose

Use this protocol before every persona run in the browser audit for `playtest-redesign-20260405`.
It defines how to produce trustworthy fresh-start evidence for the active root flow at `/`.

This protocol applies to the current shell only:

- `App.jsx -> GameUIRoot.jsx -> CharacterHub -> CharacterCreationShell -> AdventureShell`

It does not authorize testing legacy or inactive paths.

## Why This Protocol Is Required

The app has two separate reset behaviors that matter for evidence quality:

- `GameUIRoot` blocks play behind `SaveResetGate` until `useGameUiSaveController` finishes its save-reset flow.
- `useGameUiSaveController` clears legacy local save keys only when `saveResetEpochApplied:v1` is older than the current save reset epoch.

Current reset epoch: `2`.

That means the built-in reset gate is not a full fresh-session guarantee for repeated playtests. After one valid run, a later visit can still surface:

- `localAutosave:v1`
- `localSaves:v1`
- `autosavePromptDismissed:v1`

if the tester does not manually clear site state first.

Do not rely on the app alone to create a fresh run.

## Fresh Run Definition

A run counts as fresh only if all of the following are true before evidence collection begins:

1. The tester starts in a new browser context for the chosen origin.
2. The chosen root URL is opened directly from `/`, not from a deep link, history navigation, or restore-session flow.
3. No carried local save, autosave, dismissed autosave prompt marker, or local-game marker exists from a prior playtest.
4. The app does not resume directly into character creation or adventure because of retained browser state.
5. Any save-reset behavior observed on boot is the current run's behavior, not leftover state from a previous run.

For this audit, the mandatory stop point remains immediate post-creation level 1 readiness.
Level 2 at 100 XP is optional follow-through evidence only.

## Supported Origins

Use one origin per run and record it in the metadata.

- Primary local target: `http://127.0.0.1:5173/`
- Alternate local hosting/emulator target when intentionally used: `http://127.0.0.1:5000/`

Do not switch origins mid-run. A run on `5173` and a run on `5000` are separate environments and must be logged separately.

## Browser Reset Procedure

Preferred method: open a new incognito or private window for each persona run and clear site data for the target origin before loading `/`.

If a private window is not used, create a dedicated browser profile for playtests and treat each persona run as isolated setup.

### Step 1: Close conflicting tabs

- Close every tab already open on the target origin.
- Do not keep a prior playtest tab parked on `5173` or `5000`.

### Step 2: Clear site storage for the chosen origin

Use the browser's site-data controls or DevTools Application panel and clear storage for the exact origin under test.

Minimum storage that must be empty before a run starts:

- Local storage key `localGame`
- Local storage key `localAutosave:v1`
- Local storage key `localSaves:v1`
- Local storage key `saveResetEpochApplied:v1`
- Session storage key `autosavePromptDismissed:v1`
- Legacy layout keys `layout_gameMode`, `layout_characterCreation`, `layout_sharedPins`
- Any local storage key beginning with `window_fullscreen_once_`

Recommended action:

- Use `Clear site data` for the chosen origin instead of removing keys one by one.

Why:

- The app automatically clears some legacy shell layout keys on mount, but that happens after page load begins.
- Manual site-data clearing removes pre-existing contamination before the run starts.

### Step 3: Re-open the root URL directly

- Open the chosen URL at `/`.
- Do not use refresh on an old tab.
- Do not use browser Back, browser Forward, or restore closed tab.

### Step 4: Verify the run is still clean before taking notes

Before collecting evidence, confirm all of the following:

- The app starts from the current root flow.
- `AutosaveResumeOverlay` does not appear.
- The app does not load an existing character automatically.
- The app does not bypass the hub because a previous playtest left `localGame=true` or a resumable autosave.
- If `SaveResetGate` appears, its result is recorded before proceeding.

## What Counts As A Valid First Screen

The exact first visible state depends on runtime conditions, but it must still belong to the active path.

Acceptable first-screen outcomes:

- Auth or local-run entry shell when no user context exists.
- Direct entry into `GameUIRoot` through a dev-user path.
- Temporary `SaveResetGate` while the app clears progress for the current session.

Invalid first-screen outcomes for a fresh run:

- `AutosaveResumeOverlay`
- Already being in `CharacterCreationShell` without explicitly starting from the hub in this run
- Already being in `AdventureShell` with a previously created character
- Any legacy or inactive shell path outside the active browser flow

## Save Reset Interpretation Rules

Record the save-reset outcome exactly as observed.

### `mode: local`

- Expected for `local` users and dev-provider identities.
- Valid for fresh-run evidence if the session was manually cleared first.

### `mode: remote`

- Expected for authenticated non-dev users.
- Valid if the run proceeds after reset and the resulting path is still fresh.

### `mode: recoverable-local`

- Valid as a degraded run when the app reports a recoverable sync-storage failure and still continues on a fresh local path.
- Mark the run as degraded, not normal.
- Keep story and functional notes separate from the sync failure note.

### `ready: false` with error

- Treat as a blocker.
- Valid only as blocker evidence for entry/session integrity.
- Invalid for downstream onboarding, character-creation, or adventure conclusions.

## Required Metadata Per Persona Run

Every persona evidence packet must capture the following fields before or during the run.

### Run Identity

- `run_id`: unique tester-assigned identifier
- `persona`: `A` or `B`
- `persona_label`: systems-first runner or lore-first cautious explorer
- `tester_or_agent`: who performed the run
- `date_utc`
- `target_origin`

### Runtime Context

- `entry_url`: full root URL used to start the run
- `environment_mode`: Vite local dev, hosting emulator, or other clearly named environment
- `entry_mode`: one of `dev-user`, `local-game`, `authenticated-user`, or `auth-shell-first`
- `user_identity_label`: user id or email label shown by the shell, if any
- `save_reset_epoch_expected`: `2`

### Reset Evidence

- `site_data_cleared`: yes or no
- `clear_method`: incognito plus clear-site-data, dedicated profile, or equivalent
- `keys_verified_absent_before_launch`: list of cleared keys or `clear-site-data`
- `save_reset_gate_seen`: yes or no
- `save_reset_result`: `local`, `remote`, `recoverable-local`, or `blocked`
- `save_reset_error_text`: exact text if any error appeared

### Freshness Verification

- `autosave_overlay_seen_on_boot`: yes or no
- `unexpected_loaded_character`: yes or no
- `first_screen_observed`
- `hub_reached_cleanly`: yes or no
- `creation_started_from_hub`: yes or no

### Playtest Evidence Context

- `mandatory_stop_point_reached`: yes or no
- `stop_point_label`: level 1 ready, blocked before level 1, or optional level 2 follow-through
- `blocker_state`: none, degraded, blocked, or not reached
- `narrative_runtime_status`: normal, degraded fallback, unavailable, or not reached
- `optional_exploration_notes`: short list with clear distinction from golden-path steps

### Comparison Fields

- `time_to_hub`
- `time_to_creation_start`
- `time_to_level_1_ready`
- `functional_behavior_notes`
- `story_feel_notes`
- `ui_feel_notes`
- `delight_moments`
- `friction_moments`
- `evidence_limitations`

## Run Invalidation Rules

Discard the run for persona comparison and restart from a newly cleared session if any of the following occurs before trustworthy evidence begins.

1. `AutosaveResumeOverlay` appears at any point before the tester intentionally creates a new character in the current run.
2. The tester clicks `Continue Autosave` or loads any local or cloud save.
3. The app lands directly in character creation or adventure because retained state bypassed the hub.
4. The tester discovers `localAutosave:v1`, `localSaves:v1`, `autosavePromptDismissed:v1`, or `localGame` existed before the run but was not cleared.
5. The tester switches origin mid-run, for example from `5173` to `5000`.
6. The tester switches from one entry mode to another mid-run, for example from auth-shell flow to local-game flow, without restarting from a clean session.
7. The tester uses developer/admin tools, direct storage edits, or manual state injection after the run has started.
8. The tester refreshes into retained state after the character was already created and then continues logging it as a fresh-start run.
9. A remote reset error blocks progression and the tester continues to make downstream claims about onboarding or gameplay without a clean rerun.
10. The tester cannot explain whether the first playable state came from fresh onboarding or from resumed data.

## What Does Not Automatically Invalidate A Run

The following may still produce usable evidence if recorded accurately:

- A brief `SaveResetGate` on boot that resolves and still yields a clean hub-first run
- A recoverable local sync-storage failure that allows play to continue on a fresh local path
- Narrative degradation during creation or early gameplay, as long as the tester labels story evidence as limited or degraded instead of complete

## Evidence Capture Order

Collect notes in this order so persona runs stay comparable.

1. Reset and launch evidence
2. Entry and session-integrity observations
3. Hub onboarding observations
4. Character creation observations
5. Transition to level 1 readiness
6. Immediate adventure-shell observations
7. Optional level 2 evidence only if the run remains stable and report-safe

## Short Tester Checklist

- Clear site data for the chosen origin.
- Open `/` in a new isolated browser context.
- Confirm there is no autosave prompt and no carried character.
- Record entry mode, reset mode, and first screen.
- Follow the golden path to level 1 readiness.
- Label any degraded or blocked condition immediately.
- Abort and rerun if contamination is detected.

## Minimal Evidence Header Template

Use this header at the top of each persona run note.

```text
run_id:
persona:
tester_or_agent:
date_utc:
target_origin:
environment_mode:
entry_mode:
user_identity_label:
site_data_cleared:
clear_method:
save_reset_gate_seen:
save_reset_result:
autosave_overlay_seen_on_boot:
first_screen_observed:
mandatory_stop_point_reached:
blocker_state:
narrative_runtime_status:
evidence_limitations:
```

If any header field is unknown, record it as `unknown` rather than assuming success.
