# Browser Playtest Redesign Audit

Plan: `playtest-redesign-20260405`  
Task: `T9`  
Audit target: current browser root flow at `/`  
Primary local runtime assumed during evidence capture: `http://127.0.0.1:5173/`

## Audience And Scope

This report is the primary stakeholder-facing audit artifact for the current browser onboarding and early-play flow rooted at `/`.

It covers only the active browser path:

- `CharacterHub`
- `CharacterCreationShell`
- `AdventureShell`

It does not evaluate legacy or inactive UI paths, deeper progression balance, or implementation details.

## Executive Summary

The current browser shell is viable as a playtest target. The audit evidence does not support a startup-failure conclusion for `/`.

The core issue is trust loss during the transition from character creation into the first playable level 1 scene. Players can reach the intended mandatory stop point, but the experience becomes unreliable at the moment the game asks them to believe that their final character choices matter. The most serious failure is that the selected starting point is not consistently reflected in the actual spawn destination.

This makes the redesign priority clear. The strongest opportunity is not a full reinvention of the opening. The hub, ritual framing, and first-scene atmosphere already work. The redesign target is a tighter, more trustworthy handoff from creation into level 1, plus a less overloaded Soul Crucible step.

## Completion Boundary

The core completion target for this audit is immediate post-creation level 1 readiness.

For this review, level 1 means the player has completed character creation and entered the first playable adventure state. It is not treated as an earned progression milestone.

Level 2 at 100 XP remains optional context only. No additional level 2 evidence was required to complete this audit, and optional follow-through did not change the mandatory conclusions.

## Runtime Assumptions

This audit assumes the browser shell is evaluated from the current root flow at `/` under a valid local browser-gameplay configuration.

Runtime assumptions used during evidence capture:

- Primary browser target was `http://127.0.0.1:5173/`.
- The shell launched through a dev-user path rather than an interactive sign-in requirement.
- Root startup was considered ready only if the run reached the active browser shell, not a legacy path.
- Narrative quality conclusions were limited to what was actually surfaced in the browser UI during the audited runs.

Readiness conclusion:

- `/` is reachable and usable for browser playtest work.
- Startup reachability is not the main risk.
- The more important downstream risk is whether the creation-to-adventure handoff accurately preserves authored player choices and communicates state clearly.

## Fresh-Session Protocol Used

Fresh isolated browser sessions were treated as a required evidence condition.

Protocol summary:

- Each persona run started in a new isolated browser context.
- The run opened the root URL directly at `/`.
- Evidence was considered invalid if a prior character or autosave resumed before the tester intentionally entered creation in the current run.
- Clean-session validity required hub-first entry through the active shell.

Important disclosure:

- Even in fresh isolated sessions, local autosave keys could still appear during boot.
- These runs were still accepted when the shell opened cleanly at the hub, did not show an autosave resume overlay, and did not load a prior character.

This matters because the app's built-in reset behavior is not, by itself, a full fresh-session guarantee for repeated audit runs.

## Evidence Base

This artifact packages the mandatory evidence set only:

- Runtime readiness brief
- Clean-session protocol
- Balanced review rubric
- Persona A mandatory level 1 evidence
- Persona B mandatory level 1 evidence
- Persona B corroboration note
- Mandatory synthesis

The review weighted three dimensions equally:

- Functional behavior
- Story feel
- UI feel

## Evidence Limits

This report should be read with the following limits in mind:

- The audit stayed scoped to the current root flow at `/`.
- The mandatory stop point was level 1 readiness, not deeper progression.
- Timing observations were approximate, because the runs paused to validate session integrity and inspect state.
- Minor runtime noise remained present, including a 404 resource error, an environment warning, and form-field accessibility issues.
- Optional level 2 follow-through did not produce stronger pacing evidence and is not used as the basis for the main conclusions.

## What Is Working

The audit found several foundations worth preserving.

### Strong Start Viability

The browser shell reliably reached the active hub flow during the accepted fresh-session runs. The evidence does not suggest that the primary issue is an inability to start the experience.

### Onboarding Fantasy

The chamber-based ritual framing gives the opening a distinctive identity. Both evidence packets found value in the ceremonial tone and in the sense that the player is assembling a chronicle rather than filling a generic form.

### Immediate Agency After Creation

Once the adventure shell loads, the level 1 state feels playable. The World Atrium presentation, suggestion chips, quest framing, and visible room surfaces give players a clear next action.

### Dual-Audience Potential

The current shell already supports two different player intents:

- A fast systems-first player can move quickly toward agency.
- A lore-first cautious player can read enough atmosphere to care about the world.

This is important because it means the redesign can focus on reliability and pacing rather than replacing the entire opening concept.

## Core Findings

## Blocking Defects

These are the issues serious enough to distort the meaning of the mandatory level 1 outcome.

### 1. Starting-point selection is not reliably honored at spawn

This is the clearest blocker in the evidence set.

In the accepted Persona B run, `Meridian Arcology` was selected during the Oath step, but the live level 1 shell spawned in `Tideward Coast / Tideward Pier`.

Why this matters:

- Functionally, the reviewed selection does not match the actual result.
- Narratively, the game asks the player to care about a destination choice, then contradicts it.
- From a UI perspective, the final commitment step appears untrustworthy.

### 2. Oath-state communication is contradictory at the final commitment step

Both mandatory runs showed conflicting signals during the final review and commitment stage.

