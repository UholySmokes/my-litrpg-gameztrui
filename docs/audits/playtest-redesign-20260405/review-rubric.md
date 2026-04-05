# Playtest Redesign Review Rubric

## Purpose

This rubric standardizes browser playtest scoring for the current active web shell only.
It is a weighting aid for downstream testers and synthesis agents, not a substitute for lived browser evidence.

## Active Path Under Review

Score only the current browser flow rooted at `/`:

1. `GameUIRoot.jsx` entry behavior and reset gating
2. `CharacterHub.jsx` onboarding hub
3. `CharacterCreationShell.jsx` and its creation flow
4. `AdventureShell.jsx` immediate post-creation and early-play surfaces
5. Narrative-facing runtime behavior exposed through `useNarrativeRuntime.js`

## Scoring Model

- Total score: 30 points
- Functional Behavior: 10 points
- Story Feel: 10 points
- UI Feel: 10 points
- All three pillars carry equal weight in the final verdict
- Do not inflate one pillar to compensate for missing evidence in another
- If a blocker prevents scoring later checkpoints, mark blocked checkpoints as `not reached`, not `failed by assumption`

## Rating Scale

Use the same 0-5 checkpoint rating everywhere.

| Score | Meaning         | Tester guidance                                                                                              |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| 0     | Broken          | Cannot proceed, or the feature contradicts expected behavior in a way that prevents trustworthy review       |
| 1     | Severe friction | Technically reachable, but confusing, misleading, or unstable enough that most new players would likely stop |
| 2     | Weak            | Partially works, but repeated friction, ambiguity, or poor feedback damages confidence                       |
| 3     | Adequate        | Works with noticeable rough edges, but remains understandable and usable                                     |
| 4     | Strong          | Clear, stable, and satisfying with only minor polish gaps                                                    |
| 5     | Excellent       | Clear, reliable, emotionally effective, and easy to recommend as-is for the reviewed phase                   |

For each checkpoint, record:

- score
- evidence
- blocker state: `none`, `degraded`, `blocked`, or `not reached`
- recommendation note, only if supported by observed friction

## Review Sequence

Evaluate checkpoints in the following order so runs remain comparable:

1. Fresh-load entry and reset/readiness behavior
2. Character hub onboarding clarity
3. Character creation comprehension and completion flow
4. Transition into level 1 ready state
5. Immediate adventure-shell readability and command readiness
6. Early gameplay feedback, narrative continuity, and control confidence

## Functional Behavior (10 points)

Average the five checkpoint scores below, then multiply by 2 to get the pillar score out of 10.

### F1. Entry and Session Integrity

Check whether the run reaches the current entry shell cleanly and whether reset gating communicates what is happening.

- Look for startup failure, stuck loading, unusable save reset gating, or unexplained autosave interruption
- Count `SaveResetGate`, `AutosaveResumeOverlay`, and restart prompts as part of current behavior because they affect a fresh run
- Do not judge downstream gameplay if fresh-load integrity is already blocked

### F2. Onboarding Progression to Creation

Check whether a new player can move from `CharacterHub` into character genesis without hunting for the correct action.

- Confirm the primary CTA is discoverable
- Confirm profile/account context does not mislead the player about readiness
- Confirm the run stays on the active path instead of exposing obsolete flows

### F3. Character Creation Completion

Check whether the player can understand, progress through, and complete genesis with reasonable confidence.

- Watch for missing affordances, unclear state transitions, soft-locks, or contradictory build guidance
- Treat narration degradation during creation as a functional issue if it impedes completion
- Stop attributing later issues to adventure systems if creation itself is blocked

### F4. Transition to Level 1 Ready Adventure

Check whether completion produces a believable, technically stable handoff into the post-creation adventure shell.

- Confirm testers can tell that level 1 is the initial ready state, not an earned milestone
- Confirm transition timing and shell switching are understandable
- Note if the app lands in a mismatched or partially initialized state

### F5. Early Command Loop Reliability

Check whether the immediate adventure loop feels technically dependable.

- Validate command entry, action suggestions, room access, and direct controls at a basic usability level
- Note degraded narrative fallback, stale suggestions, dead buttons, or unreliable response timing
- Exclude deeper progression or long-run balance concerns beyond early gameplay

## Story Feel (10 points)

Average the five checkpoint scores below, then multiply by 2 to get the pillar score out of 10.

### S1. Fantasy Hook at Arrival

Judge whether the hub copy establishes a compelling fantasy for beginning a new chronicle.

- Focus on first-impression intrigue, stakes, and thematic coherence
- Penalize language that sounds ornate but fails to clarify what the player is about to do

### S2. Creation Ritual Cohesion

Judge whether character genesis feels like a meaningful ritual rather than a disconnected form flow.

- Look for continuity between labels, promises, and perceived consequences
- Reward creation steps that reinforce identity, doctrine, lineage, and role fantasy

### S3. Narrative Responsiveness

Judge whether the narrative runtime reacts in a way that feels context-aware during onboarding and the first adventure steps.

- Consider generated text, fallback text, summaries, and mood signaling as part of the same player-facing story surface
- Penalize generic output, tonal whiplash, or obvious mismatch with the player action just taken

### S4. Momentum Into Adventure

