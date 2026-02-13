# Firebase + Google Cutover Checklist (void-verse.com)

Last updated: February 13, 2026

This checklist is for replacing Azure edge/frontend routing with Firebase Hosting + Firebase Functions while keeping the existing app behavior.

## 1. Baseline and freeze

- [ ] Freeze production deploys during cutover window.
- [ ] Export current Azure DNS/Front Door config and keep rollback notes.
- [ ] Confirm current Firebase project: `voidcloud-c2b2c` (`.firebaserc`).
- [ ] Build current web app locally: `npm run build`.

## 2. Firebase Hosting wiring (done in repo)

- [x] `firebase.json` now includes:
- [x] `functions.source = "functions"`
- [x] `hosting.public = "dist"`
- [x] rewrite `/api/**` to function `api` in `us-central1`
- [x] SPA fallback rewrite `** -> /index.html`

Deploy commands:

```bash
npm run build
firebase use voidcloud-c2b2c
firebase deploy --only functions,hosting
```

## 3. API parity migration (Azure `api/` -> Firebase `functions/lib`)

Current Firebase router only handles:

- [x] `GET /api/health`
- [x] `POST /api/narrate`
- [x] `POST /api/narrate-start`
- [x] `GET /api/narrate-poll`
- [x] `GET/POST/PUT/DELETE /api/saves/{id?}` (implemented in `functions/lib/saves.js`)

Azure routes that still need parity in Firebase:

- [ ] `GET/POST/PUT/DELETE /api/runs/{id?}`
- [ ] `POST /api/runs/{runId}/actions/submit`
- [ ] `GET/POST /api/runs/{runId}/events`
- [ ] `GET/POST /api/runs/{runId}/snapshots`
- [ ] `POST /api/runs/{runId}/sync/push`
- [ ] `GET /api/runs/{runId}/sync/pull` (Azure side currently has `function.json` but missing handler file)
- [ ] `GET /api/static-data/{bundleKey?}`
- [ ] `GET/POST /api/factory/run`
- [ ] `POST /api/quest/create`
- [ ] `POST /api/orchestrator`

## 4. Auth migration (Azure Easy Auth -> Firebase Auth)

Current frontend auth is Azure-specific in `src/core/AuthService.js`:

- [ ] Replace `/.auth/login/<provider>` flow with Firebase Auth sign-in methods.
- [ ] Replace `/.auth/me` lookup with Firebase `onAuthStateChanged` user state.
- [ ] Replace logout URL redirect logic with Firebase `signOut`.
- [ ] Update API auth from trusted SWA headers to Firebase ID token verification in backend (`firebase-admin`).
  - `/api/saves` now verifies Firebase ID tokens; other protected routes still pending.
- [ ] Enforce auth on sensitive routes (`runs/saves/action-submit/sync`).

## 5. Environment and secrets

- [ ] Move required runtime secrets to Firebase (prefer Secret Manager):
- [ ] `FOUNDRY_PROJECT_ENDPOINT`
- [ ] `FOUNDRY_API_KEY` (or equivalent Google-side config if changing provider)
- [ ] `NARRATOR_AGENT_ID`, `COMBAT_AGENT_ID`, `DIALOGUE_AGENT_ID`, `SYSTEM_AGENT_ID`, `WORLD_AGENT_ID`
- [ ] DB/storage settings (`REDIS_URL`, SQL settings, or file backend strategy)
- [ ] Remove Azure-only runtime assumptions once migrated.

## 6. Domain cutover for `void-verse.com`

In Firebase Console -> Hosting -> Add custom domain:

- [ ] Add `void-verse.com`
- [ ] Add `www.void-verse.com` (recommended)
- [ ] Complete domain verification (TXT record)
- [ ] Add Firebase-provided A/AAAA/CNAME records exactly as shown in console
- [ ] Wait for SSL certificate status to become active

DNS/edge cleanup after Firebase reports domain connected:

- [ ] Remove old Azure Front Door custom domain binding for `void-verse.com`
- [ ] Remove DNS records pointing at Azure edge
- [ ] Keep rollback notes for 24-48 hours

## 7. Validation after cutover

- [ ] `https://void-verse.com` serves current `dist` build
- [ ] SPA deep links return `index.html` (no 404)
- [ ] `/api/health` returns from Firebase function
- [ ] Narration endpoints return expected responses
- [ ] Auth login/logout/session works with Firebase Auth
- [ ] Saves/runs endpoints work and enforce auth
- [ ] Rate limiting behavior verified under load

## 8. Rollback plan

- [ ] Keep previous Azure edge config for immediate re-enable
- [ ] If major failure, restore DNS records to previous Azure target
- [ ] Announce rollback and freeze new deploys until root cause is fixed
