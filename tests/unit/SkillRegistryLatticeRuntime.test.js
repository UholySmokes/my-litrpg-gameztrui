import { describe, expect, it } from "@jest/globals";
import {
  advanceSkillNativeMiracle,
  getAllSkills,
  getLatticeBuildPressureForLoadout,
  getLatticeLoadoutSummary,
  getModifiedSkill,
  getNativeMiracleState,
  processSkillProgressEvents,
  validateSkillContractMiracle,
  validateSkillProgressEvent,
} from "@voidverse/game-core/systems/skills/SkillRegistry.js";
import { GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE } from "@voidverse/game-core/systems/skills/LivingLatticeSystem.js";

describe("SkillRegistry lattice runtime helpers", () => {
  it("preserves lattice metadata on talent-modified skills", () => {
    const baseSkill = getAllSkills().find((skill) => skill.type === "active");
    expect(baseSkill?.id).toBeTruthy();

    const modified = getModifiedSkill(baseSkill.id, ["arcane_focus"], 10);
    expect(modified?.id).toBe(baseSkill.id);
    expect(modified?.lattice?.id).toBe(baseSkill.id);
    expect(modified?.latticeFamily).toBe(baseSkill.latticeFamily);
    expect(modified?.grandmaVoidBoundaryId).toBe("grandma_void");
    expect(modified?.activeTalentMigrationLanes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "arcane_focus",
          lane: "persistent_lattice_modifier",
        }),
      ]),
    );
  });

  it("builds loadout summaries and pressure from live skills", () => {
    const activeSkills = getAllSkills().filter((skill) => skill.type === "active").slice(0, 3);
    const passiveSkills = getAllSkills().filter((skill) => skill.type === "passive").slice(0, 2);
    expect(activeSkills.length).toBeGreaterThan(0);
    expect(passiveSkills.length).toBeGreaterThan(0);

    const summary = getLatticeLoadoutSummary({
      activeSkills,
      passiveSkills,
      professionId: "blacksmith",
    });
    const pressure = getLatticeBuildPressureForLoadout({
      activeSkills,
      passiveSkills,
      professionId: "blacksmith",
      nativeMiracleUsedRecently: true,
    });

    expect(summary.activeSkillIds).toHaveLength(activeSkills.length);
    expect(summary.passiveSkillIds).toHaveLength(passiveSkills.length);
    expect(summary.professionFocusId).toBe("blacksmith");
    expect(pressure.loadout.professionFocusId).toBe("blacksmith");
    expect(pressure.buildPressure.resolutionOrder).toEqual(["saturation", "resonance"]);
    expect(typeof pressure.buildPressure.finalMultiplier).toBe("number");
  });

  it("validates and processes deterministic progress events", () => {
    const skill = getAllSkills().find((entry) => entry.type === "active");
    expect(skill?.id).toBeTruthy();

    const validEvent = validateSkillProgressEvent({
      eventId: "evt-runtime-1",
      skillId: skill.id,
      emitterId: "combat_resolution",
      encounterTemplateId: "voidling_pack",
      chapterBucket: "chapter-1",
      contextGrade: "field",
      noveltyBucket: "new_scene",
      threatRatio: 1,
      outcome: "success",
    });

    expect(validEvent.valid).toBe(true);
    expect(validEvent.skill?.id).toBe(skill.id);
    expect(validEvent.masteryGain).toBeGreaterThan(0);

    const invalidEvent = validateSkillProgressEvent({
      eventId: "evt-runtime-unknown",
      skillId: "missing_skill",
      emitterId: "combat_resolution",
      encounterTemplateId: "voidling_pack",
    });

    expect(invalidEvent.valid).toBe(false);
    expect(invalidEvent.errors[0]).toContain("Unknown skillId");

    const processed = processSkillProgressEvents([
      {
        eventId: "evt-runtime-2",
        skillId: skill.id,
        emitterId: "combat_resolution",
        encounterTemplateId: "voidling_pack",
        chapterBucket: "chapter-1",
        contextGrade: "field",
        noveltyBucket: "new_scene",
        threatRatio: 1,
        outcome: "success",
      },
      {
        eventId: "evt-runtime-3",
        skillId: skill.id,
        emitterId: "combat_resolution",
        encounterTemplateId: "voidling_pack",
        chapterBucket: "chapter-1",
        contextGrade: "field",
        noveltyBucket: "repeat",
        threatRatio: 1,
        outcome: "success",
      },
    ], {
      chapterBucket: "chapter-1",
    });

    expect(processed.accepted).toHaveLength(1);
    expect(processed.rejected).toHaveLength(1);
    expect(processed.accepted[0].masteryGain).toBeGreaterThan(0);
  });

  it("proxies contract miracle and native miracle helpers through the skill registry", () => {
    const contract = validateSkillContractMiracle({
      contractId: "contract-runtime-1",
      authorityId: "directive_archivist",
      miraclePayloadId: "miracle-runtime-1",
      payloadTier: 1,
      grantType: "inject",
      scope: "self",
      duration: "one_turn",
      maxConcurrentContracts: 1,
      overrideFlags: ["burst"],
      exclusiveOverrideTags: ["miracle_burst"],
      collisionPolicy: "reject",
      hostLockout: ["miracle_chain"],
      costOwner: "directive-engine",
      aftershockOwner: "directive-engine",
      rejectionClauses: [GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE],
    }, {
      hostTolerance: 2,
      activeContracts: [],
      activeHostLockouts: [],
    });

    expect(contract.valid).toBe(true);
    expect(contract.resolution).toBe("apply");

    const nativeMiracle = getNativeMiracleState({
      id: "miracle_native_1",
      trigger: "near_death",
      eligibility: ["bloodline_crisis"],
      effectWindow: "one_turn",
      strain: 10,
      aftershock: ["exhausted"],
      scar: ["void_shiver"],
    });
    const advanced = advanceSkillNativeMiracle(nativeMiracle, {
      survivedActivation: true,
      acceptedAftershock: true,
      crisisTags: ["bloodline_crisis", "voidspark_attuned"],
    });

    expect(nativeMiracle.id).toBe("miracle_native_1");
    expect(advanced.survivedActivations).toBe(1);
    expect(advanced.aftershockAcceptedCount).toBe(1);
    expect(advanced.crisisTagMatchCount).toBe(2);
  });
});
