globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};
// Use same-origin API routes so Firebase Hosting rewrites /api/** to functions.api.
globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL = "";
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_TIMEOUT_MS = "240000";
