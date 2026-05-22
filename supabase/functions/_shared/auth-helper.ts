import { createClient } from "npm:@supabase/supabase-js@2";

export interface AppUser {
  id: string;
  email: string;
  provider: string;
  roles: string[];
}

const ANONYMOUS_USER: AppUser = Object.freeze({
  id: "anonymous",
  email: "anonymous@chronicle.local",
  provider: "anonymous",
  roles: ["anonymous"],
});

const DEV_USER: AppUser = Object.freeze({
  id: "dev-user",
  email: "dev@chronicle.local",
  provider: "dev",
  roles: ["dev"],
});

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient(): ReturnType<typeof createClient> {
  if (supabaseClient) return supabaseClient;

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (!url || !anonKey) {
    throw new Error("Supabase not configured: SUPABASE_URL and SUPABASE_ANON_KEY required");
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}

function extractBearerToken(authHeader: string | null): string {
  if (!authHeader) return "";
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return "";
  if (parts[0].toLowerCase() !== "bearer") return "";
  return parts[1].trim();
}

async function verifySupabaseToken(token: string): Promise<AppUser | null> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;

    const user = data.user;
    return {
      id: user.id,
      email: user.email || "",
      provider: user.app_metadata?.provider || "supabase",
      roles: user.app_metadata?.roles || ["player"],
    };
  } catch {
    return null;
  }
}

export function isDevAuthEnabled(): boolean {
  const val = Deno.env.get("DEV_AUTH_ENABLED") || "";
  return val === "true" || val === "1";
}

export async function getUserFromRequest(req: Request): Promise<AppUser | null> {
  if (isDevAuthEnabled()) {
    return DEV_USER;
  }

  const authHeader = req.headers.get("Authorization");
  const token = extractBearerToken(authHeader);
  if (!token) return null;

  return await verifySupabaseToken(token);
}

export async function requireAuthenticatedUser(
  req: Request,
  extraHeaders?: Record<string, string>,
): Promise<{ user: AppUser } | { error: Response }> {
  if (isDevAuthEnabled()) {
    return { user: DEV_USER };
  }

  const user = await getUserFromRequest(req);
  if (user) return { user };

  return {
    error: new Response(
      JSON.stringify({
        ok: false,
        errorCode: "UNAUTHENTICATED",
        message: "Sign in required.",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...extraHeaders,
        },
      },
    ),
  };
}

export function getNarrationUser(req: Request): Promise<AppUser> {
  return getUserFromRequest(req).then((user) => user || ANONYMOUS_USER);
}
