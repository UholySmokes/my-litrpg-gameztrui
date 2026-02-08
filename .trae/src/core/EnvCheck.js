export function verifyEnv() {
  const narrate =
    import.meta.env.VITE_NARRATE_ENDPOINT || import.meta.env.VITE_API_BASE_URL;
  const authProvider = import.meta.env.VITE_AUTH_PROVIDER;

  const missing = [];
  if (!narrate) {
    missing.push("VITE_NARRATE_ENDPOINT or VITE_API_BASE_URL");
  }
  if (!authProvider) {
    missing.push("VITE_AUTH_PROVIDER (defaults to aad)");
  }

  if (missing.length === 0) {
    console.info("Env loaded");
    return true;
  }

  console.warn("Env missing", missing);
  return false;
}
