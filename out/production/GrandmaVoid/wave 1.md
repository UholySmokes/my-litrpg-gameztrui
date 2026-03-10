# Wave 1 Implementation Guide: Foundations

## Overview

Wave 1 establishes the foundational infrastructure for all subsequent waves. This wave focuses on data organization, validation, and UI styling architecture.

**Estimated Effort:** 3-5 days
**Risk Level:** Medium (archetype split requires careful handling)
**Dependencies:** None

---

## Task 3.1: Split Archetype Monolith into Per-Category JSON Files

### Current State
- **File:** `packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js`
- **Size:** 4,237 lines
- **Structure:** Single `ARCHETYPE_DEFINITIONS` array with ~60+ archetype objects
- **Workspace:** The `src/systems/archetype/` files are back-compat shims that re-export from `@voidverse/game-core`

### Implementation Steps

#### Step 1.1: Create Directory Structure
```bash
mkdir -p packages/game-core/src/data/archetypes
```

#### Step 1.2: Create Migration Script

**File:** `scripts/migrate-archetypes-to-json.mjs`

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_FILE = join(process.cwd(), 'packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js');
const OUTPUT_DIR = join(process.cwd(), 'packages/game-core/src/data/archetypes');

// Read the source file
const sourceCode = readFileSync(INPUT_FILE, 'utf-8');

// Extract the ARCHETYPE_DEFINITIONS array
const match = sourceCode.match(/export let ARCHETYPE_DEFINITIONS\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find ARCHETYPE_DEFINITIONS array');
  process.exit(1);
}

const definitions = JSON.parse(match[1]);

// Group by category
const categories = {
  System: [],
  Authority: [],
  Path: [],
  Framework: [],
  Privilege: [],
  Overlay: []
};

definitions.forEach(def => {
  const category = def.category || 'System';
  if (categories[category]) {
    categories[category].push(def);
  } else {
    console.warn(`Unknown category: ${category}, defaulting to System`);
    categories.System.push(def);
  }
});

// Write category files
const categoryFileMap = {
  System: 'systems.json',
  Authority: 'authorities.json',
  Path: 'paths.json',
  Framework: 'frameworks.json',
  Privilege: 'privileges.json',
  Overlay: 'overlays.json'
};

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [category, archetypes] of Object.entries(categories)) {
  const filename = categoryFileMap[category];
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, JSON.stringify(archetypes, null, 2), 'utf-8');
  console.log(`✓ Wrote ${archetypes.length} archetypes to ${filename}`);
}

console.log('\n✅ Migration complete!');
```

#### Step 1.3: Update ArchetypeSystemRegistry.js

**File:** `packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js`

```javascript
import systemsData from '../../data/archetypes/systems.json' assert { type: 'json' };
import authoritiesData from '../../data/archetypes/authorities.json' assert { type: 'json' };
import pathsData from '../../data/archetypes/paths.json' assert { type: 'json' };
import frameworksData from '../../data/archetypes/frameworks.json' assert { type: 'json' };
import privilegesData from '../../data/archetypes/privileges.json' assert { type: 'json' };
import overlaysData from '../../data/archetypes/overlays.json' assert { type: 'json' };

class ArchetypeSystem {
  constructor(data) {
    Object.assign(this, data);
  }

  build(context = {}) {
    let integrity = 100;
    switch (this.category) {
      case "System": integrity = 100; break;
      case "Authority": integrity = 95; break;
      case "Path": integrity = 92; break;
      case "Framework": integrity = 90; break;
      default: integrity = 85;
    }
    return {
      archetypeId: this.id,
      name: this.name,
      category: this.category,
      active: true,
      systemIntegrity: integrity,
      state: { ...context },
      definition: this
    };
  }

  applyBonuses(profile, integrity) {
    if (integrity >= 100) {
      profile.attributes.intelligence += 5;
      profile.derivedStats.mp += 20;
    } else if (integrity < 90) {
      profile.attributes.strength += 8;
      profile.attributes.vitality -= 2;
    }
  }
}

