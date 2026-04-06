import { describe, it, expect } from "@jest/globals";
import {
  assemblePrompt,
  buildDialogueNpcContext,
  buildInitialPrompt,
  buildSceneMemorySeed,
  buildHistorySection,
  resolvePromptMode,
} from "../../src/core/PromptAssembler.js";

const makeEntry = ({ id, type, text, timestamp, sequence }) => ({
  id,
  type,
  text,
  timestamp,
  sequence,
});

describe("buildHistorySection", () => {
  it("orders entries deterministically and filters non-narrative noise", () => {
    const gameState = {
      narrative: {
        summary: "Summary text",
        entries: [
          makeEntry({
            id: "c",
            type: "narrative",
            text: "Third event",
            timestamp: 2,
            sequence: 3,
          }),
          makeEntry({
            id: "a",
            type: "system",
            text: "System notice",
            timestamp: 1,
            sequence: 1,
          }),
          makeEntry({
            id: "b",
            type: "narrative",
            text: "Second event",
            timestamp: 1,
            sequence: 2,
          }),
          makeEntry({
            id: "p",
            type: "user",
            text: "> inspect the gate",
            timestamp: 2,
            sequence: 2.5,
          }),
          makeEntry({
            id: "ignored",
            type: "combat",
            text: "Combat log",
            timestamp: 3,
            sequence: 4,
          }),
        ],
      },
    };

    const history = buildHistorySection(gameState);
    const lines = history.split("\n").slice(1);
    expect(lines).toEqual([
      "System: System notice",
      "Narrator: Second event",
      "Player: inspect the gate",
      "Narrator: Third event",
    ]);
    expect(history).not.toContain("Combat log");
  });

  it("caps history entries by count", () => {
    const entries = Array.from({ length: 15 }, (_, index) =>
      makeEntry({
        id: `entry-${index}`,
        type: "narrative",
        text: `Event ${index}`,
        timestamp: index,
        sequence: index,
      }),
    );
    const history = buildHistorySection({
      narrative: {
        summary: "Summary",
        entries,
      },
    });
    const lines = history.split("\n").slice(1);
    expect(lines.length).toBe(15);
    expect(lines[0]).toBe("Narrator: Event 0");
    expect(lines[14]).toBe("Narrator: Event 14");
  });
});

