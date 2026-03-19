# Dev Team Alpha — Round 1 Implementation Plan

> **Team:** Marcus (Tech Lead), Priya (Security), Jin (API Dev), Olga (DB Engineer), Sam (DevOps)
> **Date:** 2026-03-19
> **Scope:** Backend, Security, Infrastructure fixes for Voidverse LitRPG
> **Firebase Project:** `my-litrpg-gameztrui-3416-da75c` (us-central1)

---

## TL;DR

The backend has a **critical auth bypass** that allows user impersonation via header injection when `DEV_AUTH_ENABLED` is set — and there are zero guardrails preventing this in production. We have **no rate limiting** on any endpoint, **no automated deploy pipeline**, and all API routes funnel through a single 1 GiB / 540s Firebase Function monolith. The plan addresses security first (week 1-2), then infrastructure (week 3-4), architecture (week 5-8), and scale readiness (week 9-12).

---

## Phase 1: Critical Security (Week 1–2)

### Task 1.1 — Production Safety Guard for Dev Auth Bypass

| Field | Value |
|-------|-------|
| **Owner** | Priya (Security) |
| **Priority** | CRITICAL |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Risk if skipped** | Any production env with `DEV_AUTH_ENABLED=true` or `FUNCTIONS_EMULATOR=true` set allows full user impersonation via `x-dev-user-id` header. CVE-level vulnerability. |

**Current state** (`functions/lib/auth.js`, lines 40–44):
```js
function isDevAuthEnabled() {
  const explicit = parseOptionalBoolean(process.env.DEV_AUTH_ENABLED);
  if (explicit !== null) return explicit;
  return String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
}
```
There is no check for the production Firebase project ID. The function trusts env vars entirely.

**The `getDevUser()` function** (lines 55–79) accepts `x-dev-user-id` header and returns a fully authenticated user object with `roles: ["authenticated"]`. This is then picked up by `getUserFromRequest()` (line 127) before Firebase token verification, so a valid dev-auth override completely skips real auth.

**Files to modify:**
- `functions/lib/auth.js` — add production project guard

**Exact changes:**

1. Add a known production project ID constant and a production environment detector:
```js
const PRODUCTION_PROJECT_IDS = [
  "my-litrpg-gameztrui-3416-da75c",
];

function isProductionEnvironment() {
  const projectId = process.env.GCLOUD_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCP_PROJECT
    || "";
  return PRODUCTION_PROJECT_IDS.includes(projectId);
}
```

2. Rewrite `isDevAuthEnabled()`:
```js
function isDevAuthEnabled() {
  // SECURITY: Never allow dev auth in production, regardless of env vars
  if (isProductionEnvironment()) {
    if (parseOptionalBoolean(process.env.DEV_AUTH_ENABLED) === true) {
      console.error(
        "[SECURITY] DEV_AUTH_ENABLED is set in production — IGNORING. "
        + "Remove this env var from your production deployment."
      );
    }
    return false;
  }
  const explicit = parseOptionalBoolean(process.env.DEV_AUTH_ENABLED);
  if (explicit !== null) return explicit;
  return String(process.env.FUNCTIONS_EMULATOR || "").toLowerCase() === "true";
}
```

3. Add `isProductionEnvironment` to exports for testing.

**Verification:**
- Existing test `tests/unit/AuthGuardBackend.test.js` must still pass.
- Add new test cases:
  - When `GCLOUD_PROJECT=my-litrpg-gameztrui-3416-da75c` and `DEV_AUTH_ENABLED=true` → `isDevAuthEnabled()` returns `false`.
  - When `GCLOUD_PROJECT=my-litrpg-gameztrui-3416-da75c` and `FUNCTIONS_EMULATOR=true` → `isDevAuthEnabled()` returns `false`.
  - Console.error is called when dev auth is attempted in production.

---

### Task 1.2 — Rate Limiting Middleware for Client-Facing Endpoints

| Field | Value |
|-------|-------|
| **Owner** | Jin (API Dev) |
| **Priority** | HIGH |
| **Effort** | 8 hours |
| **Dependencies** | None |
| **Risk if skipped** | DoS attacks on `/api/narrate` (which calls Gemini API — real cost), `/api/saves`, `/api/sync/*` endpoints. No abuse protection. |