export let ARCHETYPE_DEFINITIONS = [
  ...systemsData,
  ...authoritiesData,
  ...pathsData,
  ...frameworksData,
  ...privilegesData,
  ...overlaysData
];

export let ARCHETYPE_SYSTEMS = ARCHETYPE_DEFINITIONS.map(def => new ArchetypeSystem(def));

export function getArchetypeSystemById(id) {
  return ARCHETYPE_SYSTEMS.find(system => system.id === id) || null;
}

export function getArchetypeSystemsByCategory(category) {
  return ARCHETYPE_SYSTEMS.filter(system => system.category === category);
}

export function getAllArchetypeSystems() {
  return ARCHETYPE_SYSTEMS;
}
```

#### Step 1.4: Run Migration
```bash
node scripts/migrate-archetypes-to-json.mjs
npm test
npm run build
```

### Validation Checklist
- [ ] All 6 JSON files created in `packages/game-core/src/data/archetypes/`
- [ ] Each JSON file contains only archetypes of its category
- [ ] Total archetype count matches original (~60+)
- [ ] `ARCHETYPE_DEFINITIONS` array loads all archetypes correctly
- [ ] `getArchetypeSystemById()` returns correct archetypes
- [ ] `getArchetypeSystemsByCategory()` returns correct subsets
- [ ] All existing tests pass
- [ ] Build succeeds without errors
- [ ] Back-compat shims in `src/systems/archetype/` still work

---

## Task 3.2: Add Schema Validation for Archetype Definitions

### Implementation Steps

#### Step 2.1: Install Validation Library
```bash
npm install zod --save
```

#### Step 2.2: Create Archetype Schema

**File:** `packages/game-core/src/systems/archetype/archetypeSchema.js`

```javascript
import { z } from 'zod';

/**
 * Zod schema for validating archetype definitions
 * Ensures data quality and consistency across all archetype entries
 */

export const ArchetypeSchema = z.object({
  id: z.string()
    .min(1, "ID is required")
    .regex(/^[a-z_]+$/, "ID must be lowercase snake_case"),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),

  category: z.enum(["System", "Authority", "Path", "Framework", "Privilege", "Overlay"], {
    errorMap: () => ({ message: "Category must be one of: System, Authority, Path, Framework, Privilege, Overlay" })
  }),

  summary: z.string()
    .min(1, "Summary is required")
    .max(80, "Summary must be 80 characters or less"),

  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less"),

  coreLoop: z.array(z.string()
    .min(1, "Core loop item cannot be empty")
    .max(120, "Core loop item must be 120 characters or less")
  )
    .min(3, "Core loop must have at least 3 items")
    .max(5, "Core loop must have at most 5 items"),

  progression: z.array(z.string()
    .min(1, "Progression item cannot be empty")
    .max(120, "Progression item must be 120 characters or less")
  )
    .min(3, "Progression must have at least 3 items")
    .max(5, "Progression must have at most 5 items"),

  narrativeHooks: z.array(z.string()
    .min(1, "Narrative hook cannot be empty")
    .max(120, "Narrative hook must be 120 characters or less")
  )
    .min(2, "Narrative hooks must have at least 2 items")
    .max(4, "Narrative hooks must have at most 4 items"),

  questHooks: z.array(z.string()
    .min(1, "Quest hook cannot be empty")
    .max(120, "Quest hook must be 120 characters or less")
  )
    .min(2, "Quest hooks must have at least 2 items")
    .max(4, "Quest hooks must have at most 4 items"),

  tags: z.array(z.string()
    .min(1, "Tag cannot be empty")
    .regex(/^[a-z-]+$/, "Tag must be lowercase with hyphens")
  )
    .min(2, "Tags must have at least 2 items")
    .max(6, "Tags must have at most 6 items")
});

export type ArchetypeDefinition = z.infer<typeof ArchetypeSchema>;

/**
 * Validates a single archetype definition
 * @param {Object} archetype - The archetype to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateArchetype(archetype) {
  const result = ArchetypeSchema.safeParse(archetype);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(err =>
    `${err.path.join('.')}: ${err.message}`
  );

  return { valid: false, errors };
}

/**
 * Validates an array of archetype definitions
 * @param {Array} archetypes - Array of archetypes to validate
 * @returns {Object} { valid: boolean, errors: Object, total: number, validCount: number }
 */
