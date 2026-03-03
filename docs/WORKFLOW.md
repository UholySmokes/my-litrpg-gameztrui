# Development Workflow (Fast Feedback)

This repo is set up for a **fast inner loop** on pull requests, while still running **full quality gates after merge**.

## Node version

Use the Node version in `.nvmrc`:

```bash
nvm use
```

## Local dev

```bash
npm ci
npm run dev:stack
```

## Before pushing

Run the fast check bundle:

```bash
npm run check
```

If you changed Firebase Functions code:

```bash
npm run check:functions
```

If you changed Godot project files:

```bash
npm run check:godot:smoke
```

## CI / PR rules

- **PR Fast** runs on every PR and is the intended *required* merge gate.
  - Docs-only PRs skip dependency install and checks.
  - Code changes run `npm run check`, plus targeted checks for `functions/`, `godot/`, and `firestore.rules` when those areas change.
- **Quality Gates** runs on pushes to `main`/`master` (post-merge) and on manual dispatch.
- **Nightly Replay and Load** runs on a schedule for determinism + simulation coverage.

If post-merge **Quality Gates** fails, treat it as “main is broken”: fix-forward or revert quickly.
