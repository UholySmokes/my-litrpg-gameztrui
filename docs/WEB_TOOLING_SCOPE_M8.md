# Web Tooling Scope (M8)

Status: Draft (implementation-aligned)  
Last updated: 2026-02-24

## 1. Purpose

Define the allowed web runtime scope after gameplay is shifted to Godot-first delivery.

Web is retained for tooling, inspection, and debug workflows, not as the default production gameplay client.

## 2. Included Tooling

### Replay Inspector (Dev Tool)

- UI: `src/components/ReplayInspector.jsx`
- Service: `src/core/SyncReplayService.js`
- API contract: `docs/contracts/replay_timeline_v1.md`
- API endpoint: `GET /api/sync/replay`

Capabilities:

1. Query by `runId`.
2. Filter by `afterSeq`, `limit`, `includeRejected`.
3. Inspect canonical tip (`seq`, `tick`, `mapId`).
4. Inspect hash checkpoints (`hashTimeline`).
5. Inspect replay timeline rows (accepted and optionally rejected events).

### Supporting Backend Surfaces

- Route wiring: `functions/lib/api-router.js`
- Replay response construction: `functions/lib/sync.js`
- Event persistence fields for timeline/hash inspection:
  - `functions/lib/sync-store.js`
  - `functions/lib/sync-dataconnect-store.js`

## 3. Gameplay Gate Policy

Policy implementation:

- `src/core/WebGameplayGate.js`
- `src/App.jsx`

Rules:

1. Dev builds (`import.meta.env.DEV`) allow web gameplay for engineering workflows.
2. Outside dev, web gameplay defaults to disabled.
3. Explicit override requires one of:
   - `VITE_WEB_GAMEPLAY_ENABLED=true`
   - `VITE_ENABLE_WEB_GAMEPLAY=true`
4. When disabled, web renders a tooling-only notice instead of gameplay UI.
5. CI/release build profiles:
   - `npm run build:tooling` strips installable PWA artifacts.
   - `npm run build:pwa` keeps manifest/service worker for Android install.

## 4. Operator Flow

### Local Engineering Flow

1. Start stack: `npm run dev:api` and `npm run dev`.
2. Run commands in Godot/client or sync tests to generate run events.
3. Open web tooling and launch Replay Inspector.
4. Fetch replay data by `runId`.
5. Compare canonical tip and hash timeline against expected sequence.

### Production Safety Flow

1. Build without gameplay override flag.
2. Confirm web shows gameplay-disabled notice.
3. Use web only for operational tooling workflows.
4. Use Godot runtime for production gameplay sessions.

## 5. Verification Evidence

Automated checks:

```bash
npm test -- tests/unit/WebGameplayGate.test.js tests/unit/SyncReplayService.test.js tests/unit/ApiRouterSyncRoutes.test.js tests/unit/SyncReplayRoute.test.js --runInBand
npm run build
```

Artifacts:

- `docs/reports/m8_replay_inspector_acceptance_checklist_2026-02-24.md`