**Current state:** Zero rate limiting. No middleware infrastructure exists in the custom router (`functions/lib/api-router.js`). The router is pure if/else chains.

**Approach:** In-memory token bucket per IP (suitable for single Cloud Function instance). For cross-instance limiting, Firestore-based counters can be added later. The in-memory approach is adequate for single-instance serverless (Firebase Functions cold starts reset the bucket anyway).

**Files to create:**
- `functions/lib/rate-limiter.js` — Token bucket implementation

**Files to modify:**
- `functions/lib/api-router.js` — Insert rate limit check before route dispatch

**Exact changes:**

1. Create `functions/lib/rate-limiter.js`:
```js
/**
 * In-memory token bucket rate limiter.
 * Resets on cold start (acceptable for Firebase Functions).
 */

const buckets = new Map();

const TIER_LIMITS = {
  // endpoint-pattern → { maxTokens, refillRate (tokens/sec), refillInterval (ms) }
  narrate:    { maxTokens: 5,  refillRate: 1,  refillIntervalMs: 10000 },
  saves:      { maxTokens: 20, refillRate: 2,  refillIntervalMs: 1000 },
  sync:       { maxTokens: 30, refillRate: 5,  refillIntervalMs: 1000 },
  telemetry:  { maxTokens: 10, refillRate: 2,  refillIntervalMs: 1000 },
  bulkGen:    { maxTokens: 3,  refillRate: 1,  refillIntervalMs: 30000 },
  default:    { maxTokens: 30, refillRate: 5,  refillIntervalMs: 1000 },
};

function getTierForPath(path) {
  if (path.startsWith("/api/narrate") || path.startsWith("/api/story/")) return "narrate";
  if (path.startsWith("/api/saves")) return "saves";
  if (path.startsWith("/api/sync/")) return "sync";
  if (path.startsWith("/api/telemetry")) return "telemetry";
  if (path.startsWith("/api/bulk-gen/")) return "bulkGen";
  return "default";
}

function getClientIp(req) {
  return req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
    || req?.ip
    || "unknown";
}

function checkRateLimit(req) {
  const path = (req?.url || "").split("?")[0] || "";
  const tier = getTierForPath(path);
  const config = TIER_LIMITS[tier];
  const ip = getClientIp(req);
  const key = `${tier}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  const refillCount = Math.floor(elapsed / config.refillIntervalMs) * config.refillRate;
  if (refillCount > 0) {
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refillCount);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return { allowed: false, tier, retryAfterMs: config.refillIntervalMs };
  }

  bucket.tokens -= 1;
  return { allowed: true, tier, remaining: bucket.tokens };
}

