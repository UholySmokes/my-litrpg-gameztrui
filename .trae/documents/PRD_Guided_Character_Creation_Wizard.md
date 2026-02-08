## 1. Product Overview
Redesign character creation into a guided, phase-based wizard that reuses existing creation panels and outputs the exact same character payload used by the current game state.
The wizard adds an explicit Profession phase and an Archetype (System) recommendation step while preserving compatibility with existing windowed UI and reducers.

## 2. Core Features

### 2.1 User Roles
| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Player | Not required (local/offline or existing auth) | Can create a character, start the run, and access existing panels/layouts |

### 2.2 Feature Module
Our requirements consist of the following main pages:
1. **Character Creation (Guided Wizard)**: phase navigation, profession selection, archetype recommendation + selection, validation + finalize.
2. **Game Screen (Windowed UI Layout)**: unchanged gameplay panels; ensure created character loads into existing state and panels without layout regressions.

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Character Creation (Guided Wizard) | Wizard shell | Guide you through ordered phases with Next/Back, step completion states, and phase gating based on validation. |
| Character Creation (Guided Wizard) | Compatibility layer | Reuse existing creation panels (Identity/Race/Class/System/Attributes/Skills/Summary) and keep them callable/embeddable in the new shell. |
| Character Creation (Guided Wizard) | Phase: Identity | Capture name + gender; show inline errors when missing. |
| Character Creation (Guided Wizard) | Phase: Race | Let you choose race; show key bonuses/abilities; keep existing race panel behavior. |
| Character Creation (Guided Wizard) | Phase: Class | Let you choose class; show description/resource system; keep existing class panel behavior. |
| Character Creation (Guided Wizard) | Phase: Profession (NEW) | Require selecting a profession; preview tier-1 unlocks/skills; persist selection through subsequent phases. |
| Character Creation (Guided Wizard) | Phase: Archetype System (with Recommendation) | Recommend 1–3 archetype systems based on your selected race/class/profession (and optionally chosen skills/attributes), while still allowing manual browse + override selection. |
| Character Creation (Guided Wizard) | Phase: Attributes | Allocate all free points; show derived HP/Mana/resource preview; prevent finalization until points are fully allocated. |
| Character Creation (Guided Wizard) | Phase: Skills | Select exactly required active/passive skills; show compatibility filters; block Next until valid counts are met. |
| Character Creation (Guided Wizard) | Phase: Review & Finalize | Show full summary (including profession + recommended archetype rationale); finalize to produce the existing `characterData` shape consumed by game state. |
| Character Creation (Guided Wizard) | Windowed UI continuity | Preserve the right-side Narrative Memory panel and the ability to keep panels as windows (minimize/float) even while the wizard provides guidance. |
| Game Screen (Windowed UI Layout) | Load created character | On finalize, transition into game mode using the same state fields (class/race/archetype/profession/skills/attributes/resources) expected by existing panels. |
| Game Screen (Windowed UI Layout) | Panel compatibility check | Ensure HUD, status, inventory, profession UI, and narrative panels can read the created character without any schema changes. |

## 3. Core Process
**Player Flow (guided wizard):**
1) Enter Identity (name, gender) → Next.
2) Choose Race → Next.
3) Choose Class → Next.
4) Choose Profession → Next.
5) See Archetype System recommendations (with short rationale) → accept one recommended system or manually choose a different system → Next.
6) Allocate Attributes until zero points remain → Next.
7) Select required Skills (exact counts) → Next.
8) Review summary → Finalize → switch into Game Screen with existing panels and unchanged character schema.

```mermaid
graph TD
  A["Character Creation (Guided Wizard)"] --> B["Identity Phase"]
  B --> C["Race Phase"]
  C --> D["Class Phase"]
  D --> E["Profession Phase"]
  E --> F["Archetype Recommendation & Selection Phase"]
  F --> G["Attributes Phase"]
  G --> H["Skills Phase"]
  H --> I["Review & Finalize Phase"]
  I