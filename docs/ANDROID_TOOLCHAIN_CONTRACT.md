# Android Toolchain Contract

## Scope
This contract defines the supported environment for native Godot Android delivery:

1. `Android Developer Singleplayer` debug APK.
2. `Android Internal Debug` debug APK.
3. `Android Release Candidate` signed release AAB.

## Required Versions
1. Node.js: `>=20` locally, CI may pin newer.
2. Godot: `4.6.2 stable` with matching export templates installed.
3. Java: `21` JDK for Android export and Gradle fallback builds.
4. Android SDK:
   - `platform-tools`
   - `build-tools;35.0.1`
   - `platforms;android-35`
   - `cmdline-tools;latest`
   - `licenses`
5. Android NDK:
   - `ndk;28.1.13356709`

## Required Files
1. [godot/export_presets.cfg](D:/Apps/my-litrpg-gameztrui/godot/export_presets.cfg)
2. [godot/export_credentials.cfg](D:/Apps/my-litrpg-gameztrui/godot/export_credentials.cfg)
3. [godot/android/build](D:/Apps/my-litrpg-gameztrui/godot/android/build)
4. [godot/android/build/assetPackInstallTime/src/main/assets/project.binary](D:/Apps/my-litrpg-gameztrui/godot/android/build/assetPackInstallTime/src/main/assets/project.binary)

## Runtime Profiles
1. `singleplayer_local`
   - generated with `npm run generate:godot-config:singleplayer`
   - no auth, sync, or story HTTP calls
2. `online`
   - generated with `npm run generate:godot-config:prod`
   - uses backend endpoints from `godot/data/config.json`

## Export Commands
1. `npm run android:preflight`
2. `npm run android:export:singleplayer`
3. `npm run android:export:internal`
4. `npm run android:export:release`

## Export Behavior
1. The export scripts always refresh Godot character options before config generation.
2. The exporter prefers direct Godot Android export first.
3. If direct Godot Android export fails with configuration errors, the script falls back to:
   - `--export-pack` to build a fresh PCK
   - asset-pack replacement inside the Android build template
   - Gradle template assembly with explicit SDK/JDK wiring
4. The Gradle fallback is the supported closure path for local developer exports on this repo.

## Signing Contract
1. Debug APKs use the debug keystore values from [godot/export_credentials.cfg](D:/Apps/my-litrpg-gameztrui/godot/export_credentials.cfg).
2. Release candidate exports require valid release keystore values in the same credentials file.
3. `scripts/configure-android-signing.mjs` remains the way to inject production signing inputs.

## Local Preflight
`npm run android:preflight` must validate:

1. Godot CLI resolution.
2. JDK 17 resolution.
3. Android SDK + NDK required directories.
4. Godot 4.6.2 export templates.
5. Export preset names.
6. Export credentials file.
7. Android build template files and `project.binary`.