export function validateArchetypes(archetypes) {
  const errors = {};
  let validCount = 0;

  archetypes.forEach((archetype, index) => {
    const result = validateArchetype(archetype);
    if (result.valid) {
      validCount++;
    } else {
      errors[archetype.id || `index_${index}`] = result.errors;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    total: archetypes.length,
    validCount
  };
}
```

#### Step 2.3: Create Validation Script

**File:** `scripts/validate-archetypes.mjs`

```javascript
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateArchetypes } from '../packages/game-core/src/systems/archetype/archetypeSchema.js';

const DATA_DIR = join(process.cwd(), 'packages/game-core/src/data/archetypes');

const categoryFiles = [
  'systems.json',
  'authorities.json',
  'paths.json',
  'frameworks.json',
  'privileges.json',
  'overlays.json'
];

let totalArchetypes = 0;
let totalValid = 0;
let hasErrors = false;

console.log('🔍 Validating archetype definitions...\n');

for (const filename of categoryFiles) {
  const filepath = join(DATA_DIR, filename);
  const content = readFileSync(filepath, 'utf-8');
  const archetypes = JSON.parse(content);

  const result = validateArchetypes(archetypes);

  totalArchetypes += result.total;
  totalValid += result.validCount;

  if (result.valid) {
    console.log(`✅ ${filename}: ${result.total} archetypes valid`);
  } else {
    hasErrors = true;
    console.log(`❌ ${filename}: ${result.validCount}/${result.total} valid`);

    for (const [id, errors] of Object.entries(result.errors)) {
      console.log(`   ${id}:`);
      errors.forEach(err => console.log(`     - ${err}`));
    }
  }
}

console.log(`\n📊 Summary: ${totalValid}/${totalArchetypes} archetypes valid`);

if (hasErrors) {
  console.log('\n❌ Validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ All archetypes valid!');
  process.exit(0);
}
```

#### Step 2.4: Add to package.json Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "validate:archetypes": "node scripts/validate-archetypes.mjs"
  }
}
```

#### Step 2.5: Run Validation
```bash
npm run validate:archetypes
```

### Validation Checklist
- [ ] Zod schema created with all constraints
- [ ] Validation script created
- [ ] Script added to package.json
- [ ] Validation runs successfully
- [ ] Errors are reported clearly for invalid entries
- [ ] Script exits with code 1 on validation failure

---

## Task 3.3: Curate Lower-Quality Archetype Entries

### Current State
Based on the validation from Task 3.2, later entries (after `instant_comprehension`, `omniscient_archive`, etc.) have:
- Paragraph-length descriptions stuffed into `coreLoop`, `progression`, `narrativeHooks` fields
- Generic quest hooks like "Secure a key resource that stabilizes the X"
- Summaries exceeding 80 characters

### Implementation Steps

#### Step 3.1: Identify Problematic Entries
```bash
npm run validate:archetypes 2> validation-errors.txt
```

#### Step 3.2: Curate Each Problematic Entry

For each failing archetype, rewrite to match the quality bar of early entries like `revival_archive` and `fate_selection_engine`.

**Example Fix - `clone_legion`:**

**Before (Invalid):**
```json
{
  "id": "clone_legion",
  "name": "Clone Legion (Self-Duplication)",
  "category": "System",
  "summary": "The character can create clones or copies of themselves, each fully capable and contributing to growth.",
  "description": "The character can create clones or copies of themselves, each fully capable and contributing to growth. The system might treat the clones as temporary or semi-permanent allies, but crucially, anything they experience (XP gained, skills practiced) merges back with the original. That means the MC can effectively be in multiple places doing multiple training or missions at once and then consolidate gains. Progression can allow more clones (start with 1 extra, later 5, eventually dozens) and more durable clones (early ones may pop after one hit, later they're as tough as the original). The flavor leans towards ninja techniques (shadow clone jutsu style) or high-level magic (mirror image but real). It could also be scientific (sci-fi nanotech duplication, if the setting flexes that far). This cheat creates abilities by sheer parallel effort: for example, to learn a difficult spell, 10 clones practice it and the knowledge pools, achieving mastery in 1/10th the time. In battle, clones can flank, distract, or overwhelm enemies through sheer numbers.",
  "coreLoop": [
    "The character can create clones or copies of themselves, each fully capable and contributing to growth.",
    "That means the MC can effectively be in multiple places doing multiple training or missions at once and then consolidate gains.",
    "Progression can allow more clones and more durable clones."
  ],
  "progression": [
    "The system might treat the clones as temporary or semi-permanent allies, but crucially, anything they experience merges back with the original.",
    "It could also be scientific.",
    "This cheat creates abilities by sheer parallel effort: for example, to learn a difficult spell, 10 clones practice it and the knowledge pools, achieving mastery in 1/10th the time."
  ],
  "narrativeHooks": [
    "The flavor leans towards ninja techniques or high-level magic.",
    "Rarity: Real cloning of a whole person is extremely rare or a forbidden spell due to obvious advantage.",
    "Perhaps a secret technique from an ancient hero known to be unbeatable because they literally were a one-man army."
  ],
  "questHooks": [
    "Secure a key resource that stabilizes the Clone Legion and removes its main limitation.",
    "Defeat a rival who wields a competing version of the Clone Legion.",
    "Use the Clone Legion to resolve a crisis ordinary powers cannot solve."
  ],
  "tags": ["clone", "summoning-companion", "system", "archetype"]
}
```

**After (Valid):**
```json
{
  "id": "clone_legion",
  "name": "Clone Legion",
  "category": "System",
  "summary": "Create autonomous clones that merge XP and skills back to you.",
  "description": "A forbidden duplication technique that lets you manifest autonomous clones. Each clone acts independently, gaining XP and practicing skills that merge back to your original self upon dismissal. Start with one fragile clone; progress to dozens of durable duplicates. The flavor draws from shadow clone jutsu or high-level mirror image magic.",
  "coreLoop": [
    "Manifest clones to explore, train, or fight in parallel.",
    "Clones gain XP and skills independently; merge to consolidate gains.",
    "Dismiss clones to absorb their experiences into your original self."
  ],
  "progression": [
    "Increase clone count from 1 to dozens as you master the technique.",
    "Strengthen clone durability from one-hit wonders to near-equals.",
    "Unlock hive-mind coordination for tactical combat advantages."
  ],
  "narrativeHooks": [
    "Forbidden technique: authorities hunt clone users as abominations.",
    "Clones develop independent personalities over time, creating internal conflict.",
    "Ancient heroes used this to become one-man armies; their echoes linger."
  ],
  "questHooks": [
    "Steal the forbidden scroll from a monastery that guards the clone technique.",
    "A rival clone master challenges you to a battle of armies.",
    "Your clones begin refusing to merge, demanding independence."
  ],
  "tags": ["clone", "summoning", "parallel", "forbidden", "tactical"]
}
```

#### Step 3.3: Validation Checklist for Each Entry
For each curated archetype, verify:
- [ ] Summary ≤ 80 characters
- [ ] Description ≤ 500 characters
- [ ] Each coreLoop item ≤ 120 characters
- [ ] Each progression item ≤ 120 characters
- [ ] Each narrativeHook ≤ 120 characters
- [ ] Each questHook is unique and specific (not generic "Secure a key resource")
- [ ] Tags are lowercase with hyphens
- [ ] Content is concise and evocative

#### Step 3.4: Re-run Validation
```bash
npm run validate:archetypes
# Should now pass with 0 errors
```

---

## Task 2.1: Extract Inline Styles to CSS Modules

### Current State
- All panels use inline `style={{}}` objects
- Design tokens already exist in `src/index.css`
- No CSS modules currently exist
- Panels: `VitalsPanel`, `CommandTerminalPanel`, `NarrativeHubPanel`, `ActionSuggestionsPanel`, and 8 creation panels

### Implementation Steps

#### Step 4.1: Extend Design Tokens

**File:** `src/index.css`

```css
:root {
  /* Existing tokens... */

  /* NEW: Spacing System */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */

  /* NEW: Typography Scale */
  --text-xs: 0.65rem;       /* 10.4px */
  --text-sm: 0.75rem;       /* 12px */
  --text-base: 0.875rem;    /* 14px */
  --text-lg: 1rem;          /* 16px */
  --text-xl: 1.125rem;      /* 18px */
  --text-2xl: 1.25rem;      /* 20px */
  --text-3xl: 1.5rem;       /* 24px */

  /* NEW: Border Radius Scale */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* NEW: Opacity Scale */
  --opacity-dim: 0.65;
  --opacity-subtle: 0.85;
  --opacity-full: 1;
}
```

#### Step 4.2: Create CSS Module for CommandTerminalPanel

**File:** `src/ui/panels/CommandTerminalPanel.module.css`

```css
.commandDeck {
  display: flex;
  gap: var(--spacing-sm);
}

.inputField {
  flex: 1;
  background: rgba(5, 16, 26, 0.6);
  border: 1px solid rgba(0, 243, 255, 0.22);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-family: var(--font-code);
  font-size: var(--text-base);
  padding: var(--spacing-sm) var(--spacing-md);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.inputField::placeholder {
  color: var(--text-dim);
}

.inputField:focus {
  border-color: var(--holo-cyan);
  box-shadow: var(--glow-subtle);
}

.inputField:disabled {
  opacity: var(--opacity-dim);
  cursor: not-allowed;
}

.submitButton {
  background: var(--button-bg);
  border: 1px solid var(--holo-cyan);
  border-radius: var(--radius-md);
  color: var(--holo-cyan);
  font-family: var(--font-hud);
  font-size: var(--text-sm);
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.submitButton:hover:not(:disabled) {
  background: rgba(0, 243, 255, 0.15);
  box-shadow: var(--glow-subtle);
}

.submitButton:disabled {
  opacity: var(--opacity-dim);
  cursor: not-allowed;
}
```

**Update:** `src/ui/panels/CommandTerminalPanel.jsx`

```jsx
import styles from './CommandTerminalPanel.module.css';

export default function CommandTerminalPanel({
  userInput,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
}) {
  return (
    <form onSubmit={onSubmit} className={styles.commandDeck}>
      <input
        ref={inputRef}
        type="text"
        className={styles.inputField}
        placeholder="Enter command..."
        value={userInput}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={isLoading}
      />
      <button className={styles.submitButton} type="submit" disabled={isLoading}>
        {isLoading ? "..." : "[EXECUTE]"}
      </button>
    </form>
  );
}
```

#### Step 4.3: Create CSS Module for ActionSuggestionsPanel

**File:** `src/ui/panels/ActionSuggestionsPanel.module.css`

```css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.emptyState {
  color: var(--text-dim);
  font-size: var(--text-sm);
  padding: var(--spacing-md);
  text-align: center;
}

.suggestionButton {
  background: var(--button-bg);
  border: 1px solid rgba(0, 243, 255, 0.15);
  border-radius: var(--radius-md);
  color: var(--text-main);
  font-family: var(--font-text);
  font-size: var(--text-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.suggestionButton:hover {
  background: rgba(0, 243, 255, 0.12);
  border-color: rgba(0, 243, 255, 0.3);
  box-shadow: var(--glow-subtle);
}

/* Weight-based visual emphasis */
.suggestionButton[data-weight="high"] {
  border-color: var(--holo-cyan);
  font-weight: 600;
}

.suggestionButton[data-weight="medium"] {
  opacity: var(--opacity-subtle);
}

.suggestionButton[data-weight="low"] {
  opacity: var(--opacity-dim);
}
```

**Update:** `src/ui/panels/ActionSuggestionsPanel.jsx`

```jsx
import styles from './ActionSuggestionsPanel.module.css';

export default function ActionSuggestionsPanel({ suggestions = [], onSelect }) {
  if (!suggestions.length) {
    return <div className={styles.emptyState}>No suggestions yet.</div>;
  }

  const getWeightLevel = (weight) => {
    if (weight >= 0.9) return 'high';
    if (weight >= 0.7) return 'medium';
    return 'low';
  };

  return (
    <div className={styles.container}>
      {suggestions.map((suggestion, index) => {
        const label =
          typeof suggestion === 'string'
            ? suggestion
            : suggestion?.t || suggestion?.text || '';
        const weight = typeof suggestion === 'object' ? suggestion?.w : 1;

        return (
          <button
            key={`${label}-${index}`}
            className={styles.suggestionButton}
            type="button"
            onClick={() => onSelect?.(label)}
            data-weight={getWeightLevel(weight)}
            style={Number.isFinite(weight) ? { opacity: weight } : undefined}
          >
            {label || 'Action'}
          </button>
        );
      })}
    </div>
  );
}
```

#### Step 4.4: Create CSS Module for CreationArchetypeSystemPanel

**File:** `src/ui/panels/creation/CreationArchetypeSystemPanel.module.css`

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.header {
  color: var(--holo-cyan);
  font-family: var(--font-hud);
  font-size: var(--text-xl);
  text-transform: uppercase;
  letter-spacing: 3px;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-dim);
}

