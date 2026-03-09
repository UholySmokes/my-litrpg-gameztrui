import { describe, expect, it } from "@jest/globals";
import { DataRegistry } from "@voidverse/game-core/data/DataRegistry.js";
import { createStudiedSpell } from "@voidverse/game-core/systems/skills/SpellStudySystem.js";
import {
  LATTICE_LOADOUT_LIMITS,
  GRANDMA_VOID_MANDATORY_REJECTION_CLAUSE,
  GRANDMA_VOID_ORIGIN,
  attachLatticeMetadata,
  dedupeLatticeProgressEvents,
  validateLatticeLoadout,
  validateLatticeRankTransition,
  validateLatticeSkillRecord,
  validateExternalAuthorityContract,
  validateLatticeProgressEvent,
} from "@voidverse/game-core/systems/skills/LivingLatticeSystem.js";
import { getRaceAbilitiesFor } from "@voidverse/game-core/systems/race/RaceAbilityRegistry.js";

describe("Living Lattice system", () => {
  it("connects magic skills to Grandma Void origin truths", () => {
    const skill = attachLatticeMetadata({
      id: "voidspark_threading",
      name: "Voidspark Threading",
      type: "active",
      class: "mage",
      ownerType: "class",
      ownerId: "mage",
      isMagic: true,
      element: "space",
      tags: ["spell", "void", "voidspark", "temporal"],
      template: {
        category: "Magic",
        function: "spell",
        source: "SpellStudySystem",
        elements: ["space", "time"],
      },
    });

    expect(skill.latticeFamily).toBe("magic");
    expect(skill.grandmaVoidBoundaryId).toBe(GRANDMA_VOID_ORIGIN.entityId);
    expect(GRANDMA_VOID_ORIGIN.loreDocument).toBe("docs/lore/VOIDVERSE_ORIGIN.md");
    expect(skill.originTruths).toEqual(
      expect.arrayContaining([
        GRANDMA_VOID_ORIGIN.firstRule,
        GRANDMA_VOID_ORIGIN.voidsparkTruth,
        GRANDMA_VOID_ORIGIN.spaceTruth,
        GRANDMA_VOID_ORIGIN.timeTruth,
      ]),
    );
  });

  it("classifies race abilities as bloodline lattice skills", () => {
    const race = DataRegistry.getRaces()[0];
    const ability = getRaceAbilitiesFor(race.id)?.[0];

    expect(ability).toBeTruthy();
    expect(ability.latticeFamily).toBe("bloodline");
    expect(ability.lattice?.sourceType).toBe("race");
    expect(ability.grandmaVoidBoundaryId).toBe("grandma_void");
  });

  it("attaches lattice metadata to studied spells", () => {
    const studiedSpell = createStudiedSpell({ level: 8, existingIds: new Set() });

    expect(studiedSpell).toBeTruthy();
    expect(studiedSpell.latticeFamily).toBe("magic");
    expect(studiedSpell.lattice?.sourceType).toBe("study");
    expect(studiedSpell.originTruths).toContain(GRANDMA_VOID_ORIGIN.firstRule);
    expect(studiedSpell.grandmaVoidBoundaryId).toBe("grandma_void");
  });

  it("rejects invalid and duplicate progress events", () => {
    const eliteFailure = validateLatticeProgressEvent({
      eventId: "evt-elite-low",
      skillId: "voidspark_threading",
      emitterId: "combat_resolution",
      encounterTemplateId: "voidling_pack",
      contextGrade: "elite",
      noveltyBucket: "new_scene",
      threatRatio: 1.05,
      outcome: "success",
    });

    expect(eliteFailure.valid).toBe(false);
    expect(eliteFailure.errors).toContain("Elite context requires threatRatio >= 1.15.");

    const residueFailure = validateLatticeProgressEvent({
      eventId: "evt-residue",
      skillId: "voidspark_threading",
      emitterId: "combat_resolution",
      encounterTemplateId: "voidling_pack",
      contextGrade: "survival",
      noveltyBucket: "new_scene",
      threatRatio: 1.5,
      outcome: "failure_survived",
      nativeMiracleResidue: true,
      sameEncounterResidue: true,
    });

    expect(residueFailure.valid).toBe(false);
    expect(residueFailure.errors).toContain(
      "Native miracle residue may not emit progress for the same encounter.",
    );

    const { accepted, rejected } = dedupeLatticeProgressEvents([
      {
        eventId: "evt-1",
        skillId: "voidspark_threading",
        emitterId: "combat_resolution",
        encounterTemplateId: "voidling_pack",
        chapterBucket: "c1",
        contextGrade: "field",
        noveltyBucket: "new_scene",
        threatRatio: 1.0,
        outcome: "success",
      },
      {
        eventId: "evt-2",
        skillId: "voidspark_threading",
        emitterId: "combat_resolution",
        encounterTemplateId: "voidling_pack",
        chapterBucket: "c1",
        contextGrade: "field",
        noveltyBucket: "repeat",
        threatRatio: 1.0,
        outcome: "success",
      },
    ], {
      chapterBucket: "c1",
    });

    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].errors).toContain(
      "progressFingerprint has already been consumed in this chapter bucket.",
    );
  });

  it("requires Grandma Void rejection clauses in external authority contracts", () => {
    const invalid = validateExternalAuthorityContract({
      contractId: "contract-missing-boundary",
      authorityId: "directive_archivist",
      miraclePayloadId: "miracle-1",
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
      rejectionClauses: [],
    }, {
      hostTolerance: 2,
      activeContracts: [],
      activeHostLockouts: [],
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain("Grandma Void rejection clause is mandatory.");

    const valid = validateExternalAuthorityContract({
      contractId: "contract-safe",
      authorityId: "directive_archivist",
      miraclePayloadId: "miracle-2",
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

    expect(valid.valid).toBe(true);
    expect(valid.resolution).toBe("apply");
  });

  it("rejects illegal lattice family/source combinations", () => {
    const result = validateLatticeSkillRecord({
      id: "illegal-bloodline-study",
      name: "Illegal Bloodline Study",
      family: "bloodline",
      sourceType: "study",
      slotType: "active",
      runtimeRole: "standard",
      rank: "seed",
      mastery: 0,
      stability: 1,
      affinityTags: ["bloodline"],
      resourceType: "mana",
      growthTriggers: ["live_use"],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Illegal family/source combination: bloodline cannot originate from study.",
    );
  });

  it("rejects impossible rank jumps and missing gate requirements", () => {
    const impossibleJump = validateLatticeRankTransition({
      fromRank: "seed",
      toRank: "knot",
      mastery: 400,
      validatedUses: 25,
      milestoneFlags: ["counter_win"],
    });
    expect(impossibleJump.valid).toBe(false);
    expect(impossibleJump.errors).toContain("Impossible rank jump from seed to knot.");

    const missingGate = validateLatticeRankTransition({
      fromRank: "knot",
      toRank: "weave",
      mastery: 470,
      milestoneFlags: ["duel_clear"],
    });
    expect(missingGate.valid).toBe(false);
    expect(missingGate.errors).toContain("Knot->Weave requires branchChoiceId or fusionRecordId.");
  });

  it("enforces reaction, concentration, ritual, and role-change loadout rules", () => {
    const invalid = validateLatticeLoadout({
      activeSkills: [
        { id: "r1", lattice: { id: "r1", slotType: "active", runtimeRole: "reaction", family: "martial", affinityTags: [] } },
        { id: "r2", lattice: { id: "r2", slotType: "active", runtimeRole: "reaction", family: "martial", affinityTags: [] } },
        { id: "r3", lattice: { id: "r3", slotType: "active", runtimeRole: "reaction", family: "martial", affinityTags: [] } },
        { id: "ritual_no_combat", lattice: { id: "ritual_no_combat", slotType: "active", runtimeRole: "ritual", family: "magic", affinityTags: [] } },
      ],
      passiveSkills: [
        { id: "stance_1", lattice: { id: "stance_1", slotType: "passive", runtimeRole: "stance", family: "martial", affinityTags: [] } },
        { id: "channel_1", lattice: { id: "channel_1", slotType: "passive", runtimeRole: "channel", family: "magic", affinityTags: [] } },
      ],
      roleChangeContext: "combat",
      requestedRoleChanges: [{ skillId: "r1", nextRole: "reaction" }],
      limits: LATTICE_LOADOUT_LIMITS,
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain("Reaction active limit exceeded (3/2).");
    expect(invalid.errors).toContain("Concentration slot limit exceeded (2/1).");
    expect(invalid.errors).toContain(
      "Ritual skills are out-of-combat unless explicitly marked combat-valid.",
    );
    expect(invalid.errors).toContain(
      "Runtime role changes require rest, loadout_swap, miracle, or contract context (received \"combat\").",
    );
  });
});
