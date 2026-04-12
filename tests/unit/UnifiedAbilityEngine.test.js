import { describe, expect, it } from "@jest/globals";
import {
  buildCombatAbilitySkill,
  executeAbilityAction,
  normalizeAbilityState,
  resolveCombatAbilityMagic,
  syncPlayerAbilityState,
} from "../../packages/game-core/src/systems/abilities/UnifiedAbilityEngine.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import {
  getSkillById,
  getSkillsByClass,
} from "../../packages/game-core/src/systems/skills/SkillRegistry.js";

describe("UnifiedAbilityEngine", () => {
  it("mirrors magic into canonical abilityState", () => {
    const player = syncPlayerAbilityState(
      {
        ...initialGameState.player,
        mana: { current: 40, max: 50 },
        magic: {
          ...initialGameState.player.magic,
          mana: { current: 40, max: 50 },
          strain: { current: 12, max: 100, state: "warming" },
        },
      },
      normalizeAbilityState(initialGameState.player.abilityState, {
        player: initialGameState.player,
      }),
    );

    expect(player.abilityState.families.magic.strain.current).toBe(12);
    expect(player.abilityState.families.magic.mana.current).toBe(40);
    expect(player.magic.strain.current).toBe(12);
  });

  it("keeps preset spell costs aligned with equivalent freeform casts", () => {
    const state = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        class: "mage",
        mana: { current: 80, max: 80 },
        magic: {
          ...initialGameState.player.magic,
          mana: { current: 80, max: 80 },
        },
      },
    };
    const skill = getSkillById("mage_fireball");
    expect(skill?.magicProfile).toBeTruthy();

    const preset = resolveCombatAbilityMagic(state, skill);
    const freeform = buildCombatAbilitySkill(state, {
      type: "magic_cast",
      essences: skill.magicProfile.essences,
      form: skill.magicProfile.form,
      pattern: skill.magicProfile.pattern,
      delivery: skill.magicProfile.delivery,
      scale: skill.magicProfile.scale,
    });

    expect(preset?.ok).toBe(true);
    expect(freeform?.ok).toBe(true);
    expect(freeform.syntheticSkill.manaCost).toBe(preset.manaCost);
    expect(freeform.syntheticSkill.unifiedMagic.manaCost).toBe(preset.manaCost);
  });

  it("routes prepare/cast through abilityState and legacy mirror together", () => {
    const prepared = executeAbilityAction(
      {
        ...initialGameState,
        player: {
          ...initialGameState.player,
          class: "mage",
          mana: { current: 60, max: 60 },
          magic: {
            ...initialGameState.player.magic,
            mana: { current: 60, max: 60 },
          },
        },
      },
      {
        type: "magic_prepare",
        essence: "fire",
        form: "bolt",
        scale: 2,
      },
    );

    expect(prepared.ok).toBe(true);
    expect(prepared.state.player.abilityState.preparedDirective).toBeTruthy();
    expect(prepared.state.player.magic.prepared).toBeTruthy();

    const cast = executeAbilityAction(prepared.state, {
      type: "magic_cast",
      usePrepared: true,
    });
    expect(cast.ok).toBe(true);
    expect(cast.state.player.abilityState.preparedDirective).toBeNull();
    expect(cast.state.player.abilityState.families.magic.strain.current).toBeGreaterThan(0);
    expect(cast.state.player.magic.strain.current).toBe(
      cast.state.player.abilityState.families.magic.strain.current,
    );
  });

  it("classifies caster packs as magic-ready through engine profiles", () => {
    const casterClasses = [
      "mage",
      "battlemage",
      "cleric",
      "spellbreaker",
      "beastmaster",
      "astral_archon",
      "tempest_reveler",
      "oracle_hierophant",
    ];

    casterClasses.forEach((classId) => {
      const pool = getSkillsByClass(classId);
      const all = [...pool.active, ...pool.passive];
      const magicTagged = all.filter((skill) => skill.engineProfile?.family === "magic");
      expect(magicTagged.length).toBeGreaterThan(0);
    });
  });
});