.systemsList {
  display: grid;
  gap: var(--spacing-sm);
  max-height: 260px;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

/* Custom scrollbar */
.systemsList::-webkit-scrollbar {
  width: 6px;
}

.systemsList::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-sm);
}

.systemsList::-webkit-scrollbar-thumb {
  background: rgba(0, 243, 255, 0.3);
  border-radius: var(--radius-sm);
}

.systemsList::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 243, 255, 0.5);
}

.systemButton {
  padding: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(0, 243, 255, 0.3);
  border-radius: var(--radius-md);
  color: var(--holo-cyan);
  font-family: var(--font-code);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.systemButton:hover {
  background: rgba(0, 243, 255, 0.1);
  border-color: rgba(0, 243, 255, 0.5);
}

.systemButton.selected {
  background: rgba(0, 243, 255, 0.3);
  border-color: var(--holo-cyan);
  box-shadow: var(--glow-subtle);
}

.systemButtonHeader {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  font-weight: 600;
}

.systemButtonCategory {
  color: var(--holo-gold);
  font-size: var(--text-xs);
}

.systemButtonSummary {
  font-size: var(--text-xs);
  opacity: var(--opacity-subtle);
}

.noSystems {
  font-size: var(--text-sm);
  color: var(--text-dim);
  padding: var(--spacing-md);
  text-align: center;
}

.detailsPanel {
  border: 1px solid rgba(0, 243, 255, 0.2);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  gap: var(--spacing-xs);
  font-size: var(--text-sm);
  color: var(--text-main);
}

.detailsLabel {
  color: var(--holo-gold);
  font-weight: 600;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detailsContent {
  line-height: 1.4;
}
```

**Update:** `src/ui/panels/creation/CreationArchetypeSystemPanel.jsx`

```jsx
import styles from './CreationArchetypeSystemPanel.module.css';

export default function CreationArchetypeSystemPanel({
  systems,
  selectedSystem,
  onSystemSelect,
  onAction,
}) {
  const selectedId = selectedSystem?.id || selectedSystem;
  const selectedEntry =
    selectedSystem ||
    (systems || []).find((system) => system.id === selectedId) ||
    null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>Archetype System</div>
      <div className={styles.subtitle}>
        Choose one system, authority, privilege, framework, or path.
      </div>
      <div className={styles.systemsList}>
        {(systems || []).map((system) => {
          const isSelected = system.id === selectedId;
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => onAction?.(() => onSystemSelect(system.id))}
              className={`${styles.systemButton} ${isSelected ? styles.selected : ''}`}
            >
              <div className={styles.systemButtonHeader}>
                <span>{system.name}</span>
                <span className={styles.systemButtonCategory}>
                  {system.category}
                </span>
              </div>
              <div className={styles.systemButtonSummary}>
                {system.summary || system.description}
              </div>
            </button>
          );
        })}
        {(systems || []).length === 0 && (
          <div className={styles.noSystems}>No systems available.</div>
        )}
      </div>
      {selectedEntry && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsLabel}>CORE LOOP</div>
          <div className={styles.detailsContent}>
            {(selectedEntry.coreLoop || []).join(' ')}
          </div>
          <div className={styles.detailsLabel}>PROGRESSION</div>
          <div className={styles.detailsContent}>
            {(selectedEntry.progression || []).join(' ')}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 4.5: Migrate Remaining Panels

Create CSS modules for:
- [ ] `VitalsPanel.jsx` → `VitalsPanel.module.css`
- [ ] `NarrativeHubPanel.jsx` → `NarrativeHubPanel.module.css`
- [ ] `CreationIdentityPanel.jsx` → `CreationIdentityPanel.module.css`
- [ ] `CreationRacePanel.jsx` → `CreationRacePanel.module.css`
- [ ] `CreationClassPanel.jsx` → `CreationClassPanel.module.css`
- [ ] `CreationAttributesPanel.jsx` → `CreationAttributesPanel.module.css`
- [ ] `CreationSkillsPanel.jsx` → `CreationSkillsPanel.module.css`
- [ ] `CreationTalentPanel.jsx` → `CreationTalentPanel.module.css`
- [ ] `CreationSummaryPanel.jsx` → `CreationSummaryPanel.module.css`

#### Step 4.6: Test and Verify
```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

### Validation Checklist
- [ ] Design tokens extended with spacing, typography, border radius, opacity
- [ ] CSS modules created for all panels
- [ ] Inline styles removed from all panels
- [ ] All panels use CSS module classes
- [ ] UI appearance unchanged (visual regression check)
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Dev server runs without errors

---

## Wave 1 Completion Checklist

### Task 3.1: Split Archetype Monolith
- [ ] Migration script created and tested
- [ ] 6 JSON files created in `packages/game-core/src/data/archetypes/`
- [ ] `ArchetypeSystemRegistry.js` updated to load from JSON
- [ ] All existing tests pass
- [ ] Build succeeds

### Task 3.2: Schema Validation
- [ ] Zod schema created with all constraints
- [ ] Validation script created
- [ ] Script added to package.json
- [ ] Validation runs successfully
- [ ] Errors are reported clearly for invalid entries
- [ ] Script exits with code 1 on validation failure

### Task 3.3: Curate Entries
- [ ] All failing entries identified
- [ ] All entries rewritten to pass validation
- [ ] Validation passes with 0 errors

### Task 2.1: CSS Modules
- [ ] Design tokens extended
- [ ] CSS modules created for all panels
- [ ] Inline styles removed
- [ ] UI appearance unchanged
- [ ] All tests pass

---

## Testing Strategy

```bash
# Run all tests
npm test

# Typecheck
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Validate archetypes
npm run validate:archetypes

# Start dev server for visual verification
npm run dev
```

---

## Rollback Plan

If any task fails:

### Task 3.1 Rollback
```bash
git checkout packages/game-core/src/systems/archetype/ArchetypeSystemRegistry.js
rm -rf packages/game-core/src/data/archetypes
```

### Task 3.2 Rollback
```bash
# Remove validation script from package.json
# Delete scripts/validate-archetypes.mjs
# Delete packages/game-core/src/systems/archetype/archetypeSchema.js
```

### Task 3.3 Rollback
```bash
git checkout packages/game-core/src/data/archetypes/
```

### Task 2.1 Rollback
```bash
git checkout src/ui/panels/
git checkout src/index.css
```

---

## Next Steps

After completing Wave 1, proceed to **Wave 2: Archetype Mechanics** which includes:
- Task 3.4: Add per-archetype stat modifier profiles
- Task 3.5: Add archetype resource system to player state
- Task 3.7: Add `narrativeTone` directives to archetype definitions

---

## Notes

- The workspace structure uses `@voidverse/game-core` as a package
- Files in `src/systems/archetype/` are back-compat shims
- Design tokens already exist in `src/index.css` - extend them, don't recreate
- Vite config already chunks `ArchetypeSystemRegistry.js` separately for performance
- Total archetype count is ~60+ across 6 categories
