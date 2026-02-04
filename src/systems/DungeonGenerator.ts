import { random, randomInt } from "../utils/DeterministicRandom.js";

export enum TileType {
  Wall = '#',
  Floor = '.',
  Enemy = 'E',
  Loot = 'L',
  Start = 'S',
  Exit = '>',
  Trap = 'T',   // New: Deals damage when stepped on
  Shrine = 'H', // New: Heals or buffs player
  Boss = 'B'    // New: Boss enemy
}

export type DungeonTuning = {
  wallFillChance: number;
  smoothingPasses: number;
  enemyBaseCount: number;
  enemyPerDifficulty: number;
  lootBaseCount: number;
  lootPerDifficulty: number;
  trapBaseCount: number;
  trapDifficultyDivisor: number;
  shrineBaseCount: number;
  shrineDifficultyDivisor: number;
  bossEvery: number;
  startCount: number;
  exitCount: number;
  placementAttemptsPerTile: number;
};

const DEFAULT_DUNGEON_TUNING: DungeonTuning = {
  wallFillChance: 0.45,
  smoothingPasses: 5,
  enemyBaseCount: 5,
  enemyPerDifficulty: 1,
  lootBaseCount: 2,
  lootPerDifficulty: 0.5,
  trapBaseCount: 3,
  trapDifficultyDivisor: 3,
  shrineBaseCount: 1,
  shrineDifficultyDivisor: 10,
  bossEvery: 5,
  startCount: 1,
  exitCount: 1,
  placementAttemptsPerTile: 6,
};

export class DungeonGenerator {
  width: number;
  height: number;
  map: string[][];
  tuning: DungeonTuning;

  constructor(
    width: number = 20,
    height: number = 20,
    tuning: Partial<DungeonTuning> = {},
  ) {
    this.width = width;
    this.height = height;
    this.map = [];
    this.tuning = { ...DEFAULT_DUNGEON_TUNING, ...tuning };
  }

  generate(
    difficulty: number,
    tuningOverrides: Partial<DungeonTuning> = {},
  ): string[][] {
    const tuning = { ...this.tuning, ...tuningOverrides };
    const difficultyLevel = Number.isFinite(difficulty)
      ? Math.max(0, Math.floor(difficulty))
      : 0;

    // 1. Initialize with Walls
    this.map = Array(this.height).fill(null).map(() => Array(this.width).fill(TileType.Wall));
    if (this.width <= 2 || this.height <= 2) {
      return this.map;
    }

    // 2. Random Fill (Cellular Automata initialization)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        // Chance to be a wall vs floor based on tuning
        this.map[y][x] = random() < tuning.wallFillChance ? TileType.Wall : TileType.Floor;
      }
    }

    // 3. Smooth Map (Create organic caves)
    for (let i = 0; i < Math.max(0, Math.floor(tuning.smoothingPasses)); i++) {
      this.smoothMap();
    }

    // 4. Place Entities based on difficulty
    this.placeFeature(
      TileType.Enemy,
      tuning.enemyBaseCount + difficultyLevel * tuning.enemyPerDifficulty,
      tuning,
    ); // More enemies on higher difficulty
    this.placeFeature(
      TileType.Loot,
      tuning.lootBaseCount + Math.floor(difficultyLevel * tuning.lootPerDifficulty),
      tuning,
    );
    
    // New: Add Traps and Shrines
    this.placeFeature(
      TileType.Trap,
      tuning.trapBaseCount +
        Math.floor(
          tuning.trapDifficultyDivisor > 0
            ? difficultyLevel / tuning.trapDifficultyDivisor
            : 0,
        ),
      tuning,
    );
    this.placeFeature(
      TileType.Shrine,
      tuning.shrineBaseCount +
        Math.floor(
          tuning.shrineDifficultyDivisor > 0
            ? difficultyLevel / tuning.shrineDifficultyDivisor
            : 0,
        ),
      tuning,
    );

    // New: Boss every N levels
    if (tuning.bossEvery > 0 && difficultyLevel > 0 && difficultyLevel % tuning.bossEvery === 0) {
      this.placeFeature(TileType.Boss, 1, tuning);
    }

    this.placeFeature(TileType.Start, tuning.startCount, tuning);
    this.placeFeature(TileType.Exit, tuning.exitCount, tuning);

    return this.map;
  }

  private placeFeature(type: TileType, count: number, tuning: DungeonTuning) {
    if (this.width <= 2 || this.height <= 2) return;
    const target = Math.max(0, Math.floor(count));
    if (target === 0) return;
    const attemptsPerTile = Number.isFinite(tuning.placementAttemptsPerTile)
      ? tuning.placementAttemptsPerTile
      : DEFAULT_DUNGEON_TUNING.placementAttemptsPerTile;
    const maxAttempts = Math.max(
      target,
      Math.floor(this.width * this.height * Math.max(1, attemptsPerTile)),
    );
    let placed = 0;
    let attempts = 0;
    while (placed < target && attempts < maxAttempts) {
      const x = randomInt(1, this.width - 2);
      const y = randomInt(1, this.height - 2);

      if (this.map[y][x] === TileType.Floor) {
        this.map[y][x] = type;
        placed++;
      }
      attempts++;
    }
  }

  private smoothMap() {
    const newMap = this.map.map(row => [...row]);
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const neighbors = this.getNeighborWallCount(x, y);
        if (neighbors > 4) newMap[y][x] = TileType.Wall;
        else if (neighbors < 4) newMap[y][x] = TileType.Floor;
      }
    }
    this.map = newMap;
  }

  private getNeighborWallCount(gridX: number, gridY: number): number {
    let wallCount = 0;
    for (let neighborY = gridY - 1; neighborY <= gridY + 1; neighborY++) {
      for (let neighborX = gridX - 1; neighborX <= gridX + 1; neighborX++) {
        if (neighborX >= 0 && neighborX < this.width && neighborY >= 0 && neighborY < this.height) {
          if (neighborX !== gridX || neighborY !== gridY) {
            if (this.map[neighborY][neighborX] === TileType.Wall) wallCount++;
          }
        } else {
          wallCount++; // Borders count as walls
        }
      }
    }
    return wallCount;
  }
}
