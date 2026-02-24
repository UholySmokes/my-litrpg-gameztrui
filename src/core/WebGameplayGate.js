const getBuildEnv = () =>
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getRuntimeEnv = () => {
  if (typeof globalThis === "undefined") return {};
  const runtimeConfig = globalThis.__RUNTIME_CONFIG__;
  return runtimeConfig && typeof runtimeConfig === "object" ? runtimeConfig : {};
};

const pickEnvValue = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
};

function parseBooleanFlag(value, fallback = false) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export function isWebGameplayEnabled() {
  const buildEnv = getBuildEnv();
  if (Boolean(buildEnv.DEV)) return true;

  const runtimeEnv = getRuntimeEnv();
  const explicit = pickEnvValue(
    runtimeEnv.VITE_WEB_GAMEPLAY_ENABLED,
    buildEnv.VITE_WEB_GAMEPLAY_ENABLED,
    runtimeEnv.VITE_ENABLE_WEB_GAMEPLAY,
    buildEnv.VITE_ENABLE_WEB_GAMEPLAY,
  );

  if (explicit !== undefined) {
    return parseBooleanFlag(explicit, false);
  }
  return false;
}

export const __testing = {
  parseBooleanFlag,
};
