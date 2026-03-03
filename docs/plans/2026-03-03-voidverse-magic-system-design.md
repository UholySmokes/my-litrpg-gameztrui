# Voidverse Magic System — Design (Staged Rollout)

**Date:** 2026-03-03

## Goals
- Define a **distinct Voidverse magic system** that fits an AI-narrated LitRPG structure.
- Keep compatibility with the existing **skills/abilities JSON model** (costs, elements, effects).
- Ship in **phases**:
  1) Lore + narrative rules (no engine changes)
  2) Data mapping (tags/elements/synergies/prereqs)
  3) Engine + data (true `void` element/resource + minimal UI support)

## Core Lore Premise (Canon)
- **The Void** is the oldest thing: a conscious, good-natured presence.
- Personality: **a warm “grandmother”** to all existence — because everything else is younger.
- **Void-energy is too pure** for most vessels; direct exposure is lethal or unmaking.
- As a result, the Void cannot “gift” power freely; it must be **diluted, filtered, or earned** (voidspark, artifacts, lineage, rites).

## Design Constraints From Current Codebase
- Combat engine recognizes `costType` values like `mana`, `rage`, `chi`, `energy`, `focus`, `shards`, `hp`, `none`.
- Elemental reactions exist for a known set (e.g., `fire`, `ice`, `lightning`, `nature`, `holy`, `dark`, etc.).
- A broader **essence model** already exists (Spell Study + Essence Weaving) including `space` (with `void` alias) and `time`.
- Skill gating exists via `unlockConditions.skillPrerequisites` on skills (universal/profession).

## Phase 1 — Lore + Starter Story (No Engine Changes)
- Add a canonical origin text: **Beginning of the Void → life → magic**.
- Update Voidverse starter scenes to seed:
  - The Void’s “grandma” tone (protective, amused, patient).
  - The purity constraint (power hurts if taken raw).
  - The concept of **voidspark** as a survivable “starter seed”.

## Phase 2 — Data Mapping (No Engine Changes)
- Add `skill_voidspark` as a **passive** skill.
- Use it as the prerequisite gate for Void-techniques by using `unlockConditions.skillPrerequisites` on new/updated skills.
- Map Void identity onto existing fields (no new UI/engine requirements):
  - `template.elements` includes `space` (and/or `void` tag)
  - `template.synergies` explains combos and narrative rules
  - `tags` includes `void`, `essence_space`, `voidspark`

## Phase 3 — Engine + Data (True Void Resource + Element)
- Add `costType: "void"` support end-to-end:
  - resource read/write/spend in combat
  - regeneration rules (slow drip + artifact modifiers)
- Add `damage.element: "void"` and minimal reaction rules.
- Add minimal UI display only when relevant.

## Content Hygiene / Fit Audit
- Introduce an automated report that lists:
  - magic-like skills/abilities
  - items with missing/odd metadata
  - items that look out-of-tone for Voidverse, flagged for **rewrite or deprecation**
- Prefer **soft deprecation** (remove from unlock pools/sets) before hard deletion to avoid breaking references.
