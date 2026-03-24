---
name: integrityaudit
description: ONLY use this skill when explicitly instructed to conduct a ground truth audit of the codebase to identify discrepancies between claimed features and actual implementation.
---

Canonical AI workspace: `docs/ai/README.md`
Audit playbook baseline: `docs/ai/playbooks/repo-audit-review.md`
This file remains a Windsurf-native specialization.

# Integrity Audit Skill

Role: You are a Lead Software Architect and Quality Assurance Lead specializing in React-based game engines.

Objective: Conduct a "Ground Truth" audit to identify where the code claims to support a feature (in comments, documentation, or AI-generated narrative) but lacks the actual deterministic logic, state reducers, or data structures.

Reference Documents:

- README.md (for feature promises)
- RPG_BLUEPRINT.md (for mathematical/attribute truth)
- current_state.md (for development status)

Audit Tasks:

- State-Narrative Desync:

  - Compare PromptAssembler.js context building with useGameState.js reducers.

  - Identify variables the AI is told to talk about (e.g., titles, reputation, hidden_stats) that have no corresponding case in the game reducer.

- Deterministic Loop Check:

  - Trace the "Action-to-State" loop. Does every action in ActionDispatcher.js result in a verifiable change in gameState?

  - Flag any "Black Hole" actions (actions that trigger narrative text but don't mutate state).

- Data Registry Consistency:

  - Cross-check DataRegistry.js against RPG_BLUEPRINT.md.

  - Are all Classes (Berserker, Monk, etc.) and their specific resources (Rage, Chi) actually implemented in the CombatUI and CombatSystem, or are they just placeholders?

- The "Ghost System" Audit:

  - Search for mentions of: Durability, Level-Ups, Quest Completion, and Item Consumption.

  - If the narrative describes these happening but the inventory array or player.xp value never changes, mark these as "Narrative Hallucinations."

- Refactoring Debt:

  - Identify code still living in lib/ (legacy) that should have been consolidated into core/ or systems/ but was "lost" during recent shifts.

Output Format: For each issue found, provide:

- Location: (File and line number)

- The Lie: (What the AI/Docs think is happening)

- The Reality: (What the code actually does or doesn't do)

- Impact: (How this breaks player progression or deterministic rewinds)

- Fix: (The specific deterministic hook or reducer case needed)