Observed pattern:

- A starting point could be visibly shown.
- The UI still reported `Origin not selected`.
- One run required a second explicit seal input before the handoff completed.

Why this matters:

- This is the moment where the character is supposed to become canonical.
- The game asks for trust at the precise point where its own state labels appear least trustworthy.

## Quality Issues

These issues did not fully block the mandatory path, but they materially weakened the experience.

### 1. Soul Crucible is the largest throughput problem

Both personas independently identified Soul Crucible as the most overloaded part of the flow.

It concentrates too many high-salience decisions into one dense chamber:

- attributes
- loadout logic
- skills
- perks
- alignment

Result:

- slower completion
- weaker clarity
- reduced ritual focus

### 2. The install prompt competes with the first meaningful action

Players encountered the install prompt before entering character genesis.

This does not break the flow, but it does dilute the arrival moment and competes with the intended first-play impression.

### 3. Stale chamber warnings remain after choices are already made

The creation flow can continue to display warnings such as `Choose a race before leaving` or `Choose a class before leaving` after those selections appear stable.

This makes the shell feel semantically out of sync with itself.

### 4. The creation-to-adventure handoff lacks a clear moment where review state becomes world state

The current flow does not communicate the transition cleanly enough. Review content, commitment language, and the resulting live adventure scene do not consistently read as one authoritative sequence.

### 5. Early freeform expectations are wider than the opening scene actually supports

The opening presents a world that invites expression, but the earliest freeform attempts can feel narrower than the UI and fiction imply.

This is a trust-and-expectation issue more than a pure command-system failure.

### 6. Minor runtime and accessibility noise remains visible

The accepted runs still surfaced low-level polish debt:

- one 404 resource error
- one environment warning
- unlabeled or incomplete form metadata

These did not block progression, but they reduce perceived polish and confidence.

## Balanced Readout

The audit was explicitly weighted across function, story, and UI. The main findings span all three rather than belonging to only one pillar.

### Functional Behavior

The mandatory path is reachable. Character creation completes and the player can reach level 1 readiness. The most serious functional issue is that the game does not consistently honor or clearly confirm the player's authored starting-point choice.

### Story Feel

The opening fiction is stronger than the final commitment reliability. The chamber framing and first-scene prose work, but narrative authorship trust is broken when the Oath asks the player to commit to a destination that the game may not actually deliver.

### UI Feel

The shell is readable and atmospheric, but it loses confidence at the highest-stakes moments. The install prompt, overloaded Soul Crucible, stale warnings, and contradictory Oath labels make the UI feel less authoritative than the overall presentation deserves.

## Larger Redesign Recommendations

These are recommendation-only responses to the evidence. They are not implementation commitments.

### 1. Reframe creation as a paced ritual funnel

Keep the chamber fantasy, but distribute high-salience decisions across clearer phases so the player is not forced through one major density spike.

### 2. Make the Oath the single source of truth

The final commitment step should authoritatively determine and communicate:

- the selected starting point
- the locked-in identity
- the meaning of entering level 1

The player should never have to wonder whether the review pane and the actual world agree.

### 3. Support both fast and careful players without punishing either

The current shell shows promise for both rapid and reflective play styles. The redesign should preserve that by making skimming safe and careful reading rewarding.

### 4. Protect the first-play impression from utility noise

The opening should feel like entering a chronicle first and configuring a web app second.

### 5. Strengthen the first playable scene as the reward for creation

The first live level 1 scene should unmistakably echo the build and destination the player just committed to, so the payoff of creation is immediate and believable.

## 10 Random Improvement Suggestions

These are intentionally separate from the larger redesign recommendations.

1. Delay or visually demote the install prompt until after the player has entered genesis or dismissed it once.
2. Add a brief explanation under `SYSTEM MATCH` badges so cautious players understand why a choice is recommended.
3. Replace stale leave-chamber warnings with confirmation text that reflects completed choices.
4. Add a compact live build-summary strip during Soul Crucible so players do not need to scroll to recover identity context.
5. Rephrase counters such as `RESET INITIALIZATION (3 REMAINING)` so the wording matches the actual spendable state.
6. Add a plain-language note near the handoff that level 1 is initial readiness, not the first earned milestone.
7. Make the freeform command examples match actions that the opening scene actually permits.
8. Echo the chosen starting point in the first post-creation passage header.
9. Resolve unlabeled form fields and missing field metadata so onboarding diagnostics are quieter during review.
10. Add a lightweight clean-session indicator for QA and audit runs so fresh-start validity is easier to confirm.

## Optional Context Only: Level 2

Optional level 2 follow-through was reviewed as non-blocking context only.

It did not produce stronger evidence than the mandatory level 1 packets, and it did not change the priority order of the final conclusions. The stakeholder interpretation should remain anchored to the validated level 1 findings above.

## Final Assessment

The current browser opening is promising but not yet trustworthy enough at its most important authored moment.

Stakeholder takeaway:

- The root browser flow at `/` is valid and worth iterating on.
- The main risk is not startup viability.
- The main risk is that the creation climax does not consistently carry the player's chosen identity and destination into the live adventure state.
- Soul Crucible density is the clearest secondary redesign priority.

If the next redesign cycle fixes Oath reliability, clarifies the final handoff, and reduces Soul Crucible overload, the existing atmospheric strengths of the hub and first-scene shell are strong enough to support a much more convincing onboarding experience.
