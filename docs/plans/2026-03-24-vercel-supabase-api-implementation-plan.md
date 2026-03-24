# Vercel Supabase API Migration Implementation Plan

Date: 2026-03-24
Depends on: `docs/plans/2026-03-24-vercel-supabase-api-design.md`

## Target Outcome

- The web app can deploy to Vercel with same-origin `/api/*` routes.
- Browser sign-in uses Supabase instead of Firebase.
- Save, sync, and narrate-run persistence can run against Supabase-backed tables instead of Firebase-backed stores.
- Existing gameplay-facing API contracts remain stable for the frontend and Godot/web clients.

## Implementation Steps

### Slice 1 - Deployment Wrapper

- Add Vercel config for the Vite frontend output and SPA fallback behavior.
- Add a Vercel Node API catch-all that forwards requests into the existing API router.
- Keep the current `/api/*` path structure unchanged.

### Slice 2 - Shared Supabase Runtime

- Install `@supabase/supabase-js`.
- Add a shared helper for resolving Supabase env config and creating browser/server clients.
- Add backend auth token resolution against Supabase auth endpoints.

### Slice 3 - Frontend Auth Migration

- Replace Firebase SDK auth usage in `src/core/AuthService.js` with Supabase auth.
- Keep current local-only mode and `VITE_DEV_USER_*` override behavior.
- Preserve the existing app-facing auth API (`signIn`, `signOut`, `getCurrentUser`, `onAuthStateChange`, `getAuthToken`).

### Slice 4 - Persistence Migration

- Add `supabase` backend support to save and sync store resolution.
- Implement Supabase-backed saves, sync runs/events/profile migration state, and narrate-run state.
- Pass authenticated access tokens through save/sync reset flows so Supabase-backed requests can operate under user identity.

### Slice 5 - Docs And Env

- Refresh `.env.example` with canonical Supabase variables and Vercel-oriented notes.
- Update local env with the provided publishable Supabase values.
- Refresh runtime comments/docs that still describe Firebase hosting as the primary same-origin deployment path.

### Slice 6 - Verification

- Run targeted tests for auth-adjacent client code and API/save/sync routes.
- Summarize any remaining non-core Firebase dependency or fallback behavior after the migration.

## Model Recommendation

- Optimal model: `gpt-5.4`
- Reasoning strength: `high`
- Execution location: `local`
