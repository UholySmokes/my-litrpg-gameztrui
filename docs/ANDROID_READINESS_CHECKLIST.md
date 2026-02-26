# Android Readiness Checklist

## Go/No-Go Gates

## 1) Core Integrity
- [ ] `npm run typecheck`
- [ ] `npm --prefix functions run typecheck`
- [ ] `npm test -- --runInBand`
- [ ] `npm run validate:registries`
- [ ] `npm run validate:archetypes`

## 2) Web PWA Installability
- [ ] `npm run build:pwa`
- [ ] `npm run test:pwa:installability -- --expect-web-gameplay=true`
- [ ] Install prompt is visible on Android Chrome or manual instructions appear.
- [ ] App launches in standalone display mode from home screen.
- [ ] Offline fallback page resolves when network is unavailable.

## 3) Tooling-Only Web Profile Safety
- [ ] `npm run build:tooling`
- [ ] `npm run test:pwa:installability -- --expect-web-gameplay=false`
- [ ] Production tooling profile keeps gameplay disabled by default.

## 4) Godot Native Android
- [ ] `npm run generate:godot-config:prod`
- [ ] `npm run android:export:internal`
- [ ] `npm run android:export:release`
- [ ] Internal APK installs on device/emulator and boots `Main.tscn`.
- [ ] Release candidate AAB builds with signing credentials.

## 5) Runtime Connection Closure
- [ ] `/api/agents` callable from AdminTools (dev-only).
- [ ] `/api/agents/run` callable from AdminTools (dev-only).
- [ ] Experimental systems are documented and not re-exported in app runtime shims.
- [ ] Simulation parity tests pass with shared fixtures.

## 6) Evidence Pack
- [ ] CI run links for `app-quality`, `godot-headless`, and `godot-android-export`.
- [ ] Artifact hashes + file sizes for APK and AAB.
- [ ] Manual smoke notes (auth fallback, save/load, sync pull, one narrative cycle).

