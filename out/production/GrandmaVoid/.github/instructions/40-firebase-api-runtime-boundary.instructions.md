---
applyTo: "{functions/**/*,public/runtime-config.js,src/core/AIService.js,firebase.json}"
description: "Keep frontend and Firebase API routing/runtime config aligned."
---

# Firebase API and Runtime Boundary

Routing and endpoint rules:
1. Prefer same-origin `/api` for client calls when possible.
2. Do not hardcode external API hosts in frontend code unless explicitly required.
3. Keep runtime config in `public/runtime-config.js` and env-driven values consistent.

When changing API behavior:
- Verify `firebase.json` rewrites still match function exports.
- Check emulator and deployed behavior remain consistent.
- Summarize env variables added/changed and their defaults.

Safety checks:
- Keep timeout and model settings configurable via environment variables.
- Avoid mixing environment logic across many files.
