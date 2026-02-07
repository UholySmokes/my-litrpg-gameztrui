import { parseAction } from "../core/InputParser.js";
import { validateActionComprehensive } from "../core/InputValidator.js";
import { executeAction } from "../core/ActionDispatcher.js";
import { normalizeGameState } from "../core/StateNormalizer.js";

/**
 * Minimal "SystemEngine" wrapper around the current deterministic core loop.
 *
 * Note: This is intentionally thin for Phase 1 extraction. It allows platform
 * adapters (web/tauri/engine) to share the same parse/validate/execute pipeline
 * without importing from app-specific paths.
 */
export function createSystemEngine() {
  return {
    normalizeGameState,
    parseAction,
    validateActionComprehensive,
    executeAction,
  };
}

