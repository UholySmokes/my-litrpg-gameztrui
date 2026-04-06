# Mandatory Findings Synthesis

Task: T8  
Plan: playtest-redesign-20260405  
Scope: recommendation-only synthesis for the mandatory browser playtest evidence set  
Completion frame: level 1 ready is the core stop point; level 2 remains optional and no separate level 2 artifact existed at synthesis time

## Evidence Base

- `docs/PRD.yaml` sets the active browser target, equal weighting across function, story, and UI, and the recommendation-only boundary.
- `runtime-readiness.md` confirms the current browser shell at `/` is reachable, hub-first launch is valid, and the main risk is downstream narration/save-state fidelity rather than boot failure.
- `gamer-personas.md` defines the two comparable lenses: a fast systems-first runner and a cautious lore-first explorer.
- `review-rubric.md` requires balanced weighting across functional behavior, story feel, and UI feel and fixes the mandatory output order.
- `persona-a-evidence.md` provides the fastest clean mandatory run and the clearest time-to-agency evidence.
- `persona-b-evidence.md` plus `persona-b-corroboration-note.md` provide the corrected lore-first run, confirm the hub-first launch, and reproduce the downstream trust failures under stricter clean-start conditions.

## Synthesis Frame

This synthesis treats immediate post-creation level 1 readiness as the mandatory completion target, matching the PRD decision that level 1 is the first playable state rather than an earned milestone. No optional level 2 addendum existed when this synthesis was compiled, so all conclusions below are grounded in runtime readiness plus the two valid level 1 evidence packets.

Across the mandatory evidence, the browser shell is not failing at startup. The stronger pattern is that the experience opens cleanly, then loses trust inside creation handoff and first-scene authorship. Function, story, and UI all contribute to that loss:

- Function: character creation completes, but review-state signals are not dependable at the Oath handoff.
- Story: the ritual fiction is strong until the chosen destination is contradicted by the actual spawned scene.
- UI: the shell looks ceremonial and readable, but the highest-stakes state changes are communicated with inconsistent labels and overloaded screens.

## Headline Findings

- The active root-shell path is valid for audit work; the evidence does not support a startup-failure verdict.
- The most serious mandatory defect is authorship trust loss during the creation-to-adventure handoff, not entry failure.
- The onboarding fantasy is stronger than the onboarding reliability: the chamber framing works, but the Oath and spawn results do not consistently honor what the player just chose.
- The browser shell already supports fast agency for Persona A and meaningful atmosphere for Persona B, so the redesign target is not reinvention. It is a trust and pacing correction.
- Soul Crucible is the clearest shared throughput problem across both personas and all three rubric pillars.

## Balanced Pillar Readout

### Functional Behavior

- Strength: both valid runs reached CharacterHub cleanly, entered creation by explicit CTA, completed genesis, and reached a stable level 1 ready state.
- Risk: the Oath review state is unreliable at the exact moment the player needs certainty. Persona A saw `Origin not selected` while a starting point was shown, then landed in a different visible zone than the review copy implied. Persona B selected `Meridian Arcology`, needed a second seal, and still spawned in `Tideward Coast / Tideward Pier`.
- Risk: stale chamber warnings and minor runtime noise make the shell feel less dependable than its main path actually is.

### Story Feel

- Strength: both personas responded positively to the chamber ritual framing, the character-fantasy scaffolding, and the immediate level 1 prose once the World Atrium loaded.
- Risk: the strongest story break is not weak prose. It is broken narrative authorship. The shell asks the player to treat the Oath as meaningful, then fails to honor or clearly explain the result.
- Risk: early freeform play reads narrower than the surrounding fiction suggests, which compresses the sense of authored possibility right after the creation ritual.

### UI Feel

- Strength: the hub CTA, system-match tags, ready-state shell, and suggestion chips all help players find the next action quickly.
- Risk: the install prompt competes with the first fantasy impression, Soul Crucible buries key decisions under too much vertical density, and Oath-state labels communicate low-confidence UI at the moment of highest commitment.
- Risk: stale warning copy and the double-seal handoff visually imply unfinished state management even when the run still completes.

## Blocking Defects

Blocking defects here are issues severe enough to distort the mandatory fresh-start review, undermine player trust in core onboarding, or compromise the authored meaning of reaching level 1.

1. Starting-point selection is not reliably honored at spawn.
   - Evidence: Persona B explicitly selected `Meridian Arcology` in Oath Mirror, then reached level 1 in `Tideward Coast / Tideward Pier`.
   - Why it blocks: this breaks the contract between the player choice, the review pane, and the actual first-scene result. It is simultaneously a functional mismatch, a story-authorship break, and a UI trust failure.
   - Evidence sources: `persona-b-evidence.md`, `persona-b-corroboration-note.md`.

2. Oath-state communication is contradictory at the final commitment step.
   - Evidence: both mandatory runs surfaced `Origin not selected` alongside visible starting-point review state, and Persona B needed a second explicit seal before transition.
   - Why it blocks: the player cannot trust that the shell understands its own final state at the exact moment the character is supposed to become canonical. Even when progression succeeds, the onboarding climax reads as unstable.
   - Evidence sources: `persona-a-evidence.md`, `persona-b-evidence.md`.

