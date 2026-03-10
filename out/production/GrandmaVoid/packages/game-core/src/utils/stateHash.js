/**
 * State hashing utilities for deterministic comparison.
 * Extracted from SimulationKernel for shared use by SystemEngine and server validation.
 *
 * DETERMINISM CONTRACT: These functions are pure — no side effects, no I/O, no randomness.
 */

/**
 * Recursively normalize a value for deterministic JSON serialization.
 * Sorts object keys, converts Map/Set to sorted arrays.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function normalizeForHash(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForHash(entry));
  }

  if (value instanceof Map) {
    const entries = Array.from(value.entries()).map(([key, entry]) => [
      String(key),
      normalizeForHash(entry),
    ]);
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }

  if (value instanceof Set) {
    const entries = Array.from(value.values()).map((entry) =>
      normalizeForHash(entry),
    );
    entries.sort((a, b) => String(a).localeCompare(String(b)));
    return entries;
  }

  const record = /** @type {Record<string, unknown>} */ (value);
  const keys = Object.keys(record).sort();
  const sorted = /** @type {Record<string, unknown>} */ ({});
  for (const key of keys) {
    sorted[key] = normalizeForHash(record[key]);
  }
  return sorted;
}

/**
 * DJB2 hash of a string → 8-char hex.
 *
 * @param {string} input
 * @returns {string}
 */
export function hashString(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Hash a game state snapshot for deterministic comparison.
 *
 * @param {unknown} state
 * @returns {string}
 */
export function hashState(state) {
  const normalized = normalizeForHash(state);
  return hashString(JSON.stringify(normalized));
}
