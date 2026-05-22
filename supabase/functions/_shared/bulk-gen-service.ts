import { runAgent } from "./agents.ts";
import * as store from "./bulk-gen-store.ts";
import {
  normalizeString,
  normalizeObject,
  nowIso,
  parseOptionalNumber,
  parseOptionalInteger,
  parseOptionalBoolean,
  clampInt,
} from "./db.ts";

// ─── Constants ──────────────────────────────────────────

const DEFAULT_QUEST_COUNT = 20000;
const DEFAULT_LORE_COUNT = 8000;
const DEFAULT_ASSET_COUNT = 12000;
const DEFAULT_VARIANTS_PER_ASSET = 3;
const DEFAULT_TEXT_MODEL = "gpt-5.4-mini";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_INITIAL_CREDITS_EUR = 2800;
const DEFAULT_STOP_THRESHOLD_EUR = 120;
const DEFAULT_TEXT_COST_EUR = 0.002;
const DEFAULT_IMAGE_PRICE_USD = 0.04; // DALL-E 3 standard
const DEFAULT_STORAGE_PREFIX = "bulk-generation";
const DEFAULT_EXPIRY_DATE = "2026-06-30T00:00:00Z";
const DEFAULT_MAX_QUEST_COUNT = 50000;
const DEFAULT_MAX_LORE_COUNT = 30000;
const DEFAULT_MAX_ASSET_COUNT = 30000;
const DEFAULT_STYLE_PROMPT =
  "Painterly high-fantasy concept art, consistent brushwork, dramatic but readable lighting, clean silhouette, no modern objects.";
const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low-detail, modern city, text overlay, watermark, logo, malformed anatomy, distorted limbs";
const ASSET_KIND_CYCLE = ["asset2d", "quest_arc", "lore_book"];

// ─── Config ─────────────────────────────────────────────

interface BulkGenConfig {
  enabled: boolean;
  defaultQuestCount: number;
  defaultLoreCount: number;
  defaultAssetCount: number;
  maxQuestCount: number;
  maxLoreCount: number;
  maxAssetCount: number;
  variantsPerAsset: number;
  textModel: string;
  defaultBatchSize: number;
  textCostPerOutputEur: number;
  imagePriceUsd: number;
  initialCreditsEur: number;
  stopThresholdEur: number;
  expiryDateIso: string;
  seedBufferSize: number;
  storageBucket: string;
  storagePrefix: string;
}

function buildConfig(): BulkGenConfig {
  return {
    enabled: parseOptionalBoolean(Deno.env.get("BULK_GEN_ENABLED"), true),
    defaultQuestCount: parseOptionalInteger(
      Deno.env.get("BULK_GEN_DEFAULT_QUEST_COUNT"), DEFAULT_QUEST_COUNT,
    ),
    defaultLoreCount: parseOptionalInteger(
      Deno.env.get("BULK_GEN_DEFAULT_LORE_COUNT"), DEFAULT_LORE_COUNT,
    ),
    defaultAssetCount: parseOptionalInteger(
      Deno.env.get("BULK_GEN_DEFAULT_ASSET_COUNT"), DEFAULT_ASSET_COUNT,
    ),
    maxQuestCount: Math.max(1, parseOptionalInteger(
      Deno.env.get("BULK_GEN_MAX_QUEST_COUNT"), DEFAULT_MAX_QUEST_COUNT,
    )),
    maxLoreCount: Math.max(1, parseOptionalInteger(
      Deno.env.get("BULK_GEN_MAX_LORE_COUNT"), DEFAULT_MAX_LORE_COUNT,
    )),
    maxAssetCount: Math.max(1, parseOptionalInteger(
      Deno.env.get("BULK_GEN_MAX_ASSET_COUNT"), DEFAULT_MAX_ASSET_COUNT,
    )),
    variantsPerAsset: Math.max(1, Math.min(4, parseOptionalInteger(
      Deno.env.get("BULK_GEN_IMAGE_VARIANTS"), DEFAULT_VARIANTS_PER_ASSET,
    ))),
    textModel: Deno.env.get("BULK_GEN_TEXT_MODEL") || DEFAULT_TEXT_MODEL,
    defaultBatchSize: Math.max(1, Math.min(30, parseOptionalInteger(
      Deno.env.get("BULK_GEN_BATCH_SIZE"), DEFAULT_BATCH_SIZE,
    ))),
    textCostPerOutputEur: Math.max(0, parseOptionalNumber(
      Deno.env.get("BULK_GEN_TEXT_COST_PER_OUTPUT_EUR"), DEFAULT_TEXT_COST_EUR,
    )),
    imagePriceUsd: Math.max(0, parseOptionalNumber(
      Deno.env.get("BULK_GEN_IMAGE_PRICE_USD"), DEFAULT_IMAGE_PRICE_USD,
    )),
    initialCreditsEur: Math.max(0, parseOptionalNumber(
      Deno.env.get("BULK_GEN_INITIAL_CREDITS_EUR"), DEFAULT_INITIAL_CREDITS_EUR,
    )),
    stopThresholdEur: Math.max(0, parseOptionalNumber(
      Deno.env.get("BULK_GEN_STOP_THRESHOLD_EUR"), DEFAULT_STOP_THRESHOLD_EUR,
    )),
    expiryDateIso: Deno.env.get("BULK_GEN_CREDIT_EXPIRY_DATE") || DEFAULT_EXPIRY_DATE,
    seedBufferSize: Math.max(20, Math.min(500, parseOptionalInteger(
      Deno.env.get("BULK_GEN_PENDING_BUFFER"), 120,
    ))),
    storageBucket: Deno.env.get("BULK_GEN_STORAGE_BUCKET") || "",
    storagePrefix: Deno.env.get("BULK_GEN_STORAGE_PREFIX") || DEFAULT_STORAGE_PREFIX,
  };
}

