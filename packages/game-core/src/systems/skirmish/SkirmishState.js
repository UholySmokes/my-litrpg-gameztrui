export const SKIRMISH_MODE = "skirmish";

export function createDefaultCombatBoard() {
  return {
    matchId: null,
    status: "inactive",
    units: [],
    activeUnitId: null,
    selectedTargetId: null,
    turnQueue: [],
    eventLog: [],
    spawnMeta: null,
    round: 0,
  };
}

export function createDefaultCombatState(overrides = {}) {
  const boardOverrides =
    overrides?.board && typeof overrides.board === "object" && !Array.isArray(overrides.board)
      ? overrides.board
      : {};

  return {
    mode: SKIRMISH_MODE,
    status: "inactive",
    turn: "player",
    stance: "focused",
    enemies: [],
    skillCooldowns: {},
    classAbilityCooldowns: {},
    raceAbilityCooldowns: {},
    telegraphs: [],
    arenaTags: [],
    tacticalVerbs: [],
    log: [],
    lanes: {
      player: 2,
      enemies: [],
    },
    spawnMeta: null,
    board: {
      ...createDefaultCombatBoard(),
      ...boardOverrides,
    },
    ...overrides,
  };
}

export function isSkirmishCombat(combat) {
  return Boolean(
    combat &&
      combat.mode === SKIRMISH_MODE &&
      combat.board &&
      typeof combat.board === "object" &&
      !Array.isArray(combat.board) &&
      Array.isArray(combat.board.units) &&
      combat.board.units.length > 0,
  );
}
