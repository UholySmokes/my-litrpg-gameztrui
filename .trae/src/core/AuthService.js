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

const normalizeBaseUrl = (value) => value.replace(/\/+$/g, "");

const resolveAuthBaseUrl = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const base = pickEnvValue(
    runtimeEnv.VITE_AUTH_BASE_URL,
    buildEnv.VITE_AUTH_BASE_URL,
  );
  return base ? normalizeBaseUrl(base) : "";
};

const resolveAuthProvider = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return (
    pickEnvValue(runtimeEnv.VITE_AUTH_PROVIDER, buildEnv.VITE_AUTH_PROVIDER) ||
    "aad"
  );
};

const getDevUser = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const devUserId = pickEnvValue(
    runtimeEnv.VITE_DEV_USER_ID,
    buildEnv.VITE_DEV_USER_ID,
  );
  if (!devUserId) return null;
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
};

const mapClientPrincipal = (principal) => {
  if (!principal || typeof principal !== "object") return null;
  const userId = principal.userId || principal.userDetails;
  if (!userId) return null;
  return {
    id: String(userId),
    email: principal.userDetails ? String(principal.userDetails) : String(userId),
    provider: principal.identityProvider ? String(principal.identityProvider) : "",
    roles: Array.isArray(principal.userRoles) ? principal.userRoles : [],
  };
};

const buildAuthUrl = (path, redirectTo) => {
  const base = resolveAuthBaseUrl();
  const prefix = base ? `${base}` : "";
  const redirect = redirectTo || window.location.href;
  const encoded = encodeURIComponent(redirect);
  return `${prefix}${path}?post_login_redirect_uri=${encoded}`;
};

export async function signUp() {
  return signIn();
}

export async function signIn() {
  const devUser = getDevUser();
  if (devUser) {
    return { success: true, user: devUser };
  }

  const provider = resolveAuthProvider();
  window.location.assign(buildAuthUrl(`/.auth/login/${provider}`));
  return { success: true };
}

export async function signOut() {
  const devUser = getDevUser();
  if (devUser) {
    return { success: true };
  }

  const base = resolveAuthBaseUrl();
  const redirect = encodeURIComponent(window.location.href);
  const url = `${base}/.auth/logout?post_logout_redirect_uri=${redirect}`;
  window.location.assign(url);
  return { success: true };
}

export async function getCurrentUser() {
  const devUser = getDevUser();
  if (devUser) return devUser;

  try {
    const base = resolveAuthBaseUrl();
    const response = await fetch(`${base}/.auth/me`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return mapClientPrincipal(data?.clientPrincipal);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export function onAuthStateChange(callback) {
  let active = true;

  const notify = async () => {
    if (!active) return;
    const user = await getCurrentUser();
    if (active) callback(user);
  };

  notify();

  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      notify();
    }
  };

  window.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    active = false;
    window.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export async function resetPassword() {
  return {
    success: false,
    error: "Password reset is handled by the identity provider.",
  };
}
