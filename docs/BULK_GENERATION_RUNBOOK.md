# Bulk Generation Runbook

## 1) Set function environment

Set environment in Functions runtime (secret/token + guardrails):

- `BULK_GEN_INTERNAL_TOKEN`
- `BULK_GEN_ALLOWED_USER_IDS`
- `BULK_GEN_CREDIT_EXPIRY_DATE`
- `BULK_GEN_INITIAL_CREDITS_EUR`
- `BULK_GEN_STOP_THRESHOLD_EUR`
- `BULK_GEN_IMAGE_MODEL=imagen-4.0-fast-generate-001`
- `BULK_GEN_IMAGE_LOCATION=global`
- `BULK_GEN_IMAGE_VARIANTS=4`

Imagen 4 operator presets:

- `imagen-4.0-fast-generate-001` → default budget estimate `0.02 EUR` per image variant
- `imagen-4.0-generate-001` → default budget estimate `0.04 EUR` per image variant
- `imagen-4.0-ultra-generate-001` → default budget estimate `0.06 EUR` per image variant

If `BULK_GEN_IMAGE_COST_PER_VARIANT_EUR` is unset, the pipeline infers the default estimate from the selected Imagen model. Keep the env var only when intentionally overriding the estimate.

## 1a) Suspension check

If GCP commands start returning `CONSUMER_SUSPENDED` or Storage shows `There is an account problem for the requested project`, stop trying to deploy or schedule more work. Fix the billing/account verification issue in Google Cloud Console first, then resume the bulk run.

## 2) Deploy functions

```bash
firebase deploy --only functions:api --project my-litrpg-gameztrui-3416-da75c
```

## 3) Start a run (authenticated operator)

```bash
curl -X POST "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/start" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "questCount": 20000,
    "loreCount": 8000,
    "assetCount": 12000,
    "creditStopThresholdEur": 120,
    "maxEstimatedEur": 2400
  }'
```

Optional per-run generation overrides:

- `imageModel`
- `imageLocation`
- `imageVariants`
- `imageCostPerVariantEur`
- `textModel`
- `textCostPerOutputEur`

Example: asset-only high-burn run without changing env defaults first:

```bash
curl -X POST "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/start" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "questCount": 0,
    "loreCount": 0,
    "assetCount": 30000,
    "maxEstimatedEur": 2400,
    "creditStopThresholdEur": 100,
    "imageModel": "imagen-4.0-ultra-generate-001",
    "imageLocation": "global",
    "imageVariants": 4
  }'
```

## 4) Tick run manually (or Cloud Scheduler)

```bash
curl -X POST "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/tick" \
  -H "x-bulk-gen-token: <BULK_GEN_INTERNAL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"runId":"<RUN_ID>","workerId":"scheduler","limit":10}'
```

## 5) Check run status

```bash
curl "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/status?runId=<RUN_ID>&outputLimit=20" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

## 6) Pause or resume

```bash
curl -X POST "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/pause" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"runId":"<RUN_ID>","reason":"manual pause"}'
```

```bash
curl -X POST "https://us-central1-my-litrpg-gameztrui-3416-da75c.cloudfunctions.net/api/api/bulk-gen/run/resume" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"runId":"<RUN_ID>"}'
```

## 7) Budget alert webhook

Configure Cloud Billing budget alerts to send Pub/Sub notifications, then forward to:

- `POST /api/bulk-gen/budget-alert`

Include:

- `x-bulk-gen-token: <BULK_GEN_INTERNAL_TOKEN>`

At signal ratio:

- `>= 0.85`: throttle signal
- `>= 0.90`: pause runs
- `>= 0.95`: halt signal (pause remains enforced)
