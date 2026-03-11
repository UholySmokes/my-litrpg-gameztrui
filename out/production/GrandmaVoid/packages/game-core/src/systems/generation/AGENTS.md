# Generator Agent Prompt (game-core)

You are an AI coding agent responsible for the procedural content generators in:

`packages/game-core/src/systems/generation/`

**Scope**
- `NameGenerator.js`: `generateName(type?)`, `generateTitle()`
- `SkillGenerator.js`: `generateSkill(level?)`, `generateSkillSet(count?, level?)`
- `RaceGenerator.js`: `generateRace()`
- `ClassGenerator.js`: `generateClass()`
- `ContentGenerator.js`: thin aggregator exposing the above via `ContentGenerator.*`

Your job is to implement changes in this folder without breaking determinism, callers, or the overall game data conventions.

## Hard Requirements (Do Not Violate)

### 1. Deterministic randomness
- Do not use `Math.random()` directly in generator code.
- Use `../../utils/DeterministicRandom.js` (`random`, `randomInt`, `randomFloat`, `randomBool`, `randomChoice`, `shuffle`, etc.).
- Reason: the simulation bridge (`SimBridge`) can run seeded and must reproduce generator results for replays/tests.

### 2. Pure, side-effect-free generators
- No I/O, no network, no filesystem, no `Date.now()` in generator output, no global mutation.
- Generators should be referentially transparent given the PRNG stream.

### 3. Stable IDs and predictable schemas
- Generated `id` values must be:
  - lowercase
  - snake_case
  - only `[a-z0-9_]`
  - stable for a given generated `name` (or explicitly documented otherwise)
- Do not silently change output object shapes. If you must, update all callers and add tests.

## Output Schemas (Current)

These are the current shapes returned by the generators in this folder. Keep them compatible unless a task explicitly requires a migration.

### `generateName(type?) -> string`
- Returns a single fantasy-style name string.
- `type` currently supports `"celestial" | "infernal" | "primal"` (fallback uses default syllable pools).

### `generateTitle() -> string`
- Returns a two-word title string, e.g. `"Grand Mage"`.

### `generateSkill(level=1) -> object`
```js
{
  id: string,
  name: string,
  type: "active" | "buff" | "passive",
  element: string,
  description: string,
  stats: {
    damage: number,
    manaCost: number,
    cooldown: number,
    target: "single" | "aoe" | "self" | "line",
    effect: string
  },
  requirements: { level: number }
}
```

### `generateSkillSet(count=4, level=1) -> object[]`
- Array of `generateSkill(level)` results.

### `generateRace() -> object`
```js
{
  id: string,
  name: string,
  description: string,
  modifiers: { str, agi, int, const, wis, cha, luck: number },
  traits: [{ name: string, effect: object }],
  baseStats: { hp: number, mana: number }
}
```

### `generateClass() -> object`
```js
{
  id: string,
  name: string,
  archetype: string,
  description: string,
  baseStats: object,
  skills: object[],
  progression: { hpGrowth: number, manaGrowth: number }
}
```

## Integration Rules

- If you add a new generator module or export, also wire it into `ContentGenerator.js` so callers have one import surface.
- Use ESM imports with explicit `.js` extensions (project is `"type": "module"`).
- Prefer aligning new generated structures with the canonical registries where applicable:
  - Skills: `packages/game-core/src/systems/skills/SkillRegistry.js` conventions
  - Races/classes: `packages/game-core/src/data/DataRegistry.js` and underlying registries
  If you intentionally diverge (e.g., "roguelike unique rolls"), document the difference in the generator output.

## Quality Bar

When making changes:
1. Preserve determinism by using the deterministic RNG helpers.
2. Keep code small and readable. Put tunable tables (elements, forms, traits, archetypes) near the top.
3. Add minimal Jest tests if behavior is non-trivial (e.g., schema validation, id sanitization, deterministic output under seeded `SimBridge`).
4. Prefer the repo fast gate npm run check (see docs/WORKFLOW.md) before handoff.
5. If you only need a targeted pass for generator work, run npm run lint + npm run test:smoke; when touching registry-backed content, also run npm run validate:registries and npm run validate:archetypes.

## Guardrails

- Avoid hardcoding "balance constants" deep in logic. If you introduce tuning knobs, group them into clearly named constants or accept an `options` param (while keeping old call signatures working).
- Defensive defaults: treat missing/empty arrays as "no choice" and return sane fallbacks rather than throwing unless a task demands strictness.
