# Middleware Dependency Analysis

**Generated:** 2026-02-02  
**Repository:** my-litrpg-gameztrui  
**API Platform:** Azure Functions (Node.js)

## Executive Summary

This document provides a comprehensive analysis of the middleware architecture, dependencies, and configuration for the Azure Functions-based API endpoints in this project. The API implements a centralized shared utility pattern with three AI-powered endpoints that depend on Azure AI Foundry services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Shared Middleware Layer](#shared-middleware-layer)
3. [Endpoint Dependencies](#endpoint-dependencies)
4. [External Service Dependencies](#external-service-dependencies)
5. [Rate Limiting Implementation](#rate-limiting-implementation)
6. [Authentication & Security](#authentication--security)
7. [Host Configuration](#host-configuration)
8. [Environment Variables](#environment-variables)
9. [Recommendations](#recommendations)

---

## Architecture Overview

### Middleware Pattern

The API follows a **centralized shared utility pattern** where all endpoints depend on a single middleware module (`api/lib/azure-ai-utils.js`) that provides:

- HTTP response formatting
- Environment variable management
- Azure AI Foundry client wrapper
- Rate limiting (dual-layer: Redis + in-memory)
- Security utilities

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Functions Host                    │
│                        (host.json v2.0)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ narrate │          │  quest  │          │ factory │
   │         │          │  create │          │   run   │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  azure-ai-utils.js  │
                    │  (Shared Middleware)│
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Azure  │          │  Azure  │          │  Redis  │
   │   AI    │          │ Identity│          │(optional)│
   │ Foundry │          │         │          │         │
   └─────────┘          └─────────┘          └─────────┘
```

---

## Shared Middleware Layer

### File: `api/lib/azure-ai-utils.js`

This module exports 13 utility functions used across all endpoints:

#### Response & Formatting
- **`jsonResponse(status, body)`** - Creates standardized HTTP responses with JSON content-type headers
- **`toStringSafe(value)`** - Type-safe string coercion
- **`hashContent(text)`** - SHA-256 hashing for output verification
- **`generateId(prefix)`** - Cryptographically secure ID generation

#### Configuration Management
- **`getRequiredEnv(name)`** - Retrieves required environment variables with trimming
- **`getOptionalEnv(name, fallback)`** - Retrieves optional environment variables with defaults
- **`normalizeEndpoint(endpoint)`** - Strips trailing slashes from URLs

#### HTTP Client
- **`resolveFetch()`** - Dynamic fetch polyfill (native or undici)
- **`fetchJson(url, options)`** - Enhanced fetch with:
  - Automatic retry logic for transient errors (429, 500, 502, 503, 504)
  - Exponential backoff: `min(2000, 300 * (attempt + 1))` milliseconds
  - Bearer token authentication
  - JSON parsing with error handling

#### Azure AI Foundry Integration
- **`extractAssistantText(messagesResponse)`** - Parses assistant responses from multiple Azure AI message formats
- **`getApiVersion()`** - Retrieves API version from environment (default: "2025-05-01")
- **`getTimeoutMs(name, fallbackMs)`** - Configurable timeout management

#### Request Processing
- **`readJsonBody(req)`** - Safely parses request body (object, string, or empty)

#### Rate Limiting
- **`rateLimit(key, limit, options)`** - Dual-layer rate limiting implementation (see [Rate Limiting](#rate-limiting-implementation))

### Dependency Graph

```
azure-ai-utils.js
├── crypto (Node.js built-in)
├── undici (^6.21.0) - Fetch polyfill
└── redis (^4.7.1) - Optional rate limit backend
```

---

## Endpoint Dependencies

### 1. Narrate Endpoint

**Route:** `POST /api/narrate`  
**Function:** `api/narrate/index.js`  
**Purpose:** Generate narrative text using Azure AI Foundry NarratorAgent

#### Dependencies
| Type | Dependency | Usage |
|------|-----------|-------|
| **Shared Middleware** | azure-ai-utils.js | 11 imported functions |
| **External Service** | Azure AI Foundry | Thread/Message/Run API |
| **Authentication** | @azure/identity | DefaultAzureCredential with managed identity |
| **Rate Limiting** | Redis (optional) + in-memory | Client-based throttling |

#### Configuration
- `FOUNDRY_PROJECT_ENDPOINT` (required)
- `NARRATOR_AGENT_ID` (required)
- `AZURE_CLIENT_ID` (optional) - User-assigned managed identity
- `NARRATE_RATE_LIMIT_PER_MIN` (optional, default: unlimited)
- `NARRATE_RUN_TIMEOUT_MS` (optional, default: 25000ms)
- `AZURE_AI_RUN_TIMEOUT_MS` (optional, fallback default)

#### Request Flow
1. Validate environment variables
2. Check rate limit (client identified by `x-forwarded-for` or `x-client-id` header)
3. Acquire Azure AI token via managed identity
4. Create AI thread → Post message → Start run
5. Poll run status (500ms → 1.5s exponential backoff)
6. Extract assistant text from messages
7. Return narrative with SHA-256 output hash

---

### 2. Quest Create Endpoint

**Route:** `POST /api/quest/create`  
**Function:** `api/quest-create/index.js`  
**Purpose:** Generate structured quest JSON using Azure AI Foundry QuestAgent

#### Dependencies
| Type | Dependency | Usage |
|------|-----------|-------|
| **Shared Middleware** | azure-ai-utils.js | 11 imported functions |
| **External Service** | Azure AI Foundry | Thread/Message/Run API |
| **Authentication** | @azure/identity | DefaultAzureCredential with managed identity |
| **Rate Limiting** | Redis (optional) + in-memory | Client-based throttling |

#### Configuration
- `FOUNDRY_PROJECT_ENDPOINT` (required)
- `QUEST_AGENT_ID` (required)
- `AZURE_CLIENT_ID` (optional)
- `QUEST_RATE_LIMIT_PER_MIN` (optional, default: unlimited)
- `QUEST_RUN_TIMEOUT_MS` (optional, default: 25000ms)

#### Additional Logic
- **JSON Parsing:** Strips markdown code fences (```json...```)
- **Quest ID Generation:** Auto-generates IDs from content hash if missing
- **Schema Validation:** Validates quest structure:
  - Required: `id`, `name`, `description`, `objectives[]`
  - Optional: `rewards` (xp, gold, items)
  - Objectives: `id`, `description`, `completed` (boolean)

#### Request Flow
1. Validate environment variables
2. Check rate limit
3. Acquire Azure AI token via managed identity
4. Create AI thread → Post message → Start run
5. Poll run status
6. Parse and validate JSON response
7. Return structured quest with hash

---

### 3. Factory Run Endpoint

**Route:** `GET|POST /api/factory/run`  
**Function:** `api/factory-run/index.js`  
**Purpose:** Generate game content drafts (items, enemies, etc.) with optional approval workflow

#### Dependencies
| Type | Dependency | Usage |
|------|-----------|-------|
| **Shared Middleware** | azure-ai-utils.js | 11 imported functions |
| **External Service** | Azure AI Foundry | Thread/Message/Run API |
| **Authentication** | @azure/identity | DefaultAzureCredential with managed identity |
| **Rate Limiting** | Redis (optional) + in-memory | Client-based throttling |
| **Storage** | Local filesystem | `api/factory-drafts.json` |
| **Security** | crypto (built-in) | Timing-safe admin key comparison |

#### Configuration
- `FOUNDRY_PROJECT_ENDPOINT` (required)
- `FACTORY_AGENT_ID` (required)
- `AZURE_CLIENT_ID` (optional)
- `FACTORY_RATE_LIMIT_PER_MIN` (optional, default: unlimited)
- `FACTORY_RUN_TIMEOUT_MS` (optional, default: 25000ms)
- `FACTORY_REQUIRE_APPROVAL` (optional, default: false) - Enables draft approval workflow
- `FACTORY_ADMIN_KEY` (optional) - Required if approval enabled
- `DEBUG_FACTORY` (optional) - Returns additional debug information

#### Draft Management
- **Storage:** `api/factory-drafts.json` (max 200 entries, FIFO)
- **Draft States:** `pending` | `approved`
- **Approval Flow:**
  - POST with `{"action": "approve", "draftId": "...", "adminKey": "..."}`
  - Timing-safe key comparison using `crypto.timingSafeEqual()`
  - Admin key from `FACTORY_ADMIN_KEY` env or `x-admin-key` header

#### Request Flow (Generate)
1. Validate environment variables
2. Check rate limit
3. Parse parameters: `contentType` (default: "items"), `count` (1-10, default: 5)
4. Acquire Azure AI token
5. Create AI thread → Post message → Start run
6. Poll run status
7. Save draft with status (`pending` or `approved`)
8. Return assistant text with hash and draft metadata

#### Request Flow (Approve)
1. Validate admin key with timing-safe comparison
2. Update draft status in JSON file
3. Return updated draft

---

### 4. VoidverseFunction (Durable Entity)

**Route:** N/A (Durable Functions entity)  
**Function:** `api/VoidverseFunction/index.js`  
**Purpose:** Stateful durable entity for orchestration

#### Dependencies
| Type | Dependency | Usage |
|------|-----------|-------|
| **Durable Functions** | durable-functions (^2.1.4) | Entity orchestration |
| **Storage** | Azure Storage | State persistence (configured in host.json) |

_Note: This entity is not directly exposed as an HTTP endpoint._

---

## External Service Dependencies

### Azure AI Foundry

**Endpoints Used:**
- `POST {endpoint}/threads` - Create conversation thread
- `POST {endpoint}/threads/{threadId}/messages` - Add user message
- `POST {endpoint}/threads/{threadId}/runs` - Start assistant run
- `GET {endpoint}/threads/{threadId}/runs/{runId}` - Poll run status
- `GET {endpoint}/threads/{threadId}/messages` - Retrieve assistant responses

**Authentication:**
- Token acquired via `DefaultAzureCredential.getToken("https://ai.azure.com/.default")`
- Supports both system-assigned and user-assigned managed identities

**API Version:** Configurable via `AZURE_AI_API_VERSION` or `FOUNDRY_API_VERSION` (default: "2025-05-01")

**Retry Logic:**
- Retries on status codes: 429, 500, 502, 503, 504
- Max retries: 2
- Delay: `min(2000, 300 * (attempt + 1))` milliseconds

### Redis (Optional)

**Purpose:** Primary rate limiting backend

**Connection:**
- Environment: `REDIS_URL` or `REDIS_CONNECTION_STRING`
- Lazy initialization on first request
- Falls back to in-memory if unavailable

**Commands Used:**
- `INCR rate:{clientKey}:{windowKey}` - Increment request count
- `PEXPIRE rate:{clientKey}:{windowKey} {windowMs}` - Set TTL (60 seconds default)

### Azure Storage

**Purpose:** Durable Functions state persistence

**Configuration:** `host.json`
```json
"extensions": {
  "durableTask": {
    "storageProvider": {
      "type": "AzureStorage"
    }
  }
}
```

Uses Azure Tables and Blobs for orchestration state.

---

## Rate Limiting Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  rateLimit(clientKey, limit, {windowMs, logger})        │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────▼──────────┐
         │ Try Redis Backend     │
         │ Key: rate:{key}:{win} │
         │ INCR + PEXPIRE        │
         └────────────┬──────────┘
                      │
              ┌───────▼────────┐
              │ Redis Success? │
              └───────┬────────┘
                  NO  │  YES
              ┌───────▼────────┐
              │ Return result  │
              └────────────────┘
                      │
          ┌───────────▼──────────────┐
          │ Fallback: In-Memory Map  │
          │ {count, expiresAt}       │
          │ Auto-cleanup @ 5000 keys │
          └───────────┬──────────────┘
                      │
              ┌───────▼────────┐
              │ Return result  │
              └────────────────┘
```

### Implementation Details

#### Window Calculation
```javascript
const windowMs = options.windowMs ?? 60000;  // 60 seconds default
const now = Date.now();
const windowKey = Math.floor(now / windowMs);
const cacheKey = `rate:${clientKey}:${windowKey}`;
```

#### Client Identification Priority
1. `x-forwarded-for` header (proxy chain, first IP)
2. `x-client-id` header (custom client identifier)
3. `"anonymous"` (default fallback)

⚠️ **Security Note:** Client identification relies on HTTP headers which can be spoofed if not behind a trusted proxy (e.g., Azure Front Door, Application Gateway).

#### In-Memory Cleanup Strategy
- Triggered when map size exceeds 5000 entries
- Removes expired entries where `expiresAt <= now`
- Prevents unbounded memory growth

---

## Authentication & Security

### Endpoint Authentication

**All HTTP endpoints:** `authLevel: "anonymous"`
- No Azure Functions-level authentication required
- Allows public access (rate limiting provides primary protection)

### Azure AI Foundry Authentication

**Method:** Azure Managed Identity (DefaultAzureCredential)

**Credential Resolution Order:**
1. **User-Assigned Managed Identity** (if `AZURE_CLIENT_ID` set)
   ```javascript
   new DefaultAzureCredential({ managedIdentityClientId })
   ```
2. **System-Assigned Managed Identity** (fallback)
   ```javascript
   new DefaultAzureCredential()
   ```
3. **Azure CLI** (local development)
4. **Environment variables** (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)

**Token Scope:** `https://ai.azure.com/.default`

### Admin Key Security (Factory Endpoint)

**Protection Against Timing Attacks:**
```javascript
const providedBuffer = Buffer.from(providedKey || "");
const adminBuffer = Buffer.from(adminKey);
const isMatch =
  providedBuffer.length === adminBuffer.length &&
  crypto.timingSafeEqual(providedBuffer, adminBuffer);
```

This prevents attackers from determining key correctness through response time analysis.

---

## Host Configuration

### File: `api/host.json`

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "extensions": {
    "durableTask": {
      "storageProvider": {
        "type": "AzureStorage"
      }
    }
  }
}
```

### Configuration Explained

- **`version: "2.0"`** - Azure Functions runtime version 2.0+
- **`extensionBundle`** - Automatically includes common extensions (HTTP, Durable Functions, etc.)
  - Version range: 4.x (latest stable, excludes breaking 5.0.0)
- **`durableTask.storageProvider`** - Durable Functions uses Azure Storage for state
  - Requires `AzureWebJobsStorage` connection string in app settings

### Function Bindings

All endpoints use similar binding configuration:

```json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"],  // or ["get", "post"]
      "route": "narrate"    // Custom route path
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

---

## Environment Variables

### Required Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `FOUNDRY_PROJECT_ENDPOINT` | All AI endpoints | Azure AI Foundry project base URL |
| `NARRATOR_AGENT_ID` | narrate | Assistant ID for narrative generation |
| `QUEST_AGENT_ID` | quest-create | Assistant ID for quest generation |
| `FACTORY_AGENT_ID` | factory-run | Assistant ID for content generation |

### Optional Configuration

#### Managed Identity
| Variable | Default | Purpose |
|----------|---------|---------|
| `AZURE_CLIENT_ID` | (system-assigned) | User-assigned managed identity client ID |

#### Rate Limiting
| Variable | Default | Purpose |
|----------|---------|---------|
| `NARRATE_RATE_LIMIT_PER_MIN` | Unlimited | Max requests per minute for narrate endpoint |
| `QUEST_RATE_LIMIT_PER_MIN` | Unlimited | Max requests per minute for quest-create endpoint |
| `FACTORY_RATE_LIMIT_PER_MIN` | Unlimited | Max requests per minute for factory-run endpoint |
| `REDIS_URL` or `REDIS_CONNECTION_STRING` | None | Redis connection for distributed rate limiting |

#### Timeouts
| Variable | Default (ms) | Purpose |
|----------|--------------|---------|
| `AZURE_AI_RUN_TIMEOUT_MS` | 25000 | Global timeout for AI run polling |
| `NARRATE_RUN_TIMEOUT_MS` | (inherits global) | Narrate endpoint-specific timeout |
| `QUEST_RUN_TIMEOUT_MS` | (inherits global) | Quest endpoint-specific timeout |
| `FACTORY_RUN_TIMEOUT_MS` | (inherits global) | Factory endpoint-specific timeout |

#### API Version
| Variable | Default | Purpose |
|----------|---------|---------|
| `AZURE_AI_API_VERSION` or `FOUNDRY_API_VERSION` | "2025-05-01" | Azure AI Foundry REST API version |

#### Factory Endpoint
| Variable | Default | Purpose |
|----------|---------|---------|
| `FACTORY_REQUIRE_APPROVAL` | false | Enables draft approval workflow |
| `FACTORY_ADMIN_KEY` | None | Secret key for approving drafts (required if approval enabled) |
| `DEBUG_FACTORY` | false | Returns additional debug information in responses |

---

## Recommendations

### ✅ Strengths

1. **Centralized Middleware Pattern**
   - Reduces code duplication across endpoints
   - Single source of truth for HTTP client, rate limiting, and utilities
   - Easy to maintain and update

2. **Security Best Practices**
   - Managed Identity eliminates hardcoded credentials
   - Timing-safe key comparison prevents timing attacks
   - SHA-256 output hashing for response verification

3. **Resilience**
   - Automatic retry logic with exponential backoff
   - Dual-layer rate limiting (Redis + in-memory fallback)
   - Graceful degradation when Redis unavailable

4. **Configurability**
   - Environment-based configuration
   - Per-endpoint rate limits and timeouts
   - Debug mode for troubleshooting

### ⚠️ Considerations & Improvements

#### 1. Scalability - Draft Storage

**Issue:** `factory-drafts.json` uses local filesystem which is not shared across instances.

**Impact:**
- Multiple Azure Functions instances will have separate draft stores
- Draft approval may not work consistently in scaled environments
- Risk of data loss during instance recycle

**Recommendation:**
```
Replace filesystem storage with:
- Azure Table Storage (structured data, query support)
- Azure Cosmos DB (globally distributed, low latency)
- Azure Blob Storage (simple key-value, cost-effective)
```

**Example Migration:**
```javascript
// Before (filesystem)
fs.writeFileSync(draftsStorePath, JSON.stringify(drafts));

// After (Azure Table Storage)
await tableClient.upsertEntity({
  partitionKey: "drafts",
  rowKey: draftId,
  ...draftData
});
```

#### 2. Security - Client Identification

**Issue:** Rate limiting relies on client headers (`x-forwarded-for`, `x-client-id`) which can be spoofed.

**Impact:**
- Attackers can bypass rate limits by changing headers
- DOS protection is weakened if not behind trusted proxy

**Recommendation:**
```
1. Deploy behind Azure Front Door or Application Gateway
2. Configure trusted proxy headers
3. Consider IP-based rate limiting at infrastructure level
4. Add API key authentication for production use
5. Enable Azure Functions built-in authentication (Easy Auth)
```

#### 3. Observability - Logging & Monitoring

**Issue:** Limited structured logging for debugging and monitoring.

**Recommendation:**
```
1. Add Application Insights integration
2. Log key events with structured data:
   - Request ID, endpoint, client key
   - Rate limit hits (429 responses)
   - AI run timeouts and failures
   - Token acquisition failures
3. Create custom metrics:
   - Request duration by endpoint
   - Rate limit hit rate
   - AI run success/failure ratio
```

**Example:**
```javascript
context.log({
  requestId,
  endpoint: "narrate",
  clientKey,
  duration: Date.now() - startTime,
  status: "success",
  threadId,
  runId
});
```

#### 4. Error Handling - Retry Configuration

**Issue:** Retry configuration is hardcoded (`retries: 2`, delay calculation).

**Recommendation:**
```
Make retry behavior configurable:
- AZURE_AI_MAX_RETRIES (default: 2)
- AZURE_AI_RETRY_DELAY_MS (default: 300)
- AZURE_AI_MAX_RETRY_DELAY_MS (default: 2000)
```

#### 5. Rate Limiting - Redis Connection Pool

**Issue:** Single Redis client shared across all requests may become bottleneck.

**Recommendation:**
```javascript
const client = createClient({
  url,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    connectTimeout: 5000
  },
  commandsQueueMaxLength: 100  // Prevent unbounded queue growth
});
```

#### 6. Testing - Unit & Integration Tests

**Issue:** No test files for middleware utilities.

**Recommendation:**
```
Add tests for:
- rateLimit() with mocked Redis
- fetchJson() retry logic
- extractAssistantText() format variations
- validateQuestSchema() edge cases
- Admin key timing-safe comparison
```

#### 7. Documentation - API Specification

**Issue:** No OpenAPI/Swagger specification for endpoints.

**Recommendation:**
```
Create OpenAPI 3.0 specification documenting:
- Request/response schemas
- Rate limits
- Error codes
- Example requests
```

---

## Dependency Summary Matrix

| Endpoint | azure-ai-utils | Azure AI Foundry | Redis | @azure/identity | durable-functions | Filesystem |
|----------|:--------------:|:----------------:|:-----:|:---------------:|:-----------------:|:----------:|
| **narrate** | ✓ | ✓ | Optional | ✓ | - | - |
| **quest-create** | ✓ | ✓ | Optional | ✓ | - | - |
| **factory-run** | ✓ | ✓ | Optional | ✓ | - | ✓ (drafts) |
| **VoidverseFunction** | - | - | - | - | ✓ | - |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.0.0 | Initial analysis document created |

---

## Appendix: Middleware Function Reference

### azure-ai-utils.js Exports

```javascript
module.exports = {
  // Response & Utilities
  jsonResponse,        // (status, body) => HTTP response object
  toStringSafe,        // (value) => Safe string coercion
  generateId,          // (prefix) => Cryptographically secure ID
  hashContent,         // (text) => SHA-256 hash of content
  normalizeEndpoint,   // (endpoint) => Remove trailing slashes
  
  // Configuration
  getRequiredEnv,      // (name) => Required env var (trimmed)
  getOptionalEnv,      // (name, fallback) => Optional env var
  getApiVersion,       // () => Azure AI API version
  getTimeoutMs,        // (name, fallbackMs) => Timeout configuration
  
  // HTTP Client
  resolveFetch,        // () => Promise<fetch function>
  fetchJson,           // (url, options) => Fetch with retries
  readJsonBody,        // (req) => Parse request body
  
  // Azure AI Integration
  extractAssistantText,// (messagesResponse) => Extract text from messages
  
  // Rate Limiting
  rateLimit            // (key, limit, options) => Promise<boolean>
};
```

---

**Document Maintainer:** AI Analysis System  
**Last Updated:** 2026-02-02  
**Status:** Active
