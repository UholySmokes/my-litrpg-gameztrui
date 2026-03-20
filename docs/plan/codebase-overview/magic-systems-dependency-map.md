# Magic Systems Dependency Map

This document is the durable architecture map for the repo's two parallel magic paths:

- Combat spell skills
- Essence-weaving / ambient world magic

It is meant to complement, not replace, [research_findings_full-codebase.yaml](./research_findings_full-codebase.yaml).

## Dependency Diagram

```mermaid
flowchart LR
  subgraph Content["Spell Content Sources"]
    classPacks["Class skill packs\n*.active.json / *.passive.json"]
    universal["universal.json"]
    classAbilityData["class_abilities.json\nclass_ability_sets.json"]
    nonCombatData["non_combat.json"]
    spellStudy["SpellStudySystem.js\ncreateStudiedSpell / improveStudiedSpell"]
  end

  subgraph Registries["Runtime Skill Assembly"]
    classAbilityRegistry["ClassAbilityRegistry.js"]
    nonCombatRegistry["NonCombatSkillRegistry.js"]
    skillRegistry["SkillRegistry.js\nnormalizeSkillTemplate\ngetAllSkills / getSkillById"]
    talentDefs["TalentDefinitions.js"]
    talentManager["TalentManager.js"]
  end

  classPacks --> skillRegistry
  universal --> skillRegistry
  classAbilityData --> classAbilityRegistry --> skillRegistry
  nonCombatData --> nonCombatRegistry --> skillRegistry
  spellStudy --> skillRegistry
  talentDefs --> skillRegistry
  talentManager --> skillRegistry

  subgraph Engine["Engine Entry Path"]
    createEngine["createSystemEngine.js"]
    parser["InputParser.js"]
    validator["InputValidator.js"]
    dispatcher["ActionDispatcher.js"]
    observer["SystemEventObserver.js"]
  end

  createEngine --> parser --> validator --> dispatcher --> observer

  subgraph Combat["Combat Skill Execution"]
    reducer["gameReducer.js\nPLAYER_ATTACK / PLAYER_USE_SKILL"]
    attackHandler["attackHandler.js"]
    combat["CombatSystem.js\nplayerAttack / executeSkill"]
    manaBalance["ManaBalance.js"]
    manaSystem["ManaSystem.js"]
    effects["EffectApplicationSystem.js\nEffectSystem.js"]
  end

  parser -- "parseUseSkill()\nuse/cast <skill>" --> reducer
  reducer --> combat
  attackHandler --> combat
  skillRegistry --> combat
  combat --> manaBalance --> manaSystem
  combat --> effects

  subgraph Essence["Essence-Weaving Path"]
    essence["EssenceWeavingSystem.js"]
    stateNorm["StateNormalizer.js"]
    world["WorldDataRegistry.js"]
  end

  parser -- "parseMagic()\nmagic_* actions" --> validator
  dispatcher -- "magic_* dispatch" --> essence
  dispatcher -- "post-turn ecology tick" --> essence
  world --> stateNorm --> essence
  essence --> stateNorm
  essence --> observer
```

## How To Read This

- Combat spell content is assembled from several sources, but `SkillRegistry.js` is the runtime choke point.
- Class abilities are not first-class skills in source data; they become skill-like records after `ClassAbilityRegistry.js` normalization.
- Studied spells are generated dynamically, not loaded from JSON packs.
- Essence weaving is a parallel magic system. It enters through `parseMagic()` and `ActionDispatcher.js`, not through `SkillRegistry.js`.
- Combat spell execution converges in `CombatSystem.js`, where talent-adjusted cost/cooldown logic, mana spending, damage, reactions, and effect application happen.
- Ambient essence state is stabilized by `StateNormalizer.js` and driven by `WorldDataRegistry.js` plus `processEssenceEcologyTurn()`.

## Long-Term Maintenance Notes

- If you add a new combat spell, start with the appropriate `*.active.json` / `*.passive.json` pack or the class ability data files, then verify `SkillRegistry.js` normalization and runtime lookup.
- If you add a new studied-spell behavior, update `SpellStudySystem.js` and then verify downstream compatibility with `SkillRegistry.js` and `CombatSystem.js`.
- If you change mana or cooldown behavior, inspect all four layers together: `TalentDefinitions.js`, `TalentManager.js`, `SkillRegistry.js`, and `CombatSystem.js`.
- If you change ambient magic behavior, inspect `InputParser.js`, `InputValidator.js`, `ActionDispatcher.js`, `EssenceWeavingSystem.js`, `StateNormalizer.js`, and `WorldDataRegistry.js` as one unit.
- A known nuance worth revisiting is that `CombatSystem.js` performs a top-level raw cooldown gate before the deeper bypass-aware execution path runs.

## Source Files

- `packages/game-core/src/systems/skills/SkillRegistry.js`
- `packages/game-core/src/systems/skills/SpellStudySystem.js`
- `packages/game-core/src/systems/class/ClassAbilityRegistry.js`
- `packages/game-core/src/systems/skills/NonCombatSkillRegistry.js`
- `packages/game-core/src/systems/skills/TalentDefinitions.js`
- `packages/game-core/src/systems/skills/TalentManager.js`
- `packages/game-core/src/systems/combat/CombatSystem.js`
- `packages/game-core/src/systems/magic/ManaBalance.js`
- `packages/game-core/src/systems/magic/ManaSystem.js`
- `packages/game-core/src/systems/magic/EssenceWeavingSystem.js`
- `packages/game-core/src/core/InputParser.js`
- `packages/game-core/src/core/InputValidator.js`
- `packages/game-core/src/core/ActionDispatcher.js`
- `packages/game-core/src/core/gameReducer.js`
- `packages/game-core/src/core/actions/attackHandler.js`
- `packages/game-core/src/core/StateNormalizer.js`
- `packages/game-core/src/core/SystemEventObserver.js`
- `packages/game-core/src/world/WorldDataRegistry.js`
