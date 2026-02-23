# Godot 2D RPG Firebase Plan v2 (Trigger-Commit Spec Locked)

## Summary
1. Godot 4 is the primary gameplay client (desktop-first); React remains admin/tooling.
2. Backend authority applies only to state-changing intents, not continuous movement.
3. Canonical sync endpoint is `POST /api/sync/commit`; `POST /api/sync/action` is a legacy wrapper.
4. Data Connect is canonical persistence; Firestore is migration source/fallback only during cutover.
5. Determinism rules, trigger schema, content-version enforcement, and Firestore-rules deadline are now explicit.

## Implementation Status (2026-02-23)
1. ✅ Canonical API surface implemented (`/api/sync/commit`, `/api/sync/commit-batch`, `/api/sync/pull`, `/api/sync/action` wrapper, `/api/story/*`, `/api/saves*`, `/api/narrate*` compatibility).
2. ✅ Trigger-commit contract implemented in server and Godot client (batching policy, immediate flush-before-send, reject-and-reconcile, local-only state exclusions).
3. ✅ Determinism appendix implemented in runtime (`hashCanonicalState`, stable serializer, deterministic RNG seed derivation, replay determinism tests).
4. ✅ Static world/content-version enforcement implemented (manifest hash, trigger/map/target validation, contentVersion mismatch rejection).
5. ✅ Data Connect canonical persistence implemented for sync + saves, with controlled Firestore fallback during cutover.
6. ✅ Lazy migration implemented with one-time `migrationVersion` marker.
7. ✅ Firestore blocking security tests implemented and passing in emulator CI.
8. ✅ Test scenarios implemented for trigger validation, batch ordering/idempotency, immediate triggers, reject/reconcile, determinism parity, content-version mismatch, Firestore denial checks, and auth resilience contract checks.
9. ⚠️ Remaining highest-priority items are operational, not code:
   March 3, 2026: restrictive rules freeze confirmation in repo/release branch.
   March 7, 2026: staging verification sign-off.
   March 9, 2026: production rules deployment.
10. ⚠️ Next technical backlog item after slice stabilization: region alignment for sync path (Functions + DB locality tuning).

## Canonical API Surface
1. `POST /api/sync/commit` (canonical).
2. `POST /api/sync/commit-batch` (canonical for batchable triggers).
3. `GET /api/sync/pull` (canonical reconciliation).
4. `POST /api/sync/action` (legacy wrapper to `commit`, same response shape, deprecation header).
5. `POST /api/story/event`, `POST /api/story/start`, `GET /api/story/poll`.
6. Compatibility routes remain: `/api/saves*`, `/api/narrate*` (wrapped internally).

## Trigger Spec
1. Trigger types: `ENTER_TILE`, `INTERACT`, `ZONE_EXIT`, `ENCOUNTER_GATE`, `SAVEPOINT`.
2. Trigger payload (inside commit envelope): `{ triggerId, mapId, x, y, targetId? }`.
3. Commit envelope required fields: `{ id, runId, clientId, clientSeq, createdAt, contentVersion, triggerType, trigger }`.
4. Client precheck responsibilities: local distance check, local line-of-sight check, local cooldown/gating check, UX feedback immediately.
5. Server validation responsibilities: trigger exists in manifest, trigger allowed for `mapId`, coordinates valid for trigger definition, state prerequisites satisfied, cooldown/security gates enforced.
6. Batch policy: `ENTER_TILE` is batchable (max 100ms window, max 4 items, ordered by `clientSeq`).
7. Immediate-send policy: `INTERACT`, `ZONE_EXIT`, `ENCOUNTER_GATE`, `SAVEPOINT` always send immediately.
8. Batch flush rule: any immediate trigger flushes pending batch first, then sends immediate commit.
9. Reconciliation on reject: client halts pending gameplay commits for run, calls `sync/pull`, replaces canonical gameplay state, clears pending queue, resumes from canonical tip.
10. Local-only state not reconciled: camera smoothing, animation blend, non-authoritative VFX.

## Authority Model
1. Client-authoritative: movement, collision, camera, animation, local traversal.
2. Server-authoritative: interaction outcomes, loot outcomes, combat decisions/outcomes, quest state transitions, crafting outcomes, zone/encounter transitions, save commits.
3. No per-frame sync for movement.

## Determinism Appendix (Mandatory)
1. Canonical hash function: `hashCanonicalState(state) -> sha256_hex`.
2. Canonical serializer: stable JSON with sorted keys and deterministic array order in hashed paths.
3. RNG rule: single deterministic RNG in game-core; seed derivation `runSeed + seq + subsystemTag`.
4. Time rule: no `Date.now()`/wall-clock in deterministic reducer/sim path.
5. Nondeterminism ban in sim path: `Math.random`, unordered iteration dependence, locale/timezone transforms.
6. Numeric rule: sim-critical values use integer/fixed-point where possible.
7. CI determinism gate: replay identical commit log twice; require identical `{seq, tick, stateHash}`.

## Static World Data and Content Version Enforcement
1. Phase-1 world data is packaged in Godot client (manifest + tilemaps + registries).
2. `contentVersion` is the SHA-256 of the shipped world manifest.
3. Every commit includes `contentVersion`.
4. Server rejects commits with unknown IDs or mismatched `contentVersion`.
5. Server validates `triggerId`, `mapId`, `npcId`, `objectId` against approved manifest set for the release.

## Persistence and Migration
1. Data Connect tables remain canonical: `UserProfile`, `RunSession`, `RunEvent`, `SaveSlot`, `StoryMemory`.
2. Lazy migration: on first user access, if Data Connect empty and Firestore has saves, migrate once and mark migration version.
3. Save minimum runtime fields: `worldId`, `mapId`, `playerPos {x,y}`, `entityStates`, `questFlags`, `runId`, `seq`, `tick`, `stateHash`, `contentVersion`, `stateVersion`.

## Firestore Rules Blocking Milestone (Hard Deadline)
1. Hard deadline: before **March 10, 2026**.
2. By **March 3, 2026**: restrictive rules implemented in repo.
3. By **March 7, 2026**: emulator and staging verification complete.
4. By **March 9, 2026**: production rules deployed.
5. Blocking test: unauthenticated and unauthorized client SDK reads/writes to save-related collections must fail in emulator CI.

## Vertical Slice Scope (Strict)
1. One tiny map.
2. One NPC.
3. One quest flag chain.
4. One encounter gate transition.
5. Save + load.
6. Story beat render + prose panel.
7. No extra systems before this slice is stable.

## Test Cases and Scenarios
1. Trigger validation tests per trigger type with positive/negative cases.
2. Batch ordering/idempotency tests for `ENTER_TILE` commit batches.
3. Immediate trigger tests for `INTERACT`, `ZONE_EXIT`, `ENCOUNTER_GATE`, `SAVEPOINT`.
4. Reject-and-reconcile flow test (`commit` reject -> `pull` -> canonical replace).
5. Determinism replay tests for canonical hash and seq/tick parity.
6. Content-version mismatch rejection tests.
7. Firestore rules blocking tests (client denied).
8. Auth resilience tests: token refresh, one retry on 401, safe-mode UI continuity.

## Assumptions and Defaults
1. Godot primary gameplay, React secondary tooling.
2. Desktop-first deployment.
3. Firebase anonymous auth first, upgrade path later.
4. Split regions temporarily accepted because movement is local and commits are sparse.
5. Region alignment for sync path is scheduled after slice stabilization.
