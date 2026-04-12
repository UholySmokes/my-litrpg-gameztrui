globalThis.__RUNTIME_CONFIG__ = globalThis.__RUNTIME_CONFIG__ || {};
// Use same-origin API routes so Firebase Hosting rewrites /api/** to functions.api.
globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL = "/";
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_ENDPOINT = "/api/narrate";
globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_TIMEOUT_MS = "240000";
globalThis.__RUNTIME_CONFIG__.VITE_WEB_GAMEPLAY_ENABLED = "true";

// If the custom domain is temporarily serving static-only content (no /api rewrites),
// allow a safe fallback to the Firebase canonical host for API calls.
try {
  const host = globalThis.location && typeof globalThis.location.hostname === "string"
    ? globalThis.location.hostname.trim().toLowerCase()
    : "";
  if (host === "void-verse.com" || host.endsWith(".void-verse.com")) {
    globalThis.__RUNTIME_CONFIG__.VITE_ALLOW_EXTERNAL_API_BASE_URL = "true";
    globalThis.__RUNTIME_CONFIG__.VITE_API_BASE_URL =
      "https://my-litrpg-gameztrui-3416-da75c.web.app";
    globalThis.__RUNTIME_CONFIG__.VITE_NARRATE_ENDPOINT =
      "https://my-litrpg-gameztrui-3416-da75c.web.app/api/narrate";
  }
} catch {
  // No location available (non-browser execution).
}
