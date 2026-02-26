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
- [x] `npm run android:preflight`
- [ ] `npm run android:export:internal` (blocked: Godot returns generic configuration errors, no artifact emitted)
- [ ] `npm run android:export:release` (blocked: Godot returns generic configuration errors, no artifact emitted)
- [ ] Internal APK installs on device/emulator and boots `Main.tscn`.
- [ ] Release candidate AAB builds with signing credentials.

## 5) Runtime Connection Closure
- [ ] `/api/agents` callable from AdminTools (dev-only).
- [ ] `/api/agents/run` callable from AdminTools (dev-only).
- [x] Experimental systems are documented and not re-exported in app runtime shims.
- [x] Simulation parity tests pass with shared fixtures.

## 6) Evidence Pack
- [ ] CI run links for `app-quality`, `godot-headless`, and `godot-android-export`.
- [ ] Artifact hashes + file sizes for APK and AAB.
- [ ] Manual smoke notes (auth fallback, save/load, sync pull, one narrative cycle).
