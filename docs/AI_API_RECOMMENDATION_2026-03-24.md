# AI API Recommendation for `my-litrpg-gameztrui` (re-analysis, 2026-03-24)

## Why this version exists

This is a full redo of the previous recommendation with tighter, code-linked reasoning and a clearer rollout plan.

---

## 1) Repository reality check (what is already implemented)

### 1.1 Provider routing is already opinionated and mostly production-ready

The backend runtime in `functions/lib/firebase-agents/runtime.js` is not provider-neutral in practice; it is already intentionally split:

- OpenAI default provider (`DEFAULT_AI_TEXT_PROVIDER = "openai"`).
- OpenAI-first for player-facing narration agents (`narrator`, `combat`, `dialogue`, `world`, `system`, `quest`).
- `content_smith` is hard-pinned Gemini-first.
- Retryable OpenAI errors fail over to Gemini automatically.

This is exactly the pattern you would otherwise have to build from scratch in most projects.

### 1.2 The runtime is contract-driven and fail-safe aware

The backend normalizes/returns:

- `backend`, `model`, `fallbackUsed`, `fallbackFrom`, `text`.
- Structured output auto-parse (`structured`) when valid JSON-like text is returned.
- Model allowlists (`OPENAI_ALLOWED_MODELS`, `GENKIT_ALLOWED_MODELS`) and hard fail on disallowed models.

This matters because provider switching cost is largely in contracts + observability, and you already have a meaningful baseline.

### 1.3 Frontend has endpoint resilience and output guardrails

The client runtime:

- Resolves narrate endpoints from runtime/build config with deduping.
- Retries transient failure statuses.
- Applies narration guardrails (tone filtering, markdown stripping, output truncation).
- Normalizes payload shape (`narrative`, `mood`, `suggestions`, `provider`, `fallbackUsed`).

This means backend provider changes will be visible but buffered by a stable client contract.

### 1.4 Tests already assert fallback metadata and endpoint behavior

The test suite includes explicit checks for:

- fallback metadata surfacing on agent responses,
- endpoint resolution deduping on client narrate calls.

That is a strong foundation for controlled model/provider experiments.

---

## 2) External research refresh (2026-03-24)

I re-checked:

- OpenAI API pricing page and Responses docs.
- Gemini API pricing docs.
- Anthropic pricing page.
- FMHY home + AI page.

### FMHY-specific conclusion

FMHY remains useful as **discovery/navigation** (many links to official and unofficial AI fronts), but not a production decision authority. It explicitly highlights privacy caution around cloud prompts and includes many third-party wrappers/aggregators. Treat it as a lead list, not a reliability/compliance source.

---

## 3) Best API choice for *this* repo

### Decision

**Keep OpenAI Responses API as primary for player-facing runtime agents; keep Gemini as automatic fallback; keep `content_smith` Gemini-first.**

### Why this is still best (now, not in theory)

1. **Lowest migration risk for shipped gameplay loops**
   - Your current runtime logic and tests already expect OpenAI-first behavior for narration-side agents and fallback metadata.

2. **Operationally consistent with existing contracts**
   - Observability fields, fallback semantics, and model allowlist controls are already wired around this split.

3. **No-value churn avoided**
   - A full primary switch would mostly be prompt retuning, output-variance debugging, and incident playbook rewrites rather than net new player value.

4. **You already have provider resilience**
   - Failover path exists and is battle-shape ready; this is a major advantage for live game narrative endpoints.

---

## 4) What to improve next (implementation plan)

## Sprint 1 (hardening)

1. **Per-agent model env overrides**
   - Add optional env variables for each narration-facing agent, e.g.:
     - `OPENAI_MODEL_NARRATOR`
     - `OPENAI_MODEL_DIALOGUE`
     - `OPENAI_MODEL_COMBAT`
   - Keep global `OPENAI_MODEL` as fallback.

2. **Telemetry dimensions for decision quality**
   - Ensure logs/events include at least:
     - `agent`, `provider/backend`, `model`, `fallbackUsed`, `fallbackFrom`, `latencyMs`, `statusCode`, `outputHash`.

3. **Structured-output validation for JSON agents**
   - For `quest` and `content_smith`, enforce post-generation schema validation before API success response.

## Sprint 2 (evaluation)

4. **A/B track model snapshots behind allowlists**
   - Compare current default model vs candidate model snapshots on staged replay prompts.
   - Score by lore adherence, mechanical non-hallucination, style consistency, and fallback rate.

5. **Fallback SLO gate**
   - Add alert threshold for fallback usage spikes (e.g., rolling 15-min fallbackUsed ratio by agent).

---

## 5) Decision matrix (weighted for this codebase)

Scoring scale: 1 (poor) to 5 (excellent).

- Criteria weights: architecture fit 30, migration risk 20, runtime reliability 20, output consistency 15, cost/latency flexibility 15.

### Option A — OpenAI primary + Gemini fallback (current pattern)
- Architecture fit: 5
- Migration risk: 5
- Runtime reliability: 5
- Output consistency: 4
- Cost/latency flexibility: 4
- **Weighted total: 4.75 / 5**

### Option B — Gemini primary + OpenAI fallback (flip now)
- Architecture fit: 2
- Migration risk: 2
- Runtime reliability: 4
- Output consistency: 3
- Cost/latency flexibility: 4
- **Weighted total: 2.95 / 5**

### Option C — Anthropic primary + others fallback (new integration)
- Architecture fit: 1
- Migration risk: 1
- Runtime reliability: 3
- Output consistency: 4
- Cost/latency flexibility: 3
- **Weighted total: 2.05 / 5**

**Winner: Option A by a wide margin.**

---

## 6) Risks and mitigations

1. **Risk: provider pricing/model availability shifts**
   - Mitigation: keep allowlists/env-configurable model IDs and periodic staging benchmark runs.

2. **Risk: fallback masking primary-provider regressions**
   - Mitigation: track fallbackUsed ratio and alert on abnormal spikes per agent.

3. **Risk: JSON agents produce prose on edge prompts**
   - Mitigation: strict schema validation + immediate typed error response for non-conforming output.

4. **Risk: quality drift across model snapshot updates**
   - Mitigation: replay harness with golden prompts and regression scoring before promotion.

---

## 7) Final recommendation

For the next implementation cycle, the highest-ROI path is:

- **Stay on OpenAI Responses as primary for player-facing narrative agents.**
- **Retain Gemini automatic fallback exactly as implemented.**
- **Retain Gemini-first `content_smith` bulk generation.**
- **Invest engineering effort in per-agent model controls, schema enforcement, and fallback-aware telemetry instead of provider churn.**

---

## 8) Evidence pointers used for this analysis

### In-repo

- `functions/lib/firebase-agents/runtime.js`
- `functions/lib/firebase-agents/definitions.js`
- `functions/lib/handlers.js`
- `functions/index.js`
- `src/core/AIService.js`
- `src/core/AgentService.js`
- `src/core/narrationContract.js`
- `tests/unit/HandlersRunAgentFallbackMetadata.test.js`
- `tests/unit/AIServiceEndpointResolution.test.js`
- `docs/FIREBASE_QUICKSTART.md`

### External

- OpenAI pricing: https://openai.com/api/pricing/
- OpenAI docs (Responses guidance): https://platform.openai.com/docs/guides/responses-vs-chat-completions
- Gemini pricing docs: https://ai.google.dev/gemini-api/docs/pricing
- Anthropic pricing: https://www.anthropic.com/pricing
- FMHY home: https://fmhy.net/
- FMHY AI index: https://fmhy.net/ai