describe("assemblePrompt", () => {
  it("injects magic ecology context when available", () => {
    const gameState = {
      player: {
        name: "Tester",
        level: 5,
        hp: { current: 70, max: 100 },
        mana: { current: 30, max: 50 },
        xp: { current: 10, max: 100 },
        inventory: [],
        equipment: {},
        secondaryClass: { id: "rogue", name: "Rogue" },
        alignment: { id: "lawful_good", name: "Lawful Good" },
        perks: ["quick_learner"],
        starterTrees: ["offense"],
        skillLoadoutId: "warrior_starter",
        magic: {
          resonance: { current: 42, max: 100, state: "humming" },
          reserves: { fire: 4.2 },
          reservesTaint: { fire: 0.15 },
          charges: [{ essence: "fire", amount: 1 }],
          prepared: { kind: "weave", pattern: "spiral" },
          unlockedPatterns: { weave: ["spiral"] },
          perks: [{ id: "stable_weaves", rank: 1 }],
        },
      },
      world: {
        flags: {},
        location: { current: "city_neon_bazaar", biome: "city" },
        essence: {
          ambient: {
            compositionByEssence: { fire: { density: 0.4, purity: 0.8, taint: 0.1 } },
            global: {
              drawMultByEssence: { fire: 1.1 },
            },
            provenance: {
              timeOfDay: "dusk",
              weatherType: "rain",
              weatherIntensity: 0.6,
              anomalyIds: ["storm_node"],
              sourceIds: ["storm_water"],
            },
          },
        },
      },
      quests: { active: [] },
      narrative: { entries: [], summary: "" },
      combat: { status: "inactive" },
    };

    const prompt = assemblePrompt(gameState, "sense essence", {
      success: true,
      actionType: "magic_sense",
      description: "Sensed essence",
    });

    expect(prompt).toContain("Magic Resonance:");
    expect(prompt).toContain("Magic Reserves:");
    expect(prompt).toContain("Ambient Context:");
    expect(prompt).toContain("Ambient Draw Multipliers:");
    expect(prompt).toContain("Secondary Class: Rogue");
    expect(prompt).toContain("Alignment: Lawful Good");
    expect(prompt).toContain("Creation Perks: quick_learner");
    expect(prompt).toContain("Starter Trees: offense");
    expect(prompt).toContain("Skill Loadout: warrior_starter");
  });



  it("injects devourer runtime context and taboo counters", () => {
    const gameState = {
      player: {
        name: "Cipher",
        level: 7,
        hp: { current: 42, max: 60 },
        mana: { current: 22, max: 40 },
        xp: { current: 10, max: 100 },
        inventory: [],
        equipment: {},
        archetypeSystem: {
          id: "devourer_core",
          name: "Devourer Core",
          category: "System",
          resource: { name: "Biomass", current: 31, max: 100 },
          runtime: {
            taint: 9,
            sentientDevours: 2,
            recentPrey: ["Bandit Raider"],
            storedSamples: { humanoid: { count: 1 }, fire: { count: 2 } },
            adaptations: { humanoid: { rank: 1 } },
          },
        },
      },
      world: { flags: {}, location: { current: "city_neon_bazaar" } },
      quests: { active: [] },
      narrative: { entries: [], summary: "" },
      combat: { status: "inactive" },
    };

    const prompt = assemblePrompt(gameState, "digest humanoid", {
      success: true,
      actionType: "devourer_digest",
      description: "Digest complete",
    });

    expect(prompt).toContain("Devourer Biomass: 31");
    expect(prompt).toContain("Devourer Taint: 9");
    expect(prompt).toContain("Devourer Sentient Devours: 2");
    expect(prompt).toContain("cold, analytical big-sister system presence");
  });
  it("includes authoritative scene state and structured response rules", () => {
    const gameState = {
      player: {
        name: "Tester",
        level: 4,
        hp: { current: 20, max: 30 },
        mana: { current: 10, max: 20 },
        xp: { current: 15, max: 100 },
        inventory: [],
        equipment: {},
      },
      world: {
        location: { current: "city_neon_bazaar" },
      },
      quests: {
        active: [{ name: "Find the courier", description: "Track the hidden courier signal." }],
      },
      narrative: {
        summary: "You reached the terminal and survived the ambush.",
        sceneMemory: {
          locationLabel: "Neon Bazaar",
          zoneLabel: "Threshold Ward",
          immediateObjective: "Find the courier signal.",
          presentEntities: ["Goblin Raider"],
          activeThreats: ["Goblin Raider"],
          unresolvedHooks: ["Courier signal"],
          lastConsequence: "The terminal unlocked.",
        },
        entries: [],
      },
      combat: {
        status: "inactive",
        inCombat: false,
        enemies: [],
      },
    };

    const prompt = assemblePrompt(gameState, "inspect the terminal seam", {
      success: true,
      description: "You inspect the seam carefully.",
      state: gameState,
    });

    expect(prompt).toContain("=== AUTHORITATIVE SCENE STATE ===");
    expect(prompt).toContain("Recent Summary: You reached the terminal and survived the ambush.");
    expect(prompt).toContain("Return one valid JSON object with this shape:");
    expect(prompt).toContain('"story"');
    expect(prompt).toContain('"sceneMemory"');
    expect(prompt).toContain("Active Threats: None confirmed");
    expect(prompt).not.toContain("Present Entities: Goblin Raider");
  });

  it("builds scene memory from deterministic state without reviving inactive enemies", () => {
    const sceneMemory = buildSceneMemorySeed(
      {
        world: { location: { current: "city_neon_bazaar" } },
        quests: { active: [{ name: "Wake the shrine", description: "Restore shrine power." }] },
        narrative: {
          sceneMemory: {
            locationLabel: "Old Hall",
            zoneLabel: "Forgotten Ward",
            presentEntities: ["Goblin Raider", "Caretaker Echo"],
            activeThreats: ["Goblin Raider"],
            unresolvedHooks: ["Broken shrine"],
          },
        },
        combat: {
          status: "inactive",
          inCombat: false,
          enemies: [],
        },
      },
      { description: "You steady yourself by the shrine gate." },
    );

    expect(sceneMemory.presentEntities).toEqual(["Caretaker Echo"]);
    expect(sceneMemory.activeThreats).toEqual([]);
    expect(sceneMemory.immediateObjective).toBe("Restore shrine power.");
    expect(sceneMemory.lastConsequence).toBe("You steady yourself by the shrine gate.");
  });

  it("keeps the runtime prompt contract JSON-only and adds reactive LitRPG voice cues", () => {
    const prompt = assemblePrompt(
      {
        player: {
          name: "Nessa",
          level: 2,
          hp: { current: 12, max: 12 },
          mana: { current: 6, max: 6 },
          xp: { current: 0, max: 10 },
          inventory: [],
          equipment: {},
        },
        world: { location: { current: "city_neon_bazaar" } },
        quests: { active: [] },
        narrative: { entries: [], summary: "" },
      },
      "look around",
      {
        success: true,
        description: "You steady yourself and look around.",
      },
    );

    expect(prompt).toContain("Return exactly one valid JSON object and nothing else");
    expect(prompt).not.toContain("Do not include JSON");
    expect(prompt).toContain("Keep the narration emotionally reactive");
    expect(prompt).toContain("Allow touches of dark humor");
    expect(prompt).toContain("Favor immediate bodily awareness");
    expect(prompt).toContain("coldly helpful notices");
    expect(prompt).toContain("Treat the player's command as a real attempted action");
    expect(prompt).toContain("Only hard-refuse or narrow an action when it would force unearned mechanics or canon state");
  });

  it("builds npc context and requires direct dialogue resolution", () => {
    const gameState = {
      player: {
        name: "Suri",
        level: 2,
        hp: { current: 7, max: 12 },
        mana: { current: 3, max: 6 },
        xp: { current: 0, max: 10 },
        inventory: [],
        equipment: {},
      },
      world: { location: { current: "wildroot_fringe" } },
      quests: { active: [] },
      narrative: {
        entries: [],
        summary: "The patrol found you in the roots.",
        sceneMemory: {
          locationLabel: "Rootbound Alcove",
          zoneLabel: "Wildroot Fringe",
          immediateObjective: "Convince the patrol not to leave you here.",
          presentEntities: ["Spirit Beast Clan Patrol"],
          activeThreats: [],
          unresolvedHooks: ["Why the patrol is cautious"],
          lastConsequence: "The patrol halted around you.",
          familiarEntities: ["Spirit Beast Clan Patrol"],
          partyEntities: [],
          socialSummary: "The patrol is wary but has not attacked.",
        },
      },
      combat: { status: "inactive", inCombat: false, enemies: [] },
    };

    const actionResult = {
      success: true,
      actionType: "dialogue",
      description: 'Player asked: "Why are you all just watching me?"',
      dialogue: {
        intent: "question",
        targetLabel: "patrol",
        topic: "their silence",
        spokenText: "Why are you all just watching me?",
        requiresResponse: true,
      },
    };

    const npcContext = buildDialogueNpcContext(
      gameState,
      "Why are you all just watching me?",
      actionResult,
    );
    const prompt = assemblePrompt(
      gameState,
      "Why are you all just watching me?",
      actionResult,
    );

    expect(npcContext?.targetLabel).toBe("Spirit Beast Clan Patrol");
    expect(npcContext?.requiresResponse).toBe(true);
    expect(prompt).toContain("This is a direct social turn.");
    expect(prompt).toContain("Do not leave a direct question hanging in unexplained silence.");
    expect(prompt).toContain("Dialogue resolution required: yes.");
  });

  it("routes dialogue actions into dialogue mode", () => {
    const mode = resolvePromptMode(
      { combat: { status: "inactive", inCombat: false } },
      {
        actionType: "dialogue",
        dialogueIntent: true,
      },
    );

    expect(mode).toBe("dialogue");
  });

  it("requires concrete reactions from alerted present entities", () => {
    const prompt = assemblePrompt(
      {
        player: {
          name: "Suri",
          level: 2,
          hp: { current: 7, max: 12 },
          mana: { current: 3, max: 6 },
          xp: { current: 0, max: 10 },
          inventory: [],
          equipment: {},
        },
        world: { location: { current: "wildroot_fringe" } },
        quests: { active: [] },
        narrative: {
          entries: [],
          summary: "The patrol has gone still and watchful.",
          sceneMemory: {
            locationLabel: "Rootbound Alcove",
            zoneLabel: "Wildroot Fringe",
            immediateObjective: "Survive first contact.",
            presentEntities: ["Spirit Beast Patrol"],
            activeThreats: [],
            unresolvedHooks: ["Why the patrol has not helped"],
            lastConsequence: "The patrol is watching from the brush.",
            socialSummary: "The patrol is wary, alert, and evaluating the cub.",
          },
        },
        combat: { status: "inactive", inCombat: false, enemies: [] },
      },
      "i run and trip over my paws",
      {
        success: true,
        actionType: "narrative",
        dialogueIntent: false,
        description: "You lurch forward and tumble into the roots.",
      },
    );

    expect(prompt).toContain(
      "When present entities are already watching, alerted, wary, or socially engaged, at least one of them should react in a concrete way",
    );
  });

  it("distinguishes adaptive scene narration from mechanical cheating", () => {
    const prompt = assemblePrompt(
      {
        player: {
          name: "Nessa",
          level: 2,
          hp: { current: 12, max: 12 },
          mana: { current: 6, max: 6 },
          xp: { current: 0, max: 10 },
          inventory: [],
          equipment: {},
        },
        world: { location: { current: "city_neon_bazaar" } },
        quests: { active: [] },
        narrative: { entries: [], summary: "" },
        combat: { status: "inactive", inCombat: false, enemies: [] },
      },
      "i vault the stall and scramble under a cart",
      {
        success: true,
        actionType: "narrative",
        description: "You make a desperate scramble for cover.",
      },
    );

    expect(prompt).toContain(
      "You may introduce minor, non-persistent scene details, fleeting bystander reactions, footing issues, pathing beats, or connective motion",
    );
    expect(prompt).toContain(
      "Do not grant levels, stats, loot, quest completion, permanent alliances, major location changes, or other persistent rewards",
    );
    expect(prompt).toContain(
      "When scene data is incomplete, choose the most plausible grounded continuation instead of stalling on missing micro-details.",
    );
  });
});

