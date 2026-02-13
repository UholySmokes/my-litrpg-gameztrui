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

const resolveFirebaseAuthTenantId = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return pickEnvValue(
    runtimeEnv.VITE_FIREBASE_AUTH_TENANT_ID,
    buildEnv.VITE_FIREBASE_AUTH_TENANT_ID,
  );
};

const resolveFirebaseAuthEmulatorUrl = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  return pickEnvValue(
    runtimeEnv.VITE_FIREBASE_AUTH_EMULATOR_URL,
    buildEnv.VITE_FIREBASE_AUTH_EMULATOR_URL,
  );
};

const resolveFirebaseConfig = () => {
  const runtimeEnv = getRuntimeEnv();
  const buildEnv = getBuildEnv();
  const rawConfig = pickEnvValue(
    runtimeEnv.VITE_FIREBASE_CONFIG,
    buildEnv.VITE_FIREBASE_CONFIG,
  );

  let parsedConfig = {};
  if (rawConfig) {
    try {
      const parsed = JSON.parse(rawConfig);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsedConfig = parsed;
      }
    } catch {
      parsedConfig = {};
    }
  }

  const firebaseConfig = {
    apiKey: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_API_KEY,
      buildEnv.VITE_FIREBASE_API_KEY,
      parsedConfig.apiKey,
    ),
    authDomain: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_AUTH_DOMAIN,
      buildEnv.VITE_FIREBASE_AUTH_DOMAIN,
      parsedConfig.authDomain,
    ),
    projectId: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_PROJECT_ID,
      buildEnv.VITE_FIREBASE_PROJECT_ID,
      parsedConfig.projectId,
    ),
    appId: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_APP_ID,
      buildEnv.VITE_FIREBASE_APP_ID,
      parsedConfig.appId,
    ),
    messagingSenderId: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      buildEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
      parsedConfig.messagingSenderId,
    ),
    storageBucket: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_STORAGE_BUCKET,
      buildEnv.VITE_FIREBASE_STORAGE_BUCKET,
      parsedConfig.storageBucket,
    ),
    measurementId: pickEnvValue(
      runtimeEnv.VITE_FIREBASE_MEASUREMENT_ID,
      buildEnv.VITE_FIREBASE_MEASUREMENT_ID,
      parsedConfig.measurementId,
    ),
  };

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.appId
  ) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(firebaseConfig).filter(([, value]) => Boolean(value)),
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

const mapFirebaseUser = (user) => {
  if (!user || typeof user !== "object" || !user.uid) return null;
  const primaryProvider = Array.isArray(user.providerData)
    ? user.providerData.find((entry) => entry?.providerId)?.providerId
    : "";
  return {
    id: String(user.uid),
    email: user.email ? String(user.email) : String(user.uid),
    provider: primaryProvider || "firebase",
    roles: ["authenticated"],
  };
};

const buildAuthUrl = (path, redirectTo) => {
  const base = resolveAuthBaseUrl();
  const prefix = base ? `${base}` : "";
  const redirect =
    redirectTo ||
    (typeof window !== "undefined" ? window.location.href : "about:blank");
  const encoded = encodeURIComponent(redirect);
  return `${prefix}${path}?post_login_redirect_uri=${encoded}`;
};

let firebaseSdkPromise = null;
let firebaseApp = null;
let firebaseAuthEmulatorConnected = false;

const loadFirebaseSdk = async () => {
  if (!firebaseSdkPromise) {
    firebaseSdkPromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ]).then(([app, auth]) => ({
      initializeApp: app.initializeApp,
      getApps: app.getApps,
      getApp: app.getApp,
      getAuth: auth.getAuth,
      onAuthStateChanged: auth.onAuthStateChanged,
      signInWithPopup: auth.signInWithPopup,
      signInWithRedirect: auth.signInWithRedirect,
      signOut: auth.signOut,
      OAuthProvider: auth.OAuthProvider,
      GoogleAuthProvider: auth.GoogleAuthProvider,
      connectAuthEmulator: auth.connectAuthEmulator,
    }));
  }
  return firebaseSdkPromise;
};

