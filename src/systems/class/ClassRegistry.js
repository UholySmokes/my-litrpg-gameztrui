// =================================================================
// CLASS REGISTRY SHIM
// Legacy shim re-exporting data from the central DataRegistry
// =================================================================

import { DataRegistry } from "../../data/DataRegistry.js";

// Legacy shim so existing imports continue to work while DataRegistry becomes
// the single source of truth for class data. Consumers should migrate to
// `DataRegistry` directly, but these helpers keep backward compatibility.

export function getClassById(id) {
  return DataRegistry.getClassById(id);
}

export function getClasses() {
  return DataRegistry.getClasses();
}

// Lazy evaluation to avoid top-level circular dependency
export const classes = getClasses();
