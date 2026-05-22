import { createClient } from "npm:@supabase/supabase-js@2";

let serviceClient: ReturnType<typeof createClient> | null = null;
let anonClient: ReturnType<typeof createClient> | null = null;

function getOptionalEnv(name: string): string {
  const value = Deno.env.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function getSupabaseServiceClient(): ReturnType<typeof createClient> {
  if (serviceClient) return serviceClient;

  const url = getOptionalEnv("SUPABASE_URL");
  const key = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Supabase service client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  serviceClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serviceClient;
}

export function getSupabaseAnonClient(): ReturnType<typeof createClient> {
  if (anonClient) return anonClient;

  const url = getOptionalEnv("SUPABASE_URL");
  const key = getOptionalEnv("SUPABASE_ANON_KEY");

  if (!url || !key) {
    throw new Error(
      "Supabase anon client not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }

  anonClient = createClient(url, key);
  return anonClient;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function parseOptionalNumber(raw: unknown, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseOptionalInteger(raw: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseOptionalBoolean(raw: unknown, fallback = false): boolean {
  if (typeof raw !== "string") return fallback;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export function clampInt(value: unknown, min: number, max: number): number {
  const parsed = parseOptionalInteger(value, min);
  return Math.max(min, Math.min(max, parsed));
}
