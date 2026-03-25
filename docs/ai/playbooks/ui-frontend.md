# UI And Frontend Playbook

Use this for React UI, game shell interactions, mobile themes, onboarding screens, and frontend workflow improvements.

## Default Setup

- Operator: Codex
- Model: `gpt-5.4`
- Reasoning: `high`
- Hosting: `cloud`

## Start Here

- `src/components/`
- `src/ui/`
- `src/hook/`
- `vite.config.js`

## Working Rules

1. Preserve the established visual language unless the task is explicitly a redesign.
2. Keep new UI behavior wired to existing state and service boundaries.
3. Prefer repo-native checks before visual polish passes.
4. Run `npm run typecheck` and the most relevant smoke or Playwright checks.
