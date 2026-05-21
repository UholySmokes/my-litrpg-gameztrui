# Android Readiness Checklist

## Go/No-Go Gates

## 1) Core Integrity
- [x] `npm run typecheck`
- [x] `npm --prefix functions run typecheck`
- [ ] `npm test -- --runInBand` (blocked locally: Firestore emulator not running for `tests/security/firestoreRules.test.js`)
- [x] `npm run validate:registries`
- [x] `npm run validate:archetypes`

## 2) Web PWA Installability
- [x] `npm run build:pwa`
- [x] `npm run test:pwa:installability -- --expect-web-gameplay=true`
- [ ] Install prompt is visible on Android Chrome or manual instructions appear.
- [ ] App launches in standalone display mode from home screen.
- [ ] Offline fallback page resolves when network is unavailable.

## 3) Tooling-Only Web Profile Safety
- [x] `npm run build:tooling`
- [x] `npm run test:pwa:installability -- --expect-web-gameplay=false`
- [x] Production tooling profile keeps gameplay disabled by default.

## 4) Godot Native Android
- [x] `npm run generate:godot-config:prod`
- [x] `npm run generate:godot-config:singleplayer`
- [x] `npm run android:preflight`
- [x] `npm run test:godot:headless`
- [x] `npm run android:export:singleplayer`
- [x] `npm run android:export:internal`
- [x] `npm run android:export:release`
- [ ] Developer singleplayer APK installs on device/emulator and boots `Main.tscn` offline.
- [ ] Offline character creation completes into local gameplay with local save/load and local story text.
- [ ] Internal APK installs on device/emulator and boots `Main.tscn`.
- [x] Release candidate AAB builds with signing credentials.

## 5) Runtime Connection Closure
- [x] `/api/agents` callable from AdminTools (dev-only).
- [x] `/api/agents/run` callable from AdminTools (dev-only).
- [x] Experimental systems are documented and not re-exported in app runtime shims.
- [x] Simulation parity tests pass with shared fixtures.
- Evidence (2026-02-26): `npm test -- tests/unit/AgentService.test.js --runInBand` passed (3/3).

## 6) Evidence Pack
- [ ] CI run links for `app-quality`, `godot-headless`, and `godot-android-export`.
- [x] Artifact hashes + file sizes for singleplayer APK, internal APK, and release AAB.
  - `build/android/developer-singleplayer.apk`: 35M, SHA-256
    `5188ca8c9368a602d0c768df1e3fd0bc289e98236d5265a871843c7583bb904d`
  - `build/android/internal-debug.apk`: 65M, SHA-256 `0aa07520902dc1dc1b5483d89e53456b6feebb04844ce7e1b5edc3324a0813e0`
  - `build/android/release-candidate.aab`: 28M, SHA-256
    `6402a848c975f1621a763ae4f10f47d97630f92831e36661a43e8c4d54db9a80`
- [ ] Manual smoke notes (singleplayer local creation, local save/load, one story refresh, one map transition).
