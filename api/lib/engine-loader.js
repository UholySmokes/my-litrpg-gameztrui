/**
 * Engine loader for Azure Functions (CommonJS) → @voidverse/game-core (ESM).
 *
 * Uses dynamic import() with module-level caching to avoid cold-start overhead.
 * The engine module is loaded once and reused for the lifetime of the function host.
 */

let _engineModule = null;

/**
 * Lazily load and cache the game-core engine module.
 *
 * @returns {Promise<{ createSystemEngine: function }>}
 */
async function getEngineModule() {
  if (_engineModule) return _engineModule;
  _engineModule = await import("@voidverse/game-core");
  return _engineModule;
}

/**
 * Create a SystemEngine instance configured for server-side authoritative validation.
 *
 * @param {object} options
 * @param {number} options.seed - Run seed for deterministic PRNG
 * @param {string} [options.contentVersion] - Content version string
 * @param {number} [options.stateVersion] - State schema version
 * @returns {Promise<object>} SystemEngine
 */
async function createServerEngine({ seed, contentVersion, stateVersion }) {
  const { createSystemEngine } = await getEngineModule();
  return createSystemEngine({
    mode: "server",
    seed: seed ?? 1,
    contentVersion: contentVersion ?? "core@0.1.0",
    stateVersion: stateVersion ?? 1,
  });
}

module.exports = { getEngineModule, createServerEngine };
