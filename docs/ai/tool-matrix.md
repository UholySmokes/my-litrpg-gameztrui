# Tool Matrix

| Surface | Role | Shared Truth | Native Asset Policy |
| --- | --- | --- | --- |
| Codex | Canonical operator for planning, implementation, review, and repo navigation | `docs/ai/*` | Full repo bootstrap lives in `.codex/environments/environment.toml` |
| Claude | Compatibility surface for specialized agents | `docs/ai/README.md` and playbooks | Keep only unique Claude-native agents such as `balancesmith-strict` |
| Gemini | Compatibility surface for Firebase-oriented prompt context | `docs/ai/playbooks/firebase-api.md` | Keep extension-native prompt files only |
| Windsurf | Compatibility surface for focused repo audits | `docs/ai/playbooks/repo-audit-review.md` | Keep unique Windsurf skills and rules only |
| `.agent` / `.agents` | Compatibility packs for generic and LitRPG-specific skill loading | `docs/ai/playbooks/*` | Generic workflows stay as thin adapters; unique LitRPG packs remain native |

## Default Routing

- Planning and implementation: Codex with `gpt-5.4`, `high`, `cloud`
- Conservative balance tuning: Codex primary, Claude `balancesmith-strict` as compatibility specialization
- Firebase/API prompting: Codex primary, Gemini extension context as compatibility layer
- Repo audits and discrepancy hunts: Codex primary, Windsurf `integrityaudit` as compatibility layer

## Local Model Policy

This workstation should be treated as `cloud-primary`. Use local runtimes only for lightweight utilities or optional offline helpers, not as the default implementation engine.
