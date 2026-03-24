import { createClient } from "@supabase/supabase-js";

const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object"
    ? runtimeConfig
    : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

const LOCAL_GAME_STORAGE_KEY = "localGame";
const LOCAL_GAME_USER = Object.freeze({
  id: "local",
  email: "local@game.dev",
  provider: "dev",
  roles: Object.freeze(["authenticated"]),
});

const getLocalGameUser = () => {
  if (typeof window === "undefined" || !window?.localStorage) return null;
  try {
    const enabled = window.localStorage.getItem(LOCAL_GAME_STORAGE_KEY);
    if (enabled !== "true") return null;
    return {
      id: LOCAL_GAME_USER.id,
      email: LOCAL_GAME_USER.email,
      provider: LOCAL_GAME_USER.provider,
      roles: [...LOCAL_GAME_USER.roles],
    };
  } catch {
    return null;
  }
};

const resolveAuthProvider = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return (
    pickEnvValue(runtimeEnv.VITE_AUTH_PROVIDER, buildEnv.VITE_AUTH_PROVIDER) ||
    "microsoft.com"
  );
};

const normalizeProviderId = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized || normalized === "aad" || normalized === "microsoft") {
    return "microsoft.com";
  }
  if (normalized === "google") return "google.com";
  return normalized;
};

const resolveSupabaseConfig = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();

  const url = pickEnvValue(
    runtimeEnv.VITE_SUPABASE_URL,
    buildEnv.VITE_SUPABASE_URL,
    runtimeEnv.NEXT_PUBLIC_SUPABASE_URL,
    buildEnv.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = pickEnvValue(
    runtimeEnv.VITE_SUPABASE_ANON_KEY,
    buildEnv.VITE_SUPABASE_ANON_KEY,
    runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    buildEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    runtimeEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    buildEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  );

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

const getDevUser = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const devUserId = pickEnvValue(
    runtimeEnv.VITE_DEV_USER_ID,
    buildEnv.VITE_DEV_USER_ID,
  );
  if (devUserId) {
    const devUserEmail = pickEnvValue(
      runtimeEnv.VITE_DEV_USER_EMAIL,
      buildEnv.VITE_DEV_USER_EMAIL,
    );
    return {
      id: devUserId,
      email: devUserEmail || devUserId,
      provider: "dev",
      roles: ["authenticated"],
    };
  }
  const localGameUser = getLocalGameUser();
  if (localGameUser) return localGameUser;
  return null;
};

const mapFirebaseUser = (user) => {
  if (!user || typeof user !== "object" || !user.id) return null;
  const primaryProvider =
    typeof user?.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : "";
  return {
    id: String(user.id),
    email: user.email ? String(user.email) : String(user.id),
    provider: primaryProvider || "supabase",
    roles: ["authenticated"],
  };
};

let supabaseClient = null;

const getSupabaseClient = () => {
  const config = resolveSupabaseConfig();
  if (!config) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }
  return supabaseClient;
};

const buildSupabaseProvider = (providerId) => {
  const normalized = normalizeProviderId(providerId);
  if (normalized === "google.com") return "google";
  if (
    normalized === "microsoft.com" ||
    normalized === "microsoft" ||
    normalized === "azure"
  ) {
    return "azure";
  }
  return normalized;
};

export async function signUp() {
  return signIn();
}

export async function signIn() {
  const devUser = getDevUser();
  if (devUser) {
    return { success: true, user: devUser };
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: "Supabase Auth is not configured.",
      };
    }

    const providerId = resolveAuthProvider();
    const provider = buildSupabaseProvider(providerId);
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) {
      return {
        success: false,
        error: String(error?.message || "Failed to sign in."),
      };
    }
    if (typeof window !== "undefined" && typeof data?.url === "string" && data.url) {
      window.location.assign(data.url);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: String(error?.message || "Failed to initialize Supabase Auth."),
    };
  }
}

export async function signOut() {
  const devUser = getDevUser();
  if (devUser) {
    return { success: true };
  }

  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: true };
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        error: String(error?.message || "Failed to sign out."),
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: String(error?.message || "Failed to sign out."),
    };
  }
}

export async function getCurrentUser() {
  const devUser = getDevUser();
  if (devUser) return devUser;

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const [{ data: userResult }, { data: sessionResult }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    return mapFirebaseUser(userResult?.user || sessionResult?.session?.user);
  } catch (error) {
    console.error("Get Supabase current user error:", error);
    return null;
  }
}

export function onAuthStateChange(callback) {
  let active = true;
  let teardown = () => {};

  const devUser = getDevUser();
  if (devUser) {
    callback(devUser);
    return () => {};
  }

  const init = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!active || !supabase) return;
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) callback(mapFirebaseUser(session?.user || null));
      });
      teardown = () => data.subscription.unsubscribe();
    } catch (error) {
      console.error("Auth state listener init failed:", error);
    }
  };

  init();

  return () => {
    active = false;
    teardown();
  };
}

export async function getAuthToken() {
  const devUser = getDevUser();
  if (devUser) return "";

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return "";
    const { data } = await supabase.auth.getSession();
    return typeof data?.session?.access_token === "string"
      ? data.session.access_token
      : "";
  } catch {
    return "";
  }
}

export function getDevAuthHeaders() {
  const devUser = getDevUser();
  if (!devUser) return {};
  return {
    "x-dev-user-id": devUser.id,
    "x-dev-user-email": devUser.email,
  };
}

export async function resetPassword() {
  return {
    success: false,
    error: "Password reset is handled by the identity provider.",
  };
}