// Periodic cleanup of stale buckets (every 5 minutes)
setInterval(() => {
  const cutoff = Date.now() - 300000;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, 300000).unref();

module.exports = { checkRateLimit, TIER_LIMITS, getTierForPath };
```

2. Modify `functions/lib/api-router.js` — add rate limit check after path normalization, before routing:
```js
const { checkRateLimit } = require("./rate-limiter");

// Inside handleApiRequest, after path/method extraction:
const rateLimitResult = checkRateLimit(req);
if (!rateLimitResult.allowed) {
  res.set("Retry-After", String(Math.ceil(rateLimitResult.retryAfterMs / 1000)));
  return json(res, 429, {
    ok: false,
    errorCode: "RATE_LIMITED",
    message: `Too many requests. Try again in ${Math.ceil(rateLimitResult.retryAfterMs / 1000)}s.`,
  });
}
```

3. Exempt `/api/health` from rate limiting (add before the rate limit call).

**Verification:**
- Unit test: multiple rapid calls return 429 after exceeding bucket.
- Verify `/api/health` is never rate-limited.
- Load test: 10 rapid `/api/narrate` calls → first 5 succeed, rest get 429.

---

### Task 1.3 — Request Body Size Validation

| Field | Value |
|-------|-------|
| **Owner** | Jin (API Dev) |
| **Priority** | MEDIUM |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Risk if skipped** | Memory exhaustion attacks via huge request payloads. Gemini prompt injection with oversized payloads. |

**Current state:** `functions/lib/http.js` reads `req.rawBody` with zero size checks. Firebase Functions has a default 10 MB limit, but that's too large for our use case.

**Files to modify:**
- `functions/lib/api-router.js` — add body size guard early in `handleApiRequest`

**Exact changes:**

Add body size check after rate limiting, before route dispatch:
```js
const MAX_BODY_BYTES = {
  "/api/narrate":       65536,   // 64 KB
  "/api/narrate-start": 65536,
  "/api/story/event":   65536,
  "/api/story/start":   65536,
  "/api/sync/commit":       131072, // 128 KB
  "/api/sync/commit-batch": 262144, // 256 KB
  "/api/sync/command":      65536,
  "/api/sync/action":       131072,
  "/api/telemetry":         32768,  // 32 KB
  "/api/bulk-gen/run/start": 65536,
  "/api/bulk-gen/run/tick":  32768,
  "/api/bulk-gen/style":     65536,
  "/api/bulk-gen/budget-alert": 8192,
};
const DEFAULT_MAX_BODY = 131072; // 128 KB

// Inside handleApiRequest, for POST/PUT/PATCH methods:
if (["POST", "PUT", "PATCH"].includes(method)) {
  const maxBytes = MAX_BODY_BYTES[path] || DEFAULT_MAX_BODY;
  const contentLength = parseInt(req.headers?.["content-length"] || "0", 10);
  const actualSize = req.rawBody ? req.rawBody.length : 0;
  const bodySize = contentLength || actualSize;
  if (bodySize > maxBytes) {
    return json(res, 413, {
      ok: false,
      errorCode: "PAYLOAD_TOO_LARGE",
      message: `Request body exceeds ${maxBytes} bytes.`,
    });
  }
}
```

**Verification:**
- Unit test: POST with body > limit returns 413.
- GET requests bypass check.

---

## Phase 2: Infrastructure (Week 3–4)

### Task 2.1 — Automated Firebase Deploy Pipeline

| Field | Value |
|-------|-------|
| **Owner** | Sam (DevOps) |
| **Priority** | HIGH |
| **Effort** | 6 hours |
| **Dependencies** | Task 1.1 (auth fix must be deployed first) |
| **Risk if skipped** | Manual deploys with zero verification. Risk of deploying broken code or insecure configs. |

**Current state:** Three CI workflows exist (`quality-gates.yml`, `pr-fast.yml`, `nightly-replay-load.yml`) but none deploy. Deployments are manual `firebase deploy` commands.

**Files to create:**
- `.github/workflows/deploy-production.yml`

**Exact changes:**

Create a production deploy workflow triggered on push to `main` after quality gates pass:

```yaml
name: Deploy Production

on:
  workflow_run:
    workflows: ["Quality Gates"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install Dependencies
        run: npm ci

      - name: Install Functions Dependencies
        run: npm --prefix functions ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: my-litrpg-gameztrui-3416-da75c

      - name: Deploy Functions
        run: npx firebase-tools deploy --only functions --project my-litrpg-gameztrui-3416-da75c --token "${{ secrets.FIREBASE_TOKEN }}"
```

**Required GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` — Service account JSON for hosting deploy.
- `FIREBASE_TOKEN` — CI token from `firebase login:ci`.

**Verification:**
- Push to `main` → Quality Gates pass → Deploy triggers.
- Failed Quality Gates → no deploy.

---

### Task 2.2 — Staging Environment Setup

| Field | Value |
|-------|-------|
| **Owner** | Sam (DevOps), Marcus (Tech Lead) |
| **Priority** | MEDIUM |
| **Effort** | 5 hours |
| **Dependencies** | Task 2.1 |
| **Risk if skipped** | Changes go straight to production with no pre-flight validation. Staging scripts (`test:staging:endpoint-probe`, `test:staging:soak-smoke`, `report:staging:signoff`) are dead code. |

**Current state:** `.firebaserc` only has `default` project. Multiple staging-related npm scripts exist but point nowhere.

**Files to modify:**
- `.firebaserc` — add staging project alias
- `firebase.json` — no changes needed (reused)
- `.github/workflows/deploy-staging.yml` — new file

**Exact changes:**

1. Create a new Firebase project for staging (manual step, Firebase Console).

2. Update `.firebaserc`:
```json
{
  "projects": {
    "default": "my-litrpg-gameztrui-3416-da75c",
    "staging": "my-litrpg-gameztrui-staging"
  }
}
```

3. Create `.github/workflows/deploy-staging.yml`:
```yaml
name: Deploy Staging

on:
  push:
    branches: [develop, staging]
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm --prefix functions ci
      - run: npm run build
      - name: Deploy to Staging
        run: npx firebase-tools deploy --project staging --token "${{ secrets.FIREBASE_TOKEN_STAGING }}"
      - name: Staging Endpoint Probe
        run: npm run test:staging:endpoint-probe
        env:
          STAGING_URL: https://my-litrpg-gameztrui-staging.web.app
```

**Verification:**
- Push to `develop` → staging deploy → endpoint probe passes.
- Existing staging scripts run against actual staging URL.

---

### Task 2.3 — Firebase Function Splitting

| Field | Value |
|-------|-------|
| **Owner** | Marcus (Tech Lead), Jin (API Dev) |
| **Priority** | MEDIUM |
| **Effort** | 12 hours |
| **Dependencies** | Task 1.2 (rate limiter), Task 2.1 (deploy pipeline) |
| **Risk if skipped** | All routes share 1 GiB / 540s limits. Narrate cold starts affect save/sync latency. Billing inefficiency (paying for 1 GiB memory on lightweight GET requests). |

**Current state:** `functions/index.js` exports a single `api` function handling all routes. `firebase.json` rewrites all `/api/**` to this one function.

**Proposed split (3 functions):**

| Function | Routes | Memory | Timeout | Reason |
|----------|--------|--------|---------|--------|
| `api` | `/api/health`, `/api/saves/*`, `/api/sync/*`, `/api/telemetry` | 256 MiB | 60s | Core gameplay — fast, lightweight |
| `apiNarrate` | `/api/narrate*`, `/api/story/*`, `/api/agents/*` | 1 GiB | 540s | AI generation — needs large memory/timeout |
| `apiBulkGen` | `/api/bulk-gen/*` | 512 MiB | 540s | Admin pipeline — medium resources |

**Files to modify:**
- `functions/index.js` — define 3 functions with different configs
- `functions/lib/api-router.js` — extract route subsets into separate router functions
- `firebase.json` — update rewrites

**Changes to `firebase.json` rewrites:**
```json
"rewrites": [
  { "source": "/api/narrate**", "function": { "functionId": "apiNarrate", "region": "us-central1" } },
  { "source": "/api/story/**",  "function": { "functionId": "apiNarrate", "region": "us-central1" } },
  { "source": "/api/agents/**", "function": { "functionId": "apiNarrate", "region": "us-central1" } },
  { "source": "/api/bulk-gen/**", "function": { "functionId": "apiBulkGen", "region": "us-central1" } },
  { "source": "/api/**", "function": { "functionId": "api", "region": "us-central1" } },
  { "source": "**", "destination": "/index.html" }
]
```

**Changes to `functions/index.js`:**
```js
exports.api = onRequest(
  { region: "us-central1", memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => { /* core routes only */ }
);

exports.apiNarrate = onRequest(
  { region: "us-central1", memory: "1GiB", timeoutSeconds: 540 },
  async (req, res) => { /* narrate + agents routes */ }
);

exports.apiBulkGen = onRequest(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 540 },
  async (req, res) => { /* bulk-gen routes only */ }
);
```

**Verification:**
- All existing API tests pass against each function.
- `npm run test:staging:endpoint-probe` covers all routes.
- Cold start latency for `/api/saves` drops below 2s.

---

## Phase 3: Architecture (Week 5–8)

### Task 3.1 — Router Modernization (Declarative Route Table)

| Field | Value |
|-------|-------|
| **Owner** | Jin (API Dev) |
| **Priority** | MEDIUM |
| **Effort** | 10 hours |
| **Dependencies** | Task 2.3 (function splitting) |
| **Risk if skipped** | Adding new routes requires copy-pasting if/else blocks. No middleware support (auth, logging, validation must be manually wired per route). |

**Current state:** `functions/lib/api-router.js` is ~150 lines of sequential if/else matching. Each route is independently structured.

**Proposed approach:** Declarative route table with middleware chain. No external framework — keep it simple and dependency-free.

**Files to create:**
- `functions/lib/router.js` — Generic lightweight router

**Files to modify:**
- `functions/lib/api-router.js` — Replace if/else with route table

**Route table design:**
```js
const routes = [
  { method: "GET",  path: "/api/health",        handler: handlers.health,         middleware: [] },
  { method: "POST", path: "/api/narrate",        handler: handlers.narrate,        middleware: [requireAuth] },
  { method: "POST", path: "/api/narrate-start",  handler: handlers.narrateStart,   middleware: [requireAuth] },
  { method: "GET",  path: "/api/narrate-poll",   handler: handlers.narratePoll,     middleware: [requireAuth] },
  { method: "POST", path: "/api/sync/commit",    handler: sync.commit,             middleware: [requireAuth] },
  // ... etc
];

// pattern: /api/saves/:saveId
{ method: "*", path: "/api/saves/:saveId?", handler: saves.handleSavesRequest, middleware: [requireAuth] },
```

**Router core (~60 lines):**
```js
function createRouter(routeDefs) {
  return async function dispatch(req, res) {
    const path = normalizePath(req?.url);
    const method = (req?.method || "GET").toUpperCase();

    for (const route of routeDefs) {
      if (route.method !== "*" && route.method !== method) continue;
      const params = matchPath(route.path, path);
      if (params === null) continue;

      // Run middleware chain
      for (const mw of route.middleware || []) {
        const result = await mw(req, res, params);
        if (result === false) return; // middleware sent response
      }

      return route.handler(req, res, params);
    }

    return json(res, 404, { ok: false, errorCode: "NOT_FOUND", message: `No route for ${method} ${path}` });
  };
}
```

**Verification:**
- All existing `ApiRouterSyncRoutes.test.js` tests pass with the new router.
- 404 test for unknown routes.
- Middleware chain test (auth → handler).

---

### Task 3.2 — Docker Cleanup & Alignment

| Field | Value |
|-------|-------|
| **Owner** | Sam (DevOps) |
| **Priority** | LOW |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Risk if skipped** | Docker setup misleads new developers. `Dockerfile` serves a Python user_agent unrelated to main app. `Dockerfile.web` builds nginx but production uses Firebase Hosting. |

**Current state:**
- `Dockerfile` — Python 3.11 for `user_agent/main.py` (port 8088)
- `Dockerfile.web` — Node 22 build + nginx serve (port 80)
- `docker-compose.yml` — Runs both services
- Neither connects to Firebase Functions or emulators

**Proposed changes:**

1. **Move** `Dockerfile` → `user_agent/Dockerfile` (scope to where it belongs).
2. **Replace** `Dockerfile.web` with a Firebase emulator-based dev environment:
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5000 5001 8080 4000
CMD ["npx", "firebase", "emulators:start"]
```
3. **Update** `docker-compose.yml` to reflect actual dev stack:
```yaml
services:
  emulator:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "5000:5000"   # Hosting
      - "5001:5001"   # Functions
      - "8080:8080"   # Firestore
      - "4000:4000"   # Emulator UI
    environment:
      - FUNCTIONS_EMULATOR=true
      - DEV_AUTH_ENABLED=true

  user-agent:
    build:
      context: ./user_agent
      dockerfile: Dockerfile
    ports:
      - "8088:8088"
```
4. Add `docker/README.md` explaining the setup.

**Verification:**
- `docker compose up` starts full emulator stack.
- `/api/health` responds on `localhost:5000`.

---

### Task 3.3 — .nvmrc CI Validation

| Field | Value |
|-------|-------|
| **Owner** | Sam (DevOps) |
| **Priority** | LOW |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Risk if skipped** | Minor version drift between CI and functions engine spec. |

**Current state:** `.nvmrc` says `20`. `functions/package.json` engines says `"node": "20"`. Root `package.json` says `"node": ">=20.0.0"`. CI uses `node-version-file: .nvmrc`. No validation that these are consistent.

**Files to modify:**
- `.github/workflows/pr-fast.yml` — add validation step

**Exact changes:**

Add step after checkout in `pr-fast.yml`:
```yaml
      - name: Validate .nvmrc consistency
        run: |
          NVMRC_VERSION=$(cat .nvmrc | tr -d '[:space:]')
          FN_ENGINE=$(node -e "console.log(require('./functions/package.json').engines.node)")
          if [[ "$NVMRC_VERSION" != "$FN_ENGINE" ]]; then
            echo "::error::.nvmrc ($NVMRC_VERSION) does not match functions/package.json engines.node ($FN_ENGINE)"
            exit 1
          fi
```

**Verification:**
- PR with mismatched `.nvmrc` and `functions/package.json` fails CI.

---

## Phase 4: Scale Readiness (Week 9–12)

### Task 4.1 — Narrative Memory Backend (Firestore-Backed Context Window)

| Field | Value |
|-------|-------|
| **Owner** | Olga (DB Engineer), Marcus (Tech Lead) |
| **Priority** | MEDIUM |
| **Effort** | 20 hours |
| **Dependencies** | Task 1.1 (auth fix), Task 2.3 (function split) |
| **Risk if skipped** | Players report AI has no long-term memory. Current 20-entry / 4000-char sliding window forgets everything. Core player complaint. |

**Current state:** Narrative context is assembled client-side in `src/core/PromptAssembler.js` with a fixed window. No server-side persistence of narrative history beyond save-game state.

**Proposed architecture — Firestore narrative_sessions collection:**

```
narrative_sessions/{sessionId}
  ├── userId: string
  ├── saveId: string
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── entries: subcollection
        ├── {entryId}
        │   ├── turn: number
        │   ├── prompt: string (summarized)
        │   ├── response: string (summarized)
        │   ├── summary: string (AI-generated 1-line summary)
        │   ├── keyFacts: string[] (extracted: names, places, decisions)
        │   ├── createdAt: timestamp
```

**Strategy — Two-tier context:**
1. **Recent window** (last 20 entries) — full text, sent in prompt as-is.
2. **Long-term memory** (all entries) — AI-summarized to key facts. A "memory block" of ~500 chars is prepended to the prompt listing cumulative key facts (NPC relationships, major decisions, discovered locations, etc.).

**Files to create:**
- `functions/lib/narrative-memory.js` — Firestore read/write for narrative sessions
- `functions/lib/narrative-summarizer.js` — Uses Gemini to extract key facts from older entries

**Files to modify:**
- `functions/lib/handlers.js` — Wire narrative memory into narrate flow
- `firestore.indexes.json` — Add compound index for narrative_sessions queries
- `firestore.rules` — Add security rules for narrative_sessions

**Verification:**
- After 30+ turns, AI references events from turn 5.
- Key facts persist across save/load.
- Memory retrieval adds < 200ms to narrate latency.

---

### Task 4.2 — Content Pipeline Backend Support

| Field | Value |
|-------|-------|
| **Owner** | Jin (API Dev), Olga (DB Engineer) |
| **Priority** | LOW |
| **Effort** | 8 hours |
| **Dependencies** | Task 4.1 (narrative memory) |
| **Risk if skipped** | Content expansion (more quests, lore, items) requires manual database seeding. No API for content management. |

**Current state:** Bulk generation pipeline exists (`/api/bulk-gen/*`) but focuses on AI-generated assets. No structured content ingestion/validation API for hand-authored content packs.

**Proposed additions:**

1. **Content validation endpoint** — `POST /api/content/validate`:
   - Accepts a content pack JSON (quests, items, lore entries).
   - Validates against game-core schemas (`packages/game-core/`).
   - Returns validation results without persisting.

2. **Content ingestion endpoint** — `POST /api/content/ingest`:
   - Authenticated + admin-only.
   - Validates and writes content to Firestore `content_packs` collection.
   - Tracks version and author.

**Files to create:**
- `functions/lib/content-pipeline.js` — Validation and ingestion handlers

**Files to modify:**
- `functions/lib/api-router.js` — Add `/api/content/*` routes
- `firestore.rules` — Admin-only rules for `content_packs`

**Verification:**
- Valid content pack → 200 + ingested.
- Invalid content pack → 400 + detailed validation errors.
- Non-admin user → 403.

---

## Dependency Graph

```
Task 1.1 (Auth Fix) ◄──────────────────────────────────────┐
Task 1.2 (Rate Limit) ◄────────────────────────────────┐   │
Task 1.3 (Body Size) ◄─────────────────────────────┐   │   │
                                                    │   │   │
Task 2.1 (Deploy Pipeline) ◄── depends on ────── 1.1   │   │
Task 2.2 (Staging Env) ◄── depends on ────── 2.1       │   │
Task 2.3 (Function Split) ◄── depends on ── 1.2 + 2.1  │   │
                                                        │   │
Task 3.1 (Router Modernize) ◄── depends on ── 2.3      │   │
Task 3.2 (Docker Cleanup) ◄── no deps                  │   │
Task 3.3 (.nvmrc Validation) ◄── no deps               │   │
                                                        │   │
Task 4.1 (Narrative Memory) ◄── depends on ── 1.1 + 2.3│   │
Task 4.2 (Content Pipeline) ◄── depends on ── 4.1      │   │
```

---

## Effort Summary

| Phase | Tasks | Total Effort | Owner(s) |
|-------|-------|-------------|----------|
| Phase 1 | 1.1, 1.2, 1.3 | 13 hours | Priya, Jin |
| Phase 2 | 2.1, 2.2, 2.3 | 23 hours | Sam, Marcus, Jin |
| Phase 3 | 3.1, 3.2, 3.3 | 14 hours | Jin, Sam |
| Phase 4 | 4.1, 4.2 | 28 hours | Olga, Marcus, Jin |
| **Total** | **11 tasks** | **78 hours** | |

---

## Team Disagreements & Open Questions

### Disagreement: Rate Limiter Approach
- **Jin** advocates in-memory token bucket (simple, no deps, adequate for Firebase Functions cold-start model).
- **Marcus** has concerns about cross-instance bypass when Firebase auto-scales to multiple instances. Each instance has its own bucket, so a determined attacker can spread requests.
- **Resolution:** Ship in-memory now (Task 1.2). Add Firestore-based counters as a Phase 4 enhancement if abuse is observed. The narrate endpoint already has natural latency (~2-5s per call) which limits practical abuse.

### Disagreement: Function Splitting Granularity
- **Sam** wants 5 separate functions (health, saves, sync, narrate, bulk-gen) for maximum isolation.
- **Marcus** argues 3 functions balances cold-start multiplication vs resource isolation. Each new function adds ~1-3s cold start latency.
- **Resolution:** Start with 3 (Task 2.3). Revisit after monitoring cold-start metrics in production.

### Open Questions
1. **Staging project name:** Does a `my-litrpg-gameztrui-staging` project already exist? If not, who has Firebase billing owner access to create it?
2. **Gemini API costs:** Rate limiting narrate at 5 req/10s per IP — is this too generous? Each call costs ~$0.001-0.01 in API charges.
3. **Narrative memory scope:** Should narrative memory survive across different save files, or be scoped per save? Current proposal is per-save.
4. **Content pipeline auth:** Who should have admin access to the content ingestion endpoint? Only the deploy service account, or also specific user UIDs?

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth bypass exploited before fix | Medium | Critical | Task 1.1 is zero-dependency, can ship standalone in < 1 day |
| Rate limiter too aggressive for real users | Low | Medium | Tunable constants in `TIER_LIMITS`, can adjust without redeploy via env vars |
| Function split breaks existing clients | Low | High | Gradual rollout: deploy new functions, update rewrites, monitor, then reduce old function resources |
| Staging project creation blocked by billing | Medium | Medium | Can use Firebase preview channels as temporary staging alternative |
| Narrative memory increases narrate latency | Medium | Medium | Key facts query is a single indexed Firestore read; target < 200ms |
