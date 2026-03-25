# Design And Planning Playbook

Use this before implementation when a task changes behavior, structure, or workflow.

## Goal

- Ground in the repo first.
- Clarify intent and success criteria.
- Produce a decision-complete plan before changing files.

## Workflow

1. Inspect the current implementation, docs, and validation path.
2. Resolve discoverable facts from the repo before asking questions.
3. Lock the goal, constraints, and rollout boundary.
4. Choose an approach and name the tradeoffs.
5. End with a concrete implementation plan that leaves no decisions to the implementer.

## Repo Notes

- Gameplay truth starts in `packages/game-core/src/`.
- Web runtime work starts in `src/`.
- Firebase/API work starts in `functions/lib/`.
- Shared AI workflow guidance must remain in `docs/ai/*`.
