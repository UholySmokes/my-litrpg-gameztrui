# Android Toolchain Contract

## Scope
This contract defines the required environment for dual-track Android delivery:

1. Web PWA profile (`npm run build:pwa`).
2. Godot native Android exports (`android:export:*` scripts).

## Required Versions
1. Node.js: `>=18` (project baseline), CI pins `22`.
2. Java: `21` (Temurin).
3. Godot: `4.2.2+` with export templates installed.
4. Android SDK/NDK:
   `platforms;android-34`, `build-tools;34.0.0`, `platform-tools`, `ndk;26.3.11579264`.

## Required Environment
1. `GODOT_BIN` (optional if `godot4` is in PATH).
2. `GODOT_CONFIG_PROFILE` (`local` or `production`).
3. `GODOT_API_BASE_URL` (optional explicit override for generated runtime config).

## Signing Inputs (Release Candidate)
1. `GODOT_ANDROID_KEYSTORE_BASE64` (base64-encoded keystore content).
2. `GODOT_ANDROID_KEYSTORE_PASSWORD`.
3. `GODOT_ANDROID_KEY_ALIAS`.
4. `GODOT_ANDROID_KEY_ALIAS_PASSWORD`.

## Export Profiles
1. Internal debug APK preset:
   `Android Internal Debug` -> `build/android/internal-debug.apk`
2. Release candidate AAB preset:
   `Android Release Candidate` -> `build/android/release-candidate.aab`

## CI Contract
1. CI job: `godot-android-export` (gated by repository variable `ANDROID_EXPORT_ENABLED=true`).
2. Artifacts:
   `internal-debug.apk`, `release-candidate.aab`.
3. Fail the job when preset config, Godot binary, or expected artifacts are missing.

## Local Preflight
1. Run `npm run android:preflight` before `android:export:*`.
2. Preflight validates:
   - SDK path + required tool directories.
   - Android export templates (`android_debug.apk`, `android_release.apk`, `android_source.zip`).
   - Project build template install (`godot/android/build/*`).
   - Required preset names in `godot/export_presets.cfg`.
