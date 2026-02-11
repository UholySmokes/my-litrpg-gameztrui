export type ActionType =
  | "use_item"
  | "move"
  | "rest"
  | "attack"
  | "look"
  | "inventory"
  | "status"
  | "narrative"
  | "magic_sense"
  | "magic_attune"
  | "magic_draw"
  | "magic_refine"
  | "magic_compress"
  | "magic_shape"
  | "magic_weave"
  | "magic_anchor"
  | "magic_release";

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
  | { type: "narrative" }
  | { type: "magic_sense"; essence?: string | null }
  | { type: "magic_attune"; stance: "open" | "focused" | "guarded"; essence?: string | null }
  | { type: "magic_draw"; essence: string; amount?: number | null }
  | { type: "magic_refine"; essence: string; method?: string | null; amount: number }
  | { type: "magic_compress"; essence: string; method?: string | null; tier: 0 | 1 | 2 | 3 }
  | { type: "magic_shape"; essence: string; form: string; amount?: number | null }
  | { type: "magic_weave"; essences: string[]; pattern: string }
  | { type: "magic_anchor"; kind: "self" | "area" | "item"; itemId?: string | null }
  | { type: "magic_release" };

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