## Quality Issues

1. Soul Crucible concentrates too many irreversible or high-salience decisions into one dense chamber.
   - Evidence: both personas independently flagged attribute, skill, perk, alignment, and loadout density as the main throughput cost.
   - Balanced impact: slows functional completion, dilutes ritual focus, and weakens UI scannability.

2. The install prompt competes with the first meaningful onboarding action.
   - Evidence: both personas encountered the prompt on arrival before entering character genesis.
   - Balanced impact: minor functional delay, weaker story first impression, noisier visual hierarchy.

3. Stale warning text remains visible after required choices have already been made.
   - Evidence: Persona B observed warnings such as `Choose a race before leaving` and `Choose a class before leaving` after those choices were already stable.
   - Balanced impact: lowers confidence in completion logic and makes the UI look semantically out of sync with the story ritual.

4. The creation-to-adventure handoff does not clearly signal when review state becomes final world state.
   - Evidence: Persona A saw mismatched destination language; Persona B experienced a second seal requirement after the review pane looked complete.
   - Balanced impact: functionally confusing, narratively anticlimactic, visually uncertain.

5. Immediate freeform command expectations and actual spatial affordances are not fully aligned.
   - Evidence: Persona B attempted a cautious exploratory travel command that read as reasonable in-scene but was denied by current positioning.
   - Balanced impact: early command-loop confidence drops, story possibility narrows, UI chips look safer than the command field.

6. Minor runtime and accessibility noise continues to leak into the audited path.
   - Evidence: both runs reported one 404 resource error, an environment warning, and unlabeled or missing-form-field metadata issues.
   - Balanced impact: not blocking, but it reduces polish confidence and complicates interpretation of the shell's overall reliability.

7. Fresh isolated sessions still materialize local autosave keys during boot even when no resume overlay appears.
   - Evidence: both evidence packets mention `localAutosave:v1` reappearing during fresh-run initialization.
   - Balanced impact: not a blocker for the mandatory audit, but it makes clean-session trust harder to explain and audit.

## Larger Redesign Recommendations

These are recommendation-only themes. They are not an implementation plan.

1. Reframe character creation as a paced ritual funnel instead of one density spike.
   - Rationale: both personas tolerated the ceremony but lost momentum at Soul Crucible.
   - Desired outcome: keep the chamber fantasy while staging decisions so mechanical stakes, story stakes, and visual focus arrive in clearer waves.

2. Make the Oath the single source of truth for authored destination, identity lock-in, and level 1 framing.
   - Rationale: the current biggest failure is mismatch between chosen start, displayed state, and actual spawn.
   - Desired outcome: when the player seals the oath, function, fiction, and UI all communicate the same canonical result.

3. Preserve fast agency and cautious reading through dual-intent onboarding surfaces.
   - Rationale: Persona A wanted immediate readable payoff, while Persona B wanted confidence that the fiction mattered.
   - Desired outcome: the same flow should support both skimming and careful reading without either player feeling punished.

4. Protect the opening fantasy from utility noise and secondary chrome.
   - Rationale: the hub itself is strong, but the install prompt and other peripheral signals dilute arrival clarity.
   - Desired outcome: the first screen should feel like entering a chronicle first and installing a web app second.

5. Strengthen the first playable scene as the payoff for the creation ritual.
   - Rationale: both personas liked the World Atrium and early prose, but the strongest authored promise is being spent before the handoff becomes trustworthy.
   - Desired outcome: the first location, first suggestions, first quest framing, and first freeform affordances should clearly echo the build and destination the player just committed to.

## 10 Random Improvement Suggestions

These are intentionally separate from the larger redesign themes.

1. Delay or visually demote the install prompt until after the player has either entered genesis or dismissed it once.
2. Add a short one-line explanation under `SYSTEM MATCH` badges so cautious readers understand why the recommendation exists.
3. Replace stale leave-chamber warnings with state-aware confirmation text that reflects the player's completed choices.
4. Show a compact live summary strip during Soul Crucible so players do not need to scroll to recover their build identity.
5. Rename or rephrase counters like `RESET INITIALIZATION (3 REMAINING)` so the wording matches actual spendable state.
6. Add a plain-language note near level 1 handoff that says this is initial readiness, not the first earned milestone.
7. Make the freeform command field examples reflect actions the current room actually permits in the opening scene.
8. Echo the chosen starting point in the first post-creation passage header, even when the scene text is short.
9. Resolve unlabeled form fields and missing field metadata so browser diagnostics are quiet during onboarding review.
10. Add a lightweight clean-session indicator for audit and QA runs so fresh-start validity is easier to confirm without digging into storage.

## Roll-Up Guidance For The Final Audit

- Treat startup readiness as a passed prerequisite with caveats, not as the story of the audit.
- Lead the final audit with the Oath-to-spawn trust failures because they are the clearest evidence-backed blockers across function, story, and UI.
- Keep Soul Crucible density as the primary cross-persona quality issue.
- Preserve the distinction between larger redesign recommendations and the 10 random suggestions.
- Keep level 1 ready as the mandatory evidence boundary unless a later optional level 2 addendum is produced separately.