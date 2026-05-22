import { getSupabaseServiceClient } from "./db.ts";
import {
  normalizeString,
  normalizeObject,
  nowIso,
  parseOptionalNumber,
  parseOptionalInteger,
  clampInt,
} from "./db.ts";

// ─── Table names ────────────────────────────────────────

const RUNS_TABLE = "bulk_gen_runs";
const TASKS_TABLE = "bulk_gen_tasks";
const OUTPUTS_TABLE = "bulk_gen_outputs";
const STYLES_TABLE = "bulk_gen_styles";
const SPEND_TABLE = "bulk_gen_spend_events";

// ─── Helpers ────────────────────────────────────────────

function db() {
  return getSupabaseServiceClient();
}

function mapRow<T>(row: unknown): T {
  return row as T;
}

interface BulkGenRun {
  run_id: string;
  owner_id: string;
  status: string;
  pause_reason: string;
  credit_guard_mode: string;
  max_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  pending_tasks: number;
  max_estimated_eur: number;
  estimated_spend_eur: number;
  credit_stop_threshold_eur: number;
  expires_at: string;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface BulkGenTask {
  task_id: string;
  run_id: string;
  kind: string;
  zone_id: string;
  status: string;
  claimed_by: string;
  estimate_eur: number;
  attempt_count: number;
  last_error: string;
  payload: Record<string, unknown>;
  defer_until: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BulkGenOutput {
  output_id: string;
  run_id: string;
  task_id: string;
  output_type: string;
  zone_id: string;
  title: string;
  body: string;
  model: string;
  asset_type: string;
  variant_index: number;
  quality_score: number;
  is_winner: boolean;
  gcs_uri: string;
  supabase_storage_path: string;
  meta: Record<string, unknown>;
  created_at: string;
}

// ─── Runs ───────────────────────────────────────────────

export async function createRun(run: Record<string, unknown>): Promise<BulkGenRun | null> {
  const { data, error } = await db()
    .from(RUNS_TABLE)
    .insert(run)
    .select()
    .single();

  if (error) throw new Error(`Failed to create run: ${error.message}`);
  return data ? mapRow<BulkGenRun>(data) : null;
}

export async function getRun(runId: string): Promise<BulkGenRun | null> {
  const safeRunId = normalizeString(runId);
  if (!safeRunId) return null;

  const { data, error } = await db()
    .from(RUNS_TABLE)
    .select("*")
    .eq("run_id", safeRunId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(`Failed to get run: ${error.message}`);
  return data ? mapRow<BulkGenRun>(data) : null;
}

export async function updateRun(
  runId: string,
  patch: Record<string, unknown>,
): Promise<BulkGenRun | null> {
  const safeRunId = normalizeString(runId);
  const safePatch = normalizeObject(patch);
  if (!safeRunId) return null;

  const { data, error } = await db()
    .from(RUNS_TABLE)
    .update({ ...safePatch, updated_at: nowIso() })
    .eq("run_id", safeRunId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update run: ${error.message}`);
  return data ? mapRow<BulkGenRun>(data) : null;
}

export async function incrementRunCounters(
  runId: string,
  increments: Record<string, number>,
): Promise<BulkGenRun | null> {
  const safeRunId = normalizeString(runId);
  const safeIncrements = normalizeObject(increments) as Record<string, number>;
  if (!safeRunId) return null;

  // Read-modify-write for atomic-like counter increments
  const run = await getRun(safeRunId);
  if (!run) return null;

  const runUpdates: Record<string, unknown> = {};
  for (const [key, amount] of Object.entries(safeIncrements)) {
    const n = Number(amount);
    if (Number.isFinite(n) && n !== 0) {
      runUpdates[key] = (Number((run as unknown as Record<string, unknown>)[key] as number) || 0) + n;
    }
  }

  if (Object.keys(runUpdates).length === 0) return run;
  return await updateRun(safeRunId, runUpdates);
}

// ─── Tasks ──────────────────────────────────────────────

export async function createTasks(
  runId: string,
  tasks: Record<string, unknown>[],
): Promise<BulkGenTask[]> {
  const safeRunId = normalizeString(runId);
  const inputTasks = Array.isArray(tasks) ? tasks : [];
  if (!safeRunId || inputTasks.length === 0) return [];

  const normalized = inputTasks.map((t) => ({
    ...t,
    run_id: safeRunId,
    created_at: nowIso(),
    updated_at: nowIso(),
  }));

  const { data, error } = await db()
    .from(TASKS_TABLE)
    .insert(normalized)
    .select();

  if (error) throw new Error(`Failed to create tasks: ${error.message}`);

  // Increment pending_tasks counter
  await incrementRunCounters(safeRunId, { pending_tasks: normalized.length });

  return data ? data.map((row) => mapRow<BulkGenTask>(row)) : [];
}

export async function claimPendingTasks(params: {
  runId: string;
  limit: number;
  workerId: string;
  statuses?: string[];
}): Promise<BulkGenTask[]> {
  const safeRunId = normalizeString(params.runId);
  const safeWorkerId = normalizeString(params.workerId, "worker");
  const safeLimit = Math.max(1, Math.min(100, Number(params.limit) || 1));
  const allowedStatuses = Array.isArray(params.statuses) && params.statuses.length
    ? params.statuses.map((s) => normalizeString(s).toLowerCase()).filter(Boolean)
    : ["pending"];

  if (!safeRunId) return [];

  // Fetch candidate tasks first
  const { data: candidates, error: fetchError } = await db()
    .from(TASKS_TABLE)
    .select("task_id, status, defer_until")
    .eq("run_id", safeRunId)
    .in("status", allowedStatuses)
    .is("defer_until", null)
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (fetchError) throw new Error(`Failed to fetch pending tasks: ${fetchError.message}`);
  if (!candidates || candidates.length === 0) return [];

  const candidateIds = candidates.map((c) => (c as Record<string, unknown>).task_id as string);
  const now = nowIso();

  // Then claim them
  const { data: claimed, error: claimError } = await db()
    .from(TASKS_TABLE)
    .update({
      status: "running",
      claimed_by: safeWorkerId,
      claimed_at: now,
      defer_until: null,
      updated_at: now,
    })
    .in("task_id", candidateIds)
    .in("status", allowedStatuses)
    .select();

  if (claimError) throw new Error(`Failed to claim tasks: ${claimError.message}`);

  if (claimed && claimed.length > 0) {
    await incrementRunCounters(safeRunId, { pending_tasks: -claimed.length });
  }

  return claimed ? claimed.map((row) => mapRow<BulkGenTask>(row)) : [];
}

export async function rescheduleTask(params: {
  taskId: string;
  lastError?: string;
  deferSeconds?: number;
}): Promise<BulkGenTask | null> {
  const safeTaskId = normalizeString(params.taskId);
  if (!safeTaskId) return null;

  const delaySeconds = Math.max(5, Math.min(3600, Number(params.deferSeconds) || 30));
  const now = nowIso();
  const deferUntil = new Date(Date.parse(now) + delaySeconds * 1000).toISOString();

  // Get current task first
  const { data: current, error: fetchError } = await db()
    .from(TASKS_TABLE)
    .select("status, run_id")
    .eq("task_id", safeTaskId)
    .single();

  if (fetchError || !current) return null;

  const prevStatus = normalizeString((current as Record<string, unknown>).status).toLowerCase();

  const { data, error } = await db()
    .from(TASKS_TABLE)
    .update({
      status: "pending",
      defer_until: deferUntil,
      updated_at: now,
      completed_at: null,
      last_error: normalizeString(params.lastError),
    })
    .eq("task_id", safeTaskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reschedule task: ${error.message}`);

  if (prevStatus !== "pending" && data) {
    await incrementRunCounters(
      normalizeString((current as Record<string, unknown>).run_id),
      { pending_tasks: 1 },
    );
  }

  return data ? mapRow<BulkGenTask>(data) : null;
}

export async function setTaskResult(params: {
  taskId: string;
  status: string;
  lastError?: string;
  estimateEurDelta?: number;
}): Promise<BulkGenTask | null> {
  const safeTaskId = normalizeString(params.taskId);
  const safeStatus = normalizeString(params.status);
  if (!safeTaskId || !safeStatus) return null;

  const now = nowIso();
  const nextStatus = safeStatus.toLowerCase();
  const isTerminal = nextStatus === "completed" || nextStatus === "failed";

  // Get current task to check prev status
  const { data: current, error: fetchError } = await db()
    .from(TASKS_TABLE)
    .select("status, run_id")
    .eq("task_id", safeTaskId)
    .single();

  if (fetchError || !current) return null;

  const prevStatus = normalizeString((current as Record<string, unknown>).status).toLowerCase();
  const alreadyTerminal = prevStatus === "completed" || prevStatus === "failed";

  const updates: Record<string, unknown> = {
    status: safeStatus,
    updated_at: now,
    completed_at: isTerminal ? now : null,
    last_error: normalizeString(params.lastError),
  };

  const { data, error } = await db()
    .from(TASKS_TABLE)
    .update(updates)
    .eq("task_id", safeTaskId)
    .select()
    .single();

  if (error) throw new Error(`Failed to set task result: ${error.message}`);

  if (!alreadyTerminal && data) {
    const runUpdates: Record<string, number> = {};
    if (nextStatus === "completed") runUpdates.completed_tasks = 1;
    if (nextStatus === "failed") runUpdates.failed_tasks = 1;
    const delta = Number(params.estimateEurDelta);
    if (nextStatus === "completed" && Number.isFinite(delta) && delta !== 0) {
      runUpdates.estimated_spend_eur = delta;
    }
    if (Object.keys(runUpdates).length > 0) {
      await incrementRunCounters(
        normalizeString((current as Record<string, unknown>).run_id),
        runUpdates,
      );
    }
  }

  return data ? mapRow<BulkGenTask>(data) : null;
}

// ─── Outputs ────────────────────────────────────────────

export async function appendOutputs(
  outputs: Record<string, unknown>[],
): Promise<BulkGenOutput[]> {
  const safeOutputs = Array.isArray(outputs) ? outputs : [];
  if (safeOutputs.length === 0) return [];

  const normalized = safeOutputs.map((o) => ({
    ...o,
    created_at: nowIso(),
  }));

  const { data, error } = await db()
    .from(OUTPUTS_TABLE)
    .insert(normalized)
    .select();

  if (error) throw new Error(`Failed to append outputs: ${error.message}`);
  return data ? data.map((row) => mapRow<BulkGenOutput>(row)) : [];
}

export async function getRunOutputs(
  runId: string,
  limit = 50,
): Promise<BulkGenOutput[]> {
  const safeRunId = normalizeString(runId);
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
  if (!safeRunId) return [];

  const { data, error } = await db()
    .from(OUTPUTS_TABLE)
    .select("*")
    .eq("run_id", safeRunId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(`Failed to get run outputs: ${error.message}`);
  return data ? data.map((row) => mapRow<BulkGenOutput>(row)) : [];
}

// ─── Styles ─────────────────────────────────────────────

export async function upsertStyleProfile(
  profile: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const normalized = {
    ...profile,
    updated_at: nowIso(),
  };

  const { data, error } = await db()
    .from(STYLES_TABLE)
    .upsert(normalized, { onConflict: "zone_id" })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert style profile: ${error.message}`);
  return data || null;
}

export async function getStyleProfile(
  zoneId: string,
): Promise<Record<string, unknown> | null> {
  const safeZoneId = normalizeString(zoneId, "global");

  const { data, error } = await db()
    .from(STYLES_TABLE)
    .select("*")
    .eq("zone_id", safeZoneId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get style profile: ${error.message}`);
  }
  return data || null;
}

// ─── Spend Events ───────────────────────────────────────

export async function appendSpendEvent(
  event: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const normalized = {
    ...event,
    created_at: nowIso(),
  };

  const { data, error } = await db()
    .from(SPEND_TABLE)
    .insert(normalized)
    .select()
    .single();

  if (error) throw new Error(`Failed to append spend event: ${error.message}`);
  return data || null;
}

// ─── Stats & List ───────────────────────────────────────

export async function getRunTaskStats(runId: string): Promise<{
  pending: number;
  running: number;
  completed: number;
  failed: number;
}> {
  const safeRunId = normalizeString(runId);
  if (!safeRunId) return { pending: 0, running: 0, completed: 0, failed: 0 };

  const { data, error } = await db()
    .from(TASKS_TABLE)
    .select("status")
    .eq("run_id", safeRunId);

  if (error) throw new Error(`Failed to get task stats: ${error.message}`);

  const counters = { pending: 0, running: 0, completed: 0, failed: 0 };
  if (data) {
    for (const row of data) {
      const status = normalizeString((row as Record<string, unknown>).status).toLowerCase();
      if (status === "pending") counters.pending += 1;
      else if (status === "running") counters.running += 1;
      else if (status === "completed") counters.completed += 1;
      else if (status === "failed") counters.failed += 1;
    }
  }
  return counters;
}

export async function listRuns(params: {
  status?: string;
  limit?: number;
} = {}): Promise<BulkGenRun[]> {
  const safeStatus = normalizeString(params.status).toLowerCase();
  const safeLimit = Math.max(1, Math.min(500, Number(params.limit) || 50));

  let query = db()
    .from(RUNS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (safeStatus) {
    query = query.eq("status", safeStatus);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to list runs: ${error.message}`);
  return data ? data.map((row) => mapRow<BulkGenRun>(row)) : [];
}
