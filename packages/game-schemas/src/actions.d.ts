export type ActionType =
  | "use_item"
  | "move"
  | "rest"
  | "attack"
  | "look"
  | "inventory"
  | "status"
  | "narrative";

// Mirrors current in-app parsed action shape (Phase 1 extraction).
export type ParsedAction =
  | { type: "use_item"; itemId: string; itemName?: string }
  | { type: "move"; targetLocation: string }
  | { type: "rest" }
  | {
      type: "attack";
      enemyIds?: string[];
      enemyIndex?: number;
      skillId?: string | null;
    }
  | { type: "look" }
  | { type: "inventory" }
  | { type: "status" }
  | { type: "narrative" };

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