// ─── Helpers ────────────────────────────────────────────

function createSeededRng(seedRaw: string): () => number {
  let seed = Number.parseInt(String(seedRaw || ""), 10);
  if (!Number.isFinite(seed)) {
    seed = 0;
    for (const ch of String(seedRaw || crypto.randomUUID())) {
      seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    }
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildDefaultZoneIds(): string[] {
  return [
    "city_of_ash",
    "verdant_fracture",
    "iron_deeps",
    "glass_wastes",
    "moonlit_floodplain",
    "howling_spires",
  ];
}

function defaultStyleProfile(zoneId: string): Record<string, unknown> {
  return {
    zone_id: zoneId,
    visual_style_prompt: `${DEFAULT_STYLE_PROMPT} Zone motif: ${zoneId.replace(/[_-]+/g, " ")}.`,
    negative_prompt: DEFAULT_NEGATIVE_PROMPT,
    palette: ["amber", "teal", "slate", "bone"],
    lighting: "cinematic high contrast",
    composition_rules: [
      "strong foreground-midground-background depth",
      "single clear focal subject",
      "readable silhouette at thumbnail size",
    ],
    reference_assets: [],
  };
}

function buildGenerationProfile(config: BulkGenConfig, body: Record<string, unknown>) {
  return {
    image_variants: clampInt(
      body.imageVariants ?? body.variantsPerAsset ?? config.variantsPerAsset, 1, 4,
    ),
    text_model: normalizeString(body.textModel as string, config.textModel),
    text_cost_per_output_eur: Math.max(
      0, parseOptionalNumber(body.textCostPerOutputEur, config.textCostPerOutputEur),
    ),
    image_price_usd: Math.max(
      0, parseOptionalNumber(body.imagePriceUsd, config.imagePriceUsd),
    ),
  };
}

function buildRunMeta(config: BulkGenConfig, body: Record<string, unknown>) {
  const zoneIdsRaw = Array.isArray(body.zoneIds) ? body.zoneIds : [];
  const zoneIds = zoneIdsRaw.map((z: unknown) => normalizeString(z)).filter(Boolean);
  const resolvedZoneIds = zoneIds.length ? zoneIds : buildDefaultZoneIds();
  const profile = buildGenerationProfile(config, body);
  const targets = {
    quest_arc: clampInt(body.questCount ?? config.defaultQuestCount, 0, config.maxQuestCount),
    lore_book: clampInt(body.loreCount ?? config.defaultLoreCount, 0, config.maxLoreCount),
    asset2d: clampInt(body.assetCount ?? config.defaultAssetCount, 0, config.maxAssetCount),
  };
  return {
    seed: normalizeString(body.seed as string, crypto.randomUUID()),
    zone_ids: resolvedZoneIds,
    target_counts: targets,
    queued_counts: { quest_arc: 0, lore_book: 0, asset2d: 0 },
    generation_profile: profile,
    budget_signal: "allow",
    budget_signal_ratio: 0,
    initial_credit_eur: Math.max(
      0, parseOptionalNumber(body.initialCreditsEur, config.initialCreditsEur),
    ),
  };
}

function buildRunShape(
  ownerId: string,
  body: Record<string, unknown>,
  config: BulkGenConfig,
): Record<string, unknown> {
  const meta = buildRunMeta(config, body);
  const maxTasks = meta.target_counts.quest_arc + meta.target_counts.lore_book + meta.target_counts.asset2d;
  const maxEstimatedEur = Math.max(
    0,
    parseOptionalNumber(
      body.maxEstimatedEur,
      meta.target_counts.quest_arc * config.textCostPerOutputEur +
        meta.target_counts.lore_book * config.textCostPerOutputEur +
        meta.target_counts.asset2d * config.imagePriceUsd * meta.generation_profile.image_variants,
    ),
  );
  return {
    run_id: normalizeString(body.runId as string, crypto.randomUUID()),
    owner_id: normalizeString(ownerId),
    status: "running",
    pause_reason: "",
    credit_guard_mode: "hard-stop",
    max_tasks: maxTasks,
    completed_tasks: 0,
    failed_tasks: 0,
    pending_tasks: 0,
    max_estimated_eur: maxEstimatedEur,
    estimated_spend_eur: 0,
    credit_stop_threshold_eur: Math.max(
      0, parseOptionalNumber(body.creditStopThresholdEur, config.stopThresholdEur),
    ),
    expires_at: normalizeString(body.expiresAt as string, config.expiryDateIso),
    meta,
  };
}

// ─── Task helpers ───────────────────────────────────────

function buildTaskId(runId: string, kind: string, index: number): string {
  return `bg-${runId}-${kind}-${index}`;
}

function getRemainingCount(
  targetCounts: Record<string, number>,
  queuedCounts: Record<string, number>,
  kind: string,
): number {
  return Math.max(0, (Number(targetCounts[kind]) || 0) - (Number(queuedCounts[kind]) || 0));
}

function parseTaskIndex(taskId: string): number {
  const parts = String(taskId || "").split("-");
  const raw = parts[parts.length - 1];
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildNarrativePrompt(kind: string, zoneId: string, index: number): string {
  if (kind === "quest_arc") {
    return [
      `Create a LitRPG quest arc in zone '${zoneId}'.`,
      `Quest index: ${index}.`,
      "Return strict JSON with keys: title, summary, steps, rewards, hooks.",
      "steps must be an array of 4-6 concise step strings.",
      "No markdown.",
    ].join(" ");
  }
  return [
    `Create a lore entry for zone '${zoneId}'.`,
    `Lore index: ${index}.`,
    "Return strict JSON with keys: title, overview, legend, notable_landmarks, factions.",
    "No markdown.",
  ].join(" ");
}

function parseTaskIndexFromId(taskId: string): number {
  const parts = String(taskId || "").split("-");
  const raw = parts[parts.length - 1];
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ─── OpenAI DALL-E 3 (replaces Vertex AI Imagen) ───────

interface ImageVariant {
  buffer: Uint8Array;
  mimeType: string;
  filteredReason: string;
}

async function generateImageViaDalle(
  prompt: string,
  config: BulkGenConfig,
): Promise<ImageVariant[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!apiKey) {
    throw new ImageGenError("OpenAI API key not configured for image generation.");
  }

  const variants: ImageVariant[] = [];
  for (let i = 0; i < config.variantsPerAsset; i++) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new ImageGenError(
        `DALL-E API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const b64Json = data?.data?.[0]?.b64_json;
    if (!b64Json) {
      throw new ImageGenError("DALL-E returned no image data.");
    }

    const decoded = Uint8Array.from(atob(b64Json), (c) => c.charCodeAt(0));
    variants.push({
      buffer: decoded,
      mimeType: "image/png",
      filteredReason: "",
    });
  }

  return variants;
}

// ─── Storage (Supabase Storage) ─────────────────────────

async function uploadToSupabaseStorage(
  _runId: string,
  _taskId: string,
  _variantIndex: number,
  _variant: ImageVariant,
  _config: BulkGenConfig,
): Promise<string> {
  // TODO: Implement Supabase Storage upload via S3-compatible API or REST
  // For now return a placeholder path
  return `supabase://${_config.storagePrefix}/${_runId}/${_taskId}/variant-${_variantIndex}.png`;
}

// ─── Run guards ─────────────────────────────────────────

async function evaluateRunGuard(
  run: Record<string, unknown>,
  config: BulkGenConfig,
): Promise<{ blocked: boolean; reason: string; run: Record<string, unknown> }> {
  if (!run) return { blocked: true, reason: "run-not-found", run };
  if (String(run.status) !== "running") {
    return { blocked: true, reason: `run-${run.status}`, run };
  }

  const now = Date.now();
  const expiresAtMs = Date.parse(normalizeString(run.expires_at as string));
  if (Number.isFinite(expiresAtMs) && now >= expiresAtMs) {
    const updated = await store.updateRun(
      normalizeString(run.run_id as string),
      { status: "paused", pause_reason: "Credit expiry window reached." },
    );
    await store.appendSpendEvent({
      run_id: run.run_id,
      source: "guard",
      action: "pause",
      estimated_cost_eur: Number(run.estimated_spend_eur) || 0,
      remaining_credit_estimate_eur: 0,
      note: "Run paused because expires_at has passed.",
    });
    return { blocked: true, reason: "expired", run: updated || run };
  }

  const maxEstimated = Number(run.max_estimated_eur) || 0;
  const spent = Number(run.estimated_spend_eur) || 0;
  if (maxEstimated > 0 && spent >= maxEstimated) {
    const updated = await store.updateRun(
      normalizeString(run.run_id as string),
      { status: "paused", pause_reason: "Estimated spend cap reached." },
    );
    return { blocked: true, reason: "max-estimated-spend", run: updated || run };
  }

  const meta = normalizeObject(run.meta);
  const initialCredit = Math.max(
    0, parseOptionalNumber(meta.initial_credit_eur, config.initialCreditsEur),
  );
  const remaining = Math.max(0, initialCredit - spent);
  const stopThreshold = Number(run.credit_stop_threshold_eur) || config.stopThresholdEur;
  if (remaining <= stopThreshold) {
    const updated = await store.updateRun(
      normalizeString(run.run_id as string),
      {
        status: "paused",
        pause_reason: `Remaining credit estimate (${remaining.toFixed(2)} EUR) is at/below stop threshold.`,
      },
    );
    return { blocked: true, reason: "remaining-credit-threshold", run: updated || run };
  }

  return { blocked: false, reason: "ok", run };
}

// ─── Task processing ────────────────────────────────────

async function processNarrativeTask(
  task: Record<string, unknown>,
  _run: Record<string, unknown>,
  config: BulkGenConfig,
): Promise<void> {
  const prompt = normalizeString(
    (task.payload as Record<string, unknown>)?.prompt as string,
  );

  const result = await runAgent({
    agent: "content_smith",
    input: {
      content_request: prompt,
      world_context: {
        zone_id: task.zone_id,
        run_id: task.run_id,
        task_id: task.task_id,
        kind: task.kind,
      },
    },
    model: config.textModel,
    temperature: 0.35,
    topP: 0.95,
  });

  const structured = result.structured || tryParseJson(result.text);
  let title = "";
  let body = normalizeString(result.text);
  if (structured && typeof structured === "object") {
    const draft = Array.isArray(structured.drafts) ? structured.drafts[0] : structured;
    title = normalizeString((draft as Record<string, unknown>)?.title as string ||
      (draft as Record<string, unknown>)?.name as string);
    body = JSON.stringify(draft || structured);
  }
  if (!title) {
    title = `${task.kind} ${parseTaskIndex(String(task.task_id))}`;
  }

  const output = {
    run_id: task.run_id,
    task_id: task.task_id,
    output_type: task.kind,
    zone_id: task.zone_id,
    title,
    body,
    model: normalizeString(result.model, config.textModel),
    meta: { backend: result.backend },
  };

  await store.appendOutputs([output]);
  await store.setTaskResult({
    taskId: normalizeString(task.task_id as string),
    status: "completed",
    estimateEurDelta: Number(task.estimate_eur) || config.textCostPerOutputEur,
  });
}

async function processAssetTask(
  task: Record<string, unknown>,
  run: Record<string, unknown>,
  config: BulkGenConfig,
): Promise<void> {
  const style = (await store.getStyleProfile(
    normalizeString(task.zone_id as string, "global"),
  )) || defaultStyleProfile(normalizeString(task.zone_id as string, "global"));

  const taskIndex = parseTaskIndexFromId(String(task.task_id));
  const assetType = normalizeString(
    (task.payload as Record<string, unknown>)?.asset_type as string, "item_icon",
  );
  const prompt = buildAssetPrompt(assetType, String(task.zone_id), taskIndex, style);
  const variants = await generateImageViaDalle(prompt, config);

  const outputs = [];
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const storagePath = await uploadToSupabaseStorage(
      String(run.run_id),
      String(task.task_id),
      i,
      variant,
      config,
    );
    outputs.push({
      run_id: run.run_id,
      task_id: task.task_id,
      output_type: "asset2d",
      zone_id: task.zone_id,
      title: `${assetType} ${taskIndex}`,
      body: prompt,
      model: "dall-e-3",
      supabase_storage_path: storagePath,
      asset_type: assetType,
      variant_index: i,
      quality_score: variant.filteredReason ? 0 : 100,
      is_winner: i === 0,
      meta: { filtered_reason: variant.filteredReason, mime_type: variant.mimeType },
    });
  }

  await store.appendOutputs(outputs);
  await store.setTaskResult({
    taskId: normalizeString(task.task_id as string),
    status: "completed",
    estimateEurDelta: Number(task.estimate_eur) || config.imagePriceUsd,
  });
}

function buildAssetPrompt(
  assetType: string,
  zoneId: string,
  index: number,
  style: Record<string, unknown>,
): string {
  const descriptors: Record<string, string> = {
    zone_splash: "wide environment key art for zone reveal screen",
    lore_illustration: "storybook illustration for in-game lore page",
    npc_portrait: "waist-up character portrait for dialogue UI",
    item_icon: "single collectible item icon on transparent-friendly plain backdrop",
  };
  const descriptor = descriptors[assetType] || descriptors.item_icon;
  const composition = Array.isArray(style.composition_rules)
    ? (style.composition_rules as string[]).join("; ")
    : "";
  const palette = Array.isArray(style.palette)
    ? (style.palette as string[]).join(", ")
    : "";
  return [
    `LitRPG ${descriptor}.`,
    `Zone: ${zoneId}.`,
    `Asset index: ${index}.`,
    String(style.visual_style_prompt || ""),
    style.lighting ? `Lighting: ${style.lighting}.` : "",
    palette ? `Palette: ${palette}.` : "",
    composition ? `Composition: ${composition}.` : "",
  ].filter(Boolean).join(" ");
}

function tryParseJson(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// ─── Retry logic ────────────────────────────────────────

function isRetryableError(error: Error): boolean {
  const message = String(error.message || "");
  if (/Too Many Requests/i.test(message)) return true;
  if (/Quota exceeded/i.test(message)) return true;
  if (/rate_limit/i.test(message)) return true;
  if (/RESOURCE_EXHAUSTED/i.test(message)) return true;
  return false;
}

function computeBackoffSeconds(attemptCount: number): number {
  const exponent = Math.min(6, Math.max(1, attemptCount) - 1);
  const baseSeconds = 20;
  const jitter = Math.floor(Math.random() * 7);
  return Math.min(900, Math.round(baseSeconds * 2 ** exponent) + jitter);
}

async function processTask(
  task: Record<string, unknown>,
  run: Record<string, unknown>,
  config: BulkGenConfig,
): Promise<{ ok: boolean; taskId: string; kind: string; errorCode?: string; message?: string }> {
  try {
    const kind = String(task.kind || "");
    if (kind === "quest_arc" || kind === "lore_book") {
      await processNarrativeTask(task, run, config);
      return { ok: true, taskId: String(task.task_id), kind };
    }
    if (kind === "asset2d") {
      await processAssetTask(task, run, config);
      return { ok: true, taskId: String(task.task_id), kind };
    }
    throw new Error(`Unsupported task kind '${kind}'.`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (isRetryableError(err)) {
      const deferSeconds = computeBackoffSeconds(Number(task.attempt_count) || 0);
      await store.rescheduleTask({
        taskId: normalizeString(task.task_id as string),
        lastError: err.message,
        deferSeconds,
      });
      return {
        ok: false,
        taskId: String(task.task_id),
        kind: String(task.kind),
        errorCode: "QUOTA_BACKOFF",
        message: `Quota exhausted; rescheduled in ~${deferSeconds}s.`,
      };
    }
    await store.setTaskResult({
      taskId: normalizeString(task.task_id as string),
      status: "failed",
      lastError: err.message,
      estimateEurDelta: 0,
    });
    return {
      ok: false,
      taskId: String(task.task_id),
      kind: String(task.kind),
      errorCode: "TASK_FAILED",
      message: err.message,
    };
  }
}

// ─── Seeding ────────────────────────────────────────────

async function ensureStyleProfiles(zoneIds: string[]): Promise<void> {
  for (const zoneId of zoneIds) {
    const existing = await store.getStyleProfile(zoneId);
    if (existing) continue;
    await store.upsertStyleProfile(defaultStyleProfile(zoneId));
  }
}

const ASSET_TYPE_WEIGHTS = [
  { type: "zone_splash", weight: 1 },
  { type: "lore_illustration", weight: 4 },
  { type: "npc_portrait", weight: 5 },
  { type: "item_icon", weight: 10 },
];

function weightedAssetType(index: number): string {
  const totalWeight = ASSET_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  const pointer = index % totalWeight;
  let cursor = 0;
  for (const item of ASSET_TYPE_WEIGHTS) {
    cursor += item.weight;
    if (pointer < cursor) return item.type;
  }
  return "item_icon";
}

async function seedTasksIfNeeded(
  run: Record<string, unknown>,
  config: BulkGenConfig,
): Promise<{ seeded: number }> {
  const meta = normalizeObject(run.meta);
  const targetCounts = normalizeObject(meta.target_counts) as Record<string, number>;
  const queuedCounts = normalizeObject(meta.queued_counts) as Record<string, number>;
  const pendingNow = Number(run.pending_tasks) || 0;
  const needed = Math.max(0, config.seedBufferSize - pendingNow);
  if (needed === 0) return { seeded: 0 };

  const seedValue = normalizeString(meta.seed as string, String(run.run_id));
  const rng = createSeededRng(seedValue);
  const zoneIds = Array.isArray(meta.zone_ids) && (meta.zone_ids as string[]).length
    ? meta.zone_ids as string[]
    : ["global"];

  const tasks: Record<string, unknown>[] = [];
  const nextQueuedCounts = {
    quest_arc: Number(queuedCounts.quest_arc) || 0,
    lore_book: Number(queuedCounts.lore_book) || 0,
    asset2d: Number(queuedCounts.asset2d) || 0,
  };

  for (let cursor = 0; cursor < needed; cursor++) {
    let chosenKind = "";
    for (let step = 0; step < ASSET_KIND_CYCLE.length; step++) {
      const candidate = ASSET_KIND_CYCLE[(cursor + step) % ASSET_KIND_CYCLE.length];
      if (getRemainingCount(targetCounts, nextQueuedCounts, candidate) > 0) {
        chosenKind = candidate;
        break;
      }
    }
    if (!chosenKind) break;

    const index = nextQueuedCounts[chosenKind];
    nextQueuedCounts[chosenKind] += 1;
    const zoneId = zoneIds[(Math.floor(rng() * 1000000) + index) % zoneIds.length] || "global";
    const taskId = buildTaskId(String(run.run_id), chosenKind, index);

    let task: Record<string, unknown>;
    if (chosenKind === "quest_arc" || chosenKind === "lore_book") {
      task = {
        task_id: taskId,
        run_id: run.run_id,
        kind: chosenKind,
        zone_id: zoneId,
        status: "pending",
        estimate_eur: config.textCostPerOutputEur,
        payload: { prompt: buildNarrativePrompt(chosenKind, zoneId, index) },
      };
    } else {
      task = {
        task_id: taskId,
        run_id: run.run_id,
        kind: chosenKind,
        zone_id: zoneId,
        status: "pending",
        estimate_eur: config.imagePriceUsd,
        payload: { asset_type: weightedAssetType(index), seed: index + 1 },
      };
    }
    tasks.push(task);
  }

  if (tasks.length > 0) {
    await store.createTasks(String(run.run_id), tasks);
    await store.updateRun(String(run.run_id), {
      meta: { ...meta, queued_counts: nextQueuedCounts },
    });
  }

  return { seeded: tasks.length };
}

async function maybeCompleteRun(runId: string): Promise<Record<string, unknown> | null> {
  const run = await store.getRun(runId);
  if (!run || String(run.status) !== "running") return run;
  const stats = await store.getRunTaskStats(runId);
  const meta = normalizeObject(run.meta);
  const target = normalizeObject(meta.target_counts) as Record<string, number>;
  const queued = normalizeObject(meta.queued_counts) as Record<string, number>;
  const queuedTotal = (Number(queued.quest_arc) || 0) + (Number(queued.lore_book) || 0) + (Number(queued.asset2d) || 0);
  const targetTotal = (Number(target.quest_arc) || 0) + (Number(target.lore_book) || 0) + (Number(target.asset2d) || 0);
  if (queuedTotal >= targetTotal && stats.pending === 0 && stats.running === 0) {
    return store.updateRun(runId, { status: "completed", pause_reason: "" });
  }
  return run;
}

// ─── Budget alert ───────────────────────────────────────

function parseBudgetPayload(body: Record<string, unknown>): Record<string, unknown> {
  const payload = normalizeObject(body);
  if (payload.message && typeof payload.message === "object") {
    const messageData = normalizeString(
      (payload.message as Record<string, unknown>).data as string,
    );
    if (messageData) {
      try {
        const decoded = atob(messageData);
        return normalizeObject(JSON.parse(decoded));
      } catch {
        return {};
      }
    }
  }
  return payload;
}

function deriveBudgetAction(payload: Record<string, unknown>): {
  action: string;
  ratio: number;
  budgetAmount: number;
  costAmount: number;
} {
  const budgetAmount = parseOptionalNumber(
    payload.budgetAmount || payload.budget_amount || payload.amount, 0,
  );
  const costAmount = parseOptionalNumber(
    payload.costAmount || payload.cost_amount || payload.cost, 0,
  );
  const threshold = parseOptionalNumber(
    payload.alertThresholdExceeded || payload.alert_threshold_exceeded, 0,
  );

  let ratio = 0;
  if (budgetAmount > 0 && costAmount > 0) {
    ratio = costAmount / budgetAmount;
  } else if (threshold > 0) {
    ratio = threshold;
  }

  let action = "allow";
  if (ratio >= 0.95) action = "halt";
  else if (ratio >= 0.9) action = "pause";
  else if (ratio >= 0.85) action = "throttle";

  return { action, ratio, budgetAmount, costAmount };
}

// ─── Exported API ───────────────────────────────────────

export async function startBulkGenerationRun(
  params: { ownerId: string; body: Record<string, unknown> },
): Promise<Record<string, unknown>> {
  const config = buildConfig();
  if (!config.enabled) {
    const error = new Error("Bulk generation is disabled by BULK_GEN_ENABLED.");
    (error as Error & { code: string }).code = "BULK_GEN_DISABLED";
    throw error;
  }

  const run = buildRunShape(params.ownerId, normalizeObject(params.body), config);
  await ensureStyleProfiles((run.meta as Record<string, unknown>).zone_ids as string[]);
  const created = await store.createRun(run);
  await store.appendSpendEvent({
    run_id: created?.run_id,
    source: "run_start",
    action: "allow",
    estimated_cost_eur: 0,
    remaining_credit_estimate_eur: Number(
      (created?.meta as Record<string, unknown>)?.initial_credit_eur,
    ) || config.initialCreditsEur,
    note: "Run created.",
  });
  return created || {};
}

export async function tickBulkGenerationRun(params: {
  runId: string;
  workerId?: string;
  limit?: number;
}): Promise<Record<string, unknown>> {
  const config = buildConfig();
  const safeRunId = normalizeString(params.runId);
  if (!safeRunId) {
    const error = new Error("runId is required.");
    (error as Error & { status: number; code: string }).status = 400;
    (error as Error & { code: string }).code = "MISSING_RUN_ID";
    throw error;
  }

  const run = await store.getRun(safeRunId);
  if (!run) {
    const error = new Error("Run not found.");
    (error as Error & { status: number; code: string }).status = 404;
    (error as Error & { code: string }).code = "RUN_NOT_FOUND";
    throw error;
  }

  const guard = await evaluateRunGuard(run, config);
  if (guard.blocked) {
    return {
      ok: true,
      runId: safeRunId,
      status: guard.run?.status || "paused",
      guardReason: guard.reason,
      processed: 0,
      seeded: 0,
      results: [],
    };
  }

  const seeded = await seedTasksIfNeeded(run, config);
  const claimed = await store.claimPendingTasks({
    runId: safeRunId,
    workerId: normalizeString(params.workerId, "scheduler"),
    limit: Math.max(1, Math.min(50, parseOptionalInteger(params.limit, config.defaultBatchSize))),
    statuses: ["pending"],
  });

  const results = [];
  for (const task of claimed) {
    const result = await processTask(task, run, config);
    results.push(result);
  }

  const finalRun = await maybeCompleteRun(safeRunId);
  return {
    ok: true,
    runId: safeRunId,
    status: finalRun?.status || run.status,
    processed: claimed.length,
    seeded: seeded.seeded,
    results,
  };
}

export async function getRunStatus(
  runId: string,
  outputLimit?: number,
): Promise<{ run: Record<string, unknown> | null; stats: Record<string, number>; outputs: Record<string, unknown>[] } | null> {
  const safeRunId = normalizeString(runId);
  if (!safeRunId) return null;
  const run = await store.getRun(safeRunId);
  if (!run) return null;
  const stats = await store.getRunTaskStats(safeRunId);
  const outputs = await store.getRunOutputs(
    safeRunId,
    Math.max(1, Math.min(200, parseOptionalInteger(outputLimit, 30))),
  );
  return { run, stats, outputs };
}

export async function pauseRun(
  runId: string,
  reason?: string,
): Promise<Record<string, unknown> | null> {
  const safeRunId = normalizeString(runId);
  if (!safeRunId) return null;
  return store.updateRun(safeRunId, {
    status: "paused",
    pause_reason: normalizeString(reason, "Paused by operator."),
  });
}

export async function resumeRun(runId: string): Promise<Record<string, unknown> | null> {
  const safeRunId = normalizeString(runId);
  if (!safeRunId) return null;
  return store.updateRun(safeRunId, { status: "running", pause_reason: "" });
}

export async function upsertStyleProfile(
  profile: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const normalized = normalizeObject(profile);
  if (!normalizeString(normalized.zone_id as string)) {
    const error = new Error("zone_id is required for style profile updates.");
    (error as Error & { status: number; code: string }).status = 400;
    (error as Error & { code: string }).code = "MISSING_ZONE_ID";
    throw error;
  }
  return store.upsertStyleProfile({
    zone_id: normalizeString(normalized.zone_id as string),
    visual_style_prompt: normalizeString(
      normalized.visual_style_prompt as string, DEFAULT_STYLE_PROMPT,
    ),
    negative_prompt: normalizeString(
      normalized.negative_prompt as string, DEFAULT_NEGATIVE_PROMPT,
    ),
    palette: Array.isArray(normalized.palette) ? normalized.palette : [],
    lighting: normalizeString(normalized.lighting as string),
    composition_rules: Array.isArray(normalized.composition_rules)
      ? normalized.composition_rules
      : [],
    reference_assets: Array.isArray(normalized.reference_assets)
      ? normalized.reference_assets
      : [],
  });
}

export async function handleBudgetAlert(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const payload = parseBudgetPayload(body);
  const decision = deriveBudgetAction(payload);
  const runningRuns = await store.listRuns({ status: "running", limit: 200 });

  const notes: string[] = [];
  for (const run of runningRuns) {
    const currentMeta = normalizeObject(run.meta);
    const nextMeta = {
      ...currentMeta,
      budget_signal: decision.action,
      budget_signal_ratio: decision.ratio,
    };
    if (decision.action === "pause" || decision.action === "halt") {
      await store.updateRun(run.run_id, {
        status: "paused",
        pause_reason: `Budget signal '${decision.action}' at ratio ${decision.ratio.toFixed(3)}.`,
        meta: nextMeta,
      });
    } else {
      await store.updateRun(run.run_id, { meta: nextMeta });
    }
    await store.appendSpendEvent({
      run_id: run.run_id,
      source: "budget-alert",
      action: decision.action,
      estimated_cost_eur: Number(run.estimated_spend_eur) || 0,
      remaining_credit_estimate_eur: Math.max(
        0,
        (Number((currentMeta as Record<string, unknown>).initial_credit_eur) || 0) -
          (Number(run.estimated_spend_eur) || 0),
      ),
      note: `Budget alert ratio ${decision.ratio.toFixed(3)}.`,
    });
    notes.push(run.run_id);
  }

  return {
    ok: true,
    action: decision.action,
    ratio: decision.ratio,
    affectedRuns: notes,
  };
}

// ─── Error type ─────────────────────────────────────────

class ImageGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageGenError";
  }
}
