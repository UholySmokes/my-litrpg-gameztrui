# Bulk Generation Credit Burn Design (Vertex + Firebase)

Date: 2026-03-05  
Project: `my-litrpg-gameztrui-3416-da75c`

## Goal

Use remaining Google Cloud credits before expiry to pre-generate high-value game content:

- Quest arcs/steps
- Lore books/zone descriptions
- 2D assets (with consistent zone style)

Primary constraint: enforce hard stop behavior before non-credit spend.

## Implemented Architecture

- API endpoints on Firebase Functions:
  - `POST /api/bulk-gen/run/start`
  - `POST /api/bulk-gen/run/tick`
  - `GET /api/bulk-gen/run/status`
  - `POST /api/bulk-gen/run/pause`
  - `POST /api/bulk-gen/run/resume`
  - `POST /api/bulk-gen/style`
  - `POST /api/bulk-gen/budget-alert`
- Orchestration service:
  - Seeds tasks in small chunks instead of writing all tasks up front.
  - Processes queued tasks per tick.
  - Writes outputs to Cloud Storage (image binaries) and store records (metadata).
- Generation backends:
  - Text: existing Genkit runtime on Vertex AI.
  - Image: Vertex Imagen (`imagen-4.0-fast-generate-001`) via `@google-cloud/aiplatform`.
- Data persistence:
  - Firestore by default.
  - JSON-file fallback in emulator mode (same backend strategy as other runtime stores).

## Data Model

- `bulk_generation_runs`
- `bulk_generation_tasks`
- `bulk_generation_outputs`
- `bulk_generation_styles`
- `bulk_generation_spend_events`

## Spend Guardrails

Run-level guardrails are enforced by service logic:

- Pause at run expiry timestamp.
- Pause at run `max_estimated_eur`.
- Pause when estimated remaining credits are below `credit_stop_threshold_eur`.
- Budget alert endpoint can throttle/pause/halt all active runs based on incoming budget signal ratio.

Platform-level recommendations:

- Keep Cloud Billing budget alerts at 85/90/95%.
- Route budget alert Pub/Sub to `/api/bulk-gen/budget-alert`.
- Keep a safety buffer (for reporting delay) instead of spending to 100%.

## Default Throughput Targets

Defaults in implementation:

- Quests: 20,000
- Lore entries: 8,000
- Final assets: 12,000
- Imagen variants per asset: 3

These are configurable via environment variables and request body at run start.

## Environment Controls

See `functions/.env.example` for full list. Key controls:

- `BULK_GEN_INTERNAL_TOKEN`
- `BULK_GEN_ALLOWED_USER_IDS`
- `BULK_GEN_CREDIT_EXPIRY_DATE`
- `BULK_GEN_INITIAL_CREDITS_EUR`
- `BULK_GEN_STOP_THRESHOLD_EUR`
- `BULK_GEN_IMAGE_MODEL`
- `BULK_GEN_IMAGE_VARIANTS`

## Operational Sequence

1. Configure env values and deploy functions.
2. Create/update style profiles per zone.
3. Start a run.
4. Trigger ticks from Cloud Scheduler.
5. Attach budget alerts to budget-alert endpoint.
6. Monitor run status and pause/resume as needed.

## Open Risks

- Imagen response schema can evolve; parser is defensive but should be validated in staging.
- Budget alerts are not real-time hard caps; app-level guardrail remains mandatory.
- Large runs can create significant Firestore write volume; monitor write quotas and costs.