describe("buildInitialPrompt", () => {
  it("uses the structured JSON contract and opening voice rules", () => {
    const prompt = buildInitialPrompt({
      player: {
        name: "Suri",
        race: { name: "Foxkin" },
        class: { name: "Scout" },
        profession: { name: "Forager" },
        activeSkills: [{ name: "Pounce" }],
      },
      world: {
        location: { current: "city_neon_bazaar" },
        vars: {
          startingSceneId: "start_moonlit_fox_awakening",
          openingSceneChoicePending: true,
        },
      },
      quests: {
        active: [{ name: "Stay Alive", description: "Survive the first night." }],
      },
    });

    expect(prompt).toContain("=== OPENING VOICE RULES ===");
    expect(prompt).toContain("Foxkin body should feel immediate");
    expect(prompt).toContain('[System Notice: ...]');
    expect(prompt).toContain("coldly helpful");
    expect(prompt).toContain("sharp sensory detail");
    expect(prompt).toContain("Return one valid JSON object with this shape:");
    expect(prompt).toContain('"story"');
    expect(prompt).toContain('"sceneMemory"');
  });

  it("treats a questless start as a deliberate opening state", () => {
    const prompt = buildInitialPrompt({
      player: {
        name: "Ari",
        race: { name: "Human" },
        class: { name: "Paladin" },
        profession: { name: "Blacksmith" },
        startingZoneId: "coast",
      },
      world: {
        location: { current: "city_neon_bazaar" },
        vars: {
          startingSceneId: "start_inn_raid_midnight",
          openingSceneChoicePending: true,
        },
      },
      quests: {
        active: [],
      },
    });

    expect(prompt).toContain("=== OPENING PRESSURES ===");
    expect(prompt).toContain(
      "Immediate Lead -> Let the first meaningful opportunity emerge from the opening scene itself.",
    );
    expect(prompt).toContain("no formal quest has been assigned yet");
    expect(prompt).not.toContain("Main Quest -> Pending discovery.");
    expect(prompt).not.toContain("=== QUEST THREADS ===");
    expect(prompt).toContain("Return one valid JSON object with this shape:");
    expect(prompt).toContain('"sceneMemory"');
  });

  it("keeps an authored starting prompt authoritative over default hub labels", () => {
    const prompt = buildInitialPrompt({
      player: {
        name: "Suri",
        race: { name: "Foxkin" },
        class: { name: "Scout" },
        profession: { name: "Forager" },
        startingZoneId: "city",
        startingPrompt:
          "In a random forest surrounded by trees, I remember a truck hitting me and realize I'm a tiny spirit fox beast cub as a nearby patrol finds me.",
      },
      world: {
        location: { current: "city_neon_bazaar" },
      },
      quests: {
        active: [],
      },
    });

    expect(prompt).toContain("Authored Opening:");
    expect(prompt).toContain("random forest surrounded by trees");
    expect(prompt).toContain(
      "Honors the authored opening premise without relocating the player to a generic hub, alcove, or city",
    );
    expect(prompt).not.toContain('Starting Point: Meridian Arcology');
    expect(prompt).not.toContain('Names the player\'s starting point ("Meridian Arcology")');
  });
});

