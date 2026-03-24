globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};
// Use same-origin API routes so Vercel or any same-host deployment can serve /api/**.
globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL = "/";
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_ENDPOINT = "/api/narrate";
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_TIMEOUT_MS = "240000";
globalThis.__RUNTIME_CONFIG__.VITE_WEB_GAMEPLAY_ENABLED = "true";
