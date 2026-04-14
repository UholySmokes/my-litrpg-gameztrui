# AI Command Center

This repo is now `Codex-first`. Shared AI workflow truth lives in `docs/ai/*`, while tool-specific folders only keep compatibility adapters or unique native assets.

## Defaults

| Setting | Default |
| --- | --- |
| Primary operator | Codex |
| Primary model | `gpt-5.4` |
| Reasoning strength | `high` |
| Hosting | `cloud` |
| Local fallback | Lightweight utilities only |

## Quick Start

```bash
npm run ai:setup
npm run ai:doctor
npm run ai:check
```

- `ai:setup` seeds local-only scaffolding such as `.env.local`, `functions/.env.local`, and `.vscode/settings.json` when missing.
- `ai:doctor` reports tool availability, env posture, and whether the workstation still matches the cloud-primary recommendation.
- `ai:check` enforces the AI workspace policy and is part of the repo validation path.

## Optional Hermes Agent

Hermes is supported here as an optional developer tool, not as a replacement for the repo's Codex-first workflow.

```bash
npm run hermes:doctor
npm run hermes:setup
```

- On Windows, Hermes must run inside WSL2 rather than PowerShell-native installs.
- `hermes:doctor` checks for a usable non-`docker-desktop` distro and reports whether `hermes` is already installed.
- `hermes:setup` uses the official Hermes installer on Linux/macOS or inside the healthiest WSL2 distro it can find, in non-interactive mode.
- After installation, finish provider selection with `hermes model`.

See [Hermes Agent Setup](hermes-agent-setup.md) for the repo-specific notes and troubleshooting path.

## Canonical Workflow

1. Start in Codex with the repo bootstrap at `.codex/environments/environment.toml`.
2. Use the playbook that matches the task.
3. Keep shared workflow guidance in `docs/ai/*`.
4. Treat `.claude`, `.gemini`, `.windsurf`, `.agent`, and `.agents` as adapters or specialized native assets, not parallel sources of truth.

## Playbooks

- [Design And Planning](playbooks/design-and-planning.md)
- [Gameplay Systems](playbooks/gameplay-systems.md)
- [Balance](playbooks/balance.md)
- [UI And Frontend](playbooks/ui-frontend.md)
- [Firebase And API](playbooks/firebase-api.md)
- [Content And Worldbuild](playbooks/content-worldbuild.md)
- [Repo Audit And Review](playbooks/repo-audit-review.md)
- [Tool Matrix](tool-matrix.md)

## Local-Only Editor Policy

- `.vscode/settings.json` is local-only and should not be tracked.
- Shareable spelling lives in `cspell.json`.
- The tracked VS Code artifact is `.vscode/extensions.json`.
- Use `docs/ai/templates/vscode.settings.local.json` as the seed template for local editor preferences.

## Preserved Native Assets

- Claude balance specialist: `.claude/agents/balancesmith-strict.md`
- Gemini Firebase prompt extension: `.gemini/extensions/firebase/`
- Windsurf integrity audit skill: `.windsurf/skills/integrityaudit/`
- LitRPG specialization packs: `.agents/skills/litrpg-*` and `.agents/skills/swarm/`
