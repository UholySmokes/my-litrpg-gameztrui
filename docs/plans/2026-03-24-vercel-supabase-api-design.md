# Vercel Supabase API Migration Design

Date: 2026-03-24

## Goal

Move the web API off Firebase hosting/functions onto Vercel, replace Firebase Auth with Supabase Auth for the browser flow, and move core gameplay persistence away from Firebase-backed stores.

## Approved Direction

- Keep the existing `/api/*` route contract and reuse the current handler/business-logic modules.
- Add a Vercel catch-all API entrypoint that forwards requests into the existing API router.
- Replace frontend Firebase Auth usage with Supabase Auth while preserving the current local-only dev fallback.
- Add a Supabase backend for saves, sync state, sync events, migration-version tracking, and narrate-run polling state.
- Keep non-core admin bulk-generation routes on a safe fallback path instead of blocking the migration on a full store rewrite.

## Scope

- Add Vercel runtime/config for the Vite frontend plus server API routing.
- Add shared Supabase helpers for browser auth and server-side data access.
- Update frontend auth code to use Supabase OAuth redirects.
- Update backend auth to resolve Supabase bearer tokens.
- Add Supabase persistence adapters for:
  - `game_saves`
  - `sync_runs`
  - `run_events`
  - `sync_profiles`
  - `narrate_runs`
- Refresh env/docs to describe the new deployment target and canonical variables.

## Non-Goals

- Rewriting narration or sync business logic.
- Reworking gameplay UI around auth.
- Fully redesigning bulk generation persistence in this pass.
- Removing every Firebase-era file from the repo immediately.

## Data Model Direction

- Supabase becomes the canonical hosted backend for browser auth and core API persistence.
- Browser config uses Vite-compatible env keys:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Compatibility with the pasted `NEXT_PUBLIC_*` names may remain as a fallback read path, but not as the primary convention.
- Server-side writes should work with the signed-in user access token under Supabase RLS when possible, with optional service-role support if later needed.

## Risks And Mitigations

- Risk: OAuth provider mapping differs between Firebase and Supabase.
- Mitigation: normalize existing provider choices onto Supabase provider IDs and keep local dev auth fallback intact.

- Risk: existing sync/save flows assume Firebase-backed defaults.
- Mitigation: introduce `supabase` as an explicit backend option and make hosted defaults prefer Supabase when configured.

- Risk: non-core admin routes may still expect Firebase storage.
- Mitigation: keep them on a non-crashing fallback path and call out the residual limitation after verification.

## Validation

- Focused checks should confirm:
  - frontend auth still initializes and returns bearer tokens
  - `/api/saves*` stays contract-compatible
  - `/api/sync/*` keeps canonical routing and persistence semantics
  - `/api/narrate*` still works on the Vercel wrapper path
  - Vercel config builds the Vite app and routes API requests separately from SPA navigation
