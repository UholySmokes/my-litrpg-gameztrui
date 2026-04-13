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
    "azure"
  );
};

const normalizeProviderId = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (
    !normalized ||
    normalized === "aad" ||
    normalized === "microsoft" ||
    normalized === "microsoft.com" ||
    normalized === "azuread"
  ) {
    return "azure";
  }
  if (normalized === "google.com") return "google";
  return normalized;
};

const resolveSupabaseUrl = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return pickEnvValue(
    runtimeEnv.VITE_SUPABASE_URL,
    buildEnv.VITE_SUPABASE_URL,
  );
};

const resolveSupabasePublishableKey = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return pickEnvValue(
    runtimeEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    buildEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    runtimeEnv.VITE_SUPABASE_ANON_KEY,
    buildEnv.VITE_SUPABASE_ANON_KEY,
  );
};

const resolveSupabaseAuthRedirectUrl = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const explicit = pickEnvValue(
    runtimeEnv.VITE_SUPABASE_AUTH_REDIRECT_URL,
    buildEnv.VITE_SUPABASE_AUTH_REDIRECT_URL,
  );
  if (explicit) return explicit;
  if (typeof window === "undefined" || !window?.location) return undefined;
  try {
    return new URL(window.location.href).toString();
  } catch {
    return undefined;
  }
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

const mapSupabaseUser = (user) => {
  if (!user || typeof user !== "object" || !user.id) return null;
  const primaryIdentity = Array.isArray(user.identities)
    ? user.identities.find((entry) => entry?.provider)
    : null;
  const primaryProvider =
    user.app_metadata?.provider ||
    primaryIdentity?.provider ||
    user.user_metadata?.provider ||
    "";

  return {
    id: String(user.id),
    email: user.email ? String(user.email) : String(user.id),
    provider: primaryProvider || "supabase",
    roles: ["authenticated"],
  };
};

let supabaseSdkPromise = null;
let supabaseClientPromise = null;
let cachedSupabaseConfigKey = "";

const loadSupabaseSdk = async () => {
  if (!supabaseSdkPromise) {
    supabaseSdkPromise = import("@supabase/supabase-js").then((sdk) => ({
      createClient: sdk.createClient,
    }));
  }
  return supabaseSdkPromise;
};

const getSupabaseClient = async () => {
  const url = resolveSupabaseUrl();
  const key = resolveSupabasePublishableKey();
  if (!url || !key) return null;

  const nextConfigKey = `${url}::${key}`;
  if (supabaseClientPromise && cachedSupabaseConfigKey === nextConfigKey) {
    return supabaseClientPromise;
  }

  cachedSupabaseConfigKey = nextConfigKey;
  supabaseClientPromise = loadSupabaseSdk().then(({ createClient }) =>
    createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "voidverse-web-auth",
        },
      },
    }),
  );

  return supabaseClientPromise;
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
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        error: "Supabase Auth is not configured.",
      };
    }

    const provider = normalizeProviderId(resolveAuthProvider());
    const redirectTo = resolveSupabaseAuthRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });

    if (error) {
      return {
        success: false,
        error: String(error.message || "Failed to sign in."),
      };
    }

    if (typeof window !== "undefined" && data?.url) {
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
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return { success: true };
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      return {
        success: false,
        error: String(error.message || "Failed to sign out."),
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
    const supabase = await getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return mapSupabaseUser(data?.user);
  } catch (error) {
    console.error("Get Supabase current user error:", error);
    return null;
  }
}

export function onAuthStateChange(callback) {
  let active = true;
  let unsubscribe = () => {};

  const devUser = getDevUser();
  if (devUser) {
    callback(devUser);
    return () => {};
  }

  const init = async () => {
    try {
      const supabase = await getSupabaseClient();
      if (!active || !supabase) return;
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        callback(mapSupabaseUser(session?.user || null));
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      console.error("Auth state listener init failed:", error);
    }
  };

  init();

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function getAuthToken() {
  const devUser = getDevUser();
  if (devUser) return "";

  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return "";
    const { data, error } = await supabase.auth.getSession();
    if (error) return "";
    return data?.session?.access_token || "";
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