const getFirebaseContext = async () => {
  const config = resolveFirebaseConfig();
  if (!config) return null;

  const sdk = await loadFirebaseSdk();

  if (!firebaseApp) {
    firebaseApp = sdk.getApps().length ? sdk.getApp() : sdk.initializeApp(config);
  }

  const auth = sdk.getAuth(firebaseApp);
  const tenantId = resolveFirebaseAuthTenantId();
  if (tenantId) {
    auth.tenantId = tenantId;
  }

  const emulatorUrl = resolveFirebaseAuthEmulatorUrl();
  if (emulatorUrl && !firebaseAuthEmulatorConnected) {
    sdk.connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
    firebaseAuthEmulatorConnected = true;
  }

  return { sdk, auth };
};

const waitForFirebaseAuthReady = async ({ sdk, auth }) => {
  if (auth && typeof auth.authStateReady === "function") {
    await auth.authStateReady();
    return;
  }

  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    const unsubscribe = sdk.onAuthStateChanged(
      auth,
      () => {
        unsubscribe();
        finish();
      },
      () => {
        unsubscribe();
        finish();
      },
    );

    setTimeout(() => {
      unsubscribe();
      finish();
    }, 2500);
  });
};

const buildFirebaseProvider = (sdk, providerId) => {
  const normalized = normalizeProviderId(providerId);
  if (normalized === "google.com") {
    return new sdk.GoogleAuthProvider();
  }

  const provider = new sdk.OAuthProvider(normalized);
  if (normalized === "microsoft.com") {
    provider.addScope("openid");
    provider.addScope("profile");
    provider.addScope("email");
  }
  return provider;
};

const isPopupRedirectFallbackError = (error) => {
  const code = String(error?.code || "");
  return (
    code === "auth/popup-blocked" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
};

async function getLegacyCurrentUser() {
  try {
    const base = resolveAuthBaseUrl();
    const response = await fetch(`${base}/.auth/me`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return mapClientPrincipal(data?.clientPrincipal);
  } catch (error) {
    console.error("Get legacy current user error:", error);
    return null;
  }
}

export async function signUp() {
  return signIn();
}

export async function signIn() {
  const devUser = getDevUser();
  if (devUser) {
    return { success: true, user: devUser };
  }

  try {
    const firebase = await getFirebaseContext();
    if (firebase) {
      const providerId = resolveAuthProvider();
      const provider = buildFirebaseProvider(firebase.sdk, providerId);

      try {
        const result = await firebase.sdk.signInWithPopup(firebase.auth, provider);
        return { success: true, user: mapFirebaseUser(result?.user) };
      } catch (error) {
        if (isPopupRedirectFallbackError(error)) {
          await firebase.sdk.signInWithRedirect(firebase.auth, provider);
          return { success: true };
        }
        return {
          success: false,
          error: String(error?.message || "Failed to sign in."),
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: String(error?.message || "Failed to initialize Firebase Auth."),
    };
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

  try {
    const firebase = await getFirebaseContext();
    if (firebase) {
      await firebase.sdk.signOut(firebase.auth);
      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error?.message || "Failed to sign out."),
    };
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
    const firebase = await getFirebaseContext();
    if (firebase) {
      await waitForFirebaseAuthReady(firebase);
      return mapFirebaseUser(firebase.auth.currentUser);
    }
  } catch (error) {
    console.error("Get Firebase current user error:", error);
  }

  return getLegacyCurrentUser();
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
      const firebase = await getFirebaseContext();
      if (!active) return;

      if (firebase) {
        teardown = firebase.sdk.onAuthStateChanged(firebase.auth, (user) => {
          if (active) callback(mapFirebaseUser(user));
        });
        return;
      }
    } catch (error) {
      console.error("Auth state listener init failed:", error);
    }

    const notify = async () => {
      if (!active) return;
      const user = await getLegacyCurrentUser();
      if (active) callback(user);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        notify();
      }
    };

    notify();
    window.addEventListener("focus", notify);
    document.addEventListener("visibilitychange", handleVisibility);
    teardown = () => {
      window.removeEventListener("focus", notify);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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
    const firebase = await getFirebaseContext();
    if (!firebase) return "";

    await waitForFirebaseAuthReady(firebase);
    const user = firebase.auth.currentUser;
    if (!user || typeof user.getIdToken !== "function") return "";
    return await user.getIdToken();
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
