import { describe, expect, it } from "@jest/globals";

import { DataRegistry } from "../../packages/game-core/src/data/DataRegistry.js";
import { initialGameState } from "../../packages/game-core/src/data/initialState.js";
import { getClassLineage } from "../../packages/game-core/src/data/registries/ClassDataRegistry.js";
import { gameReducer } from "../../packages/game-core/src/core/gameReducer.js";
import { escapeCombat, startCombat } from "../../packages/game-core/src/systems/combat/CombatSystem.js";
import {
  moveSkirmishUnit,
  waitSkirmishTurn,
} from "../../packages/game-core/src/systems/skirmish/SkirmishSystem.js";
import {
  getSquadProfileForClass,
  resolveSquadProfileId,
  SKIRMISH_SQUAD_PROFILES,
} from "../../packages/game-core/src/systems/skirmish/SkirmishSquadProfiles.js";

const cloneState = (state) => JSON.parse(JSON.stringify(state));
const BOARD_CELLS = [
  { lane: 1, slot: 0 },
  { lane: 1, slot: 1 },
  { lane: 1, slot: 2 },
  { lane: 2, slot: 0 },
  { lane: 2, slot: 1 },
  { lane: 2, slot: 2 },
  { lane: 3, slot: 0 },
  { lane: 3, slot: 1 },
  { lane: 3, slot: 2 },
];

function buildState(playerOverrides = {}, configOverrides = {}) {
  const state = cloneState(initialGameState);
  return {
    ...state,
    config: {
      ...state.config,
      ...configOverrides,
    },
    player: {
      ...state.player,
      name: "Test Hero",
      level: 12,
      class: "warrior",
      hp: { ...state.player.hp, current: state.player.hp.max },
      mana: { ...state.player.mana, current: state.player.mana.max },
      ...playerOverrides,
    },
  };
}

function createSummon(id, name, overrides = {}) {
  return {
    id,
    name,
    attack: 6,
    maxHp: 24,
    stats: {
      hp: { current: 24, max: 24 },
      attack: 6,
      defense: 2,
      speed: 7,
      mana: { current: 0, max: 0 },
      ...(overrides.stats || {}),
    },
    ...overrides,
  };
}

function getBoardUnits(state, faction) {
  return state.combat.board.units.filter((unit) => unit.faction === faction);
}

describe("skirmish combat system", () => {
  it("resolves squad profiles for each base family and inherits evolved classes from lineage", () => {
    const baseProfileIds = Object.keys(SKIRMISH_SQUAD_PROFILES);

    baseProfileIds.forEach((profileId) => {
      const profile = getSquadProfileForClass(profileId);
      expect(profile.id).toBe(profileId);
      expect(profile.units).toHaveLength(4);
    });

    const evolvedClass = DataRegistry.getClasses().find((classEntry) => {
      const lineage = getClassLineage(classEntry.id);
      return lineage.length > 1 && baseProfileIds.includes(lineage[0]?.id);
    });

    expect(evolvedClass).toBeDefined();
    expect(resolveSquadProfileId(evolvedClass.id)).toBe(
      getClassLineage(evolvedClass.id)[0].id,
    );
  });

  it("starts combat in skirmish mode with a 5-unit allied squad and expanded enemy roster", () => {
    const started = startCombat(buildState({ class: "warrior" }), ["goblin"]);
    const allyUnits = getBoardUnits(started, "ally");
    const enemyUnits = getBoardUnits(started, "enemy");
    const occupiedCells = new Set(
      started.combat.board.units.map((unit) => `${unit.faction}:${unit.lane}:${unit.slot}`),
    );

    expect(started.combat.mode).toBe("skirmish");
    expect(started.combat.status).toBe("active");
    expect(allyUnits).toHaveLength(5);
    expect(enemyUnits.length).toBeGreaterThanOrEqual(3);
    expect(enemyUnits.length).toBeLessThanOrEqual(5);
    expect(started.combat.board.spawnMeta.allyProfileId).toBe("warrior");
    expect(started.combat.board.selectedTargetId).toBeTruthy();
    expect(started.combat.enemies).toHaveLength(enemyUnits.length);
    expect(occupiedCells.size).toBe(started.combat.board.units.length);
  });

  it("injects summons ahead of profile units and caps the allied board at nine units", () => {
    const started = startCombat(
      buildState({
        class: "mage",
        activePet: createSummon("pet_wolf", "Pet Wolf"),
        activeDemon: createSummon("ember_imp", "Ember Imp"),
        undead: [
          createSummon("skeleton_1", "Skeleton One"),
          createSummon("skeleton_2", "Skeleton Two"),
        ],
        totems: [
          createSummon("totem_1", "Storm Totem"),
          createSummon("totem_2", "Stone Totem"),
        ],
        traps: [
          createSummon("trap_1", "Snare Trap"),
          createSummon("trap_2", "Hex Trap"),
        ],
      }),
      ["goblin"],
    );

    const allyUnits = getBoardUnits(started, "ally");
    const summonUnits = allyUnits.filter((unit) => unit.sourceType === "summon");

    expect(allyUnits).toHaveLength(9);
    expect(summonUnits).toHaveLength(8);
    expect(allyUnits.some((unit) => unit.sourceType === "profile")).toBe(false);
    expect(started.combat.board.spawnMeta.summonCount).toBe(8);
  });

  it("consumes the acting unit turn on move and wait actions", () => {
    const started = startCombat(buildState({ class: "rogue" }), ["goblin"]);
    const actorId = started.combat.board.activeUnitId;
    const occupied = new Set(
      getBoardUnits(started, "ally").map((unit) => `${unit.lane}:${unit.slot}`),
    );
    const openCell = BOARD_CELLS.find((cell) => !occupied.has(`${cell.lane}:${cell.slot}`));

    expect(actorId).toBeTruthy();
    expect(openCell).toBeDefined();

    const moved = moveSkirmishUnit(started, openCell.lane, openCell.slot);
    const movedActor = moved.combat.board.units.find((unit) => unit.id === actorId);

    expect(movedActor.lane).toBe(openCell.lane);
    expect(movedActor.slot).toBe(openCell.slot);
    expect(moved.combat.board.activeUnitId).not.toBe(actorId);

    const nextActorId = moved.combat.board.activeUnitId;
    const waited = waitSkirmishTurn(moved);

    expect(waited.combat.board.turnQueue).not.toContain(nextActorId);
    expect(waited.combat.board.activeUnitId).not.toBe(nextActorId);
  });

  it("routes reducer combat starts through the skirmish board snapshot and preserves spawn metadata", () => {
    const state = buildState({ class: "cleric" });
    const next = gameReducer(state, {
      type: "PLAYER_START_COMBAT",
      payload: { enemyIds: ["goblin"] },
    });

    expect(next.combat.mode).toBe("skirmish");
    expect(next.combat.status).toBe("active");
    expect(next.combat.board.units.length).toBeGreaterThan(0);
    expect(next.combat.board.spawnMeta.enemyIds).toContain("goblin");
    expect(next.combat.spawnMeta.enemyIds).toContain("goblin");
    expect(next.combat.board.spawnMeta.allyProfileId).toBe("cleric");
  });

  it("honors guaranteed escape configs in skirmish mode", () => {
    const state = buildState({}, { baseEscapeChance: 1, agilityEscapeBonus: 0 });
    const started = startCombat(state, ["goblin"]);
    const escaped = escapeCombat(started);

    expect(escaped.success).toBe(true);
    expect(escaped.state.combat.status).toBe("inactive");
    expect(escaped.state.combat.log.at(-1)).toBe("You successfully escaped from combat!");
  });
});