Judge whether the handoff from creation into the atrium creates anticipation for immediate play.

- Reward clean escalation from setup to action
- Penalize abrupt emotional drop, unclear objective framing, or weak payoff after the creation ritual

### S5. Early Play Story Continuity

Judge whether the first commands and system responses preserve a coherent adventure thread.

- Look for continuity between objective text, latest passage, action suggestions, and resulting feedback
- Mark story review as limited if narration is unavailable and no usable fallback preserves context

## UI Feel (10 points)

Average the five checkpoint scores below, then multiply by 2 to get the pillar score out of 10.

### U1. Entry Clarity and Orientation

Judge how quickly the player understands where they are and what the first meaningful action is.

- Check visual hierarchy, CTA prominence, and whether support surfaces crowd the main intent
- Penalize any entry-state ambiguity caused by overlays or competing prompts

### U2. Onboarding Readability

Judge whether the hub and creation shell present information in digestible chunks.

- Check copy scannability, spacing, section hierarchy, and whether ritual framing improves or hurts comprehension
- Reward layouts that let a new player identify the next step at a glance

### U3. Transition Smoothness

Judge the feel of moving between hub, creation, and adventure surfaces.

- Look for abrupt mode shifts, visual discontinuity, or unclear fade and handoff states
- Reward transitions that communicate progress without making the player wait in confusion

### U4. Adventure Shell Control Readiness

Judge whether the atrium layout makes the first actionable options obvious and inviting.

- Check command entry prominence, suggestion usefulness, room gateway legibility, and direct-control discoverability
- Penalize dense layouts that hide the most important next action

### U5. Feedback and Atmosphere

Judge the combined visual and textual feel once the player starts acting.

- Consider mood display, status strip clarity, passage presentation, and whether the shell feels alive rather than administrative
- Reward interfaces that make the player feel guided without feeling constrained

## Cross-Pillar Checkpoints

These do not add separate points. Use them to keep scoring consistent across pillars.

### Blocker Classification

- `startup blocker`: app does not reach the active entry shell or is unusable on fresh load
- `onboarding blocker`: player cannot reasonably begin or complete genesis
- `narration degraded`: story review is limited, but play remains usable through fallback behavior
- `early-loop blocker`: player reaches adventure shell but cannot meaningfully issue or interpret the first actions

### Milestone Framing

- Treat immediate post-creation level 1 as fresh-start completion
- Treat level 2 at 100 XP as the first earned milestone, outside the minimum scoring requirement for this rubric

### Evidence Rule

- Every low or high score must cite an observed moment, not inferred intent from code structure alone
- If a checkpoint was not reached, leave a short reason and do not guess the score

## Exclusions

Do not score the following as current behavior:

- Legacy or inactive UI architectures outside the active `GameUIRoot -> CharacterHub / CharacterCreationShell / AdventureShell` path
- Old shell state or obsolete flows cleared by legacy reset behavior
- Non-browser runtimes as primary evidence sources
- Deep progression, long-session balance, or post-early-game systems beyond the first command loop
- Implementation plans, engineering estimates, or speculative redesign build scope

Legacy or inactive paths may be cited only as redesign inspiration, never as evidence that the current experience fails or succeeds.

## Recommendation Boundary

This rubric can feed recommendations, but the rubric itself remains recommendation-only.

- Do not turn rubric observations into implementation commitments
- Separate observed defects from quality concerns and from redesign opportunities
- Keep larger redesign ideas framed as optional responses to evidence
- Preserve a later distinction between core redesign recommendations and random improvement suggestions

## Downstream Tester Template

Use this template per checkpoint:

| Pillar     | Checkpoint                               | Score (0-5) | Blocker State | Evidence | Recommendation Note |
| ---------- | ---------------------------------------- | ----------- | ------------- | -------- | ------------------- |
| Functional | F1 Entry and Session Integrity           |             |               |          |                     |
| Functional | F2 Onboarding Progression to Creation    |             |               |          |                     |
| Functional | F3 Character Creation Completion         |             |               |          |                     |
| Functional | F4 Transition to Level 1 Ready Adventure |             |               |          |                     |
| Functional | F5 Early Command Loop Reliability        |             |               |          |                     |
| Story      | S1 Fantasy Hook at Arrival               |             |               |          |                     |
| Story      | S2 Creation Ritual Cohesion              |             |               |          |                     |
| Story      | S3 Narrative Responsiveness              |             |               |          |                     |
| Story      | S4 Momentum Into Adventure               |             |               |          |                     |
| Story      | S5 Early Play Story Continuity           |             |               |          |                     |
| UI         | U1 Entry Clarity and Orientation         |             |               |          |                     |
| UI         | U2 Onboarding Readability                |             |               |          |                     |
| UI         | U3 Transition Smoothness                 |             |               |          |                     |
| UI         | U4 Adventure Shell Control Readiness     |             |               |          |                     |
| UI         | U5 Feedback and Atmosphere               |             |               |          |                     |

## Final Synthesis Hand-off

When this rubric is used in later audit synthesis, preserve this output order:

1. Blocking defects
2. Quality issues
3. Larger redesign recommendations
4. Random improvement suggestions

The rubric prepares comparability. It does not authorize implementation work.
