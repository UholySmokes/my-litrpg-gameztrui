# Hermes Agent Setup

This repo treats Hermes as an optional compatibility tool for local developer workflows. The canonical planning and implementation path remains Codex-first.

## Repo Boundary

- Hermes is not wired into the repo's `/api/narrate` or `/api/agents` runtime.
- Use Hermes for standalone CLI workflows unless we explicitly add a runtime integration later.
- Keep `docs/ai/*` as the shared source of truth for cross-tool workflow rules.

## Supported Install Paths

```bash
npm run hermes:doctor
npm run hermes:setup
```

- On Linux and macOS, `hermes:setup` runs the official installer directly in non-interactive mode.
- On Windows, `hermes:setup` requires WSL2 and targets a healthy non-`docker-desktop` distro in non-interactive mode.
- After install, finish provider selection with `hermes model`.

## Recommended Repo Usage

1. Run `npm run hermes:doctor`.
2. If the distro health check passes, run `npm run hermes:setup`.
3. Configure a provider with `hermes model`.
4. Keep Codex as the default operator for repo implementation work.

## WSL Troubleshooting

If `npm run hermes:doctor` reports that a distro exists but `bash` cannot start, repair the WSL distro outside this repo first.

Common signs:

- `getpwuid(...) failed`
- `getpwnam(...) failed`
- `Failed to start the systemd user session`

Until that is fixed, Hermes cannot be installed in the supported Windows path.
