# Project Health & Integrity Report

## Executive Summary
A comprehensive scan of the `my-litrpg-gameztrui` project reveals a mixed-technology stack (React/Vite, Firebase Functions, Godot, Python) with a Monorepo structure. While the codebase contains significant functionality, there are **CRITICAL** missing components that will prevent both the backend API from starting and the game client from building.

**Overall Health Status**: 🔴 **CRITICAL** - Immediate remediation required for build and runtime stability.

---

## 1. Critical Issues (Blocking Run/Build)

### 🔴 Missing Backend Handler Logic
*   **Location**: `functions/lib/handlers.js`
*   **Impact**: **API CRASH**. The `functions/lib/api-router.js` file explicitly requires `./handlers`, but this file does not exist in `functions/lib/` or `functions/`.
*   **Consequence**: The Firebase Function `api` will fail to initialize, causing all API endpoints (`/api/narrate`, `/api/health`, etc.) to error with `MODULE_NOT_FOUND`.
*   **Recommendation**: Restore `handlers.js` from backup or history, or reimplement the missing route handlers (`health`, `agents`, `narrate`, `narrateStart`, `narratePoll`).

### 🔴 Missing Godot Export Configuration
*   **Location**: `godot/export_presets.cfg`
*   **Impact**: **BUILD FAILURE**. The build script `scripts/configure-android-signing.mjs` and Godot export process rely on this file. Only a backup (`export_presets.cfg.bak.codex`) exists.
*   **Consequence**: Android and Web builds cannot be generated.
*   **Recommendation**: Restore `export_presets.cfg` from the backup or regenerate it within the Godot Editor.

---

## 2. High Severity Issues (Configuration & Dependencies)

### 🟠 Missing/Uninstalled Dependencies
*   **Location**: Root and subdirectories
*   **Impact**: **CANNOT RUN**. `node_modules` are missing (standard for fresh clones), but `functions/` and `packages/` also lack installed dependencies.
*   **Recommendation**: Run `npm install` in the root (which should handle workspaces). Ensure `functions/` dependencies are also installed if not covered by root workspaces.

### 🟠 Incomplete Environment Configuration
*   **Location**: `functions/.env.example`
*   **Impact**: **RUNTIME ERRORS**.
    *   `functions/lib/narrate-runs-store.js` uses `NARRATE_RUN_TTL_MS`, which is missing from `functions/.env.example`.
    *   `src/observability/initTracing.node.js` uses `TRACE_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT`, etc., which are not documented in root `.env.example`.
*   **Recommendation**: Update `.env.example` files to include all required variables.

---

## 3. Medium Severity Issues (Structure & Maintenance)

### 🟡 Confused Functions Build Process
*   **Location**: `functions/`
*   **Issue**: `functions/package.json` specifies `"main": "index.js"` (CommonJS), but `functions/tsconfig.json` specifies `"outDir": "lib"`.
    *   `functions/src/` contains `index.ts` and `genkit-sample.ts` but **NO** `api-router.ts` or `handlers.ts`.
    *   `functions/lib/` contains `api-router.js` (CommonJS) but **NO** `handlers.js`.
*   **Risk**: It is unclear if `functions/` is meant to be a TypeScript project compiled to `lib/` or a JavaScript project. Running `tsc` might overwrite valid JS files in `lib/` with incomplete TS compilations.
*   **Recommendation**: Clarify if `functions` is TS or JS. If TS, migrate all `lib/*.js` files to `src/*.ts`. If JS, remove `tsconfig.json` and `src/*.ts` to avoid confusion.

### 🟡 Missing Python Dependencies File
*   **Location**: `user_agent/`
*   **Issue**: `Dockerfile` checks for `requirements.txt`, but it does not exist.
*   **Impact**: While `main.py` currently only uses standard libraries, future additions will fail without this file.
*   **Recommendation**: Create an empty `requirements.txt` or remove the check from `Dockerfile` if strictly standard lib.

---

## 4. Component Analysis & Missing References

| Component | Status | Missing / Broken References |
|-----------|--------|-----------------------------|
| **Frontend (React)** | 🟡 Warning | `src/main.jsx` imports exist, but `dataconnect-generated` imports in `package.json` need verification after `npm install`. |
| **Backend (Firebase)** | 🔴 Critical | `functions/lib/handlers.js` (MISSING). `functions/.env` missing vars. |
| **Game Engine (Godot)** | 🔴 Critical | `godot/export_presets.cfg` (MISSING). |
| **Packages** | 🟢 OK | `game-core` and `game-schemas` structure appears valid. |
| **Documentation** | 🟢 OK | Extensive docs available, though scattered. |

---

## 5. Remediation Plan

1.  **Immediate Fixes**:
    *   Recreate/Restore `functions/lib/handlers.js`.
    *   Restore `godot/export_presets.cfg` from `.bak.codex` or Godot Editor.
2.  **Setup**:
    *   Run `npm install`.
    *   Copy `.env.example` to `.env` and fill values.
3.  **Cleanup**:
    *   Decide on TS vs JS for `functions/` and consolidate.
    *   Add missing env vars to documentation.
