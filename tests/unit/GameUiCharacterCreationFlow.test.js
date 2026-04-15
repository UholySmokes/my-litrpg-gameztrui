import { describe, expect, it } from "@jest/globals";
import { buildCharacterCreationState } from "../../src/components/gameui/useGameUiCharacterCreationFlow.js";
import { createInitialWorldState } from "../../src/world/WorldInitializer.js";
import { getLocationById } from "../../src/world/WorldDataRegistry.js";

describe("buildCharacterCreationState", () => {
  it("starts a fresh run with the Crowngrave onboarding anchor quest", () => {
    const nextState = buildCharacterCreationState(
      {
        player_profile: { characters_created: 0 },
        world: createInitialWorldState({ seed: 17 }),
      },
      {
        name: "Ari",
        class: "paladin",
        race: "human",
        secondaryClass: { id: "sentinel", name: "Sentinel" },
        profession: { id: "blacksmith", name: "Blacksmith" },
        archetypeSystem: { id: "runebound", name: "Runebound" },
        alignment: "guardian",
        perks: ["hardened_skin", "echo_memory"],
        starterTrees: ["iron_vow"],
        skillLoadoutId: "vanguard",
        activeSkills: [{ id: "shield_bash", name: "Shield Bash" }],
        passiveSkills: [{ id: "bulwark", name: "Bulwark" }],
        characterCreationBlueprint: {
          name: "Ari",
          raceId: "human",
          classId: "paladin",
          secondaryClassId: "sentinel",
          professionId: "blacksmith",
          archetypeSystemId: "runebound",
          alignmentId: "guardian",
          perkIds: ["hardened_skin", "echo_memory"],
          starterTreeIds: ["iron_vow"],
          skillLoadoutId: "vanguard",
          activeSkillIds: ["shield_bash"],
          passiveSkillIds: ["bulwark"],
          startingPrompt: "I wake on the pier and ask for the safest route inland.",
          startingLocationId: "coast_tideward_pier",
          startingZoneId: "coast",
        },
        startingPrompt: "I wake on the pier and ask for the safest route inland.",
        startingLocationId: "coast_tideward_pier",
        startingZoneId: "coast",
      },
    );

    expect(nextState.player_profile.characters_created).toBe(1);
    expect(nextState.quests.completed).toEqual([]);
    expect(nextState.quests.active).toHaveLength(1);
    expect(nextState.quests.active[0]?.id).toBe("otb_dawnreef_tangle_anchor");
    expect(nextState.world.vars.current_quest_id).toBe("otb_dawnreef_tangle_anchor");
    expect(nextState.world.vars.startingSceneId).toBeNull();
    expect(nextState.world.vars.openingSceneChoicePending).toBe(false);
    expect(nextState.world.vars.openingArcId).toBe("oa_dawnreef_tangle_storm_omen");
    expect(nextState.world.vars.tutorialBundleId).toBe("pilot_dawnreef_tangle");
    expect(nextState.world.vars.onboarding).toMatchObject({
      bundleId: "pilot_dawnreef_tangle",
      currentStepId: "anchor",
      deferredMainQuestId: "oq_dawnreef_storm_omen",
      deferredMainQuestReady: false,
      openingArcId: "oa_dawnreef_tangle_storm_omen",
      tutorialBundleId: "pilot_dawnreef_tangle",
    });

    const startLocation = getLocationById(nextState.world.location.current);
    expect(startLocation?.zoneId).toBe("dawnreef_tangle");
    expect(nextState.player.secondaryClass).toEqual({ id: "sentinel", name: "Sentinel" });
    expect(nextState.player.archetypeSystem).toEqual({ id: "runebound", name: "Runebound" });
    expect(nextState.player.alignment).toBe("guardian");
    expect(nextState.player.perks).toEqual(["hardened_skin", "echo_memory"]);
    expect(nextState.player.starterTrees).toEqual(["iron_vow"]);
    expect(nextState.player.skillLoadoutId).toBe("vanguard");
    expect(nextState.player.activeSkills).toEqual([{ id: "shield_bash", name: "Shield Bash" }]);
    expect(nextState.player.passiveSkills).toEqual([{ id: "bulwark", name: "Bulwark" }]);
    expect(nextState.player.characterCreationBlueprint).toMatchObject({
      archetypeSystemId: "runebound",
      alignmentId: "guardian",
      perkIds: ["hardened_skin", "echo_memory"],
      starterTreeIds: ["iron_vow"],
      skillLoadoutId: "vanguard",
      activeSkillIds: ["shield_bash"],
      passiveSkillIds: ["bulwark"],
      startingLocationId: "coast_tideward_pier",
      startingZoneId: "coast",
    });
  });
});
